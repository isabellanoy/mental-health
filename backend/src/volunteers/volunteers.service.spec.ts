import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CreateVolunteerDto } from './dto/create-volunteer.dto.js';
import { VolunteersService } from './volunteers.service.js';

function setup() {
  const volunteer = {
    create: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  };
  const service = new VolunteersService({ volunteer } as unknown as PrismaService);
  return { volunteer, service };
}

const dto = {
  firstName: 'Lucía',
  lastName: 'Pérez',
  career: 'Psicología',
  semester: '',
  email: 'l@b.co',
  phone: '+58 412 000 0000',
  helpAreas: ['otra'],
  availability: 'semanal',
  message: '',
  consent: true,
} as CreateVolunteerDto;

describe('VolunteersService', () => {
  it('guarda los opcionales vacíos como null', async () => {
    const { service, volunteer } = setup();
    await service.create(dto);
    expect(volunteer.create.mock.calls[0][0].data).toMatchObject({ semester: null, message: null });
  });

  it('list pagina, ordena por fecha desc y busca cada palabra en nombre o correo', async () => {
    const { service, volunteer } = setup();
    volunteer.count.mockResolvedValue(41);
    const result = await service.list({
      page: 3,
      pageSize: 20,
      status: 'activo',
      search: 'ana  gómez',
    });
    expect(result.meta).toEqual({ page: 3, pageSize: 20, total: 41, totalPages: 3 });
    const args = volunteer.findMany.mock.calls[0][0];
    expect(args).toMatchObject({ orderBy: { createdAt: 'desc' }, skip: 40, take: 20 });
    expect(args.where.status).toBe('activo');
    expect(args.where.AND).toHaveLength(2);
    expect(args.where.AND[0].OR).toHaveLength(3);
  });

  it('exporta CSV con BOM, usa el delimitador y neutraliza fórmulas', async () => {
    const { service, volunteer } = setup();
    volunteer.findMany.mockResolvedValue([
      {
        id: 'x',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        firstName: '=cmd',
        lastName: 'Pérez',
        career: 'A;B',
        semester: null,
        email: 'l@b.co',
        phone: '+58',
        helpAreas: ['tecnologia', 'otra'],
        availability: 'semanal',
        message: null,
        consent: true,
        status: 'nuevo',
        notes: null,
      },
    ]);
    const csv = await service.exportCsv({ delimiter: ';' });
    expect(csv.startsWith('\uFEFFid;fecha;nombre')).toBe(true);
    expect(csv).toContain("'=cmd;Pérez;\"A;B\"");
    expect(csv).toContain('tecnologia; otra');
  });

  it('update y remove traducen P2025 a 404', async () => {
    const { service, volunteer } = setup();
    volunteer.update.mockRejectedValue({ code: 'P2025' });
    volunteer.delete.mockRejectedValue({ code: 'P2025' });
    await expect(service.update('x', { status: 'activo' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update guarda notas vacías como null', async () => {
    const { service, volunteer } = setup();
    await service.update('x', { notes: '   ' });
    expect(volunteer.update.mock.calls[0][0].data).toEqual({ notes: null });
  });
});
