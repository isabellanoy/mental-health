import { buildStoragePath, sanitizeFileStem } from './storage-path.js';

describe('storage path', () => {
  it('sanitiza el nombre original', () => {
    expect(sanitizeFileStem('Mi Logo ÁÉÍ (final).png')).toBe('mi-logo-aei-final');
    expect(sanitizeFileStem('../../etc/passwd.png')).toBe('etc-passwd');
    expect(sanitizeFileStem('.png')).toBe('archivo');
  });

  it('genera rutas únicas con uuid y sin separadores de carpeta', () => {
    const first = buildStoragePath('foto.png', 'png');
    const second = buildStoragePath('foto.png', 'png');
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}-foto\.png$/);
    expect(first).not.toContain('/');
  });
});
