import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { entityId, invalidInput } from '../platform/http/operation-input.js';
import { registerImportIntent } from './import-intent.js';
import { storedRows, validateRows } from './import-validation.js';
import { contentHash } from './import-processing.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { jobDto, importJob } from './import-data.js';
export interface UploadFile {
  buffer: Buffer;
  originalname: string;
  size: number;
}
@Injectable()
export class ImportService {
  constructor(private readonly identity: IdentityService) {
  }
  async upload(headers: CommandHeaders, fields: Record<string, unknown>, file: UploadFile | undefined) {
    this.identity.protectedMutation(headers);
    return this.identity.withIdentity(headers.cookie, ['admin'], async (ctx, session) => {
      if (Object.keys(fields).some(k => !['kind', 'warehouseId'].includes(k)) || !['catalogue', 'initial_stock'].includes(String(fields.kind)))
        invalidInput('Indica la clase de importación admitida.');
      if (!file || !file.buffer.length)
        throw new DomainError('INVALID_FILE', 'Adjunta un archivo CSV o XLSX con datos.');
      if (file.buffer.length > 20000000)
        throw new DomainError('FILE_TOO_LARGE', 'El archivo supera 20.000.000 bytes.');
      if (!/\.(csv|xlsx)$/iu.test(file.originalname))
        throw new DomainError('FORMAT', 'Usa CSV UTF-8 o XLSX.');
      const warehouse = fields.kind === 'initial_stock' ? entityId(fields.warehouseId) : null;
      if (fields.kind === 'catalogue' && fields.warehouseId !== undefined)
        invalidInput('El catálogo no requiere un almacén.');
      if (warehouse)
        await findWarehouse(ctx, warehouse);
      const id = randomUUID();
      const row = (await queryTenant(ctx, `INSERT INTO app.import_jobs(tenant_id,id,actor_id,kind,file_name,bytes,payload,warehouse_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [ctx.tenantId, id, session.user_id, fields.kind, file.originalname, file.buffer.length, file.buffer, warehouse])).rows[0]!;
      return jobDto(row);
    });
  }
  async application(headers: CommandHeaders, id: string, hash: string) {
    this.identity.publicMutation(headers);
    this.identity.protectedMutation(headers);
    return this.identity.withIdentity(headers.cookie, ['admin'], (ctx, session) => registerImportIntent(ctx, session.user_id, entityId(id), headers.reference ?? '', hash));
  }
  async validate(headers: CommandHeaders, id: string) {
    this.identity.publicMutation(headers);
    this.identity.protectedMutation(headers);
    return this.identity.withIdentity(headers.cookie, ['admin'], async (ctx) => {
      const started = performance.now(), job = await importJob(ctx, id, true);
      if (!['preview', 'invalid', 'validated'].includes(job.state))
        throw new DomainError('IMPORT_STATE_CONFLICT', 'La importación no está disponible para validar.');
      const rows = await validateRows(ctx, job, await storedRows(ctx, id));
      const errors = rows.flatMap(r => r.errors.map(e => ({ row: r.row, ...e })));
      await queryTenant(ctx, `UPDATE app.import_rows r SET action=v.action,values=v.values,errors=v.errors FROM jsonb_to_recordset($3::jsonb) v(row integer,action text,values jsonb,errors jsonb) WHERE r.tenant_id=$1 AND r.job_id=$2 AND r.row_no=v.row`, [ctx.tenantId, id, JSON.stringify(rows.map(r => ({ row: r.row, action: r.action, values: r.values, errors: r.errors })))]);
      const result = (await queryTenant(ctx, `UPDATE app.import_jobs SET state=$3,errors=$4,content_hash=$5,processing_ms=coalesce(processing_ms,0)+$6 WHERE tenant_id=$1 AND id=$2 RETURNING *`, [ctx.tenantId, id, errors.length ? 'invalid' : 'validated', JSON.stringify(errors), contentHash(job.kind, job.warehouse_id, rows), Math.ceil(performance.now() - started)])).rows[0]!;
      return jobDto(result);
    });
  }
  async rows(cookie: string | undefined, id: string, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin'], async (ctx) => {
      await importJob(ctx, id);
      const page = pageInput(ctx, query, [], 'import-rows:' + id);
      const rows = (await queryTenant(ctx, `SELECT row_no,action,values,errors FROM app.import_rows WHERE tenant_id=$1 AND job_id=$2 AND row_no>coalesce(nullif($3,'')::integer,0) ORDER BY row_no LIMIT $4`, [ctx.tenantId, id, page.after, page.limit + 1])).rows;
      const paged = page.finish(rows, row => String(row.row_no));
      return { data: paged.data.map(r => ({ row: r.row_no, action: r.action, values: r.values, errors: r.errors })), page: paged.page };
    });
  }
  async detail(cookie: string | undefined, id: string) {
    return this.identity.withIdentity(cookie, ['admin'], async (ctx) => jobDto(await importJob(ctx, id)));
  }
}
