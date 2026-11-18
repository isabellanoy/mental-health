import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Solo la usa la CLI de Prisma; la app se conecta con el adaptador de pg (ver PrismaService)
    url: process.env.DATABASE_URL ?? '',
  },
});
