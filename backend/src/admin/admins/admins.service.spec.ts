import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedAdmin } from '../auth/admin.types.js';
import { hashPassword } from '../auth/password.js';
import { AdminsService, LAST_SUPERADMIN } from './admins.service.js';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'target',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  name: 'Otro',
  email: 'otro@correo.com',
  passwordHash: 'hash-secreto',
  role: 'admin',
  active: true,
  lastLoginAt: null,
  ...overrides,
});

const actor: AuthenticatedAdmin = { id: 'actor', email: 'yo@correo.com', name: 'Yo', role: 'superadmin' };

function setup() {
  const admin = {
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve(row(data))),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve(row(data))),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(1),
  };
  return { admin, service: new AdminsService({ admin } as unknown as PrismaService) };
}

describe('AdminsService', () => {
  it('create guarda el hash y nunca devuelve password_hash', async () => {
    const { admin, service } = setup();
    const view = await service.create({
      name: 'Nuevo',
      email: 'nuevo@correo.com',
      password: 'contrasena-segura-1',
      role: 'admin',
    });
    const { data } = admin.create.mock.calls[0][0];
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(data.passwordHash).not.toContain('contrasena-segura-1');
    expect(view).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(view)).not.toContain('hash');
  });

  it('create responde 409 si el correo ya existe', async () => {
    const { admin, service } = setup();
    admin.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create({ name: 'X', email: 'x@correo.com', password: '1234567890' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('reglas sobre uno mismo', () => {
    it('no permite desactivarse', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ id: 'actor', role: 'superadmin' }));
      await expect(service.update('actor', { active: false }, actor)).rejects.toThrow(
        'No puedes desactivar tu propia cuenta.',
      );
    });

    it('no permite degradarse', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ id: 'actor', role: 'superadmin' }));
      await expect(service.update('actor', { role: 'admin' }, actor)).rejects.toThrow(
        'No puedes cambiar tu propio rol.',
      );
    });

    it('no permite eliminarse', async () => {
      const { service } = setup();
      await expect(service.remove('actor', actor)).rejects.toThrow(
        'No puedes eliminar tu propia cuenta.',
      );
    });

    it('sí permite cambiar el propio nombre', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ id: 'actor', role: 'superadmin' }));
      await expect(service.update('actor', { name: 'Nuevo nombre' }, actor)).resolves.toBeDefined();
    });
  });

  describe('último superadmin', () => {
    it.each([
      ['degradar', { role: 'admin' as const }],
      ['desactivar', { active: false }],
    ])('no permite %s al único superadmin activo', async (_label, dto) => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ role: 'superadmin' }));
      admin.count.mockResolvedValue(0);
      await expect(service.update('target', dto, actor)).rejects.toThrow(LAST_SUPERADMIN);
      expect(admin.update).not.toHaveBeenCalled();
    });

    it('no permite eliminar al único superadmin activo', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ role: 'superadmin' }));
      admin.count.mockResolvedValue(0);
      await expect(service.remove('target', actor)).rejects.toThrow(LAST_SUPERADMIN);
      expect(admin.delete).not.toHaveBeenCalled();
    });

    it('permite degradar a un superadmin si queda otro activo', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ role: 'superadmin' }));
      admin.count.mockResolvedValue(1);
      await service.update('target', { role: 'admin' }, actor);
      expect(admin.count.mock.calls[0][0].where).toEqual({
        role: 'superadmin',
        active: true,
        id: { not: 'target' },
      });
      expect(admin.update).toHaveBeenCalled();
    });

    it('no consulta nada si el destino no es un superadmin activo', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ role: 'superadmin', active: false }));
      await service.remove('target', actor);
      expect(admin.count).not.toHaveBeenCalled();
    });
  });

  it('update exige al menos un campo y responde 404 si no existe', async () => {
    const { admin, service } = setup();
    await expect(service.update('target', {}, actor)).rejects.toBeInstanceOf(BadRequestException);
    admin.findUnique.mockResolvedValue(null);
    await expect(service.update('target', { name: 'X' }, actor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update restablece la contraseña de otro admin guardando un hash nuevo', async () => {
    const { admin, service } = setup();
    admin.findUnique.mockResolvedValue(row());
    await service.update('target', { password: 'nueva-contrasena-1' }, actor);
    expect(admin.update.mock.calls[0][0].data.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  describe('changeOwnPassword', () => {
    it('rechaza una contraseña actual incorrecta', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ passwordHash: await hashPassword('la-actual-123') }));
      await expect(service.changeOwnPassword(actor, 'incorrecta', 'la-nueva-1234')).rejects.toThrow(
        'La contraseña actual no es correcta.',
      );
      expect(admin.update).not.toHaveBeenCalled();
    });

    it('rechaza reutilizar la misma contraseña', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ passwordHash: await hashPassword('la-actual-123') }));
      await expect(service.changeOwnPassword(actor, 'la-actual-123', 'la-actual-123')).rejects.toThrow(
        'distinta',
      );
    });

    it('guarda el hash de la nueva contraseña', async () => {
      const { admin, service } = setup();
      admin.findUnique.mockResolvedValue(row({ passwordHash: await hashPassword('la-actual-123') }));
      await service.changeOwnPassword(actor, 'la-actual-123', 'la-nueva-1234');
      const hash = admin.update.mock.calls[0][0].data.passwordHash as string;
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash).not.toContain('la-nueva-1234');
    });
  });
});
