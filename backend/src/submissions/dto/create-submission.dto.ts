import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Trim } from '../../common/transforms.js';
import {
  BEST_TIMES,
  DURATIONS,
  EMOTIONS,
  PRIORITIES,
  QUALITY,
  SELF_HARM,
} from '../submission.constants.js';

const lowerCase = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

// class-validator ejecuta los decoradores de abajo hacia arriba: con `stopAtFirstError`
// el de más abajo (tipo) se evalúa primero y da el mensaje más claro.
const isFilled = (value: unknown) => value !== undefined && value !== null && value !== '';

export class CreateSubmissionDto {
  @Trim()
  @MaxLength(60, { message: 'El nombre puede tener hasta 60 caracteres.' })
  @MinLength(1, { message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre es obligatorio.' })
  name: string;

  @Max(100, { message: 'La edad debe ser de 100 años o menos.' })
  @Min(10, { message: 'La edad debe ser de 10 años o más.' })
  @IsInt({ message: 'La edad debe ser un número entero.' })
  age: number;

  @Max(5, { message: 'El estado de ánimo debe estar entre 1 y 5.' })
  @Min(1, { message: 'El estado de ánimo debe estar entre 1 y 5.' })
  @IsInt({ message: 'El estado de ánimo debe ser un número entero entre 1 y 5.' })
  mood: number;

  @IsIn(EMOTIONS, { each: true, message: 'Una de las emociones no es válida.' })
  @ArrayUnique({ message: 'Las emociones no pueden repetirse.' })
  @ArrayMaxSize(EMOTIONS.length, { message: 'Hay demasiadas emociones en la lista.' })
  @ArrayMinSize(1, { message: 'Elige al menos una emoción.' })
  @IsArray({ message: 'Las emociones deben enviarse como una lista.' })
  emotions: string[];

  @IsIn(DURATIONS, { message: 'La duración no es válida.' })
  duration: string;

  @Max(10, { message: 'El impacto debe estar entre 0 y 10.' })
  @Min(0, { message: 'El impacto debe estar entre 0 y 10.' })
  @IsInt({ message: 'El impacto debe ser un número entero entre 0 y 10.' })
  impact: number;

  @IsIn(QUALITY, { message: 'El valor de sueño no es válido.' })
  sleep: string;

  @IsIn(QUALITY, { message: 'El valor de apetito no es válido.' })
  appetite: string;

  @IsIn(SELF_HARM, { message: 'La respuesta sobre pensamientos de hacerse daño no es válida.' })
  selfHarm: (typeof SELF_HARM)[number];

  @lowerCase()
  @MaxLength(254, { message: 'El correo electrónico es demasiado largo.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @Trim()
  @ValidateIf((_, value) => isFilled(value))
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'El teléfono no es válido.' })
  phone?: string;

  @IsIn(BEST_TIMES, { message: 'El mejor horario no es válido.' })
  bestTime: string;

  @Equals(true, { message: 'Necesitamos tu consentimiento para poder contactarte.' })
  @IsBoolean({ message: 'El consentimiento debe ser verdadero o falso.' })
  consent: boolean;

  // El cliente la envía, pero se ignora: la prioridad se recalcula en el servidor
  @IsOptional()
  @IsIn(PRIORITIES, { message: 'La prioridad no es válida.' })
  priority?: string;

  // Honeypot: las personas nunca lo llenan
  @IsOptional()
  @MaxLength(500, { message: 'Campo no válido.' })
  @IsString({ message: 'Campo no válido.' })
  website?: string;
}
