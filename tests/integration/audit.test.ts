import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedWarehouse, seedProduct, seedStock, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { executeCommand } from '../../apps/api/dist/platform/commands/command-executor.js';
import { queryTenant } from '../../packages/database/dist/tenant-context.js';
import { appendInventoryEntries, appendAuditEvent, appendChange } from '../../packages/database/dist/audit.js';
let db: SchemaFixture;
let identity: IdentitySeed;
beforeAll(async () => { db = await createSchemaFixture(); identity = await seedIdentity(db.owner); });
afterAll(async () => { if (db)
  await db.close(); });
describe('I-AUD/registro-inmutable', () => {
  it('vincula actor, reloj, referencia y deltas exactos en la misma confirmación', async () => {
    const w = await seedWarehouse(db.owner, identity.tenant);
    const p = await seedProduct(db.owner, identity.tenant);
    await db.owner.query("UPDATE app.products SET unit_kind='weight',unit_label='kg' WHERE tenant_id=$1 AND id=$2", [identity.tenant, p]);
    await seedStock(db.owner, identity.tenant, w.warehouse, w.location, p);
    const reference = randomUUID();
    const date = '2026-10-29T20:30:00.123Z';
    await executeCommand(db.app, { tenantId: identity.tenant, actorId: identity.actor, reference, type: 'count.adjust', data: { productId: p, quantity: '0.001' } }, async (ctx, stamp) => {
      await queryTenant(ctx, 'UPDATE app.stock_balances SET physical=99.999 WHERE product_id=$1', [p]);
      const ids = await appendInventoryEntries(ctx, stamp, [{ warehouseId: w.warehouse, productId: p, locationId: w.location, kind: 'adjustment', physicalDelta: '-0.001', reservedDelta: '0', transitDelta: '0', reason: 'Conteo autorizado' }]);
      await appendAuditEvent(ctx, stamp, { kind: 'adjustment', entityId: p, reason: 'Conteo autorizado', details: { productId: p } });
      await appendChange(ctx, stamp, [{ kind: 'warehouse', id: w.warehouse }]);
      return { historyId: ids[0] };
    }, { clock: () => new Date(date) });
    expect((await db.owner.query('SELECT actor_id,operation_reference,occurred_at,physical_delta::text FROM app.inventory_entries WHERE tenant_id=$1', [identity.tenant])).rows[0]).toEqual({ actor_id: identity.actor, operation_reference: reference, occurred_at: new Date(date), physical_delta: '-0.001' });
    expect((await db.owner.query('SELECT count(*)::int AS n FROM app.audit_events WHERE tenant_id=$1 AND operation_reference=$2', [identity.tenant, reference])).rows[0].n).toBe(1);
    await expect(db.app.query('DELETE FROM app.inventory_entries')).rejects.toMatchObject({ code: '42501' });
    await expect(db.app.query('DELETE FROM app.commands')).rejects.toMatchObject({ code: '42501' });
  });
  it('rechaza una identidad de auditoría distinta de la del comando', async () => {
    const reference = randomUUID();
    await expect(executeCommand(db.app, { tenantId: identity.tenant, actorId: identity.actor, reference, type: 'user.update', data: {} }, async (ctx, stamp) => { await appendAuditEvent(ctx, { ...stamp, actorId: identity.otherActor }, { kind: 'change', entityId: identity.actor, details: {} }); return {}; })).rejects.toMatchObject({ code: 'INVALID_AUDIT_CONTEXT' });
    expect((await db.owner.query('SELECT * FROM app.commands WHERE tenant_id=$1 AND reference=$2', [identity.tenant, reference])).rowCount).toBe(0);
  });
});
