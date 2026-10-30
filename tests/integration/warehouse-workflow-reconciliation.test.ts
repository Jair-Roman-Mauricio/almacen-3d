import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
async function reconcile() {
  const discrepancy = (await f.db.owner.query(`WITH ledger AS(SELECT tenant_id,warehouse_id,location_id,product_id,sum(physical_delta) AS physical,sum(reserved_delta) AS reserved FROM app.inventory_entries WHERE tenant_id=$1 GROUP BY tenant_id,warehouse_id,location_id,product_id) SELECT coalesce(s.location_id,l.location_id) AS location_id FROM app.stock_balances s FULL JOIN ledger l USING(tenant_id,warehouse_id,location_id,product_id) WHERE coalesce(s.tenant_id,l.tenant_id)=$1 AND (coalesce(s.physical,0)<>coalesce(l.physical,0) OR coalesce(s.reserved,0)<>coalesce(l.reserved,0) OR s.physical<0 OR s.reserved<0 OR s.reserved>s.physical)`, [f.admin.tenant])).rows;
  expect(discrepancy).toEqual([]);
  const transit = (await f.db.owner.query(`WITH ledger AS(SELECT tenant_id,transfer_id,product_id,sum(transit_delta) AS quantity FROM app.inventory_entries WHERE tenant_id=$1 AND transfer_id IS NOT NULL GROUP BY tenant_id,transfer_id,product_id),actual AS(SELECT tenant_id,transfer_id,product_id,sum(in_transit) AS quantity FROM app.transfer_lines WHERE tenant_id=$1 GROUP BY tenant_id,transfer_id,product_id) SELECT transfer_id FROM actual a FULL JOIN ledger l USING(tenant_id,transfer_id,product_id) WHERE coalesce(a.quantity,0)<>coalesce(l.quantity,0)`, [f.admin.tenant])).rows;
  expect(transit).toEqual([]);
}
describe('I-INV/reconciliacion-flujos-completos', () => {
  it('reconcilia libro, reservas y tránsito al combinar despacho parcial, traslado y ajuste', async () => {
    const source = await outboundScene(f), target = await outboundScene(f, '0'), order = await createOrder(f, source.warehouse, source.product);
    const reserveRef = randomUUID(), reserveBody = { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: source.a, quantity: '30' }] };
    const reserved = await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', reserveBody, reserveRef).expect(200), allocationId = reserved.body.data.result.lines[0].allocations[0].id;
    await reconcile();
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/preparations', { lines: [{ allocationId, quantity: '20' }] }).expect(200);
    const dispatchRef = randomUUID(), dispatchBody = { lines: [{ allocationId, quantity: '10' }] };
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/dispatches', dispatchBody, dispatchRef).expect(200);
    await reconcile();
    const transfer = (await f.mutate(f.admin, 'post', '/transfers', { code: randomUUID(), sourceWarehouseId: source.warehouse, targetWarehouseId: target.warehouse, lines: [{ productId: source.product, sourceLocationId: source.a, quantity: '25' }] }).expect(201)).body.data.result, departRef = randomUUID(), departBody = { lines: [{ transferLineId: transfer.lines[0].id, quantity: '25' }] };
    await f.mutate(f.admin, 'post', '/transfers/' + transfer.id + '/departure', departBody, departRef).expect(200);
    await reconcile();
    const receiptBody = { lines: [{ transferLineId: transfer.lines[0].id, targetLocationId: target.a, quantity: '10' }] }, receiptRef = randomUUID();
    await f.mutate(f.admin, 'post', '/transfers/' + transfer.id + '/receipts', receiptBody, receiptRef).expect(200);
    await reconcile();
    const count = (await f.mutate(f.admin, 'post', '/counts', { warehouseId: source.warehouse, locationId: source.a, productId: source.product, observed: '60' }).expect(201)).body.data.result;
    await f.mutate(f.admin, 'post', '/counts/' + count.id + '/adjustment', { reason: 'Corrección contrastada' }).expect(200);
    await reconcile();
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/cancellation', {}).expect(409);
    await reconcile();
    await f.mutate(f.admin, 'post', '/transfers/' + transfer.id + '/receipts', { lines: [{ transferLineId: transfer.lines[0].id, targetLocationId: target.b, quantity: '15' }] }).expect(200);
    await reconcile();
    const exact = (await f.mutate(f.admin, 'post', '/counts', { warehouseId: target.warehouse, locationId: target.b, productId: source.product, observed: '15' }).expect(201)).body.data.result;
    await f.mutate(f.admin, 'post', '/counts/' + exact.id + '/adjustment', { reason: 'Conteo coincide, sin cambio de físico' }).expect(200);
    await reconcile();
    const snapshot = async () => (await f.db.owner.query('SELECT warehouse_id,location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances ORDER BY warehouse_id,location_id,product_id')).rows, before = await snapshot();
    for (const [path, body, ref] of [['/orders/' + order.id + '/reservations', reserveBody, reserveRef], ['/orders/' + order.id + '/dispatches', dispatchBody, dispatchRef], ['/transfers/' + transfer.id + '/departure', departBody, departRef], ['/transfers/' + transfer.id + '/receipts', receiptBody, receiptRef]] as const) {
      const replay = await f.mutate(f.admin, 'post', path, body, ref).expect(200);
      expect(replay.headers['idempotent-replayed']).toBe('true');
    }
    await f.get(f.admin, '/history').expect(200);
    await f.get(f.admin, '/orders/' + order.id).expect(200);
    await f.get(f.admin, '/transfers/' + transfer.id).expect(200);
    await f.get(f.admin, '/counts/' + count.id).expect(200);
    expect(await snapshot()).toEqual(before);
    await reconcile();
    expect((await f.db.owner.query('SELECT sum(physical)::text AS physical,sum(reserved)::text AS reserved FROM app.stock_balances WHERE product_id=$1', [source.product])).rows[0]).toEqual({ physical: '85', reserved: '20' });
    expect((await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data.lines[0]).toMatchObject({ dispatched: '10', reserved: '20', preparedPending: '10' });
  });
});
