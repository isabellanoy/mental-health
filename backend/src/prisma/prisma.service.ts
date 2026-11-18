import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

function buildPoolConfig(databaseUrl: string) {
  const url = new URL(databaseUrl);
  // Parámetros propios de Prisma (pooler de Supabase): el adaptador de pg no los usa
  const limit = Number(url.searchParams.get('connection_limit')) || 1;
  url.searchParams.delete('pgbouncer');
  url.searchParams.delete('connection_limit');

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  return {
    connectionString: url.toString(),
    // Una conexión por instancia: en serverless cada invocación vive poco tiempo
    max: limit,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg(buildPoolConfig(config.getOrThrow<string>('DATABASE_URL'))),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
