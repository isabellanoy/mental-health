import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Sanitize } from '../../common/transforms.js';
import { AVAILABILITIES, HELP_AREAS } from '../volunteer.constants.js';

const lowerCase = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

const isFilled = (value: unknown) => value !== undefined && value !== null && value !== '';

// class-validator ejecuta los decoradores de abajo hacia arriba: con `stopAtFirstError`
// el de más abajo (tipo) se evalúa primero y da el mensaje más claro.
export class CreateVolunteerDto {
  @Sanitize()
  @MaxLength(60, { message: 'El nombre puede tener hasta 60 caracteres.' })
  @MinLength(1, { message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre es obligatorio.' })
  firstName: string;

  @Sanitize()
  @MaxLength(60, { message: 'El apellido puede tener hasta 60 caracteres.' })
  @MinLength(1, { message: 'El apellido es obligatorio.' })
  @IsString({ message: 'El apellido es obligatorio.' })
  lastName: string;

  @Sanitize()
  @MaxLength(100, { message: 'La carrera o profesión puede tener hasta 100 caracteres.' })
  @MinLength(1, { message: 'La carrera o profesión es obligatoria.' })
  @IsString({ message: 'La carrera o profesión es obligatoria.' })
  career: string;

  @Sanitize()
  @ValidateIf((_, value) => isFilled(value))
  @MaxLength(40, { message: 'El semestre o año puede tener hasta 40 caracteres.' })
  @IsString({ message: 'El semestre o año debe ser texto.' })
  semester?: string;

  @lowerCase()
  @MaxLength(254, { message: 'El correo electrónico es demasiado largo.' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @Sanitize()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'El teléfono no es válido.' })
  @IsString({ message: 'El teléfono es obligatorio.' })
  phone: string;

  @IsIn(HELP_AREAS, { each: true, message: 'Una de las formas de ayudar no es válida.' })
  @ArrayUnique({ message: 'Las formas de ayudar no pueden repetirse.' })
  @ArrayMaxSize(HELP_AREAS.length, { message: 'Hay demasiadas formas de ayudar en la lista.' })
  @ArrayMinSize(1, { message: 'Elige al menos una forma de ayudar.' })
  @IsArray({ message: 'Las formas de ayudar deben enviarse como una lista.' })
  helpAreas: string[];

  @IsIn(AVAILABILITIES, { message: 'La disponibilidad no es válida.' })
  availability: (typeof AVAILABILITIES)[number];

  @Sanitize(true)
  @ValidateIf((_, value) => isFilled(value))
  @MaxLength(500, { message: 'El mensaje puede tener hasta 500 caracteres.' })
  @IsString({ message: 'El mensaje debe ser texto.' })
  message?: string;

  @Equals(true, { message: 'Necesitamos tu consentimiento para poder contactarte.' })
  @IsBoolean({ message: 'El consentimiento debe ser verdadero o falso.' })
  consent: boolean;

  // Honeypot: las personas nunca lo llenan
  @IsOptional()
  @MaxLength(500, { message: 'Campo no válido.' })
  @IsString({ message: 'Campo no válido.' })
  website?: string;
}
