import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VOLUNTEER_STATUSES } from '../volunteer.constants.js';
import type { VolunteerStatus } from '../volunteer.constants.js';

export class UpdateVolunteerDto {
  @IsOptional()
  @IsIn(VOLUNTEER_STATUSES, {
    message: 'El estado debe ser nuevo, contactado, activo o descartado.',
  })
  status?: VolunteerStatus;

  // null o cadena vacía borran la nota
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(2000, { message: 'Las notas pueden tener hasta 2000 caracteres.' })
  notes?: string | null;
}
