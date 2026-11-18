import { BadRequestException } from '@nestjs/common';

export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type ImageKind = 'roulette' | 'logo';
type ImageExtension = 'jpg' | 'png' | 'webp' | 'svg';

export interface ValidatedImage {
  extension: ImageExtension;
  contentType: string;
}

const MB = 1024 * 1024;

export const IMAGE_RULES: Record<ImageKind, { maxBytes: number; extensions: ImageExtension[]; label: string }> = {
  roulette: { maxBytes: 5 * MB, extensions: ['jpg', 'png', 'webp'], label: 'JPG, PNG o WebP' },
  logo: { maxBytes: 2 * MB, extensions: ['png', 'jpg', 'webp', 'svg'], label: 'PNG, JPG, WebP o SVG' },
};

const CONTENT_TYPES: Record<ImageExtension, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const EXTENSION_ALIASES: Record<string, ImageExtension> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  svg: 'svg',
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SVG_START = /^(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i;
const SVG_FORBIDDEN =
  /<script|<foreignObject|<iframe|<embed|<object|javascript:|data:text\/html|\son[a-z]+\s*=/i;

const startsWith = (buffer: Buffer, bytes: number[]) =>
  buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);

// Detecta el tipo real mirando el contenido, no lo que declara el cliente
export function detectImageType(buffer: Buffer): ImageExtension | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(buffer, PNG_SIGNATURE)) return 'png';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  const head = buffer.toString('utf8', 0, 2048).replace(/^\uFEFF/, '').trimStart();
  if (SVG_START.test(head)) return 'svg';
  return null;
}

function reject(message: string, label?: string): never {
  const text = label ? `${label}: ${message}` : `${message[0].toUpperCase()}${message.slice(1)}`;
  throw new BadRequestException(text);
}

export function validateImage(
  file: UploadedImage | undefined,
  kind: ImageKind,
  label?: string,
): ValidatedImage {
  const rules = IMAGE_RULES[kind];
  if (!file || file.size === 0 || file.buffer.length === 0) {
    reject('el archivo está vacío o no se recibió.', label);
  }

  const maxMb = rules.maxBytes / MB;
  if (file.size > rules.maxBytes || file.buffer.length > rules.maxBytes) {
    reject(`supera el tamaño máximo de ${maxMb} MB.`, label);
  }

  const rawExtension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
  const extension = EXTENSION_ALIASES[rawExtension];
  if (!extension || !rules.extensions.includes(extension)) {
    reject(`formato no permitido. Usa ${rules.label}.`, label);
  }

  if (file.mimetype.toLowerCase() !== CONTENT_TYPES[extension]) {
    reject('el tipo de archivo no coincide con su extensión.', label);
  }

  if (detectImageType(file.buffer) !== extension) {
    reject('el contenido del archivo no corresponde a una imagen válida.', label);
  }

  if (extension === 'svg' && SVG_FORBIDDEN.test(file.buffer.toString('utf8'))) {
    reject('el SVG contiene elementos no permitidos (scripts o contenido activo).', label);
  }

  return { extension, contentType: CONTENT_TYPES[extension] };
}
