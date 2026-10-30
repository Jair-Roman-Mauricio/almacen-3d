import { lockResources, queryTenant, type TenantContext } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import { orderRecord, loadOrder, type LoadedOrder } from './order-data.js';
export async function lockOrder(context: TenantContext, id: string) {
  const record = await orderRecord(context, id);
  await lockResources(context, [{ kind: 'warehouse', id: record.warehouseId }, { kind: 'order', id: record.id, warehouseId: record.warehouseId }]);
  return loadOrder(context, id);
}
export function requireOpenOrder(order: LoadedOrder): void {
  if (['cancelled', 'dispatched'].includes(order.dto.status))
    throw new DomainError('ORDER_CLOSED', 'El pedido ya está cerrado.');
}
export async function requireAssigned(context: TenantContext, order: LoadedOrder, actorId: string): Promise<void> {
  const user = (await queryTenant(context, 'SELECT role FROM app.users WHERE tenant_id=$1 AND id=$2 AND active', [context.tenantId, actorId])).rows[0];
  if (!user)
    throw new DomainError('SESSION_INVALID', 'La cuenta no está activa.');
  if (user.role === 'operator' && order.record.assignedId !== actorId)
    throw new DomainError('NOT_ASSIGNED', 'La preparación no está asignada actualmente a este operario.');
}
