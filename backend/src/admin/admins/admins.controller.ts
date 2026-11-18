import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthenticatedAdmin } from '../auth/admin.types.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ChangePasswordDto } from '../auth/dto/change-password.dto.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminsService } from './admins.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';

const INVALID_ID = 'El identificador no es válido.';
const idPipe = () =>
  new ParseUUIDPipe({ exceptionFactory: () => new BadRequestException(INVALID_ID) });

@UseGuards(AdminGuard, RolesGuard)
@Controller('admin')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get('me')
  me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.admins.me(admin.id);
  }

  // 5 intentos por minuto y por IP: evita adivinar la contraseña actual con un token robado
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch('me/password')
  @HttpCode(204)
  async changePassword(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() dto: ChangePasswordDto) {
    await this.admins.changeOwnPassword(admin, dto.currentPassword, dto.newPassword);
  }

  @Roles('superadmin')
  @Get('admins')
  list() {
    return this.admins.list();
  }

  @Roles('superadmin')
  @Post('admins')
  create(@Body() dto: CreateAdminDto) {
    return this.admins.create(dto);
  }

  @Roles('superadmin')
  @Patch('admins/:id')
  update(
    @Param('id', idPipe()) id: string,
    @Body() dto: UpdateAdminDto,
    @CurrentAdmin() actor: AuthenticatedAdmin,
  ) {
    return this.admins.update(id, dto, actor);
  }

  @Roles('superadmin')
  @Delete('admins/:id')
  @HttpCode(204)
  async remove(@Param('id', idPipe()) id: string, @CurrentAdmin() actor: AuthenticatedAdmin) {
    await this.admins.remove(id, actor);
  }
}
