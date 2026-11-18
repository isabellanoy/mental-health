import { randomUUID } from 'node:crypto';

const MAX_SLUG_LENGTH = 40;

// Deja solo letras, números y guiones: evita rutas, espacios y caracteres raros en Storage
export function sanitizeFileStem(originalName: string): string {
  const stem = originalName.replace(/\.[^./\\]*$/, '');
  const slug = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || 'archivo';
}

// Nombre único (uuid) + nombre original sanitizado + extensión validada
export function buildStoragePath(originalName: string, extension: string): string {
  return `${randomUUID()}-${sanitizeFileStem(originalName)}.${extension}`;
}
