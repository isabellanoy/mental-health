import { IsString, MaxLength, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../password.js';

export class ChangePasswordDto {
  @MaxLength(200, { message: 'La contraseña actual es demasiado larga.' })
  @MinLength(1, { message: 'Escribe tu contraseña actual.' })
  @IsString({ message: 'Escribe tu contraseña actual.' })
  currentPassword: string;

  @MaxLength(200, { message: 'La contraseña nueva es demasiado larga.' })
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  })
  @IsString({ message: 'La contraseña nueva es obligatoria.' })
  newPassword: string;
}
