import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../common/transforms.js';

export class LoginDto {
  @Trim()
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  @MinLength(1, { message: 'El correo es obligatorio.' })
  @IsString({ message: 'El correo es obligatorio.' })
  email: string;

  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  @MinLength(1, { message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña es obligatoria.' })
  password: string;
}
