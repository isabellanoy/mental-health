import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PRIORITIES, STATUSES } from '../submission.constants.js';
import type { Priority, SubmissionStatus } from '../submission.constants.js';

export class SubmissionFiltersDto {
  @IsOptional()
  @IsIn(STATUSES, { message: 'El filtro de estado no es válido (nuevo, contactado o cerrado).' })
  status?: SubmissionStatus;

  @IsOptional()
  @IsIn(PRIORITIES, { message: 'El filtro de prioridad no es válido (alta o normal).' })
  priority?: Priority;
}

export class ListSubmissionsQueryDto extends SubmissionFiltersDto {
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

export class ExportSubmissionsQueryDto extends SubmissionFiltersDto {
  @IsOptional()
  @IsIn([',', ';'], { message: 'El separador debe ser "," o ";".' })
  delimiter: ',' | ';' = ',';
}
