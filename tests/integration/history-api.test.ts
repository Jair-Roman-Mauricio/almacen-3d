import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { seedWarehouse, seedProduct } from './schema-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
describe('I-AUD/filtros-historial', () => {
  it('aplica días extremos en zona de empresa con DST, autor/referencia, cursores y ámbito', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant);
    await f.db.owner.query("UPDATE app.companies SET time_zone='America/New_York' WHERE id=$1", [f.admin.tenant]);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)', [f.admin.tenant, w.warehouse, w.location, product]);
    const dates = ['2026-03-08T04:59:59.999Z', '2026-03-08T05:00:00.000Z', '2026-03-09T03:59:59.999Z', '2026-03-09T04:00:00.000Z'];
    const refs: string[] = [];
    for (const date of dates) {
      const reference = randomUUID();
      refs.push(reference);
      await f.db.owner.query("INSERT INTO app.commands(tenant_id,reference,operation_type,data_hash,actor_id,state,result,confirmed_at) VALUES ($1,$2,'inventory.receipt',$3,$4,'confirmed','{}',$5)", [f.admin.tenant, reference, 'a'.repeat(64), f.admin.actor, date]);
      await f.db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,actor_id,warehouse_id,location_id,product_id,occurred_at,kind,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'receipt',0,0,0)", [f.admin.tenant, randomUUID(), reference, f.admin.actor, w.warehouse, w.location, product, date]);
      await f.db.owner.query("INSERT INTO app.audit_events(tenant_id,id,operation_reference,actor_id,occurred_at,kind,entity_id,reason,details) VALUES ($1,$2,$3,$4,$5,'location.unblock',$6,'Inspección sintética','{}')", [f.admin.tenant, randomUUID(), reference, f.admin.actor, date, w.location]);
    }
    const query = { from: '2026-03-08', to: '2026-03-08', warehouseId: w.warehouse, productId: product };
    const first = await f.get(f.admin, '/history').query({ ...query, limit: 1 }).set('X-Client-Time-Zone', 'Asia/Tokyo').expect(200);
    expect(first.body.data[0]).toMatchObject({ reference: refs[1], actor: { id: f.admin.actor, name: 'Admin' }, occurredAt: dates[1], warehouseIds: [w.warehouse], entries: [{ productId: product, locationId: w.location, physicalDelta: '0', reservedDelta: '0', transitDelta: '0' }] });
    const next = await f.get(f.admin, '/history').query({ ...query, cursor: first.body.page.nextCursor }).expect(200);
    expect(next.body.data.map((x: {
      reference: string;
    }) => x.reference)).toEqual([refs[2]]);
    expect(next.body.page.nextCursor).toBeNull();
    const audit = await f.get(f.admin, '/audit').query({ from: '2026-03-08', to: '2026-03-08', entityId: w.location }).expect(200);
    expect(audit.body.data).toHaveLength(2);
    expect(audit.body.data[0]).toMatchObject({ actor: { id: f.admin.actor }, details: { reason: 'Inspección sintética' } });
    for (const path of ['/history', '/audit']) {
      await f.get(f.admin, path).query({ from: '2026-03-09', to: '2026-03-08' }).expect(400);
      await f.get(await f.role('operator'), path).expect(403);
      expect((await f.get(f.other, path).expect(200)).body.data).toEqual([]);
    }
    await f.mutate(f.admin, 'delete', '/products/' + product).expect(200);
    expect((await f.get(f.admin, '/history').query(query).expect(200)).body.data).toHaveLength(2);
  });
});
