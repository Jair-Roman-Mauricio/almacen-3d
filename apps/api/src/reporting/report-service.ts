import { Injectable } from '@nestjs/common';
import { queryTenant, lockResources, appendAuditEvent, appendChange } from '@almacen/database';
import { companyDateRange, DomainError, parseQuantity, formatQuantity } from '@almacen/domain';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct, productDto } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
@Injectable()
export class ReportService {
  constructor(private readonly identity: IdentityService) {
  }
  async dashboard(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor'], async (ctx) => {
      const page = pageInput(ctx, query, ['warehouseId', 'from', 'to'], 'dashboard');
      const warehouse = entityId(page.filters.warehouseId);
      await findWarehouse(ctx, warehouse);
      const zone = (await queryTenant(ctx, 'SELECT time_zone FROM app.companies WHERE id=$1', [ctx.tenantId])).rows[0]!.time_zone as string;
      const range = companyDateRange(page.filters.from!, page.filters.to!, zone);
      const row = (await queryTenant(ctx, `SELECT
(SELECT count(DISTINCT product_id)::int FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND physical>0) AS "productsWithStock",
(SELECT count(DISTINCT location_id)::int FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND physical>0) AS "occupiedLocations",
(SELECT count(*)::int FROM app.orders o WHERE o.tenant_id=$1 AND o.warehouse_id=$2 AND NOT o.cancelled AND EXISTS(SELECT 1 FROM app.order_lines l WHERE l.tenant_id=o.tenant_id AND l.order_id=o.id AND l.requested>l.dispatched)) AS "pendingOrders",
(SELECT count(DISTINCT operation_reference)::int FROM app.inventory_entries WHERE tenant_id=$1 AND warehouse_id=$2 AND occurred_at>=$3 AND occurred_at<$4) AS "movementsInInterval"`, [ctx.tenantId, warehouse, range.fromInclusive, range.toExclusive])).rows[0];
      return { warehouseId: warehouse, from: query.from, to: query.to, timeZone: zone, ...row };
    });
  }
  async threshold(headers: CommandHeaders, input: {
    warehouseId: string;
    productId: string;
    quantity: unknown;
  }) {
    const warehouse = entityId(input.warehouseId), product = entityId(input.productId);
    try {
      parseQuantity(input.quantity, { kind: 'weight', label: 'unidad' }, 'nonnegative');
    }
    catch (e) {
      if (e instanceof DomainError)
        throw e;
      throw new DomainError('INVALID_QUANTITY', 'Indica una cantidad decimal no negativa.');
    }
    return this.identity.command(headers, 'threshold.set', input, async (ctx, stamp) => {
      await lockResources(ctx, [{ kind: 'warehouse', id: warehouse }, { kind: 'product', id: product }]);
      await findWarehouse(ctx, warehouse);
      const p = await findProduct(ctx, product);
      let quantity: string;
      try {
        quantity = formatQuantity(parseQuantity(input.quantity as string, p.unit, 'nonnegative'));
      }
      catch (e) {
        if (e instanceof DomainError)
          throw e;
        throw new DomainError('INVALID_QUANTITY', 'Indica una cantidad decimal no negativa.');
      }
      await queryTenant(ctx, `INSERT INTO app.stock_thresholds(tenant_id,warehouse_id,product_id,quantity) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,warehouse_id,product_id) DO UPDATE SET quantity=EXCLUDED.quantity`, [ctx.tenantId, warehouse, product, quantity]);
      await appendAuditEvent(ctx, stamp, { kind: 'threshold.set', entityId: product, details: { warehouseId: warehouse, quantity } });
      await appendChange(ctx, stamp, [{ kind: 'reports', id: warehouse }]);
      return { warehouseId: warehouse, productId: product, quantity };
    }, { roles: ['admin', 'supervisor'] });
  }
  async alerts(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor'], async (ctx) => {
      const warehouse = entityId(query.warehouseId);
      await findWarehouse(ctx, warehouse);
      const page = pageInput(ctx, query, ['warehouseId'], 'alerts');
      const rows = (await queryTenant(ctx, `SELECT p.id,p.sku,p.name,p.unit_kind,p.unit_label,t.quantity::text AS threshold,coalesce(sum(CASE WHEN e.blocked THEN 0 ELSE s.physical-s.reserved END),0)::text AS available FROM app.stock_thresholds t JOIN app.products p ON(p.tenant_id,p.id)=(t.tenant_id,t.product_id) LEFT JOIN app.stock_balances s ON(s.tenant_id,s.warehouse_id,s.product_id)=(t.tenant_id,t.warehouse_id,t.product_id) LEFT JOIN app.layout_elements e ON(e.tenant_id,e.warehouse_id,e.id)=(s.tenant_id,s.warehouse_id,s.location_id) WHERE t.tenant_id=$1 AND t.warehouse_id=$2 AND p.removed_at IS NULL AND p.id::text>$3 GROUP BY p.id,p.sku,p.name,p.unit_kind,p.unit_label,t.quantity HAVING coalesce(sum(CASE WHEN e.blocked THEN 0 ELSE s.physical-s.reserved END),0)<t.quantity ORDER BY p.id LIMIT $4`, [ctx.tenantId, warehouse, page.after, page.limit + 1])).rows.map(row => ({ warehouseId: warehouse, product: productDto(row), available: formatQuantity(parseQuantity(row.available, productDto(row).unit, 'nonnegative')), threshold: formatQuantity(parseQuantity(row.threshold, productDto(row).unit, 'nonnegative')) }));
      return page.finish(rows, row => row.product.id);
    });
  }
}
