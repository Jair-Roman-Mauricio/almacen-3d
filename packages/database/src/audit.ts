import { randomUUID } from 'node:crypto';
import { DomainError } from '@almacen/domain';
import { queryTenant, type TenantContext } from './tenant-context.js';
export interface AuditStamp {
  actorId: string;
  reference: string;
  occurredAt: string;
  type: string;
}
export interface InventoryEntry {
  warehouseId: string;
  productId: string;
  locationId?: string;
  transferId?: string;
  kind: string;
  physicalDelta: string;
  reservedDelta: string;
  transitDelta: string;
  reason?: string;
}
async function assertStamp(context: TenantContext, stamp: AuditStamp): Promise<void> {
  const row = (await queryTenant(context, "SELECT actor_id,operation_type FROM app.commands WHERE tenant_id=$1 AND reference=$2 AND state='pending'", [context.tenantId, stamp.reference])).rows[0];
  if (!row || row.actor_id !== stamp.actorId || row.operation_type !== stamp.type || !/^\d{4}-\d{2}-\d{2}T.*Z$/u.test(stamp.occurredAt) || !Number.isFinite(Date.parse(stamp.occurredAt)))
    throw new DomainError('INVALID_AUDIT_CONTEXT', 'La auditoría requiere actor, fecha y referencia del comando activo.');
}
function noSecrets(value: unknown): void {
  if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      if (/password|token|secret/iu.test(key))
        throw new DomainError('INVALID_AUDIT_DATA', 'No se pueden registrar secretos en auditoría.');
      noSecrets(item);
    }
}
export async function appendInventoryEntries(context: TenantContext, stamp: AuditStamp, entries: readonly InventoryEntry[]): Promise<string[]> {
  await assertStamp(context, stamp);
  const rows = entries.map(entry => ({ id: randomUUID(), warehouse_id: entry.warehouseId, product_id: entry.productId, location_id: entry.locationId ?? null, transfer_id: entry.transferId ?? null, kind: entry.kind, reason: entry.reason ?? null, physical_delta: entry.physicalDelta, reserved_delta: entry.reservedDelta, transit_delta: entry.transitDelta }));
  if (rows.length)
    await queryTenant(context, `INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,actor_id,occurred_at,warehouse_id,product_id,location_id,transfer_id,kind,reason,physical_delta,reserved_delta,transit_delta)
  SELECT $1,e.id,$2,$3,$4,e.warehouse_id,e.product_id,e.location_id,e.transfer_id,e.kind,e.reason,e.physical_delta,e.reserved_delta,e.transit_delta
  FROM jsonb_to_recordset($5::jsonb) AS e(id uuid,warehouse_id uuid,product_id uuid,location_id uuid,transfer_id uuid,kind text,reason text,physical_delta numeric,reserved_delta numeric,transit_delta numeric)`, [context.tenantId, stamp.reference, stamp.actorId, stamp.occurredAt, JSON.stringify(rows)]);
  return rows.map(row => row.id);
}
export async function appendAuditEvent(context: TenantContext, stamp: AuditStamp, event: {
  kind: string;
  entityId: string;
  reason?: string;
  details: Record<string, unknown>;
}): Promise<string> {
  await assertStamp(context, stamp);
  noSecrets(event.details);
  const id = randomUUID();
  await queryTenant(context, 'INSERT INTO app.audit_events(tenant_id,id,operation_reference,actor_id,occurred_at,kind,entity_id,reason,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [context.tenantId, id, stamp.reference, stamp.actorId, stamp.occurredAt, event.kind, event.entityId, event.reason ?? null, JSON.stringify(event.details)]);
  return id;
}
export async function appendChange(context: TenantContext, stamp: AuditStamp, scopes: readonly {
  kind: string;
  id: string;
}[]): Promise<void> {
  await assertStamp(context, stamp);
  await queryTenant(context, 'INSERT INTO app.change_outbox(tenant_id,id,operation_reference,created_at,scopes) VALUES ($1,$2,$3,$4,$5)', [context.tenantId, randomUUID(), stamp.reference, stamp.occurredAt, JSON.stringify(scopes)]);
}
