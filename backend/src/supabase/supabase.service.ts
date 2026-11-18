import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildStoragePath } from './storage-path.js';

export type StorageBucket = 'roulette' | 'allies';

export interface StorageUploadInput {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  extension: string;
}

export interface StoredFile {
  path: string;
  publicUrl: string;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async upload(bucket: StorageBucket, input: StorageUploadInput): Promise<StoredFile> {
    const path = buildStoragePath(input.originalName, input.extension);
    const { error } = await this.client.storage.from(bucket).upload(path, input.buffer, {
      contentType: input.contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      // Solo se registra el nombre del error: nunca el contenido ni las claves
      this.logger.error(`No se pudo subir un archivo al bucket "${bucket}" (${error.name})`);
      throw new BadGatewayException(
        'No pudimos guardar el archivo en este momento. Inténtalo de nuevo en unos minutos.',
      );
    }
    return { path, publicUrl: this.getPublicUrl(bucket, path) };
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.error(`No se pudo eliminar un archivo del bucket "${bucket}" (${error.name})`);
      throw new BadGatewayException(
        'No pudimos eliminar el archivo en este momento. Inténtalo de nuevo en unos minutos.',
      );
    }
  }
}
