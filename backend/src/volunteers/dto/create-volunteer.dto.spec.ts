import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVolunteerDto } from './create-volunteer.dto.js';

const valid = {
  firstName: '  Lucía ',
  lastName: 'Pérez',
  career: 'Psicología',
  email: ' LUCIA@Correo.com ',
  phone: '+58 412 000 0000',
  helpAreas: ['tecnologia'],
  availability: 'pocas_horas',
  consent: true,
};

async function check(overrides: Record<string, unknown> = {}) {
  const dto = plainToInstance(CreateVolunteerDto, { ...valid, ...overrides });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, messages: errors.flatMap((error) => Object.values(error.constraints ?? {})) };
}

describe('CreateVolunteerDto', () => {
  it('acepta un voluntario válido y normaliza los textos', async () => {
    const { dto, messages } = await check();
    expect(messages).toEqual([]);
    expect(dto.firstName).toBe('Lucía');
    expect(dto.email).toBe('lucia@correo.com');
  });

  it('el semestre y el mensaje son opcionales (vacíos se aceptan)', async () => {
    expect((await check({ semester: '', message: '' })).messages).toEqual([]);
  });

  it.each([
    ['firstName', '   ', 'El nombre es obligatorio.'],
    ['lastName', '', 'El apellido es obligatorio.'],
    ['career', '', 'La carrera o profesión es obligatoria.'],
    ['email', 'no-es-correo', 'El correo electrónico no es válido.'],
    ['phone', 'abc', 'El teléfono no es válido.'],
    ['helpAreas', [], 'Elige al menos una forma de ayudar.'],
    ['helpAreas', ['otra', 'otra'], 'Las formas de ayudar no pueden repetirse.'],
    ['helpAreas', ['cocinar'], 'Una de las formas de ayudar no es válida.'],
    ['availability', 'siempre', 'La disponibilidad no es válida.'],
    ['message', 'x'.repeat(501), 'El mensaje puede tener hasta 500 caracteres.'],
    ['consent', false, 'Necesitamos tu consentimiento para poder contactarte.'],
  ])('rechaza %s inválido', async (field, value, expected) => {
    expect((await check({ [field]: value })).messages).toContain(expected);
  });

  it('rechaza campos que no están en el DTO (status, notes…)', async () => {
    expect((await check({ status: 'activo' })).messages.length).toBeGreaterThan(0);
  });

  it('limpia etiquetas HTML y caracteres de control del mensaje', async () => {
    const { dto } = await check({ message: '<script>x</script>Hola\u0000\n\n\n\nmundo' });
    expect(dto.message).toBe('xHola\n\nmundo');
  });
});
