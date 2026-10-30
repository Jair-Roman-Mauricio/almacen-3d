import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture, type Access } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(1);
});
afterAll(async () => {
  await f?.close();
});
async function setup(who: Access) {
  const source = await outboundScene(f, '100', who), target = await outboundScene(f, '0', who), body = { code: randomUUID(), sourceWarehouseId: source.warehouse, targetWarehouseId: target.warehouse, lines: [{ productId: source.product, sourceLocationId: source.a, quantity: '20' }] };
  const transfer = (await f.mutate(who, 'post', '/transfers', body).expect(201)).body.data.result;
  return { source, target, body, transfer };
}
describe('I-ISO/traslados-rutas', () => {
  it('distingue creación/salida de recepción y rechaza IDs de otra empresa sin efectos', async () => {
    const a = await setup(f.admin), b = await setup(f.other), operator = await f.role('operator'), supervisor = await f.role('supervisor'), departure = { lines: [{ transferLineId: a.transfer.lines[0].id, quantity: '20' }] };
    const before = (await f.db.owner.query('SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE tenant_id=$1', [f.other.tenant])).rows;
    await f.mutate(operator, 'post', '/transfers', { ...a.body, code: randomUUID() }).expect(403);
    await f.mutate(operator, 'post', '/transfers/' + a.transfer.id + '/departure', departure).expect(403);
    await f.get(f.admin, '/transfers/' + b.transfer.id).expect(404);
    await f.get(f.admin, '/transfers').query({ warehouseId: b.source.warehouse }).expect(404);
    expect((await f.get(f.admin, '/transfers').expect(200)).body.data.map((t: {
      id: string;
    }) => t.id)).not.toContain(b.transfer.id);
    for (const body of [{ ...a.body, code: randomUUID(), targetWarehouseId: b.target.warehouse }, { ...a.body, code: randomUUID(), sourceWarehouseId: b.source.warehouse }, { ...a.body, code: randomUUID(), lines: [{ productId: a.source.product, sourceLocationId: b.source.a, quantity: '1' }] }, { ...a.body, code: randomUUID(), lines: [{ productId: b.source.product, sourceLocationId: a.source.a, quantity: '1' }] }])
      await f.mutate(f.admin, 'post', '/transfers', body).expect(404);
    await f.mutate(f.admin, 'post', '/transfers', { ...a.body, tenantId: f.other.tenant }).expect(400);
    await f.mutate(f.admin, 'post', '/transfers/' + b.transfer.id + '/departure', departure).expect(404);
    await f.mutate(f.admin, 'post', '/transfers/' + a.transfer.id + '/departure', { lines: [{ transferLineId: b.transfer.lines[0].id, quantity: '20' }] }).expect(404);
    const reference = randomUUID();
    await f.mutate(supervisor, 'post', '/transfers/' + a.transfer.id + '/departure', departure, reference).expect(200);
    await f.get(supervisor, '/operations/' + reference).expect(200);
    await f.mutate(f.admin, 'patch', '/users/' + supervisor.actor, { role: 'operator' }).expect(200);
    await f.get(supervisor, '/operations/' + reference).expect(403);
    for (const line of [{ transferLineId: a.transfer.lines[0].id, targetLocationId: b.target.a, quantity: '1' }, { transferLineId: a.transfer.lines[0].id, targetLocationId: a.source.a, quantity: '1' }, { transferLineId: b.transfer.lines[0].id, targetLocationId: a.target.a, quantity: '1' }])
      await f.mutate(operator, 'post', '/transfers/' + a.transfer.id + '/receipts', { lines: [line] }).expect(404);
    await f.mutate(operator, 'post', '/transfers/' + b.transfer.id + '/receipts', { lines: [{ transferLineId: b.transfer.lines[0].id, targetLocationId: b.target.a, quantity: '1' }] }).expect(404);
    await f.mutate(operator, 'post', '/transfers/' + a.transfer.id + '/receipts', { lines: [{ transferLineId: a.transfer.lines[0].id, targetLocationId: a.target.a, quantity: '20' }] }).expect(200);
    expect((await f.db.owner.query('SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE tenant_id=$1', [f.other.tenant])).rows).toEqual(before);
    expect((await f.db.app.query('SELECT * FROM app.transfer_lines')).rows).toEqual([]);
  });
});
