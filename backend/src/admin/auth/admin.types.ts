import type { Request } from 'express';

export const ADMIN_ROLES = ['superadmin', 'admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// Datos del administrador que se adjuntan a la petición tras validar el token
export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AuthenticatedRequest extends Request {
  admin: AuthenticatedAdmin;
}

// Lo que la API devuelve de un administrador: nunca incluye password_hash
export interface AdminView {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}
