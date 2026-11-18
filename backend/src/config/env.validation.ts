const REQUIRED = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
] as const;

const MIN_JWT_SECRET_LENGTH = 32;

// Falla al arrancar (con un mensaje claro) si falta alguna variable obligatoria
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((name) => {
    const value = config[name];
    return typeof value !== 'string' || value.trim() === '';
  });
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  }

  const secret = config.JWT_SECRET as string;
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET es demasiado corto: usa al menos ${MIN_JWT_SECRET_LENGTH} caracteres aleatorios.`,
    );
  }
  return config;
}
