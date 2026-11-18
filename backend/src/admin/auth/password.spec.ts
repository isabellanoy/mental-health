import { BadRequestException } from '@nestjs/common';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('guarda un hash bcrypt, nunca la contraseña, y lo verifica', async () => {
    const hash = await hashPassword('una-contrasena-larga');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toContain('una-contrasena-larga');
    expect(await verifyPassword('una-contrasena-larga', hash)).toBe(true);
    expect(await verifyPassword('otra-contrasena', hash)).toBe(false);
  });

  it('usa una sal distinta cada vez', async () => {
    expect(await hashPassword('misma-contrasena')).not.toBe(await hashPassword('misma-contrasena'));
  });

  it('rechaza contraseñas que bcrypt truncaría (más de 72 bytes)', async () => {
    await expect(hashPassword('ñ'.repeat(40))).rejects.toBeInstanceOf(BadRequestException);
  });
});
