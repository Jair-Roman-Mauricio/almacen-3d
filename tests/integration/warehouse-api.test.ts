import { seedWarehouse, seedProduct, seedStock } from './schema-fixture.js';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, warehouseInput, type OperationsFixture } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
describe('I-GEO/alta-consulta-almacen', () => {
  it('crea almacenes válidos, pagina por empresa y rechaza código duplicado o dimensiones inválidas', async () => {
    const created = await f.mutate(f.admin, 'post', '/warehouses', warehouseInput()).expect(201);
    expect(created.body.data.result).toMatchObject({ ...warehouseInput(), layoutRevision: '0' });
    expect((await f.mutate(f.admin, 'post', '/warehouses', warehouseInput(' central ')).expect(409)).body.error.code).toBe('CODE_EXISTS');
    for (const width of ['0', '-1', 'NaN'])
      await f.mutate(f.admin, 'post', '/warehouses', { ...warehouseInput('INVALID'), dimensions: { width, height: '1', depth: '1' } }).expect(422);
    await f.mutate(f.admin, 'post', '/warehouses', warehouseInput('OTRO')).expect(201);
    const page = await f.get(f.admin, '/warehouses?limit=1').expect(200);
    expect(page.body.data).toHaveLength(1);
    const next = await f.get(f.admin, '/warehouses').query({ cursor: page.body.page.nextCursor }).expect(200);
    expect(next.body.data).toHaveLength(1);
    expect(next.body.data[0].id).not.toBe(page.body.data[0].id);
    expect((await f.get(f.other, '/warehouses').expect(200)).body.data).toEqual([]);
    const operator = await f.role('operator');
    await f.mutate(operator, 'post', '/warehouses', warehouseInput('DENIED')).expect(403);
    await f.get(operator, '/warehouses').expect(200);
  });
});
describe('I-GEO/lectura-layout', () => {
  it('lee distribución vacía o guardada y ubicaciones, conservando IDs y ámbito', async () => {
    const empty = (await f.mutate(f.admin, 'post', '/warehouses', warehouseInput('EMPTY')).expect(201)).body.data.result.id;
    expect((await f.get(f.admin, '/warehouses/' + empty + '/layout').expect(200)).body.data).toEqual({ warehouseId: empty, revision: '0', elements: [] });
    const w = await seedWarehouse(f.db.owner, f.admin.tenant);
    const read = await f.get(f.admin, '/warehouses/' + w.warehouse + '/layout').expect(200);
    expect(read.body.data.elements).toHaveLength(2);
    expect(read.body.data.elements.find((x: {
      id: string;
    }) => x.id === w.location)).toMatchObject({ type: 'location', parentId: w.zone, code: 'U/1', position: { x: '0', y: '0', z: '0' }, blocked: false });
    const locations = await f.get(f.admin, '/warehouses/' + w.warehouse + '/locations?q=u/1').expect(200);
    expect(locations.body.data.map((x: {
      id: string;
    }) => x.id)).toEqual([w.location]);
    await f.get(f.other, '/warehouses/' + w.warehouse + '/layout').expect(404);
    await f.get(f.other, '/warehouses/' + w.warehouse + '/locations').expect(404);
  });
});
describe('I-GEO/busqueda-espacial', () => {
  it('busca claves normalizadas dentro del almacén sin efectos de stock o revisión', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant);
    await seedStock(f.db.owner, f.admin.tenant, w.warehouse, w.location, product);
    const before = (await f.db.owner.query('SELECT physical::text,physical_revision::text FROM app.stock_balances WHERE product_id=$1', [product])).rows;
    const sku = (await f.db.owner.query('SELECT sku FROM app.products WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, product])).rows[0].sku as string;
    for (const query of [{ kind: 'sku', code: ' ' + sku.toLowerCase() + ' ' }, { kind: 'location', code: ' u/1 ' }])
      expect((await f.get(f.admin, '/warehouses/' + w.warehouse + '/spatial-search').query(query).expect(200)).body.data).toEqual({ locationIds: [w.location] });
    expect((await f.get(f.admin, '/warehouses/' + w.warehouse + '/spatial-search?kind=sku&code=MISSING').expect(200)).body.data).toEqual({ locationIds: [] });
    await f.get(f.admin, '/warehouses/' + w.warehouse + '/spatial-search?kind=other&code=U').expect(400);
    await f.get(f.other, '/warehouses/' + w.warehouse + '/spatial-search?kind=location&code=U/1').expect(404);
    expect((await f.db.owner.query('SELECT physical::text,physical_revision::text FROM app.stock_balances WHERE product_id=$1', [product])).rows).toEqual(before);
  });
});
