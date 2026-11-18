import { Injectable, NotFoundException } from '@nestjs/common';
import { isPrismaNotFound } from '../common/prisma-errors.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toCsv } from '../submissions/csv.js';
import type { CreateVolunteerDto } from './dto/create-volunteer.dto.js';
import type { UpdateVolunteerDto } from './dto/update-volunteer.dto.js';
import type {
  ExportVolunteersQueryDto,
  ListVolunteersQueryDto,
  VolunteerFiltersDto,
} from './dto/volunteer-query.dto.js';

const NOT_FOUND = 'No encontramos a ese voluntario.';
const EXPORT_LIMIT = 10_000;

const CSV_HEADER = [
  'id',
  'fecha',
  'nombre',
  'apellido',
  'carrera_profesion',
  'semestre_anio',
  'correo',
  'telefono',
  'formas_de_ayudar',
  'disponibilidad',
  'mensaje',
  'consentimiento',
  'estado',
  'notas',
];

@Injectable()
export class VolunteersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVolunteerDto): Promise<void> {
    await this.prisma.volunteer.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        career: dto.career,
        semester: dto.semester ? dto.semester : null,
        email: dto.email,
        phone: dto.phone,
        helpAreas: dto.helpAreas,
        availability: dto.availability,
        message: dto.message ? dto.message : null,
        consent: dto.consent,
      },
    });
  }

  // Cada palabra de la búsqueda debe aparecer en el nombre, el apellido o el correo
  private where({ status, search }: VolunteerFiltersDto): Prisma.VolunteerWhereInput {
    const terms = search?.split(/\s+/).filter(Boolean) ?? [];
    return {
      ...(status && { status }),
      ...(terms.length > 0 && {
        AND: terms.map((term) => ({
          OR: [
            { firstName: { contains: term, mode: 'insensitive' as const } },
            { lastName: { contains: term, mode: 'insensitive' as const } },
            { email: { contains: term, mode: 'insensitive' as const } },
          ],
        })),
      }),
    };
  }

  async list(query: ListVolunteersQueryDto) {
    const where = this.where(query);
    const [total, data] = await Promise.all([
      this.prisma.volunteer.count({ where }),
      this.prisma.volunteer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async exportCsv(query: ExportVolunteersQueryDto): Promise<string> {
    const rows = await this.prisma.volunteer.findMany({
      where: this.where(query),
      orderBy: { createdAt: 'desc' },
      take: EXPORT_LIMIT,
    });
    return toCsv(
      CSV_HEADER,
      rows.map((row) => [
        row.id,
        row.createdAt.toISOString(),
        row.firstName,
        row.lastName,
        row.career,
        row.semester,
        row.email,
        row.phone,
        row.helpAreas.join('; '),
        row.availability,
        row.message,
        row.consent ? 'si' : 'no',
        row.status,
        row.notes,
      ]),
      query.delimiter,
    );
  }

  async update(id: string, dto: UpdateVolunteerDto) {
    try {
      return await this.prisma.volunteer.update({
        where: { id },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.notes !== undefined && { notes: dto.notes?.trim() ? dto.notes.trim() : null }),
        },
      });
    } catch (error) {
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.volunteer.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }
}
