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
async function record(who: Access, d: {
  warehouse: string;
  a: string;
  product: string;
}, observed = '90') {
  return f.mutate(who, 'post', '/counts', { warehouseId: d.warehouse, locationId: d.a, productId: d.product, observed }).expect(201);
}
describe('I-ISO/conteos-rutas', () => {
  it('rechaza referencias ajenas y campos de control manipulados con una conexión reutilizada', async () => {
    const a = await outboundScene(f), b = await outboundScene(f, '100', f.other), ca = await record(f.admin, a), cb = await record(f.other, b);
    await record(f.admin, a, '95');
    const pid = (await f.db.app.query('SELECT pg_backend_pid() pid')).rows[0].pid, before = (await f.db.owner.query('SELECT tenant_id,warehouse_id,location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances ORDER BY tenant_id,warehouse_id,location_id,product_id')).rows;
    await f.get(f.admin, '/counts/' + cb.body.data.result.id).expect(404);
    await f.mutate(f.admin, 'post', '/counts/' + cb.body.data.result.id + '/adjustment', { reason: 'Ajeno' }).expect(404);
    await f.get(f.admin, '/counts').query({ warehouseId: b.warehouse }).expect(404);
    await f.get(f.admin, '/counts').query({ warehouseId: a.warehouse, productId: b.product }).expect(404);
    await f.get(f.admin, '/counts').query({ warehouseId: a.warehouse, locationId: b.a }).expect(404);
    for (const body of [{ warehouseId: a.warehouse, locationId: b.a, productId: a.product, observed: '0' }, { warehouseId: a.warehouse, locationId: a.a, productId: b.product, observed: '0' }, { warehouseId: b.warehouse, locationId: a.a, productId: a.product, observed: '0' }])
      await f.mutate(f.admin, 'post', '/counts', body).expect(404);
    await f.mutate(f.admin, 'post', '/counts', { warehouseId: a.warehouse, locationId: a.a, productId: a.product, observed: '0', tenantId: f.other.tenant }).expect(400);
    await f.mutate(f.admin, 'post', '/counts/' + ca.body.data.result.id + '/adjustment', { reason: 'No modificar observación', observed: '0' }).expect(400);
    const page = await f.get(f.admin, '/counts').query({ warehouseId: a.warehouse, limit: 1 }).expect(200);
    await f.get(f.other, '/counts').query({ warehouseId: b.warehouse, cursor: page.body.page.nextCursor }).expect(400);
    await f.get(f.other, '/operations/' + ca.body.data.reference).expect(404);
    expect(JSON.stringify(ca.body)).not.toMatch(/password|token_hash|argon2/u);
    expect((await f.db.owner.query('SELECT tenant_id,warehouse_id,location_id,product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances ORDER BY tenant_id,warehouse_id,location_id,product_id')).rows).toEqual(before);
    expect((await f.db.app.query('SELECT pg_backend_pid() pid')).rows[0].pid).toBe(pid);
    expect((await f.db.app.query('SELECT * FROM app.counts')).rows).toEqual([]);
  });
  it('operario registra/consulta pero solo supervisor/admin ajusta y los permisos actuales se releen', async () => {
    const d = await outboundScene(f), operator = await f.role('operator'), supervisor = await f.role('supervisor');
    const created = await record(operator, d);
    const id = created.body.data.result.id;
    await f.get(operator, '/counts/' + id).expect(200);
    await f.mutate(operator, 'post', '/counts/' + id + '/adjustment', { reason: 'Sin autorización' }).expect(403);
    const adjusted = await f.mutate(supervisor, 'post', '/counts/' + id + '/adjustment', { reason: 'Verificado por supervisión' }).expect(200);
    expect(adjusted.body.data.result.count.actor.id).toBe(operator.actor);
    await f.get(operator, '/operations/' + adjusted.body.data.reference).expect(403);
    await f.get(supervisor, '/operations/' + adjusted.body.data.reference).expect(200);
    await f.mutate(f.admin, 'patch', '/users/' + operator.actor, { active: false }).expect(200);
    await f.get(operator, '/counts/' + id).expect(401);
    await f.get(f.admin, '/counts/' + id).expect(200);
  });
});
