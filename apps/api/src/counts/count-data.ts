import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError, parseQuantity, formatQuantity, type Unit } from '@almacen/domain';
import { productDto } from '../catalogue/catalogue-service.js';
import { decimalText, entityId } from '../platform/http/operation-input.js';
export function countQuantity(value: unknown, unit: Unit = { kind: 'weight', label: 'base' }) {
  try {
    return parseQuantity(value, unit, 'nonnegative');
  }
  catch (error) {
    if (error instanceof DomainError && error.code !== 'INVALID_QUANTITY')
      throw error;
    throw new DomainError('INVALID_COUNT', 'Indica una cantidad observada decimal no negativa.');
  }
}
export const countColumns = 'c.id AS count_id,c.warehouse_id,c.location_id,c.observed::text,c.reference_physical::text,c.reference_revision::text,c.difference::text,c.recorded_at,c.adjusted,p.id,p.sku,p.name,p.unit_kind,p.unit_label,u.id AS actor_id,u.name AS actor_name,u.email AS actor_email,u.role AS actor_role,u.active AS actor_active';
export const countFrom = 'FROM app.counts c JOIN app.products p ON (p.tenant_id,p.id)=(c.tenant_id,c.product_id) JOIN app.users u ON (u.tenant_id,u.id)=(c.tenant_id,c.actor_id)';
export function countDto(row: Record<string, unknown>) {
  const product = productDto(row);
  return { id: row.count_id as string, warehouseId: row.warehouse_id as string, locationId: row.location_id as string, product, observed: formatQuantity(countQuantity(row.observed, product.unit)), referencePhysical: formatQuantity(countQuantity(row.reference_physical, product.unit)), referenceRevision: row.reference_revision as string, difference: decimalText(row.difference), recordedAt: (row.recorded_at as Date).toISOString(), actor: { id: row.actor_id as string, name: row.actor_name as string, email: row.actor_email as string, role: row.actor_role as string, active: row.actor_active as boolean }, adjusted: row.adjusted as boolean };
}
export async function loadCount(context: TenantContext, value: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, `SELECT ${countColumns} ${countFrom} WHERE c.tenant_id=$1 AND c.id=$2`, [context.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró el conteo en esta empresa.');
  return countDto(row);
}
