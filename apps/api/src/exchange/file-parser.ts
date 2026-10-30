import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { DomainError } from '@almacen/domain';
export type ImportKind = 'catalogue' | 'initial_stock';
export interface RowError {
  field: string;
  reason: string;
}
export interface ParsedRow {
  row: number;
  values: Record<string, string>;
  errors: RowError[];
}
export const headersFor = (kind: ImportKind) => kind === 'catalogue' ? ['sku', 'nombre', 'tipo_unidad', 'unidad_base'] : ['sku', 'codigo_ubicacion', 'cantidad'];
export function failFile(message: string, code = 'INVALID_FILE'): never {
  throw new DomainError(code, message);
}
export async function parseImportFile(bytes: Buffer, name: string, kind: ImportKind): Promise<ParsedRow[]> {
  if (bytes.length > 20000000)
    failFile('El archivo supera 20.000.000 bytes.', 'FILE_TOO_LARGE');
  if (!bytes.length)
    failFile('El archivo está vacío.');
  if (name.toLowerCase().endsWith('.xlsx')) {
    const { parseXlsx } = await import('./xlsx-parser.js');
    return parseXlsx(bytes, kind);
  }
  if (!name.toLowerCase().endsWith('.csv'))
    failFile('El formato de archivo no está disponible.', 'FORMAT');
  if (bytes.includes(0))
    failFile('El CSV contiene un carácter nulo no admitido.', 'FORMAT');
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  catch {
    failFile('CSV debe usar UTF-8 válido.', 'FORMAT');
  }
  const parser = Readable.from([bytes]).pipe(parse({ bom: true, delimiter: ',', relax_column_count: true, skip_empty_lines: false }));
  const rows: ParsedRow[] = [], headers = headersFor(kind);
  let line = 0;
  try {
    for await (const record of parser) {
      const values = record as string[];
      line++;
      if (line === 1) {
        if (values.length !== headers.length || values.some((v, i) => v !== headers[i]))
          failFile('Los encabezados no corresponden a la plantilla.', 'FORMAT');
        continue;
      }
      if (rows.length === 20000)
        failFile('El archivo supera 20.000 filas de datos.', 'ROW_LIMIT');
      rows.push({ row: line, values: Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])), errors: values.length !== headers.length ? [{ field: 'row', reason: 'La fila no contiene todas las columnas de la plantilla.' }] : [] });
    }
  }
  catch (error) {
    if (error instanceof DomainError)
      throw error;
    failFile('El CSV contiene comillas o registros corruptos.', 'FORMAT');
  }
  if (!rows.length)
    failFile('El archivo no contiene registros de datos.');
  return rows;
}
