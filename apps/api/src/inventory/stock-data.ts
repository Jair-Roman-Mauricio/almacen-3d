import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError, parseQuantity, formatQuantity, positionAvailability } from '@almacen/domain';
import { productDto } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
export async function findLocation(context: TenantContext, value: string, warehouse?: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, "SELECT id,warehouse_id,code,blocked FROM app.layout_elements WHERE tenant_id=$1 AND id=$2 AND type='location' AND removed_at IS NULL", [context.tenantId, id])).rows[0];
  if (!row || (warehouse && row.warehouse_id !== warehouse))
    throw new DomainError('NOT_FOUND', 'No se encontró la ubicación activa en este almacén.');
  return { id: row.id as string, warehouseId: row.warehouse_id as string, code: row.code as string, blocked: row.blocked as boolean };
}
export const stockFrom = `FROM app.stock_balances s JOIN app.products p ON (p.tenant_id,p.id)=(s.tenant_id,s.product_id) JOIN app.layout_elements e ON (e.tenant_id,e.warehouse_id,e.id)=(s.tenant_id,s.warehouse_id,s.location_id)`;
export const stockColumns = 's.warehouse_id,s.location_id,e.code AS location_code,e.blocked,p.id,p.sku,p.name,p.unit_kind,p.unit_label,s.physical::text,s.reserved::text';
export function stockDto(row: Record<string, unknown>) {
  const product = productDto(row), physical = parseQuantity(row.physical, product.unit, 'nonnegative'), reserved = parseQuantity(row.reserved, product.unit, 'nonnegative');
  const position = positionAvailability({ warehouseId: row.warehouse_id as string, productId: product.id, locationId: row.location_id as string, physical, reserved, blocked: row.blocked as boolean });
  return { warehouseId: position.warehouseId, locationId: position.locationId, locationCode: row.location_code as string, blocked: position.blocked, product, physical: formatQuantity(physical), reserved: formatQuantity(reserved), available: formatQuantity(position.available) };
}
export async function positionBalance(context: TenantContext, warehouse: string, location: string, product: string) {
  const row = (await queryTenant(context, `SELECT ${stockColumns} ${stockFrom} WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND s.location_id=$3 AND s.product_id=$4`, [context.tenantId, warehouse, location, product])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró la posición de inventario.');
  return stockDto(row);
}
/** Call after acquiring the location row lock, immediately before effects. */
export async function requireEnabledLocation(context: TenantContext, id: string, warehouse: string) {
  const location = await findLocation(context, id, warehouse);
  if (location.blocked)
    throw new DomainError('LOCATION_BLOCKED', 'La ubicación está bloqueada para nuevas operaciones.', { field: 'locationId', locationId: id });
  return location;
}
