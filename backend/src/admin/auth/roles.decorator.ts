import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from './admin.types.js';

export const ROLES_KEY = 'admin_roles';

// Restringe una ruta a los roles indicados (requiere AdminGuard y RolesGuard)
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
