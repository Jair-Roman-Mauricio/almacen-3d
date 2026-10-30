import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, warehouseInput, productInput, simpleLayout, type OperationsFixture } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
async function reconcile() {
  const rows = (await f.db.owner.query(`WITH ledger AS(SELECT tenant_id,warehouse_id,location_id,product_id,sum(physical_delta) AS physical,sum(reserved_delta) AS reserved FROM app.inventory_entries WHERE tenant_id=$1 GROUP BY tenant_id,warehouse_id,location_id,product_id)
 SELECT coalesce(s.location_id,l.location_id) AS location_id FROM app.stock_balances s FULL JOIN ledger l USING(tenant_id,warehouse_id,location_id,product_id) WHERE coalesce(s.tenant_id,l.tenant_id)=$1 AND (coalesce(s.physical,0)<>coalesce(l.physical,0) OR coalesce(s.reserved,0)<>coalesce(l.reserved,0) OR s.physical<0 OR s.reserved<0 OR s.reserved>s.physical)`, [f.admin.tenant])).rows;
  expect(rows).toEqual([]);
}
describe('I-INV/reconciliacion-libro', () => {
  it('reconcilia secuencias exactas y conserva saldos/revisiones/libro después de GET y geometría permitida', async () => {
    const warehouse = (await f.mutate(f.admin, 'post', '/warehouses', warehouseInput()).expect(201)).body.data.result.id as string, d = simpleLayout();
    await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const piece = (await f.mutate(f.admin, 'post', '/products', productInput('PIECE')).expect(201)).body.data.result.id as string, weight = (await f.mutate(f.admin, 'post', '/products', productInput('WEIGHT', 'weight')).expect(201)).body.data.result.id as string;
    const body = { warehouseId: warehouse, lines: [{ productId: piece, targetLocationId: d.a, quantity: '100' }, { productId: weight, targetLocationId: d.a, quantity: '9007199254740993.125' }] }, reference = randomUUID();
    await f.mutate(f.admin, 'post', '/receipts', body, reference).expect(201);
    await reconcile();
    for (const [productId, sourceLocationId, targetLocationId, quantity] of [[piece, d.a, d.b, '40'], [piece, d.b, d.a, '10'], [weight, d.a, d.b, '0.125']] as const) {
      await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: warehouse, lines: [{ productId, sourceLocationId, targetLocationId, quantity }] }).expect(201);
      await reconcile();
    }
    const snapshot = async () => ({ stock: (await f.db.owner.query('SELECT location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1 ORDER BY location_id,product_id', [warehouse])).rows, entries: (await f.db.owner.query('SELECT id,physical_delta::text,reserved_delta::text FROM app.inventory_entries WHERE warehouse_id=$1 ORDER BY id', [warehouse])).rows });
    const before = await snapshot();
    const totals = await f.get(f.admin, '/inventory/totals').query({ warehouseId: warehouse }).expect(200);
    expect(totals.body.data.find((x: {
      product: {
        id: string;
      };
    }) => x.product.id === weight).physical).toBe('9007199254740993.125');
    expect(before.stock.find(row => row.location_id === d.a && row.product_id === piece).physical).toBe('70');
    expect(before.stock.find(row => row.location_id === d.b && row.product_id === piece).physical).toBe('30');
    const commands = (await f.db.owner.query('SELECT count(*)::int n FROM app.commands')).rows[0].n;
    for (const path of ['/warehouses', '/products', '/inventory?warehouseId=' + warehouse, '/inventory/totals?warehouseId=' + warehouse, '/locations/' + d.a + '/inventory', '/warehouses/' + warehouse + '/locations', '/warehouses/' + warehouse + '/spatial-search?kind=sku&code=PIECE', '/history?warehouseId=' + warehouse, '/audit'])
      await f.get(f.admin, path).expect(200);
    const layout = await f.get(f.admin, '/warehouses/' + warehouse + '/layout').set('Accept-Encoding', 'gzip').expect(200);
    expect(layout.headers['content-encoding']).toBe('gzip');
    expect((await f.db.owner.query('SELECT count(*)::int n FROM app.commands')).rows[0].n).toBe(commands);
    const c = { ...d.elements[1]!, id: randomUUID(), code: 'EMPTY', position: { x: '4', y: '0', z: '0' } };
    await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '1', elements: [...d.elements, c] }).expect(200);
    await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '2', elements: [...d.elements, { ...c, position: { ...c.position, x: '6' } }] }).expect(200);
    const replay = await f.mutate(f.admin, 'post', '/receipts', body, reference).expect(201);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    expect(await snapshot()).toEqual(before);
    await reconcile();
  });
});
