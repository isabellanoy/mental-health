import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole, AuthenticatedRequest } from './admin.types.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const { admin } = context.switchToHttp().getRequest<Partial<AuthenticatedRequest>>();
    if (!admin || !roles.includes(admin.role)) {
      throw new ForbiddenException('Solo un superadministrador puede hacer esto.');
    }
    return true;
  }
}
