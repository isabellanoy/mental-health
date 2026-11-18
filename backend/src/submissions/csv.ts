export type CsvDelimiter = ',' | ';';

const FORMULA_START = /^[=+\-@\t\r]/;

// Evita la inyección de fórmulas en Excel/Sheets: las celdas que empiezan con = + - @ se tratan como texto
export function escapeCsvCell(value: string | number | boolean | null | undefined, delimiter: CsvDelimiter): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  const needsQuotes = text.includes('"') || text.includes('\n') || text.includes('\r') || text.includes(delimiter);
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

// UTF-8 con BOM para que Excel respete tildes y eñes
export function toCsv(
  header: string[],
  rows: (string | number | boolean | null | undefined)[][],
  delimiter: CsvDelimiter = ',',
): string {
  const lines = [header, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter),
  );
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
