import { expect, it } from 'vitest';
const modulePath = '../../apps/api/dist/exchange/file-parser.js';
it('I-EXC/parser-csv interpreta BOM Unicode y comillas, rechaza vacío y UTF-8 corrupto', async () => {
  const { parseImportFile } = await import(modulePath);
  const rows = await parseImportFile(Buffer.from('\ufeffsku,nombre,tipo_unidad,unidad_base\r\nMOTOR,"Motor, sintético ñ",piece,pieza\r\n'), 'catalogo.csv', 'catalogue');
  expect(rows).toEqual([{ row: 2, values: { sku: 'MOTOR', nombre: 'Motor, sintético ñ', tipo_unidad: 'piece', unidad_base: 'pieza' }, errors: [] }]);
  for (const bytes of [Buffer.from(''), Buffer.from([0xff, 0xfe]), Buffer.from('sku;nombre\nMOTOR;Motor'), Buffer.from('sku,nombre,tipo_unidad,unidad_base\nMOTOR,Motor\0,piece,pieza\n')])
    await expect(parseImportFile(bytes, 'catalogo.csv', 'catalogue')).rejects.toMatchObject({ code: expect.stringMatching(/INVALID_FILE|FORMAT/) });
});
it('I-EXC/parser-xlsx acepta texto exacto y rechaza fórmula e hipervínculo por fila', async () => {
  const { default: ExcelJS } = await import('exceljs');
  const { parseImportFile } = await import(modulePath);
  const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('Datos');
  sheet.addRow(['sku', 'codigo_ubicacion', 'cantidad']);
  sheet.addRow(['MOTOR', 'A/1', '12345678901234567890.125']);
  sheet.addRow(['MOTOR', 'A/2', { formula: '1+1', result: 2 }]);
  sheet.addRow(['MOTOR', 'A/3', { text: '2', hyperlink: 'https://example.test' }]);
  const rows = await parseImportFile(Buffer.from(await workbook.xlsx.writeBuffer()), 'stock.xlsx', 'initial_stock');
  expect(rows[0].values.cantidad).toBe('12345678901234567890.125');
  expect(rows[1].errors).toEqual([expect.objectContaining({ field: 'cantidad' })]);
  expect(rows[2].errors).toHaveLength(1);
});
it('I-EXC/fronteras-archivo acepta 20.000 filas y 20.000.000 bytes exactos y rechaza cada exceso', async () => {
  const { parseImportFile } = await import(modulePath);
  const base = 'sku,nombre,tipo_unidad,unidad_base\n' + Array.from({ length: 20000 }, (_, i) => `SKU-${i},Motor sintético,piece,pieza\n`).join('');
  const bytes = Buffer.from(base), position = bytes.indexOf(Buffer.from('Motor'));
  const exact = Buffer.concat([bytes.subarray(0, position), Buffer.alloc(20000000 - bytes.length, 32), bytes.subarray(position)]);
  expect(exact.length).toBe(20000000);
  expect(await parseImportFile(exact, 'limite.csv', 'catalogue')).toHaveLength(20000);
  await expect(parseImportFile(Buffer.concat([exact, Buffer.from(' ')]), 'exceso.csv', 'catalogue')).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
  await expect(parseImportFile(Buffer.from(base + 'EXTRA,Motor,piece,pieza\n'), 'filas.csv', 'catalogue')).rejects.toMatchObject({ code: 'ROW_LIMIT' });
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('Datos');
  sheet.addRow(['sku', 'nombre', 'tipo_unidad', 'unidad_base']);
  for (let i = 0; i < 20000; i++)
    sheet.addRow(['SKU-' + i, 'Motor sintético', 'piece', 'pieza']);
  sheet.getCell('A50000').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  expect(await parseImportFile(Buffer.from(await workbook.xlsx.writeBuffer()), 'limite.xlsx', 'catalogue')).toHaveLength(20000);
  sheet.getCell('A20002').value = 'EXCESO';
  await expect(parseImportFile(Buffer.from(await workbook.xlsx.writeBuffer()), 'exceso.xlsx', 'catalogue')).rejects.toMatchObject({ code: 'ROW_LIMIT' });
}, 30000);
it('I-EXC/xlsx-activo identifica enlaces por rango y contenedores con macros', async () => {
  const { createRequire } = await import('node:module'), { default: ExcelJS } = await import('exceljs');
  const JSZip = createRequire(import.meta.resolve('exceljs'))('jszip');
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('Datos');
  sheet.addRow(['sku', 'codigo_ubicacion', 'cantidad']);
  sheet.addRow(['MOTOR', 'A/1', { text: '2', hyperlink: 'https://example.test' }]);
  const zip = await JSZip.loadAsync(await book.xlsx.writeBuffer()), xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  zip.file('xl/worksheets/sheet1.xml', xml.replace('ref="C2"', 'ref="B2:C2"'));
  const { parseImportFile } = await import(modulePath), rows = await parseImportFile(await zip.generateAsync({ type: 'nodebuffer' }), 'rango.xlsx', 'initial_stock');
  expect(rows[0].errors.length).toBeGreaterThan(0);
  zip.file('xl/vbaProject.bin', Buffer.from('Contenido sintético sin ejecución'));
  await expect(parseImportFile(await zip.generateAsync({ type: 'nodebuffer' }), 'macro.xlsx', 'initial_stock')).rejects.toMatchObject({ code: 'FORMAT' });
});
