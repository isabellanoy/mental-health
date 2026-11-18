import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { AdminsService } from '../admins/admins.service.js';
import { AdminGuard } from './admin.guard.js';

const ID = '8f14e45f-ceea-4b7a-9f3c-2d3b2b6a1e11';

const contextWith = (authorization?: string, request: Record<string, unknown> = {}) =>
  ({
    switchToHttp: () => ({ getRequest: () => Object.assign(request, { headers: { authorization } }) }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const verifyAsync = vi.fn();
  const findActiveById = vi.fn();
  const guard = new AdminGuard(
    { verifyAsync } as unknown as JwtService,
    { findActiveById } as unknown as AdminsService,
  );

  beforeEach(() => {
    verifyAsync.mockReset();
    findActiveById.mockReset();
  });

  it('rechaza peticiones sin cabecera Authorization', async () => {
    await expect(guard.canActivate(contextWith())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rechaza esquemas distintos de Bearer', async () => {
    await expect(guard.canActivate(contextWith('Basic abc'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza tokens inválidos o expirados', async () => {
    verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(guard.canActivate(contextWith('Bearer token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza tokens antiguos cuyo sub no es un uuid', async () => {
    verifyAsync.mockResolvedValue({ sub: 'admin', role: 'admin' });
    await expect(guard.canActivate(contextWith('Bearer token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findActiveById).not.toHaveBeenCalled();
  });

  it('rechaza a un administrador desactivado o eliminado, aunque el token sea válido', async () => {
    verifyAsync.mockResolvedValue({ sub: ID });
    findActiveById.mockResolvedValue(null);
    await expect(guard.canActivate(contextWith('Bearer token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('permite el acceso y adjunta al administrador leído de la base', async () => {
    const admin = { id: ID, email: 'a@b.co', name: 'Ana', role: 'superadmin' };
    verifyAsync.mockResolvedValue({ sub: ID, role: 'admin' });
    findActiveById.mockResolvedValue(admin);
    const request: Record<string, unknown> = {};
    await expect(guard.canActivate(contextWith('Bearer token', request))).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('token');
    expect(request.admin).toEqual(admin);
  });
});
