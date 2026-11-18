import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transforms.js';
import { VOLUNTEER_STATUSES } from '../volunteer.constants.js';
import type { VolunteerStatus } from '../volunteer.constants.js';

export class VolunteerFiltersDto {
  @IsOptional()
  @IsIn(VOLUNTEER_STATUSES, {
    message: 'El filtro de estado no es válido (nuevo, contactado, activo o descartado).',
  })
  status?: VolunteerStatus;

  // Busca por nombre, apellido o correo
  @IsOptional()
  @Trim()
  @MaxLength(100, { message: 'La búsqueda puede tener hasta 100 caracteres.' })
  @IsString({ message: 'La búsqueda debe ser texto.' })
  search?: string;
}

export class ListVolunteersQueryDto extends VolunteerFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  @IsInt({ message: 'La página debe ser un número entero.' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Max(100, { message: 'El tamaño de página máximo es 100.' })
  @Min(1, { message: 'El tamaño de página debe ser 1 o mayor.' })
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  pageSize: number = 20;
}

export class ExportVolunteersQueryDto extends VolunteerFiltersDto {
  @IsOptional()
  @IsIn([',', ';'], { message: 'El separador debe ser "," o ";".' })
  delimiter: ',' | ';' = ',';
}
