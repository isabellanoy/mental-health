import { createHash, timingSafeEqual } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Admin } from '../../generated/prisma/client.js';
import { AdminsService, toAdminView } from '../admins/admins.service.js';
import { burnPasswordCheck, verifyPassword } from './password.js';

export const TOKEN_TTL_SECONDS = 8 * 60 * 60;

const BAD_CREDENTIALS = 'Correo o contraseña incorrectos.';

// Compara los hashes SHA-256: tiempo constante y sin filtrar la longitud del valor
export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly admins: AdminsService,
  ) {}

  // ADMIN_EMAIL y ADMIN_PASSWORD solo siembran al superadmin inicial: después manda la tabla admins
  private async seedOwner(email: string, password: string): Promise<Admin | null> {
    const ownerEmail = this.config.getOrThrow<string>('ADMIN_EMAIL').trim().toLowerCase();
    const ownerPassword = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    // Se evalúan ambas comparaciones siempre, para no revelar cuál falló
    const emailMatches = safeEqual(email, ownerEmail);
    const passwordMatches = safeEqual(password, ownerPassword);
    if (!(emailMatches && passwordMatches)) return null;
    return this.admins.createOwner(ownerEmail, ownerPassword);
  }

  async login(rawEmail: string, password: string) {
    const email = rawEmail.trim().toLowerCase();
    const admin = (await this.admins.findByEmail(email)) ?? (await this.seedOwner(email, password));

    if (!admin) {
      await burnPasswordCheck(password);
      throw new UnauthorizedException(BAD_CREDENTIALS);
    }
    if (!(await verifyPassword(password, admin.passwordHash))) {
      throw new UnauthorizedException(BAD_CREDENTIALS);
    }
    // Se avisa de la cuenta desactivada solo a quien conoce la contraseña
    if (!admin.active) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Habla con un superadministrador.',
      );
    }

    const updated = await this.admins.touchLogin(admin.id);
    const accessToken = await this.jwt.signAsync({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_TTL_SECONDS,
      admin: toAdminView(updated),
    };
  }
}
