import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder, extraOperator } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(1);
});
afterAll(async () => {
  await f?.close();
});
describe('I-ISO/salidas-rutas', () => {
  it('limita todas las acciones al pedido y líneas de la empresa y respeta los tres roles', async () => {
    const a = await outboundScene(f), b = await outboundScene(f, '100', f.other), orderA = await createOrder(f, a.warehouse, a.product), orderB = await createOrder(f, b.warehouse, b.product, '100', f.other);
    const reserveA = { lines: [{ orderLineId: orderA.lines[0].id, sourceLocationId: a.a, quantity: '10' }] }, reserveB = { lines: [{ orderLineId: orderB.lines[0].id, sourceLocationId: b.a, quantity: '10' }] };
    const ra = (await f.mutate(f.admin, 'post', '/orders/' + orderA.id + '/reservations', reserveA).expect(200)).body.data.result, rb = (await f.mutate(f.other, 'post', '/orders/' + orderB.id + '/reservations', reserveB).expect(200)).body.data.result;
    const allocationA = ra.lines[0].allocations[0].id, allocationB = rb.lines[0].allocations[0].id, operator = await f.role('operator'), unassigned = await extraOperator(f);
    await f.mutate(f.admin, 'put', '/orders/' + orderA.id + '/assignment', { operatorId: operator.actor }).expect(200);
    await f.get(f.admin, '/orders/' + orderB.id).expect(404);
    await f.get(f.admin, '/orders').query({ warehouseId: b.warehouse }).expect(404);
    await f.mutate(f.admin, 'post', '/orders/' + orderA.id + '/reservations', reserveB).expect(404);
    await f.mutate(f.admin, 'post', '/orders/' + orderA.id + '/reservations', { lines: [{ orderLineId: orderA.lines[0].id, sourceLocationId: b.a, quantity: '1' }] }).expect(404);
    for (const action of ['reservations', 'preparations', 'dispatches', 'cancellation']) {
      const body = action === 'reservations' ? reserveA : action === 'cancellation' ? {} : { lines: [{ allocationId: allocationA, quantity: '1' }] };
      await f.mutate(f.admin, 'post', '/orders/' + orderB.id + '/' + action, body).expect(404);
    }
    for (const action of ['preparations', 'dispatches'])
      await f.mutate(f.admin, 'post', '/orders/' + orderA.id + '/' + action, { lines: [{ allocationId: allocationB, quantity: '1' }] }).expect(404);
    await f.mutate(f.admin, 'put', '/orders/' + orderB.id + '/assignment', { operatorId: operator.actor }).expect(404);
    await f.mutate(f.admin, 'post', '/orders', { code: randomUUID(), warehouseId: a.warehouse, tenantId: f.other.tenant, lines: [{ productId: a.product, quantity: '1' }] }).expect(400);
    await f.mutate(operator, 'post', '/orders', { code: randomUUID(), warehouseId: a.warehouse, lines: [{ productId: a.product, quantity: '1' }] }).expect(403);
    for (const action of ['reservations', 'dispatches', 'cancellation'])
      await f.mutate(operator, 'post', '/orders/' + orderA.id + '/' + action, action === 'reservations' ? reserveA : action === 'cancellation' ? {} : { lines: [{ allocationId: allocationA, quantity: '1' }] }).expect(403);
    await f.mutate(operator, 'put', '/orders/' + orderA.id + '/assignment', { operatorId: unassigned.actor }).expect(403);
    await f.mutate(unassigned, 'post', '/orders/' + orderA.id + '/preparations', { lines: [{ allocationId: allocationA, quantity: '1' }] }).expect(403);
    const reference = randomUUID();
    await f.mutate(operator, 'post', '/orders/' + orderA.id + '/preparations', { lines: [{ allocationId: allocationA, quantity: '1' }] }, reference).expect(200);
    await f.get(unassigned, '/operations/' + reference).expect(403);
    await f.get(operator, '/operations/' + reference).expect(200);
    await f.mutate(f.admin, 'put', '/orders/' + orderA.id + '/assignment', { operatorId: unassigned.actor }).expect(200);
    await f.get(operator, '/operations/' + reference).expect(403);
    await f.mutate(operator, 'post', '/orders/' + orderA.id + '/preparations', { lines: [{ allocationId: allocationA, quantity: '1' }] }, reference).expect(403);
    await f.get(f.other, '/operations/' + reference).expect(404);
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [b.warehouse])).rows).toEqual([{ physical: '100', reserved: '10' }]);
    expect((await f.db.app.query('SELECT * FROM app.orders')).rows).toEqual([]);
    const supervisor = await f.role('supervisor'), managed = await createOrder(f, a.warehouse, a.product, '5', supervisor);
    await f.mutate(supervisor, 'post', '/orders/' + managed.id + '/cancellation', {}).expect(200);
  });
});
