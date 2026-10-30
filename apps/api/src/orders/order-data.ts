import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError, parseQuantity, formatQuantity, lineBalances, deriveOrderState, type OrderLine } from '@almacen/domain';
import { productDto } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
export async function orderRecord(context: TenantContext, value: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, 'SELECT id,warehouse_id,code,assigned_operator_id,cancelled FROM app.orders WHERE tenant_id=$1 AND id=$2', [context.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró el pedido en esta empresa.');
  return { id: row.id as string, warehouseId: row.warehouse_id as string, code: row.code as string, assignedId: row.assigned_operator_id as string | null, cancelled: row.cancelled as boolean };
}
export async function loadOrder(context: TenantContext, value: string) {
  const record = await orderRecord(context, value);
  const rows = (await queryTenant(context, 'SELECT l.id AS line_id,l.requested::text,l.dispatched::text,p.id,p.sku,p.name,p.unit_kind,p.unit_label FROM app.order_lines l JOIN app.products p ON (p.tenant_id,p.id)=(l.tenant_id,l.product_id) WHERE l.tenant_id=$1 AND l.warehouse_id=$2 AND l.order_id=$3 ORDER BY l.id', [context.tenantId, record.warehouseId, record.id])).rows;
  const allocations = (await queryTenant(context, 'SELECT a.id,a.line_id,a.location_id,e.code AS location_code,a.reserved::text,a.prepared_pending::text FROM app.allocations a JOIN app.layout_elements e ON (e.tenant_id,e.warehouse_id,e.id)=(a.tenant_id,a.warehouse_id,a.location_id) WHERE a.tenant_id=$1 AND a.warehouse_id=$2 AND a.order_id=$3 ORDER BY a.id', [context.tenantId, record.warehouseId, record.id])).rows;
  const lines = rows.map(row => {
    const product = productDto(row);
    const model: OrderLine = { productId: product.id, requested: parseQuantity(row.requested, product.unit), dispatched: parseQuantity(row.dispatched, product.unit, 'nonnegative'), allocations: allocations.filter(a => a.line_id === row.line_id).map(a => ({ id: a.id as string, locationId: a.location_id as string, reserved: parseQuantity(a.reserved, product.unit, 'nonnegative'), preparedPending: parseQuantity(a.prepared_pending, product.unit, 'nonnegative') })) };
    const balances = lineBalances(model);
    return { id: row.line_id as string, product, model, dto: { id: row.line_id as string, product, requested: formatQuantity(model.requested), dispatched: formatQuantity(model.dispatched), pending: formatQuantity(balances.pending), pendingReserve: formatQuantity(balances.pendingReserve), reserved: formatQuantity(balances.reserved), preparedPending: formatQuantity(balances.preparedPending), allocations: balances.allocations.map(a => ({ id: a.id, locationId: a.locationId, locationCode: allocations.find(raw => raw.id === a.id)!.location_code as string, reserved: formatQuantity(a.reserved), preparedPending: formatQuantity(a.preparedPending), pendingPrepare: formatQuantity(a.pendingPrepare) })) } };
  });
  const assigned = record.assignedId ? (await queryTenant(context, 'SELECT id,name,email,role,active FROM app.users WHERE tenant_id=$1 AND id=$2', [context.tenantId, record.assignedId])).rows[0] ?? null : null;
  const state = deriveOrderState(lines.map(line => line.model), record.cancelled);
  return { record, lines, dto: { id: record.id, code: record.code, warehouseId: record.warehouseId, status: state.status, assignedOperator: assigned, lines: lines.map(line => line.dto) } };
}
export type LoadedOrder = Awaited<ReturnType<typeof loadOrder>>;
