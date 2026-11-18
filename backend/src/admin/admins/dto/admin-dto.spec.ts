import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdminDto } from './create-admin.dto.js';
import { UpdateAdminDto } from './update-admin.dto.js';

async function messages<T extends object>(cls: new () => T, plain: object) {
  const errors = await validate(plainToInstance(cls, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('DTOs de administradores', () => {
  const valid = { name: 'Ana', email: ' ANA@Correo.com ', password: '1234567890', role: 'admin' };

  it('acepta un administrador válido y pasa el correo a minúsculas', async () => {
    expect(await messages(CreateAdminDto, valid)).toEqual([]);
    expect(plainToInstance(CreateAdminDto, valid).email).toBe('ana@correo.com');
  });

  it.each([
    [{ password: '123456789' }, 'La contraseña debe tener al menos 10 caracteres.'],
    [{ email: 'no-es-correo' }, 'El correo electrónico no es válido.'],
    [{ role: 'dios' }, 'El rol debe ser superadmin o admin.'],
    [{ name: '  ' }, 'El nombre es obligatorio.'],
  ])('rechaza %j al crear', async (override, expected) => {
    expect(await messages(CreateAdminDto, { ...valid, ...override })).toContain(expected);
  });

  it('al editar exige 10 caracteres si se envía contraseña y rechaza campos extra', async () => {
    expect(await messages(UpdateAdminDto, { password: 'corta' })).toContain(
      'La contraseña debe tener al menos 10 caracteres.',
    );
    expect((await messages(UpdateAdminDto, { email: 'x@y.co' })).length).toBeGreaterThan(0);
    expect(await messages(UpdateAdminDto, { active: false })).toEqual([]);
  });
});
