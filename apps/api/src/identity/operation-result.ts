import { queryTenant, lockResources, type TenantContext } from '@almacen/database';
import { DomainError } from '@almacen/domain';
// Extend this explicit policy when a new command type is implemented. Unknown
// persisted types fail closed instead of inheriting an accidental permission.
export function operationRoles(type: string): readonly string[] {
  if(['count.create','transfer.receive','order.prepare','inventory.receipt','inventory.internal-move'].includes(type))return ['admin','supervisor','operator'];
  if(['count.adjust','transfer.create','transfer.depart','order.create','order.reserve','order.assign','order.dispatch','order.cancel','product.create','product.update','product.remove'].includes(type))return ['admin','supervisor'];
  return ['location.block','location.unblock','layout.save','warehouse.create','user.create', 'user.update', 'company.update', 'import.apply'].includes(type) ? ['admin'] : [];
}
export async function operationResult(context: TenantContext, reference: string, role: string, actorId:string) {
  const row = (await queryTenant(context, `SELECT c.reference,c.operation_type,c.state,c.result,c.confirmed_at,j.id AS job_id
  FROM app.commands c LEFT JOIN app.import_jobs j ON j.tenant_id=c.tenant_id AND j.result_reference=c.reference AND j.state='applying'
  WHERE c.tenant_id=$1 AND c.reference=$2`, [context.tenantId, reference])).rows[0];
  if (!row)
    throw new DomainError('RESULT_NOT_RECORDED', 'Todavía no hay un resultado registrado para esta referencia.');
  if (!operationRoles(row.operation_type).includes(role))
    throw new DomainError('FORBIDDEN', 'No tienes permiso para consultar esta operación.');
  if(role==='operator'&&row.operation_type==='order.prepare'){
    const orderId=(row.result as Record<string,unknown>|null)?.id;
    if(typeof orderId!=='string')throw new DomainError('NOT_ASSIGNED','No tienes preparación asignada para esta operación.');
    const order=(await queryTenant(context,'SELECT warehouse_id FROM app.orders WHERE tenant_id=$1 AND id=$2',[context.tenantId,orderId])).rows[0];
    if(!order)throw new DomainError('NOT_ASSIGNED','No tienes preparación asignada para esta operación.');
    await lockResources(context,[{kind:'warehouse',id:order.warehouse_id as string},{kind:'order',id:orderId,warehouseId:order.warehouse_id as string}]);
    const current=(await queryTenant(context,'SELECT assigned_operator_id FROM app.orders WHERE tenant_id=$1 AND id=$2',[context.tenantId,orderId])).rows[0];
    if(current?.assigned_operator_id!==actorId)throw new DomainError('NOT_ASSIGNED','La preparación ya no está asignada a este operario.');
  }
  if (row.state === 'confirmed')
    return { status: 200, data: { reference, status: 'confirmed', type: row.operation_type, confirmedAt: (row.confirmed_at as Date).toISOString(), result: row.result } };
  if (row.job_id)
    return { status: 202, data: { reference, status: 'pending', jobId: row.job_id } };
  throw new DomainError('RESULT_NOT_RECORDED', 'Todavía no hay un resultado registrado para esta referencia.');
}
