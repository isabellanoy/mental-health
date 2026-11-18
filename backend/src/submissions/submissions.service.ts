import { Injectable, NotFoundException } from '@nestjs/common';
import { isPrismaNotFound } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { toCsv } from './csv.js';
import type { CreateSubmissionDto } from './dto/create-submission.dto.js';
import type {
  ExportSubmissionsQueryDto,
  ListSubmissionsQueryDto,
  SubmissionFiltersDto,
} from './dto/submission-query.dto.js';
import type { UpdateSubmissionDto } from './dto/update-submission.dto.js';
import { calculatePriority } from './priority.js';
import { buildDailySeries, startOfUtcDay } from './stats.js';

const NOT_FOUND = 'No encontramos esa solicitud.';
const EXPORT_LIMIT = 10_000;
const STATS_DAYS = 14;

const CSV_HEADER = [
  'id',
  'fecha',
  'nombre',
  'edad',
  'animo',
  'emociones',
  'duracion',
  'impacto',
  'sueno',
  'apetito',
  'pensamientos_hacerse_dano',
  'prioridad',
  'correo',
  'telefono',
  'mejor_horario',
  'consentimiento',
  'estado',
  'notas',
];

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto): Promise<void> {
    await this.prisma.submission.create({
      data: {
        name: dto.name,
        age: dto.age,
        mood: dto.mood,
        emotions: dto.emotions,
        duration: dto.duration,
        impact: dto.impact,
        sleep: dto.sleep,
        appetite: dto.appetite,
        selfHarmThoughts: dto.selfHarm,
        priority: calculatePriority(dto.selfHarm),
        email: dto.email,
        phone: dto.phone ? dto.phone : null,
        bestTime: dto.bestTime,
        consent: dto.consent,
      },
    });
  }

  private where({ status, priority }: SubmissionFiltersDto): Prisma.SubmissionWhereInput {
    return { ...(status && { status }), ...(priority && { priority }) };
  }

  async list(query: ListSubmissionsQueryDto) {
    const where = this.where(query);
    const [total, data] = await Promise.all([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
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

  async exportCsv(query: ExportSubmissionsQueryDto): Promise<string> {
    const rows = await this.prisma.submission.findMany({
      where: this.where(query),
      orderBy: { createdAt: 'desc' },
      take: EXPORT_LIMIT,
    });
    return toCsv(
      CSV_HEADER,
      rows.map((row) => [
        row.id,
        row.createdAt.toISOString(),
        row.name,
        row.age,
        row.mood,
        row.emotions.join('; '),
        row.duration,
        row.impact,
        row.sleep,
        row.appetite,
        row.selfHarmThoughts,
        row.priority,
        row.email,
        row.phone,
        row.bestTime,
        row.consent ? 'si' : 'no',
        row.status,
        row.notes,
      ]),
      query.delimiter,
    );
  }

  async update(id: string, dto: UpdateSubmissionDto) {
    try {
      return await this.prisma.submission.update({
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
      await this.prisma.submission.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }

  async stats() {
    const since = new Date(startOfUtcDay(new Date()).getTime() - (STATS_DAYS - 1) * 24 * 60 * 60 * 1000);
    const [total, nuevos, prioridadAlta, voluntariosTotal, voluntariosNuevos, perDay] = await Promise.all([
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { status: 'nuevo' } }),
      this.prisma.submission.count({ where: { priority: 'alta' } }),
      this.prisma.volunteer.count(),
      this.prisma.volunteer.count({ where: { status: 'nuevo' } }),
      this.prisma.$queryRaw<{ day: string; count: number }[]>`
        select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as day, count(*)::int as count
        from public.submissions
        where created_at >= ${since}
        group by 1`,
    ]);
    return {
      total,
      nuevos,
      prioridadAlta,
      voluntariosTotal,
      voluntariosNuevos,
      enviosPorDia: buildDailySeries(perDay, STATS_DAYS),
    };
  }
}
