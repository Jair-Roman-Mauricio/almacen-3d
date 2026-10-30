import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { queryTenant, runUnitOfWork, lockResources, appendAuditEvent, appendChange, appendInventoryEntries, type TenantContext } from '@almacen/database';
import { DomainError, normalizeCode } from '@almacen/domain';
import { executeCommand, type CommandStamp } from '../platform/commands/command-executor.js';
import { requireEnabledLocation } from '../inventory/stock-data.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { lockSkuKeys } from '../catalogue/sku-lock.js';
import { importJob } from './import-data.js';
import { contentHash, requireImportActor } from './import-processing.js';
import { storedRows, validateRows } from './import-validation.js';
import { importCommandData } from './import-intent.js';
async function assertRows(ctx: TenantContext, job: Record<string, unknown>) {
  const rows = await validateRows(ctx, job, await storedRows(ctx, String(job.id))), bad = rows.find(r => r.errors.length);
  if (bad)
    throw new DomainError('IMPORT_INVALID_ROWS', bad.errors[0]!.reason, { row: String(bad.row), field: bad.errors[0]!.field });
  return rows;
}
async function applyCatalogue(ctx: TenantContext, job: Record<string, unknown>, stamp: CommandStamp) {
  const source = await storedRows(ctx, String(job.id));
  await lockSkuKeys(ctx, source.map(r => normalizeCode(r.values.sku).key));
  let rows = await assertRows(ctx, job);
  await lockResources(ctx, rows.filter(r => r.product).map(r => ({ kind: 'product' as const, id: r.product!.id })));
  rows = await assertRows(ctx, job);
  const added = rows.filter(r => !r.product).map(r => ({ id: randomUUID(), sku: r.values.sku, name: r.values.nombre, kind: r.values.tipo_unidad, label: r.values.unidad_base }));
  const updated = rows.filter(r => r.product).map(r => ({ id: r.product!.id, name: r.values.nombre, before: r.product!.name }));
  if (added.length)
    await queryTenant(ctx, `INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) SELECT $1,p.id,p.sku,p.name,p.kind,p.label FROM jsonb_to_recordset($2::jsonb) p(id uuid,sku text,name text,kind text,label text)`, [ctx.tenantId, JSON.stringify(added)]);
  if (updated.length)
    await queryTenant(ctx, `UPDATE app.products p SET name=r.name FROM jsonb_to_recordset($2::jsonb) r(id uuid,name text) WHERE p.tenant_id=$1 AND p.id=r.id`, [ctx.tenantId, JSON.stringify(updated)]);
  await appendAuditEvent(ctx, stamp, { kind: 'import.catalogue', entityId: String(job.id), details: { created: added, updated } });
  await appendChange(ctx, stamp, [{ kind: 'products', id: ctx.tenantId }]);
  return { jobId: job.id, created: added.length, updated: updated.length, stockEntries: 0 };
}
export async function applyInitialStock(ctx: TenantContext, job: Record<string, unknown>, stamp: CommandStamp): Promise<Record<string, unknown>> {
  const warehouse = String(job.warehouse_id);
  await lockResources(ctx, [{ kind: 'warehouse', id: warehouse }]);
  await findWarehouse(ctx, warehouse);
  let rows = await assertRows(ctx, job);
  await lockResources(ctx, [...rows.map(r => ({ kind: 'location' as const, id: r.locationId!, warehouseId: warehouse })), ...rows.map(r => ({ kind: 'product' as const, id: r.product!.id }))]);
  for (const r of rows)
    await requireEnabledLocation(ctx, r.locationId!, warehouse);
  await lockResources(ctx, rows.map(r => ({ kind: 'stock' as const, id: r.locationId!, warehouseId: warehouse, productId: r.product!.id })));
  rows = await assertRows(ctx, job);
  const changes = rows.map(r => ({ location: r.locationId, product: r.product!.id, quantity: r.values.cantidad }));
  await queryTenant(ctx, `UPDATE app.stock_balances s SET physical=r.quantity FROM jsonb_to_recordset($3::jsonb) r(location uuid,product uuid,quantity numeric) WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND s.location_id=r.location AND s.product_id=r.product`, [ctx.tenantId, warehouse, JSON.stringify(changes)]);
  await appendInventoryEntries(ctx, stamp, rows.map(r => ({ warehouseId: warehouse, locationId: r.locationId!, productId: r.product!.id, kind: 'initial_stock', physicalDelta: r.values.cantidad!, reservedDelta: '0', transitDelta: '0' })));
  await appendAuditEvent(ctx, stamp, { kind: 'import.initial-stock', entityId: String(job.id), details: { warehouseId: warehouse, rows: rows.length } });
  await appendChange(ctx, stamp, [{ kind: 'inventory', id: warehouse }]);
  return { jobId: job.id, created: 0, updated: 0, stockEntries: rows.length };
}
export async function applyImportJob(pool: Pool, tenant: string, id: string) {
  const metadata = await runUnitOfWork(pool, tenant, async (ctx) => {
    const job = await importJob(ctx, id);
    const command = (await queryTenant(ctx, 'SELECT actor_id FROM app.commands WHERE tenant_id=$1 AND reference=$2', [tenant, job.result_reference])).rows[0];
    return { job, actor: command?.actor_id as string | undefined };
  });
  const { job, actor } = metadata;
  if (!actor || job.state !== 'applying')
    return;
  try {
    return await executeCommand(pool, { tenantId: tenant, actorId: actor, reference: job.result_reference, type: 'import.apply', data: importCommandData(job, job.content_hash) }, async (ctx, stamp) => {
      const locked = await importJob(ctx, id, true);
      if (locked.state !== 'applying' || locked.result_reference !== stamp.reference)
        throw new DomainError('IMPORT_STATE_CONFLICT', 'El trabajo ya no está pendiente de esta referencia.');
      const rows = await storedRows(ctx, id);
      if (contentHash(locked.kind, locked.warehouse_id, rows) !== locked.content_hash)
        throw new DomainError('CONTENT_CHANGED', 'El contenido normalizado cambió después de validar.');
      const result = locked.kind === 'catalogue' ? await applyCatalogue(ctx, locked, stamp) : await applyInitialStock(ctx, locked, stamp);
      await queryTenant(ctx, "UPDATE app.import_jobs SET state='confirmed',processing_ms=coalesce(processing_ms,0)+$3 WHERE tenant_id=$1 AND id=$2", [tenant, id, Math.max(0, Date.now() - (locked.application_queued_at as Date).getTime())]);
      return result;
    }, { resumePending: true, authorize: ctx => requireImportActor(ctx, actor) });
  }
  catch (error) {
    // The failed command transaction rolled back first. Persist only its explanation.
    await runUnitOfWork(pool, tenant, async (ctx) => {
      await lockResources(ctx, [{ kind: 'command', id: job.result_reference }]);
      const current = await importJob(ctx, id, true);
      if (current.state !== 'applying')
        return;
      await queryTenant(ctx, "UPDATE app.import_jobs SET state='failed',errors=$3 WHERE tenant_id=$1 AND id=$2", [tenant, id, JSON.stringify([{ ...(error instanceof DomainError ? error.details : {}), field: error instanceof DomainError ? error.details.field ?? 'application' : 'application', reason: error instanceof DomainError ? error.message : 'No se pudo aplicar el archivo; no se modificó el negocio.', code: error instanceof DomainError ? error.code : 'APPLICATION_FAILED' }])]);
    });
  }
}
