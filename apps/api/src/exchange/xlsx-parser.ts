import { orderedXlsxParts } from './xlsx-container.js';
import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { DomainError } from '@almacen/domain';
import { headersFor, failFile, type ImportKind, type ParsedRow } from './file-parser.js';
export async function parseXlsx(bytes: Buffer, kind: ImportKind): Promise<ParsedRow[]> {
  if (bytes.length < 4 || bytes.readUInt16LE(0) !== 0x4b50)
    failFile('No es un contenedor XLSX válido.', 'FORMAT');
  // ZIP directory paths remain visible without decompressing or running content.
  if (/xl\/(?:vbaProject|externalLinks|embeddings|activeX)/iu.test(bytes.toString('latin1')))
    failFile('No se admiten macros, objetos activos ni referencias externas.', 'FORMAT');
  const rows: ParsedRow[] = [], headers = headersFor(kind);
  let sheets = 0, header = false;
  try {
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(orderedXlsxParts(bytes)), { worksheets: 'emit', sharedStrings: 'cache', hyperlinks: 'cache', styles: 'ignore' });
    for await (const sheet of workbook) {
      sheets++;
      const metadata = sheet as unknown as {
        name: string;
        hyperlinks?: Record<string, unknown>;
      };
      if (sheets !== 1 || metadata.name !== 'Datos')
        failFile('XLSX requiere una única hoja llamada Datos.', 'FORMAT');
      let last = 1;
      for await (const record of sheet) {
        const values = headers.map((_, i) => record.getCell(i + 1).value), nonempty = record.hasValues;
        if (record.number === 1) {
          if (record.cellCount !== headers.length || values.some((v, i) => v !== headers[i]))
            failFile('Los encabezados no corresponden a la plantilla.', 'FORMAT');
          header = true;
          continue;
        }
        if (!nonempty)
          continue;
        if (record.number > 20001)
          failFile('El archivo supera 20.000 filas de datos.', 'ROW_LIMIT');
        for (let missing = last + 1; missing < record.number; missing++)
          rows.push({ row: missing, values: Object.fromEntries(headers.map(h => [h, ''])), errors: [{ field: 'row', reason: 'Fila vacía intermedia.' }] });
        const row: ParsedRow = { row: record.number, values: {}, errors: [] };
        for (let i = 0; i < headers.length; i++) {
          const field = headers[i]!, v = values[i];
          if (typeof v === 'string')
            row.values[field] = v;
          else if (typeof v === 'number' && Number.isFinite(v) && (!Number.isInteger(v) || Number.isSafeInteger(v)))
            row.values[field] = String(v);
          else {
            row.values[field] = '';
            row.errors.push({ field, reason: 'Usa texto o número decimal exacto; no fórmulas, enlaces ni objetos.' });
          }
        }
        if (record.cellCount > headers.length)
          row.errors.push({ field: 'row', reason: 'La fila contiene columnas adicionales.' });
        rows.push(row);
        last = record.number;
      }
      for (const ref of Object.keys(metadata.hyperlinks ?? {})) {
        const match = /^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$/u.exec(ref);
        if (!match)
          failFile('La referencia de hipervínculo no está admitida.', 'FORMAT');
        const column = (value: string) => [...value].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
        const firstColumn = column(match[1]!), lastColumn = column(match[3] ?? match[1]!), firstRow = Number(match[2]), lastRow = Number(match[4] ?? match[2]);
        if (firstRow < 1 || lastRow > 1048576 || lastRow < firstRow || firstColumn < 0 || lastColumn > 16383 || lastColumn < firstColumn || firstRow === 1)
          failFile('El archivo contiene un hipervínculo no admitido.', 'FORMAT');
        for (const row of rows)
          if (row.row >= firstRow && row.row <= lastRow) {
            for (let i = firstColumn; i <= Math.min(lastColumn, headers.length - 1); i++)
              row.errors.push({ field: headers[i]!, reason: 'No se admiten hipervínculos como datos.' });
          }
      }
    }
  }
  catch (error) {
    if (error instanceof DomainError)
      throw error;
    failFile('El XLSX está vacío o corrupto.', 'FORMAT');
  }
  if (!header || !rows.length)
    failFile('El archivo no contiene registros de datos.');
  return rows;
}
