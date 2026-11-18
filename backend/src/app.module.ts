import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './admin/auth/auth.module.js';
import { AlliesModule } from './allies/allies.module.js';
import { AppController } from './app.controller.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RouletteModule } from './roulette/roulette.module.js';
import { SubmissionsModule } from './submissions/submissions.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { VolunteersModule } from './volunteers/volunteers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Límite general por IP; las rutas sensibles lo ajustan con @Throttle
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    SubmissionsModule,
    RouletteModule,
    AlliesModule,
    VolunteersModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
