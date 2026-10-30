import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, warehouseInput, productInput, simpleLayout, type OperationsFixture, type Access } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(1);
});
afterAll(async () => {
  await f?.close();
});
async function setup(who: Access) {
  const warehouse = (await f.mutate(who, 'post', '/warehouses', warehouseInput()).expect(201)).body.data.result.id as string;
  const d = simpleLayout();
  await f.mutate(who, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
  const product = (await f.mutate(who, 'post', '/products', productInput()).expect(201)).body.data.result.id as string;
  const receipt = await f.mutate(who, 'post', '/receipts', { warehouseId: warehouse, lines: [{ productId: product, targetLocationId: d.a, quantity: '5' }] }).expect(201);
  return { warehouse, product, reference: receipt.body.data.reference as string, ...d };
}
describe('I-ISO/inventario-geometria', () => {
  it('rechaza IDs/cuerpos ajenos en todas las rutas operativas y reutiliza conexión sin contexto residual', async () => {
    const a = await setup(f.admin), b = await setup(f.other);
    const pid = (await f.db.app.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    const before = (await f.db.owner.query('SELECT tenant_id,warehouse_id,location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances ORDER BY tenant_id,location_id')).rows;
    for (const path of ['/warehouses/' + b.warehouse + '/layout', '/warehouses/' + b.warehouse + '/locations', '/warehouses/' + b.warehouse + '/spatial-search?kind=location&code=A/1', '/locations/' + b.a + '/inventory', '/inventory?warehouseId=' + b.warehouse, '/inventory/totals?warehouseId=' + b.warehouse, '/operations/' + b.reference])
      await f.get(f.admin, path).expect(404);
    for (const query of [{ warehouseId: a.warehouse, productId: b.product }, { warehouseId: a.warehouse, locationId: b.a }])
      await f.get(f.admin, '/inventory').query(query).expect(404);
    await f.mutate(f.admin, 'patch', '/products/' + b.product, { name: 'Invadido' }).expect(404);
    await f.mutate(f.admin, 'delete', '/products/' + b.product).expect(404);
    for (const action of ['block', 'unblock'])
      await f.mutate(f.admin, 'post', '/locations/' + b.a + '/' + action, action === 'block' ? {} : { reason: 'Ajeno' }).expect(404);
    await f.mutate(f.admin, 'put', '/warehouses/' + b.warehouse + '/layout', { baseRevision: '1', elements: [] }).expect(404);
    for (const line of [{ productId: b.product, targetLocationId: a.a, quantity: '1' }, { productId: a.product, targetLocationId: b.a, quantity: '1' }])
      await f.mutate(f.admin, 'post', '/receipts', { warehouseId: a.warehouse, lines: [line] }).expect(404);
    for (const line of [{ productId: a.product, sourceLocationId: b.a, targetLocationId: a.a, quantity: '1' }, { productId: a.product, sourceLocationId: a.a, targetLocationId: b.a, quantity: '1' }])
      await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: a.warehouse, lines: [line] }).expect(404);
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: a.warehouse, tenantId: f.other.tenant, lines: [] }).expect(400);
    await f.mutate(f.admin, 'post', '/warehouses', { ...warehouseInput('ATTACK'), tenantId: f.other.tenant }).expect(400);
    const supervisor = await f.role('supervisor'), operator = await f.role('operator');
    for (const access of [supervisor, operator]) {
      await f.mutate(access, 'post', '/warehouses', warehouseInput('DENIED')).expect(403);
      await f.mutate(access, 'put', '/warehouses/' + a.warehouse + '/layout', { baseRevision: '1', elements: [] }).expect(403);
      await f.mutate(access, 'post', '/locations/' + a.a + '/block', {}).expect(403);
    }
    await f.mutate(operator, 'patch', '/products/' + a.product, { name: 'DENIED' }).expect(403);
    await f.mutate(operator, 'delete', '/products/' + a.product).expect(403);
    for (let i = 0; i < 4; i++)
      for (const [access, own, other] of [[f.admin, a, b], [f.other, b, a]] as const) {
        const stock = await f.get(access, '/inventory').query({ warehouseId: own.warehouse }).expect(200);
        expect(JSON.stringify(stock.body)).not.toContain(other.product);
        expect((await f.get(access, '/products').expect(200)).body.data.map((p: {
          id: string;
        }) => p.id)).toEqual([own.product]);
      }
    expect((await f.db.app.query('SELECT pg_backend_pid() pid')).rows[0].pid).toBe(pid);
    expect((await f.db.app.query('SELECT * FROM app.stock_balances')).rows).toEqual([]);
    expect((await f.db.owner.query('SELECT tenant_id,warehouse_id,location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances ORDER BY tenant_id,location_id')).rows).toEqual(before);
  });
  it('rechaza filtros desconocidos también en mutaciones y evita caché de datos privados', async () => {
    await f.mutate(f.admin, 'post', '/warehouses?tenantId=' + f.other.tenant, warehouseInput('BAD-QUERY')).expect(400);
    const response = await f.get(f.admin, '/warehouses').expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
  });
});
describe('I-ISO/cuerpo-json', () => {
  it('rechaza JSON malformado con el contrato uniforme de entrada', async () => {
    const response = await request(f.server).post('/api/v1/warehouses').set('Content-Type', 'application/json').send('{"code":').expect(400);
    expect(response.body.error).toMatchObject({ code: 'INVALID_INPUT', requestId: expect.any(String) });
  });
});
