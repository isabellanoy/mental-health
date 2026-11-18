import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminsController } from '../admins/admins.controller.js';
import { AdminsService } from '../admins/admins.service.js';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService, TOKEN_TTL_SECONDS } from './auth.service.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: TOKEN_TTL_SECONDS },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, AdminsController],
  providers: [AuthService, AdminsService, AdminGuard, RolesGuard],
  // Los módulos con rutas /admin/* importan AuthModule para usar AdminGuard y RolesGuard
  exports: [AdminGuard, RolesGuard, AdminsService, JwtModule],
})
export class AuthModule {}
