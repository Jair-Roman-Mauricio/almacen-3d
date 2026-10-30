import { Injectable } from '@nestjs/common';
import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError, companyDateRange } from '@almacen/domain';
import { IdentityService } from '../identity/identity-service.js';
import { entityId, decimalText } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
const timestampKey = (column: string) => `to_char(${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
async function dateContext(context: TenantContext, query: Record<string, unknown>, allowed: readonly string[], resource: string) {
  const zone = (await queryTenant(context, 'SELECT time_zone FROM app.companies WHERE id=$1', [context.tenantId])).rows[0]!.time_zone as string;
  const page = pageInput(context, query, allowed, resource + ':' + zone);
  let from: string | null = null, to: string | null = null;
  if (page.filters.from !== undefined || page.filters.to !== undefined) {
    const range = companyDateRange(page.filters.from ?? page.filters.to!, page.filters.to ?? page.filters.from!, zone);
    if (page.filters.from !== undefined)
      from = range.fromInclusive;
    if (page.filters.to !== undefined)
      to = range.toExclusive;
  }
  return { page, from, to };
}
@Injectable()
export class HistoryService {
  constructor(private readonly identity: IdentityService) {
  }
  async history(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor'], async (context) => {
      const { page, from, to } = await dateContext(context, query, ['warehouseId', 'productId', 'from', 'to'], 'history');
      const warehouse = page.filters.warehouseId ? entityId(page.filters.warehouseId) : null, product = page.filters.productId ? entityId(page.filters.productId) : null;
      if (warehouse)
        await findWarehouse(context, warehouse);
      if (product && !(await queryTenant(context, 'SELECT id FROM app.products WHERE tenant_id=$1 AND id=$2', [context.tenantId, product])).rowCount)
        throw new DomainError('NOT_FOUND', 'No se encontró el producto en esta empresa.');
      const key = `(${timestampKey('s.occurred_at')}||'|'||c.reference::text)`;
      const rows = (await queryTenant(context, `WITH selected AS(SELECT DISTINCT e.operation_reference,e.occurred_at FROM app.inventory_entries e WHERE e.tenant_id=$1 AND ($2::uuid IS NULL OR e.warehouse_id=$2) AND ($3::uuid IS NULL OR e.product_id=$3) AND ($4::timestamptz IS NULL OR e.occurred_at>=$4) AND ($5::timestamptz IS NULL OR e.occurred_at<$5))
   SELECT c.reference,c.operation_type,c.actor_id,u.name AS actor_name,s.occurred_at,${key} AS cursor_key FROM selected s JOIN app.commands c ON c.tenant_id=$1 AND c.reference=s.operation_reference JOIN app.users u ON (u.tenant_id,u.id)=(c.tenant_id,c.actor_id) WHERE c.state='confirmed' AND ${key} COLLATE "C">$6 ORDER BY s.occurred_at,c.reference LIMIT $7`, [context.tenantId, warehouse, product, from, to, page.after, page.limit + 1])).rows;
      const paged = page.finish(rows, row => row.cursor_key as string);
      const entries = paged.data.length ? (await queryTenant(context, 'SELECT operation_reference,warehouse_id,product_id,location_id,transfer_id,reason,physical_delta::text,reserved_delta::text,transit_delta::text FROM app.inventory_entries WHERE tenant_id=$1 AND operation_reference=ANY($2::uuid[]) ORDER BY id', [context.tenantId, paged.data.map(row => row.reference)])).rows : [];
      return { data: paged.data.map(row => {
          const related = entries.filter(entry => entry.operation_reference === row.reference), reason = related.find(entry => entry.reason)?.reason as string | undefined;
          return { id: row.reference as string, reference: row.reference as string, type: row.operation_type as string, actor: { id: row.actor_id as string, name: row.actor_name as string }, occurredAt: (row.occurred_at as Date).toISOString(), ...(reason ? { reason } : {}), warehouseIds: [...new Set(related.map(entry => entry.warehouse_id as string))].sort(), entries: related.map(entry => ({ productId: entry.product_id as string, ...(entry.location_id ? { locationId: entry.location_id as string } : {}), ...(entry.transfer_id ? { transferId: entry.transfer_id as string } : {}), physicalDelta: decimalText(entry.physical_delta), reservedDelta: decimalText(entry.reserved_delta), transitDelta: decimalText(entry.transit_delta) })) };
        }), page: paged.page };
    });
  }
  async audit(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor'], async (context) => {
      const { page, from, to } = await dateContext(context, query, ['entityId', 'from', 'to'], 'audit'), id = page.filters.entityId ? entityId(page.filters.entityId) : null, key = `(${timestampKey('a.occurred_at')}||'|'||a.id::text)`;
      const rows = (await queryTenant(context, `SELECT a.id,a.operation_reference,a.kind,a.actor_id,u.name AS actor_name,a.occurred_at,a.entity_id,a.reason,a.details,${key} AS cursor_key FROM app.audit_events a JOIN app.users u ON (u.tenant_id,u.id)=(a.tenant_id,a.actor_id) WHERE a.tenant_id=$1 AND ($2::uuid IS NULL OR a.entity_id=$2) AND ($3::timestamptz IS NULL OR a.occurred_at>=$3) AND ($4::timestamptz IS NULL OR a.occurred_at<$4) AND ${key} COLLATE "C">$5 ORDER BY a.occurred_at,a.id LIMIT $6`, [context.tenantId, id, from, to, page.after, page.limit + 1])).rows;
      const paged = page.finish(rows, row => row.cursor_key as string);
      return { data: paged.data.map(row => ({ id: row.id as string, reference: row.operation_reference as string, type: row.kind as string, actor: { id: row.actor_id as string, name: row.actor_name as string }, occurredAt: (row.occurred_at as Date).toISOString(), entityId: row.entity_id as string, details: { ...row.details as Record<string, unknown>, ...(row.reason ? { reason: row.reason as string } : {}) } })), page: paged.page };
    });
  }
}
