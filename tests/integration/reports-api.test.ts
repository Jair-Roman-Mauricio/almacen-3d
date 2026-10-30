import { afterAll, beforeAll, expect, it } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f.close();
});
it('I-REP/indicadores cuenta entidades y operaciones sin sumar unidades distintas', async () => {
  const s = await outboundScene(f, '100');
  await createOrder(f, s.warehouse, s.product, '10');
  const r = await f.get(f.admin, `/dashboard?warehouseId=${s.warehouse}&from=2020-01-01&to=2040-01-01`).expect(200);
  expect(r.body.data).toMatchObject({ productsWithStock: 1, occupiedLocations: 1, pendingOrders: 1, movementsInInterval: 1, timeZone: 'America/Lima' });
  await f.get(f.admin, `/dashboard?warehouseId=${s.warehouse}&from=2026-02-30&to=2026-03-01`).expect(400);
});
it('I-REP/umbral permite cero y exige unidad y precisión vigentes', async () => {
  const s = await outboundScene(f, '0'), supervisor = await f.role('supervisor');
  for (const quantity of ['0', '5']) {
    const r = await f.mutate(supervisor, 'put', '/thresholds', { warehouseId: s.warehouse, productId: s.product, quantity }).expect(200);
    expect(r.body.data.result.quantity).toBe(quantity);
  }
  for (const quantity of ['-1', '1.1', null])
    await f.mutate(f.admin, 'put', '/thresholds', { warehouseId: s.warehouse, productId: s.product, quantity }).expect(422);
  await f.mutate(await f.role('operator'), 'put', '/thresholds', { warehouseId: s.warehouse, productId: s.product, quantity: '5' }).expect(403);
});
it('I-REP/alerta-ciclo usa disponible operativo y desaparece en igualdad', async () => {
  const s = await outboundScene(f, '10');
  await f.mutate(f.admin, 'put', '/thresholds', { warehouseId: s.warehouse, productId: s.product, quantity: '11' }).expect(200);
  let r = await f.get(f.admin, `/alerts?warehouseId=${s.warehouse}`).expect(200);
  expect(r.body.data).toEqual([expect.objectContaining({ warehouseId: s.warehouse, available: '10', threshold: '11', product: expect.objectContaining({ id: s.product }) })]);
  await f.mutate(f.admin, 'post', '/receipts', { warehouseId: s.warehouse, lines: [{ productId: s.product, targetLocationId: s.a, quantity: '1' }] }).expect(201);
  r = await f.get(f.admin, `/alerts?warehouseId=${s.warehouse}`).expect(200);
  expect(r.body.data).toEqual([]);
});
