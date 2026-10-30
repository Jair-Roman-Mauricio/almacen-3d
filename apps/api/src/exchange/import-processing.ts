import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { runUnitOfWork, queryTenant, type TenantContext } from '@almacen/database';
import { normalizeCode, DomainError } from '@almacen/domain';
import { parseImportFile, type ImportKind, type ParsedRow } from './file-parser.js';
export function contentHash(kind: string, warehouse: string | null, rows: readonly Pick<ParsedRow, 'values'>[]) {
  return createHash('sha256').update(JSON.stringify({ kind, warehouse, rows: rows.map(r => r.values) })).digest('hex');
}
export async function requireImportActor(ctx: TenantContext, actor: string) {
  const user = (await queryTenant(ctx, "SELECT id FROM app.users WHERE tenant_id=$1 AND id=$2 AND active AND role='admin'", [ctx.tenantId, actor])).rows[0];
  if (!user)
    throw new DomainError('FORBIDDEN', 'El autor debe seguir siendo administrador activo.');
}
export async function parseJob(pool: Pool, tenant: string, id: string) {
  return runUnitOfWork(pool, tenant, async (ctx) => {
    const job = (await queryTenant(ctx, "SELECT * FROM app.import_jobs WHERE tenant_id=$1 AND id=$2 AND state='parsing' FOR UPDATE SKIP LOCKED", [tenant, id])).rows[0];
    if (!job)
      return;
    const started = job.created_at.getTime();
    try {
      await requireImportActor(ctx, job.actor_id);
      const rows = await parseImportFile(job.payload, job.file_name, job.kind as ImportKind);
      const products = new Map((await queryTenant(ctx, 'SELECT sku_key FROM app.products WHERE tenant_id=$1 AND removed_at IS NULL', [tenant])).rows.map(p => [p.sku_key, true]));
      const normalized = rows.map(row => {
        let field = 'sku';
        try {
          const sku = normalizeCode(row.values.sku);
          row.values.sku = sku.value;
          if (job.kind === 'initial_stock') {
            field = 'codigo_ubicacion';
            row.values.codigo_ubicacion = normalizeCode(row.values.codigo_ubicacion).value;
          }
          return { ...row, action: job.kind === 'initial_stock' ? 'initial_stock' : products.has(sku.key) ? 'update' : 'create' };
        }
        catch (error) {
          return { ...row, action: job.kind === 'initial_stock' ? 'initial_stock' : 'create', errors: [...row.errors, { field, reason: error instanceof DomainError ? error.message : 'Código inválido.' }] };
        }
      });
      await queryTenant(ctx, `INSERT INTO app.import_rows(tenant_id,job_id,row_no,action,values,errors,source_errors) SELECT $1,$2,r.row,r.action,r.values,r.errors,r.errors FROM jsonb_to_recordset($3::jsonb) r(row integer,action text,values jsonb,errors jsonb)`, [tenant, id, JSON.stringify(normalized)]);
      await queryTenant(ctx, "UPDATE app.import_jobs SET state='preview',row_count=$3,content_hash=$4,processing_ms=$5 WHERE tenant_id=$1 AND id=$2", [tenant, id, rows.length, contentHash(job.kind, job.warehouse_id, rows), Math.max(0, Date.now() - started)]);
    }
    catch (error) {
      await queryTenant(ctx, "UPDATE app.import_jobs SET state='failed',errors=$3,processing_ms=$4 WHERE tenant_id=$1 AND id=$2", [tenant, id, JSON.stringify([{ field: 'file', reason: error instanceof DomainError ? error.message : 'No se pudo interpretar el archivo.', code: error instanceof DomainError ? error.code : 'INVALID_FILE' }]), Math.max(0, Date.now() - started)]);
    }
  });
}
