import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { validationExceptionFactory } from './common/validation.js';

// Configuración compartida entre `main.ts` (local) y `api/index.ts` (Vercel serverless)
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const origins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Detrás del proxy de Vercel: así `req.ip` (y el límite de peticiones) usa la IP real del cliente
  const express = app.getHttpAdapter().getInstance() as { set: (name: string, value: unknown) => void };
  express.set('trust proxy', 1);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: origins.length ? origins : false,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
