import { afterAll, beforeAll, expect, it } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f.close();
});
it('I-EXC/export-csv conserva filtros, precisión, texto seguro y encabezados vacíos', async () => {
  const s = await outboundScene(f, '12');
  await f.mutate(f.admin, 'patch', '/products/' + s.product, { name: '=SUM(1,2)' }).expect(200);
  const r = await f.get(f.admin, `/exports/inventory?warehouseId=${s.warehouse}&productId=${s.product}&format=csv`).expect(200);
  expect(r.headers['content-disposition']).toMatch(/attachment.*inventory/u);
  expect(r.text).toContain('"\'=SUM(1,2)"');
  expect(r.text).toContain(',12,0,12,false');
  expect(JSON.parse(decodeURIComponent(r.headers['x-export-filters']!))).toMatchObject({ warehouseId: s.warehouse, productId: s.product, timeZone: 'America/Lima' });
  const empty = await f.get(f.admin, `/exports/inventory?warehouseId=${s.warehouse}&q=NO-EXISTE&format=csv`).expect(200);
  expect(empty.text.trim().split('\r\n')).toHaveLength(1);
  const history = await f.get(f.admin, `/exports/history?warehouseId=${s.warehouse}&from=2020-01-01&to=2040-01-01&format=csv`).expect(200);
  expect(history.text).toContain('inventory.receipt');
  expect(history.text).toContain('America/Lima');
  await f.mutate(f.admin, 'post', '/receipts', { warehouseId: s.warehouse, lines: [{ productId: s.product, targetLocationId: s.a, quantity: '1' }] }).expect(201);
  const page = (await f.get(f.admin, `/history?warehouseId=${s.warehouse}&limit=1`).expect(200)).body;
  const fromPage = await f.get(f.admin, `/exports/history?warehouseId=${s.warehouse}&limit=1&cursor=${encodeURIComponent(page.page.nextCursor)}&format=csv`).expect(200);
  expect(fromPage.text.trim().split('\r\n')).toHaveLength(3);
  await f.get(await f.role('operator'), `/exports/inventory?warehouseId=${s.warehouse}&format=csv`).expect(403);
});
it('I-EXC/export-xlsx reabre datos exactos, filtros y textos sin fórmulas', async () => {
  const { default: ExcelJS } = await import('exceljs');
  const s = await outboundScene(f, '9007199254740993');
  await f.mutate(f.admin, 'patch', '/products/' + s.product, { name: '=SUM(1,2)' }).expect(200);
  const r = await f.get(f.admin, `/exports/inventory?warehouseId=${s.warehouse}&format=xlsx`).buffer(true).parse((res, callback) => {
    const chunks: Buffer[] = [];
    res.on('data', chunk => chunks.push(Buffer.from(chunk)));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
    res.on('error', callback);
  }).expect(200);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(r.body);
  const data = book.getWorksheet('Datos')!, query = book.getWorksheet('Consulta')!;
  expect(data.getCell('D2').value).toBe('=SUM(1,2)');
  expect(data.getCell('F2').value).toBe('9007199254740993');
  expect(data.getCell('D2').type).toBe(ExcelJS.ValueType.String);
  expect(query.getSheetValues().flat(2)).toContain(s.warehouse);
  expect(query.getSheetValues().flat(2)).toContain('America/Lima');
  data.eachRow(row => row.eachCell(cell => {
    expect(cell.formula).toBeUndefined();
    expect(cell.hyperlink).toBeUndefined();
  }));
});
