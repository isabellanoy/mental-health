import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from '../admins/admins.service.js';
import type { AuthenticatedRequest } from './admin.types.js';

interface AdminTokenPayload {
  sub?: unknown;
}

const INVALID_SESSION = 'Sesión inválida o expirada. Inicia sesión de nuevo.';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly admins: AdminsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Falta el token de acceso (Authorization: Bearer).');
    }

    let payload: AdminTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AdminTokenPayload>(token);
    } catch {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    if (typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    // El rol y el estado se leen de la base en cada petición: desactivar o degradar corta el acceso al instante
    const admin = await this.admins.findActiveById(payload.sub);
    if (!admin) throw new UnauthorizedException(INVALID_SESSION);

    request.admin = admin;
    return true;
  }
}
