import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Sanitize } from '../../../common/transforms.js';
import { ADMIN_ROLES } from '../../auth/admin.types.js';
import { MIN_PASSWORD_LENGTH } from '../../auth/password.js';

export class CreateAdminDto {
  @Sanitize()
  @MaxLength(80, { message: 'El nombre puede tener hasta 80 caracteres.' })
  @MinLength(1, { message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre es obligatorio.' })
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254, { message: 'El correo electrónico es demasiado largo.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  })
  @IsString({ message: 'La contraseña es obligatoria.' })
  password: string;

  @IsOptional()
  @IsIn(ADMIN_ROLES, { message: 'El rol debe ser superadmin o admin.' })
  role?: (typeof ADMIN_ROLES)[number];
}
