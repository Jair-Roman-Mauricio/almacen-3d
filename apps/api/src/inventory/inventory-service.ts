import { Injectable } from '@nestjs/common';
import { queryTenant } from '@almacen/database';
import { parseQuantity, formatQuantity } from '@almacen/domain';
import { IdentityService } from '../identity/identity-service.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct, productDto } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { findLocation, stockFrom, stockColumns, stockDto } from './stock-data.js';
@Injectable()
export class InventoryService {
  constructor(private readonly identity: IdentityService) {
  }
  async list(cookie: string | undefined, query: Record<string, unknown>, locationId?: string) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const location = locationId ? await findLocation(context, locationId) : null;
      const warehouse = location?.warehouseId ?? entityId(query.warehouseId);
      await findWarehouse(context, warehouse);
      const page = pageInput(context, query, location ? [] : ['warehouseId', 'productId', 'locationId', 'q'], location ? 'location-stock:' + location.id : 'inventory');
      const productId = page.filters.productId ? entityId(page.filters.productId) : null;
      const target = location?.id ?? (page.filters.locationId ? entityId(page.filters.locationId) : null);
      if (productId)
        await findProduct(context, productId);
      if (target)
        await findLocation(context, target, warehouse);
      const rows = (await queryTenant(context, `SELECT ${stockColumns} ${stockFrom} WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND p.removed_at IS NULL AND e.removed_at IS NULL AND ($3::uuid IS NULL OR p.id=$3) AND ($4::uuid IS NULL OR e.id=$4) AND (s.location_id::text||':'||s.product_id::text)>$5 AND (strpos(p.sku_key,app.code_key($6))>0 OR strpos(lower(p.name),lower($6))>0 OR strpos(e.code_key,app.code_key($6))>0) ORDER BY s.location_id,s.product_id LIMIT $7`, [context.tenantId, warehouse, productId, target, page.after, page.filters.q ?? '', page.limit + 1])).rows.map(stockDto);
      return page.finish(rows, row => row.locationId + ':' + row.product.id);
    });
  }
  async totals(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const warehouse = entityId(query.warehouseId);
      await findWarehouse(context, warehouse);
      const page = pageInput(context, query, ['warehouseId', 'productId', 'q'], 'inventory-totals');
      const productId = page.filters.productId ? entityId(page.filters.productId) : null;
      if (productId)
        await findProduct(context, productId);
      const rows = (await queryTenant(context, `SELECT s.warehouse_id,p.id,p.sku,p.name,p.unit_kind,p.unit_label,sum(s.physical)::text AS physical,sum(s.reserved)::text AS reserved,sum(CASE WHEN e.blocked THEN 0 ELSE s.physical-s.reserved END)::text AS available ${stockFrom} WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND p.removed_at IS NULL AND e.removed_at IS NULL AND ($3::uuid IS NULL OR p.id=$3) AND p.id::text>$4 AND (strpos(p.sku_key,app.code_key($5))>0 OR strpos(lower(p.name),lower($5))>0) GROUP BY s.warehouse_id,p.id,p.sku,p.name,p.unit_kind,p.unit_label ORDER BY p.id LIMIT $6`, [context.tenantId, warehouse, productId, page.after, page.filters.q ?? '', page.limit + 1])).rows.map(row => {
        const product = productDto(row);
        return { warehouseId: warehouse, product, physical: formatQuantity(parseQuantity(row.physical, product.unit, 'nonnegative')), reserved: formatQuantity(parseQuantity(row.reserved, product.unit, 'nonnegative')), available: formatQuantity(parseQuantity(row.available, product.unit, 'nonnegative')) };
      });
      return page.finish(rows, row => row.product.id);
    });
  }
}
