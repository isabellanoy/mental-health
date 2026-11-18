import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

const contextWith = (admin?: { role: string }) =>
  ({
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ admin }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const getAllAndOverride = vi.fn();
  const guard = new RolesGuard({ getAllAndOverride } as unknown as Reflector);

  beforeEach(() => getAllAndOverride.mockReset());

  it('deja pasar las rutas sin @Roles', () => {
    getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({ role: 'admin' }))).toBe(true);
  });

  it('permite el rol requerido', () => {
    getAllAndOverride.mockReturnValue(['superadmin']);
    expect(guard.canActivate(contextWith({ role: 'superadmin' }))).toBe(true);
  });

  it('rechaza con 403 a un admin en una ruta de superadmin', () => {
    getAllAndOverride.mockReturnValue(['superadmin']);
    expect(() => guard.canActivate(contextWith({ role: 'admin' }))).toThrow(ForbiddenException);
  });

  it('rechaza si la petición no pasó por AdminGuard', () => {
    getAllAndOverride.mockReturnValue(['superadmin']);
    expect(() => guard.canActivate(contextWith())).toThrow(ForbiddenException);
  });
});
