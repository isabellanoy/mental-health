import { BadRequestException } from '@nestjs/common';
import { detectImageType, validateImage } from './image-validation.js';
import type { UploadedImage } from './image-validation.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);
const svg = Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');

const file = (overrides: Partial<UploadedImage> = {}): UploadedImage => ({
  originalname: 'foto.png',
  mimetype: 'image/png',
  size: png.length,
  buffer: png,
  ...overrides,
});

describe('validateImage', () => {
  it('acepta JPG, PNG y WebP para la ruleta', () => {
    expect(validateImage(file(), 'roulette')).toEqual({ extension: 'png', contentType: 'image/png' });
    expect(
      validateImage(file({ originalname: 'a.JPEG', mimetype: 'image/jpeg', buffer: jpg, size: jpg.length }), 'roulette').extension,
    ).toBe('jpg');
    expect(
      validateImage(file({ originalname: 'a.webp', mimetype: 'image/webp', buffer: webp, size: webp.length }), 'roulette').extension,
    ).toBe('webp');
  });

  it('rechaza SVG en la ruleta pero lo acepta en logos', () => {
    const svgFile = file({ originalname: 'logo.svg', mimetype: 'image/svg+xml', buffer: svg, size: svg.length });
    expect(() => validateImage(svgFile, 'roulette')).toThrow(BadRequestException);
    expect(validateImage(svgFile, 'logo').extension).toBe('svg');
  });

  it('rechaza archivos que superan el tamaño máximo', () => {
    const big = file({ size: 5 * 1024 * 1024 + 1 });
    expect(() => validateImage(big, 'roulette')).toThrow(/5 MB/i);
    expect(() => validateImage(file({ size: 2 * 1024 * 1024 + 1 }), 'logo')).toThrow(/2 MB/i);
  });

  it('rechaza extensiones no permitidas', () => {
    expect(() => validateImage(file({ originalname: 'script.exe' }), 'roulette')).toThrow(
      /formato no permitido/i,
    );
  });

  it('rechaza cuando el mimetype no coincide con la extensión', () => {
    expect(() => validateImage(file({ mimetype: 'image/jpeg' }), 'roulette')).toThrow(
      /no coincide/i,
    );
  });

  it('rechaza archivos cuyo contenido real no es una imagen', () => {
    const fake = Buffer.from('esto no es una imagen');
    expect(() => validateImage(file({ buffer: fake, size: fake.length }), 'roulette')).toThrow(
      /contenido/i,
    );
  });

  it('rechaza una imagen cuyo contenido es de otro formato', () => {
    expect(() =>
      validateImage(file({ originalname: 'a.jpg', mimetype: 'image/jpeg' }), 'roulette'),
    ).toThrow(/contenido/i);
  });

  it('rechaza SVG con scripts o contenido activo', () => {
    const evil = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const evilFile = file({ originalname: 'x.svg', mimetype: 'image/svg+xml', buffer: evil, size: evil.length });
    expect(() => validateImage(evilFile, 'logo')).toThrow(/no permitidos/i);

    const handler = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="x()"></svg>');
    expect(() =>
      validateImage({ ...evilFile, buffer: handler, size: handler.length }, 'logo'),
    ).toThrow(/no permitidos/i);
  });

  it('rechaza archivos vacíos o ausentes', () => {
    expect(() => validateImage(undefined, 'roulette')).toThrow(BadRequestException);
    expect(() => validateImage(file({ size: 0, buffer: Buffer.alloc(0) }), 'roulette')).toThrow(
      BadRequestException,
    );
  });

  it('antepone la etiqueta del archivo en los errores de lotes', () => {
    expect(() => validateImage(file({ originalname: 'x.exe' }), 'roulette', 'Archivo 2')).toThrow(
      /^Archivo 2:/,
    );
  });
});

describe('detectImageType', () => {
  it('reconoce el tipo por el contenido', () => {
    expect(detectImageType(png)).toBe('png');
    expect(detectImageType(jpg)).toBe('jpg');
    expect(detectImageType(webp)).toBe('webp');
    expect(detectImageType(svg)).toBe('svg');
    expect(detectImageType(Buffer.from('hola'))).toBeNull();
  });
});
