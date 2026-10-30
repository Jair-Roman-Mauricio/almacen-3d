import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import { entityId } from '../platform/http/operation-input.js';
export function jobDto(row: Record<string, unknown>) {
  return { id: row.id, kind: row.kind, state: row.state, fileName: row.file_name, bytes: Number(row.bytes), rowCount: row.row_count, ...(row.content_hash ? { contentHash: row.content_hash } : {}), processingMs: row.processing_ms ?? 0, errors: row.errors, ...(row.result_reference ? { resultReference: row.result_reference } : {}) };
}
export async function importJob(ctx: TenantContext, idValue: string, lock = false) {
  const id = entityId(idValue), row = (await queryTenant(ctx, `SELECT * FROM app.import_jobs WHERE tenant_id=$1 AND id=$2 ${lock ? 'FOR UPDATE' : ''}`, [ctx.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró la importación en esta empresa.');
  return row;
}
