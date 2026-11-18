import { BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

export const MIN_PASSWORD_LENGTH = 10;
// bcrypt solo usa los primeros 72 bytes: se rechaza lo que se truncaría en silencio
export const MAX_PASSWORD_BYTES = 72;

const ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new BadRequestException('La contraseña es demasiado larga (máximo 72 bytes).');
  }
  return hash(password, ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

// Hash de relleno para que un correo inexistente tarde lo mismo que uno existente
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hash('contrasena-de-relleno', ROUNDS);
  await compare(password, await dummyHash);
}
