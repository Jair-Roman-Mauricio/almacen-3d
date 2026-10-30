import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, appendAuditEvent, appendChange, lockResources, type TenantContext } from '@almacen/database';
import { DomainError, normalizeCode, normalizeName } from '@almacen/domain';
import type { CreateWarehouseInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { dimensions, decimalText, entityId, invalidInput } from '../platform/http/operation-input.js';
import { layoutElements, elementColumns, elementDto } from './layout-data.js';
import { ApiException } from '../platform/http/api-exception.js';
import { pageInput } from '../platform/http/cursor-page.js';
export const warehouseColumns = `id,code,name,width::text,height::text,depth::text,layout_revision::text`;
export function warehouseDto(row: Record<string, unknown>) {
  return { id: row.id as string, code: row.code as string, name: row.name as string, dimensions: { width: decimalText(row.width), height: decimalText(row.height), depth: decimalText(row.depth) }, layoutRevision: row.layout_revision as string };
}
export async function findWarehouse(context: TenantContext, value: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, `SELECT ${warehouseColumns} FROM app.warehouses WHERE tenant_id=$1 AND id=$2`, [context.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró el almacén en esta empresa.');
  return warehouseDto(row);
}
@Injectable()
export class WarehouseService {
  constructor(private readonly identity: IdentityService) {
  }
  async create(headers: CommandHeaders, input: CreateWarehouseInput) {
    const data = { code: normalizeCode(input.code).value, name: normalizeName(input.name), dimensions: dimensions(input.dimensions) };
    try {
      return await this.identity.command(headers, 'warehouse.create', data, async (context, stamp) => {
        const id = randomUUID();
        const row = (await queryTenant(context, `INSERT INTO app.warehouses(tenant_id,id,code,name,width,height,depth) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${warehouseColumns}`, [context.tenantId, id, data.code, data.name, data.dimensions.width, data.dimensions.height, data.dimensions.depth])).rows[0]!;
        const result = warehouseDto(row);
        await appendAuditEvent(context, stamp, { kind: 'warehouse.create', entityId: id, details: result });
        await appendChange(context, stamp, [{ kind: 'warehouses', id }]);
        return result;
      });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
        throw new DomainError('CODE_EXISTS', 'El código de almacén ya existe.');
      throw error;
    }
  }
  async list(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const page = pageInput(context, query, ['q'], 'warehouses');
      const rows = (await queryTenant(context, `SELECT ${warehouseColumns} FROM app.warehouses WHERE tenant_id=$1 AND id::text>$2 AND (strpos(lower(name),lower($3))>0 OR strpos(code_key,app.code_key($3))>0) ORDER BY id LIMIT $4`, [context.tenantId, page.after, page.filters.q ?? '', page.limit + 1])).rows.map(warehouseDto);
      return page.finish(rows, row => row.id);
    });
  }
  async layout(cookie: string | undefined, value: string, query: Record<string, unknown> = {}) {
    if (Object.keys(query).length)
      invalidInput('Esta consulta no admite filtros.');
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      await lockResources(context, [{ kind: 'warehouse', id }]);
      const warehouse = await findWarehouse(context, id);
      return { warehouseId: id, revision: warehouse.layoutRevision, elements: await layoutElements(context, id) };
    });
  }
  async locations(cookie: string | undefined, value: string, query: Record<string, unknown>) {
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      await findWarehouse(context, id);
      const page = pageInput(context, query, ['q', 'blocked'], 'locations:' + id);
      const blocked = page.filters.blocked;
      if (blocked !== undefined && !['true', 'false'].includes(blocked))
        invalidInput('El filtro de bloqueo no es válido.');
      const rows = (await queryTenant(context, `SELECT ${elementColumns} FROM app.layout_elements WHERE tenant_id=$1 AND warehouse_id=$2 AND type='location' AND removed_at IS NULL AND id::text>$3 AND (strpos(lower(name),lower($4))>0 OR strpos(code_key,app.code_key($4))>0) AND ($5::boolean IS NULL OR blocked=$5) ORDER BY id LIMIT $6`, [context.tenantId, id, page.after, page.filters.q ?? '', blocked ?? null, page.limit + 1])).rows.map(elementDto);
      return page.finish(rows, row => row.id);
    });
  }
  async spatialSearch(cookie: string | undefined, value: string, query: Record<string, unknown>) {
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      await findWarehouse(context, id);
      let code: string;
      try {
        if (Object.keys(query).some(key => !['kind', 'code'].includes(key)) || !['sku', 'location'].includes(String(query.kind)))
          throw new Error();
        code = normalizeCode(query.code).key;
      }
      catch {
        throw new ApiException(400, { code: 'INVALID_SEARCH', message: 'Indica tipo de búsqueda y código válidos.', details: [] });
      }
      const rows = query.kind === 'location' ? (await queryTenant(context, "SELECT id AS location_id FROM app.layout_elements WHERE tenant_id=$1 AND warehouse_id=$2 AND type='location' AND removed_at IS NULL AND code_key=$3 ORDER BY id", [context.tenantId, id, code])).rows : (await queryTenant(context, `SELECT s.location_id FROM app.stock_balances s JOIN app.products p ON (p.tenant_id,p.id)=(s.tenant_id,s.product_id) JOIN app.layout_elements e ON (e.tenant_id,e.warehouse_id,e.id)=(s.tenant_id,s.warehouse_id,s.location_id) WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND p.sku_key=$3 AND p.removed_at IS NULL AND e.removed_at IS NULL AND s.physical>0 ORDER BY s.location_id`, [context.tenantId, id, code])).rows;
      return { locationIds: rows.map(row => row.location_id as string) };
    });
  }
}
