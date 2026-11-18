import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isPrismaNotFound } from '../common/prisma-errors.js';
import { validateImage } from '../common/upload/image-validation.js';
import type { UploadedImage } from '../common/upload/image-validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

const BUCKET = 'roulette';
const NOT_FOUND = 'No encontramos esa imagen.';

@Injectable()
export class RouletteService {
  private readonly logger = new Logger(RouletteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  listPublic() {
    return this.prisma.rouletteImage.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, imageUrl: true },
    });
  }

  listAll() {
    return this.prisma.rouletteImage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createMany(files: UploadedImage[] | undefined) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Adjunta al menos una imagen en el campo "files".');
    }

    // Se valida todo antes de subir nada
    const validated = files.map((file, index) =>
      validateImage(file, 'roulette', files.length > 1 ? `Archivo ${index + 1}` : undefined),
    );

    const created: { id: string; storagePath: string }[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const stored = await this.supabase.upload(BUCKET, {
          buffer: file.buffer,
          contentType: validated[index].contentType,
          extension: validated[index].extension,
          originalName: file.originalname,
        });
        try {
          const row = await this.prisma.rouletteImage.create({
            data: { imageUrl: stored.publicUrl, storagePath: stored.path },
          });
          created.push({ id: row.id, storagePath: row.storagePath });
        } catch (error) {
          await this.supabase.remove(BUCKET, stored.path).catch(() => undefined);
          throw error;
        }
      }
    } catch (error) {
      await this.rollback(created);
      throw error;
    }

    return this.prisma.rouletteImage.findMany({
      where: { id: { in: created.map((item) => item.id) } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Si falla una imagen del lote, se deshacen las anteriores para no dejar cargas a medias
  private async rollback(created: { id: string; storagePath: string }[]) {
    for (const item of created) {
      await this.prisma.rouletteImage.delete({ where: { id: item.id } }).catch(() => undefined);
      await this.supabase.remove(BUCKET, item.storagePath).catch(() => {
        this.logger.warn('No se pudo limpiar un archivo tras una carga fallida.');
      });
    }
  }

  async setActive(id: string, active: boolean) {
    try {
      return await this.prisma.rouletteImage.update({ where: { id }, data: { active } });
    } catch (error) {
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const image = await this.prisma.rouletteImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(NOT_FOUND);

    await this.supabase.remove(BUCKET, image.storagePath);
    try {
      await this.prisma.rouletteImage.delete({ where: { id } });
    } catch (error) {
      if (!isPrismaNotFound(error)) throw error;
    }
  }
}
