import { waitForBlockedBy } from './concurrency-helpers.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, warehouseInput, simpleLayout, type OperationsFixture } from './operations-fixture.js';
import { seedWarehouse, seedProduct, seedStock, seedOrder } from './schema-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(5);
});
afterAll(async () => {
  await f?.close();
});
describe('I-BLK/bloquear-desbloquear', () => {
  it('exige administrador y motivo al desbloquear; conserva reservas y trabajo sin ejecutarlo', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant), order = await seedOrder(f.db.owner, f.admin.tenant, w.warehouse, product);
    await seedStock(f.db.owner, f.admin.tenant, w.warehouse, w.location, product);
    await f.db.owner.query('UPDATE app.stock_balances SET reserved=20 WHERE warehouse_id=$1', [w.warehouse]);
    await f.db.owner.query('INSERT INTO app.allocations(tenant_id,warehouse_id,id,order_id,line_id,product_id,location_id,reserved,prepared_pending) VALUES ($1,$2,$3,$4,$5,$6,$7,20,5)', [f.admin.tenant, w.warehouse, randomUUID(), order.order, order.line, product, w.location]);
    const before = (await f.db.owner.query('SELECT reserved::text,prepared_pending::text FROM app.allocations WHERE warehouse_id=$1', [w.warehouse])).rows;
    for (const role of ['supervisor', 'operator'] as const) {
      const access = await f.role(role);
      await f.mutate(access, 'post', '/locations/' + w.location + '/block', {}).expect(403);
      await f.mutate(access, 'post', '/locations/' + w.location + '/unblock', { reason: 'Motivo' }).expect(403);
    }
    await f.mutate(f.admin, 'post', '/locations/' + w.location + '/block', {}).expect(200);
    expect((await f.get(f.admin, '/locations/' + w.location + '/inventory').expect(200)).body.data[0]).toMatchObject({ physical: '100', reserved: '20', available: '0', blocked: true });
    for (const reason of ['', '   '])
      expect((await f.mutate(f.admin, 'post', '/locations/' + w.location + '/unblock', { reason }).expect(422)).body.error.code).toBe('REASON_REQUIRED');
    const reference = randomUUID();
    const unblocked = await f.mutate(f.admin, 'post', '/locations/' + w.location + '/unblock', { reason: ' Inspección terminada ' }, reference).expect(200);
    expect(unblocked.body.data.result).toMatchObject({ locationId: w.location, blocked: false, auditId: expect.any(String) });
    const audit = (await f.db.owner.query('SELECT actor_id,operation_reference,reason FROM app.audit_events WHERE id=$1', [unblocked.body.data.result.auditId])).rows[0];
    expect(audit).toEqual({ actor_id: f.admin.actor, operation_reference: reference, reason: 'Inspección terminada' });
    expect((await f.db.owner.query('SELECT reserved::text,prepared_pending::text FROM app.allocations WHERE warehouse_id=$1', [w.warehouse])).rows).toEqual(before);
    expect((await f.db.owner.query('SELECT physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [w.warehouse])).rows[0].physical_revision).toBe('0');
  });
});
async function scene() {
  const warehouse = (await f.mutate(f.admin, 'post', '/warehouses', warehouseInput(randomUUID())).expect(201)).body.data.result.id as string;
  const d = simpleLayout();
  await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
  const product = await seedProduct(f.db.owner, f.admin.tenant);
  const receipt = { warehouseId: warehouse, lines: [{ productId: product, targetLocationId: d.a, quantity: '2' }] };
  const reference = randomUUID();
  const confirmed = await f.mutate(f.admin, 'post', '/receipts', receipt, reference).expect(201);
  return { warehouse, product, receipt, reference, confirmed, ...d };
}
describe('I-BLK/recepcion-movimiento-bloqueados', () => {
  it('rechaza formularios anteriores al bloqueo en ambos extremos y permite replay sin nuevos efectos', async () => {
    const d = await scene();
    await f.get(f.admin, '/warehouses/' + d.warehouse + '/layout').expect(200);
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/block', {}).expect(200);
    expect((await f.mutate(f.admin, 'post', '/receipts', d.receipt).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    const move = { warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId: d.a, targetLocationId: d.b, quantity: '1' }] };
    expect((await f.mutate(f.admin, 'post', '/internal-moves', move).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    const replay = await f.mutate(f.admin, 'post', '/receipts', d.receipt, d.reference).expect(201);
    expect(replay.body).toEqual(d.confirmed.body);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/unblock', { reason: 'Listo' }).expect(200);
    await f.mutate(f.admin, 'post', '/locations/' + d.b + '/block', {}).expect(200);
    expect((await f.mutate(f.admin, 'post', '/internal-moves', move).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '2' }]);
  });
  it.each(['block-first', 'receipt-first'])('respeta el orden de commit %s con conexiones distintas', async (order) => {
    const d = await scene();
    const gate = await f.db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470069)');
    const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    const table = order === 'block-first' ? 'layout_elements' : 'stock_balances';
    await gate.query(`CREATE FUNCTION app.pause_block_race() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470069); RETURN NEW; END $$;CREATE TRIGGER pause_block_race BEFORE UPDATE ON app.${table} FOR EACH ROW EXECUTE FUNCTION app.pause_block_race()`);
    const block = () => f.mutate(f.admin, 'post', '/locations/' + d.b + '/block', {}).then(r => r), receipt = () => f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: d.product, targetLocationId: d.b, quantity: '1' }] }).then(r => r);
    const first = order === 'block-first' ? block() : receipt();
    let second: Promise<Awaited<typeof first>> | undefined;
    try {
      const writer = await waitForBlockedBy(f.db.app, pid);
      second = order === 'block-first' ? receipt() : block();
      await waitForBlockedBy(f.db.app, writer);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470069)');
      gate.release();
    }
    try {
      expect((await first).status).toBe(order === 'block-first' ? 200 : 201);
      const later = await second!;
      expect(later.status).toBe(order === 'block-first' ? 409 : 200);
      if (order === 'block-first')
        expect(later.body.error.code).toBe('LOCATION_BLOCKED');
      const row = (await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1 AND location_id=$2', [d.warehouse, d.b])).rows[0];
      expect(row?.physical ?? '0').toBe(order === 'block-first' ? '0' : '1');
      expect((await f.db.owner.query('SELECT blocked FROM app.layout_elements WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, d.b])).rows[0].blocked).toBe(true);
    }
    finally {
      await f.db.owner.query(`DROP TRIGGER pause_block_race ON app.${table};DROP FUNCTION app.pause_block_race()`);
    }
  });
});
