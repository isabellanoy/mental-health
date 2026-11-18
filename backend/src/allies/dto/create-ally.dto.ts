import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ToBoolean, Trim } from '../../common/transforms.js';

const URL_MESSAGE = 'website_url debe ser una dirección válida que empiece con http:// o https://';

// Los campos llegan como multipart (texto) junto con el archivo "logo"
export class CreateAllyDto {
  @Trim()
  @MaxLength(80, { message: 'El nombre puede tener hasta 80 caracteres.' })
  @MinLength(1, { message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre es obligatorio.' })
  name: string;

  @Trim()
  @MaxLength(500, { message: 'website_url puede tener hasta 500 caracteres.' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: URL_MESSAGE })
  @Matches(/^https?:\/\//i, { message: URL_MESSAGE })
  @IsString({ message: URL_MESSAGE })
  website_url: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'La posición debe ser 0 o mayor.' })
  @IsInt({ message: 'La posición debe ser un número entero.' })
  position?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean({ message: '"active" debe ser verdadero o falso.' })
  active?: boolean;
}
