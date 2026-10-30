import { queryTenant, lockResources, type TenantContext } from '@almacen/database';
import { DomainError, parseQuantity, formatQuantity, transferBalances, transferState, type TransferLine } from '@almacen/domain';
import { productDto } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
export async function transferRecord(context: TenantContext, value: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, 'SELECT id,code,source_warehouse_id,target_warehouse_id,departure_reference FROM app.transfers WHERE tenant_id=$1 AND id=$2', [context.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró el traslado en esta empresa.');
  return { id: row.id as string, code: row.code as string, sourceWarehouseId: row.source_warehouse_id as string, targetWarehouseId: row.target_warehouse_id as string, departureReference: row.departure_reference as string | null };
}
export async function loadTransfer(context: TenantContext, value: string) {
  const record = await transferRecord(context, value);
  const rows = (await queryTenant(context, 'SELECT l.id AS line_id,l.source_location_id,l.declared::text,l.departed::text,l.received::text,p.id,p.sku,p.name,p.unit_kind,p.unit_label FROM app.transfer_lines l JOIN app.products p ON (p.tenant_id,p.id)=(l.tenant_id,l.product_id) WHERE l.tenant_id=$1 AND l.transfer_id=$2 ORDER BY l.id', [context.tenantId, record.id])).rows;
  const lines = rows.map(row => {
    const product = productDto(row), model: TransferLine = { productId: product.id, declared: parseQuantity(row.declared, product.unit), departed: parseQuantity(row.departed, product.unit, 'nonnegative'), received: parseQuantity(row.received, product.unit, 'nonnegative') };
    return { id: row.line_id as string, sourceLocationId: row.source_location_id as string, product, model, dto: { id: row.line_id as string, product, sourceLocationId: row.source_location_id as string, declared: formatQuantity(model.declared), departed: formatQuantity(model.departed), received: formatQuantity(model.received), inTransit: formatQuantity(transferBalances(model).inTransit) } };
  });
  return { record, lines, dto: { ...record, status: transferState(lines.map(line => line.model)), lines: lines.map(line => line.dto) } };
}
export async function lockTransfer(context: TenantContext, value: string) {
  const record = await transferRecord(context, value);
  await lockResources(context, [{ kind: 'warehouse', id: record.sourceWarehouseId }, { kind: 'warehouse', id: record.targetWarehouseId }, { kind: 'transfer', id: record.id }]);
  return loadTransfer(context, record.id);
}
export type LoadedTransfer = Awaited<ReturnType<typeof loadTransfer>>;
