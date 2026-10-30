import { queryTenant, lockResources, type TenantContext } from '@almacen/database';
import { canonicalCommand, DomainError } from '@almacen/domain';
import { fingerprintCanonicalData } from '../platform/commands/fingerprint.js';
import { entityId } from '../platform/http/operation-input.js';
import { importJob } from './import-data.js';
export function importCommandData(job: Record<string, unknown>, hash: string) {
  return { jobId: job.id, kind: job.kind, warehouseId: job.warehouse_id, contentHash: hash };
}
export async function registerImportIntent(ctx: TenantContext, actor: string, id: string, referenceValue: string, hashValue: string) {
  if (typeof referenceValue !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(referenceValue))
    throw new DomainError('INVALID_REFERENCE', 'La referencia de operación no es válida.');
  const reference = entityId(referenceValue), hash = typeof hashValue === 'string' ? hashValue.toLowerCase() : '';
  if (!/^[0-9a-f]{64}$/u.test(hash))
    throw new DomainError('CONTENT_CHANGED', 'La huella de contenido no es válida.');
  await lockResources(ctx, [{ kind: 'command', id: reference }]);
  const job = await importJob(ctx, id, true);
  const fingerprint = fingerprintCanonicalData(canonicalCommand({ tenantId: ctx.tenantId, type: 'import.apply', data: importCommandData(job, hash) }));
  const previous = (await queryTenant(ctx, 'SELECT * FROM app.commands WHERE tenant_id=$1 AND reference=$2', [ctx.tenantId, reference])).rows[0];
  if (previous) {
    if (previous.operation_type !== 'import.apply' || previous.data_hash !== fingerprint)
      throw new DomainError('REFERENCE_REUSED', 'La referencia ya fue utilizada con otros datos.');
    if (previous.state === 'confirmed')
      return { status: 200, data: { reference, status: 'confirmed', type: 'import.apply', confirmedAt: previous.confirmed_at.toISOString(), result: previous.result } };
    if (job.result_reference !== reference || job.state !== 'applying')
      throw new DomainError('IMPORT_STATE_CONFLICT', 'La aplicación falló; revisa los errores del trabajo.');
    return { status: 202, data: { reference, status: 'pending', jobId: id } };
  }
  if (job.content_hash !== hash)
    throw new DomainError('CONTENT_CHANGED', 'El contenido no coincide con la previsualización validada.');
  if (job.state !== 'validated')
    throw new DomainError('IMPORT_NOT_VALIDATED', 'Valida la importación antes de aplicarla.');
  await queryTenant(ctx, "INSERT INTO app.commands(tenant_id,reference,operation_type,data_hash,actor_id) VALUES($1,$2,'import.apply',$3,$4)", [ctx.tenantId, reference, fingerprint, actor]);
  await queryTenant(ctx, "UPDATE app.import_jobs SET state='applying',result_reference=$3,application_queued_at=clock_timestamp() WHERE tenant_id=$1 AND id=$2", [ctx.tenantId, id, reference]);
  return { status: 202, data: { reference, status: 'pending', jobId: id } };
}
