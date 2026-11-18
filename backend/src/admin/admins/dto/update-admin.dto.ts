import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Sanitize } from '../../../common/transforms.js';
import { ADMIN_ROLES } from '../../auth/admin.types.js';
import { MIN_PASSWORD_LENGTH } from '../../auth/password.js';

export class UpdateAdminDto {
  @IsOptional()
  @Sanitize()
  @MaxLength(80, { message: 'El nombre puede tener hasta 80 caracteres.' })
  @MinLength(1, { message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser texto.' })
  name?: string;

  @IsOptional()
  @IsIn(ADMIN_ROLES, { message: 'El rol debe ser superadmin o admin.' })
  role?: (typeof ADMIN_ROLES)[number];

  @IsOptional()
  @IsBoolean({ message: '"active" debe ser verdadero o falso.' })
  active?: boolean;

  // Restablece la contraseña de otro administrador
  @IsOptional()
  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  })
  @IsString({ message: 'La contraseña debe ser texto.' })
  password?: string;
}
