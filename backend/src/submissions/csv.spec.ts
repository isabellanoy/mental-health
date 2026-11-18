import { escapeCsvCell, toCsv } from './csv.js';

describe('toCsv', () => {
  it('empieza con BOM UTF-8 y usa saltos de línea CRLF', () => {
    const csv = toCsv(['a', 'b'], [['ñ', 1]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toBe('\uFEFFa,b\r\nñ,1\r\n');
  });

  it('entrecomilla comas, comillas y saltos de línea', () => {
    expect(escapeCsvCell('hola, "mundo"', ',')).toBe('"hola, ""mundo"""');
    expect(escapeCsvCell('línea 1\nlínea 2', ',')).toBe('"línea 1\nlínea 2"');
  });

  it('respeta el separador elegido', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'z']], ';')).toBe('\uFEFFa;b\r\n"x;y";z\r\n');
  });

  it('neutraliza fórmulas de hoja de cálculo', () => {
    expect(escapeCsvCell('=SUM(A1)', ',')).toBe("'=SUM(A1)");
    expect(escapeCsvCell('@cmd', ',')).toBe("'@cmd");
    expect(escapeCsvCell(null, ',')).toBe('');
  });
});
