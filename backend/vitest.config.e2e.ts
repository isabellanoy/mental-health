import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Valores ficticios: las pruebas usan mocks de Prisma y Supabase, nunca servicios reales
    env: {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
      SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_SERVICE_KEY: 'test-service-key',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'una-contrasena-de-prueba',
      JWT_SECRET: 'secreto-de-prueba-de-al-menos-32-caracteres',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
