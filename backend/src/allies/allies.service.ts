import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isPrismaNotFound } from '../common/prisma-errors.js';
import { validateImage } from '../common/upload/image-validation.js';
import type { UploadedImage } from '../common/upload/image-validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateAllyDto } from './dto/create-ally.dto.js';
import type { UpdateAllyDto } from './dto/update-ally.dto.js';

const BUCKET = 'allies';
const NOT_FOUND = 'No encontramos a ese aliado.';

@Injectable()
export class AlliesService {
  private readonly logger = new Logger(AlliesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  listPublic() {
    return this.prisma.ally.findMany({
      where: { active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, logoUrl: true, websiteUrl: true },
    });
  }

  listAll() {
    return this.prisma.ally.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
  }

  async create(dto: CreateAllyDto, logo: UploadedImage | undefined) {
    if (!logo) {
      throw new BadRequestException('Adjunta el logo en el campo "logo".');
    }
    const validated = validateImage(logo, 'logo');

    const position = dto.position ?? (await this.nextPosition());
    const stored = await this.supabase.upload(BUCKET, {
      buffer: logo.buffer,
      contentType: validated.contentType,
      extension: validated.extension,
      originalName: logo.originalname,
    });

    try {
      return await this.prisma.ally.create({
        data: {
          name: dto.name,
          websiteUrl: dto.website_url,
          logoUrl: stored.publicUrl,
          storagePath: stored.path,
          position,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      await this.supabase.remove(BUCKET, stored.path).catch(() => undefined);
      throw error;
    }
  }

  async update(id: string, dto: UpdateAllyDto, logo: UploadedImage | undefined) {
    const current = await this.prisma.ally.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(NOT_FOUND);

    const hasChanges =
      logo !== undefined ||
      dto.name !== undefined ||
      dto.website_url !== undefined ||
      dto.position !== undefined ||
      dto.active !== undefined;
    if (!hasChanges) {
      throw new BadRequestException('Envía al menos un campo para actualizar.');
    }

    let stored: { path: string; publicUrl: string } | undefined;
    if (logo) {
      const validated = validateImage(logo, 'logo');
      stored = await this.supabase.upload(BUCKET, {
        buffer: logo.buffer,
        contentType: validated.contentType,
        extension: validated.extension,
        originalName: logo.originalname,
      });
    }

    let updated;
    try {
      updated = await this.prisma.ally.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.website_url !== undefined && { websiteUrl: dto.website_url }),
          ...(dto.position !== undefined && { position: dto.position }),
          ...(dto.active !== undefined && { active: dto.active }),
          ...(stored && { logoUrl: stored.publicUrl, storagePath: stored.path }),
        },
      });
    } catch (error) {
      if (stored) await this.supabase.remove(BUCKET, stored.path).catch(() => undefined);
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }

    // El logo anterior se borra solo cuando ya se guardó el nuevo
    if (stored) {
      await this.supabase.remove(BUCKET, current.storagePath).catch(() => {
        this.logger.warn('No se pudo borrar el logo anterior de Storage.');
      });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const ally = await this.prisma.ally.findUnique({ where: { id } });
    if (!ally) throw new NotFoundException(NOT_FOUND);

    await this.supabase.remove(BUCKET, ally.storagePath);
    try {
      await this.prisma.ally.delete({ where: { id } });
    } catch (error) {
      if (!isPrismaNotFound(error)) throw error;
    }
  }

  private async nextPosition(): Promise<number> {
    const { _max } = await this.prisma.ally.aggregate({ _max: { position: true } });
    return (_max.position ?? -1) + 1;
  }
}
