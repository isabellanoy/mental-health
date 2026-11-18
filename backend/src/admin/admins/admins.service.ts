import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaNotFound, isPrismaUniqueViolation } from '../../common/prisma-errors.js';
import type { Admin } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AdminRole, AdminView, AuthenticatedAdmin } from '../auth/admin.types.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import type { CreateAdminDto } from './dto/create-admin.dto.js';
import type { UpdateAdminDto } from './dto/update-admin.dto.js';

const NOT_FOUND = 'No encontramos a ese administrador.';
const EMAIL_TAKEN = 'Ya existe un administrador con ese correo.';
export const LAST_SUPERADMIN = 'Debe quedar al menos un superadministrador activo.';

export function toAdminView(row: Admin): AdminView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AdminRole,
    active: row.active,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.admin.findUnique({ where: { email } });
  }

  async findActiveById(id: string): Promise<AuthenticatedAdmin | null> {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin?.active) return null;
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role as AdminRole };
  }

  // Crea el superadmin inicial; si dos logins lo crean a la vez, gana el primero
  async createOwner(email: string, password: string): Promise<Admin> {
    try {
      return await this.prisma.admin.create({
        data: {
          name: 'Superadmin',
          email,
          passwordHash: await hashPassword(password),
          role: 'superadmin',
        },
      });
    } catch (error) {
      if (!isPrismaUniqueViolation(error)) throw error;
      const existing = await this.findByEmail(email);
      if (!existing) throw error;
      return existing;
    }
  }

  touchLogin(id: string) {
    return this.prisma.admin.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async me(id: string): Promise<AdminView> {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException(NOT_FOUND);
    return toAdminView(admin);
  }

  async list(): Promise<AdminView[]> {
    const rows = await this.prisma.admin.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toAdminView);
  }

  async create(dto: CreateAdminDto): Promise<AdminView> {
    try {
      const row = await this.prisma.admin.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: await hashPassword(dto.password),
          role: dto.role ?? 'admin',
        },
      });
      return toAdminView(row);
    } catch (error) {
      if (isPrismaUniqueViolation(error)) throw new ConflictException(EMAIL_TAKEN);
      throw error;
    }
  }

  // Impide dejar el sistema sin ningún superadmin activo
  private async assertSuperadminRemains(
    target: Pick<Admin, 'id' | 'role' | 'active'>,
    next: { role: string; active: boolean },
  ) {
    const losesPower = target.role === 'superadmin' && target.active;
    const keepsPower = next.role === 'superadmin' && next.active;
    if (!losesPower || keepsPower) return;

    const others = await this.prisma.admin.count({
      where: { role: 'superadmin', active: true, id: { not: target.id } },
    });
    if (others === 0) throw new BadRequestException(LAST_SUPERADMIN);
  }

  async update(id: string, dto: UpdateAdminDto, actor: AuthenticatedAdmin): Promise<AdminView> {
    if (
      dto.name === undefined &&
      dto.role === undefined &&
      dto.active === undefined &&
      dto.password === undefined
    ) {
      throw new BadRequestException('Envía al menos un campo para actualizar.');
    }

    const target = await this.prisma.admin.findUnique({ where: { id } });
    if (!target) throw new NotFoundException(NOT_FOUND);

    if (id === actor.id) {
      if (dto.active === false) {
        throw new BadRequestException('No puedes desactivar tu propia cuenta.');
      }
      if (dto.role !== undefined && dto.role !== target.role) {
        throw new BadRequestException('No puedes cambiar tu propio rol.');
      }
      if (dto.password !== undefined) {
        throw new BadRequestException(
          'Para cambiar tu propia contraseña usa la sección Mi cuenta.',
        );
      }
    }

    await this.assertSuperadminRemains(target, {
      role: dto.role ?? target.role,
      active: dto.active ?? target.active,
    });

    try {
      const row = await this.prisma.admin.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.role !== undefined && { role: dto.role }),
          ...(dto.active !== undefined && { active: dto.active }),
          ...(dto.password !== undefined && { passwordHash: await hashPassword(dto.password) }),
        },
      });
      return toAdminView(row);
    } catch (error) {
      if (isPrismaNotFound(error)) throw new NotFoundException(NOT_FOUND);
      throw error;
    }
  }

  async remove(id: string, actor: AuthenticatedAdmin): Promise<void> {
    if (id === actor.id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta.');
    }
    const target = await this.prisma.admin.findUnique({ where: { id } });
    if (!target) throw new NotFoundException(NOT_FOUND);

    await this.assertSuperadminRemains(target, { role: target.role, active: false });
    try {
      await this.prisma.admin.delete({ where: { id } });
    } catch (error) {
      if (!isPrismaNotFound(error)) throw error;
    }
  }

  async changeOwnPassword(
    actor: AuthenticatedAdmin,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await this.prisma.admin.findUnique({ where: { id: actor.id } });
    if (!admin) throw new NotFoundException(NOT_FOUND);

    // 400 y no 401: un 401 haría que el panel cerrara la sesión por un simple error de tipeo
    if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('La contraseña nueva debe ser distinta de la actual.');
    }
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
  }
}
