import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';

function collect(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([constraint, message]) =>
      constraint === 'whitelistValidation' ? `El campo "${path}" no está permitido.` : message,
    );
    return [...own, ...collect(error.children ?? [], path)];
  });
}

// Mensajes de validación siempre en español y sin devolver los valores recibidos
export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    statusCode: 400,
    error: 'Solicitud inválida',
    message: collect(errors),
  });
}
