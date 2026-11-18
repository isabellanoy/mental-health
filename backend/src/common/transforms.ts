import { Transform } from 'class-transformer';

export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

// Los campos multipart llegan como texto: "true"/"false" se convierten a booleano
export const ToBoolean = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });

const CONTROL_CHARS = /(?![\t\n\r])\p{Cc}/gu;
const HTML_TAGS = /<[^>]*>?/g;

// Limpia texto libre: quita caracteres de control y etiquetas HTML. Con `multiline`
// conserva los saltos de línea; si no, todo se colapsa en una sola línea.
export function sanitizeText(value: string, multiline = false): string {
  const clean = value.normalize('NFC').replace(CONTROL_CHARS, '').replace(HTML_TAGS, '');
  return (
    multiline
      ? clean
          .replace(/\r\n?/g, '\n')
          .replace(/[^\S\n]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
      : clean.replace(/\s+/g, ' ')
  ).trim();
}

export const Sanitize = (multiline = false) =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? sanitizeText(value, multiline) : value,
  );
