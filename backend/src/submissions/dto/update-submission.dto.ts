import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { STATUSES } from '../submission.constants.js';
import type { SubmissionStatus } from '../submission.constants.js';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsIn(STATUSES, { message: 'El estado debe ser nuevo, contactado o cerrado.' })
  status?: SubmissionStatus;

  // null o cadena vacía borran la nota
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(2000, { message: 'Las notas pueden tener hasta 2000 caracteres.' })
  notes?: string | null;
}
