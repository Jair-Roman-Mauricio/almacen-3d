import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, lockResources, appendAuditEvent, appendChange, appendInventoryEntries } from '@almacen/database';
import { DomainError, formatQuantity } from '@almacen/domain';
import type { CreateCountInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { positionBalance, findLocation } from '../inventory/stock-data.js';
import { countQuantity, loadCount, countColumns, countFrom, countDto } from './count-data.js';
@Injectable()
export class CountService {
  constructor(private readonly identity: IdentityService) {
  }
  async create(headers: CommandHeaders, input: CreateCountInput) {
    const warehouseId = entityId(input.warehouseId), locationId = entityId(input.locationId), productId = entityId(input.productId), observed = formatQuantity(countQuantity(input.observed));
    return this.identity.command(headers, 'count.create', { warehouseId, locationId, productId, observed }, async (context, stamp) => {
      await lockResources(context, [{ kind: 'warehouse', id: warehouseId }]);
      await findWarehouse(context, warehouseId);
      await lockResources(context, [{ kind: 'location', id: locationId, warehouseId }, { kind: 'product', id: productId }]);
      await findLocation(context, locationId, warehouseId);
      const product = await findProduct(context, productId);
      countQuantity(observed, product.unit);
      await lockResources(context, [{ kind: 'stock', id: locationId, warehouseId, productId }]);
      const snapshot = (await queryTenant(context, 'SELECT physical::text,physical_revision::text FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, locationId, productId])).rows[0]!;
      const id = randomUUID();
      await queryTenant(context, 'INSERT INTO app.counts(tenant_id,id,warehouse_id,location_id,product_id,observed,reference_physical,reference_revision,actor_id,operation_reference,recorded_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [context.tenantId, id, warehouseId, locationId, productId, observed, snapshot.physical, snapshot.physical_revision, stamp.actorId, stamp.reference, stamp.occurredAt]);
      await appendAuditEvent(context, stamp, { kind: 'count.create', entityId: id, details: { warehouseId, locationId, productId, observed } });
      await appendChange(context, stamp, [{ kind: 'inventory', id: warehouseId }]);
      return loadCount(context, id);
    }, { roles: ['admin', 'supervisor', 'operator'] });
  }
  async detail(cookie: string | undefined, value: string) {
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], context => loadCount(context, id));
  }
  async list(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const warehouse = entityId(query.warehouseId);
      await findWarehouse(context, warehouse);
      const page = pageInput(context, query, ['warehouseId', 'productId', 'locationId'], 'counts'), product = page.filters.productId ? entityId(page.filters.productId) : null, location = page.filters.locationId ? entityId(page.filters.locationId) : null;
      if (product && !(await queryTenant(context, 'SELECT id FROM app.products WHERE tenant_id=$1 AND id=$2', [context.tenantId, product])).rowCount)
        throw new DomainError('NOT_FOUND', 'No se encontró el producto en esta empresa.');
      if (location && !(await queryTenant(context, "SELECT id FROM app.layout_elements WHERE tenant_id=$1 AND warehouse_id=$2 AND id=$3 AND type='location'", [context.tenantId, warehouse, location])).rowCount)
        throw new DomainError('NOT_FOUND', 'No se encontró la ubicación en este almacén.');
      const rows = (await queryTenant(context, `SELECT ${countColumns} ${countFrom} WHERE c.tenant_id=$1 AND c.warehouse_id=$2 AND ($3::uuid IS NULL OR c.product_id=$3) AND ($4::uuid IS NULL OR c.location_id=$4) AND c.id::text>$5 ORDER BY c.id LIMIT $6`, [context.tenantId, warehouse, product, location, page.after, page.limit + 1])).rows.map(countDto);
      return page.finish(rows, row => row.id);
    });
  }
  async adjust(headers: CommandHeaders, value: string, input: {
    reason?: unknown;
  }) {
    const countId = entityId(value);
    if (typeof input.reason !== 'string' || !input.reason.trim())
      throw new DomainError('REASON_REQUIRED', 'Indica el motivo del ajuste.', { field: 'reason' });
    const reason = input.reason.trim();
    return this.identity.command(headers, 'count.adjust', { countId, reason }, async (context, stamp) => {
      const initial = await loadCount(context, countId), warehouseId = initial.warehouseId;
      await lockResources(context, [{ kind: 'warehouse', id: warehouseId }, { kind: 'count', id: countId }]);
      const count = await loadCount(context, countId);
      if (count.adjusted)
        throw new DomainError('COUNT_ALREADY_ADJUSTED', 'El conteo ya tiene un ajuste confirmado.');
      await lockResources(context, [{ kind: 'location', id: count.locationId, warehouseId }, { kind: 'product', id: count.product.id }]);
      await findLocation(context, count.locationId, warehouseId);
      await findProduct(context, count.product.id);
      await lockResources(context, [{ kind: 'stock', id: count.locationId, warehouseId, productId: count.product.id }]);
      const snapshot = (await queryTenant(context, 'SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, count.locationId, count.product.id])).rows[0]!;
      if (snapshot.physical_revision !== count.referenceRevision)
        throw new DomainError('COUNT_STALE', 'El físico cambió después del conteo; registra una referencia nueva.');
      const observed = countQuantity(count.observed, count.product.unit), current = countQuantity(snapshot.physical, count.product.unit), reserved = countQuantity(snapshot.reserved, count.product.unit);
      if (observed.minor < reserved.minor)
        throw new DomainError('RESERVED_STOCK_PROTECTED', 'La corrección no puede dejar el físico por debajo de las reservas actuales.');
      await queryTenant(context, 'UPDATE app.stock_balances SET physical=$5 WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, count.locationId, count.product.id, count.observed]);
      await queryTenant(context, 'INSERT INTO app.adjustments(tenant_id,id,warehouse_id,count_id,location_id,product_id,authorized_physical,reason,actor_id,operation_reference,confirmed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [context.tenantId, randomUUID(), warehouseId, countId, count.locationId, count.product.id, count.observed, reason, stamp.actorId, stamp.reference, stamp.occurredAt]);
      await queryTenant(context, 'UPDATE app.counts SET adjusted=true WHERE tenant_id=$1 AND id=$2', [context.tenantId, countId]);
      await appendInventoryEntries(context, stamp, [{ warehouseId, locationId: count.locationId, productId: count.product.id, kind: 'adjustment', reason, physicalDelta: formatQuantity({ minor: observed.minor - current.minor, unit: count.product.unit }), reservedDelta: '0', transitDelta: '0' }]);
      await appendAuditEvent(context, stamp, { kind: 'count.adjust', entityId: countId, reason, details: { observed: count.observed, referenceRevision: count.referenceRevision, warehouseId } });
      await appendChange(context, stamp, [{ kind: 'inventory', id: warehouseId }]);
      return { count: await loadCount(context, countId), balance: await positionBalance(context, warehouseId, count.locationId, count.product.id), historyId: stamp.reference };
    }, { roles: ['admin', 'supervisor'] });
  }
}
