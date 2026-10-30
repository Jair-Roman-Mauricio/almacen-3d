import {lockSkuKeys} from './sku-lock.js';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, appendAuditEvent, appendChange, lockResources, type TenantContext } from '@almacen/database';
import { DomainError, normalizeCode, normalizeName, type UnitKind } from '@almacen/domain';
import type { CreateProductInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
export const productColumns = 'id,sku,name,unit_kind,unit_label';
export function productDto(row: Record<string, unknown>) {
  return { id: row.id as string, sku: row.sku as string, name: row.name as string, unit: { kind: row.unit_kind as UnitKind, label: row.unit_label as string } };
}
export async function findProduct(context: TenantContext, value: string) {
  const id = entityId(value);
  const row = (await queryTenant(context, `SELECT ${productColumns} FROM app.products WHERE tenant_id=$1 AND id=$2 AND removed_at IS NULL`, [context.tenantId, id])).rows[0];
  if (!row)
    throw new DomainError('NOT_FOUND', 'No se encontró el producto activo en esta empresa.');
  return productDto(row);
}
@Injectable()
export class CatalogueService {
  constructor(private readonly identity: IdentityService) {
  }
  async create(headers: CommandHeaders, input: CreateProductInput) {
    const kind = input.unit.kind;
    if (typeof kind !== 'string' || !['piece', 'box', 'pallet', 'weight', 'volume', 'length'].includes(kind))
      throw new DomainError('INVALID_UNIT', 'La unidad base no es válida.');
    const data = { sku: normalizeCode(input.sku).value, name: normalizeName(input.name), unit: { kind, label: normalizeName(input.unit.label) } };
    try {
      return await this.identity.command(headers, 'product.create', data, async (context, stamp) => {
        await lockSkuKeys(context,[normalizeCode(data.sku).key]);
        const id = randomUUID();
        const row = (await queryTenant(context, `INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${productColumns}`, [context.tenantId, id, data.sku, data.name, kind, data.unit.label])).rows[0]!;
        const result = productDto(row);
        await appendAuditEvent(context, stamp, { kind: 'product.create', entityId: id, details: result });
        await appendChange(context, stamp, [{ kind: 'products', id }]);
        return result;
      }, { roles: ['admin', 'supervisor'] });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
        throw new DomainError('SKU_EXISTS', 'El SKU ya existe en esta empresa.');
      throw error;
    }
  }
  async update(headers: CommandHeaders, value: string, input: {
    name: unknown;
  }) {
    const id = entityId(value), name = normalizeName(input.name);
    return this.identity.command(headers, 'product.update', { id, name }, async (context, stamp) => {
      await lockResources(context, [{ kind: 'product', id }]);
      await findProduct(context, id);
      const result = productDto((await queryTenant(context, `UPDATE app.products SET name=$3 WHERE tenant_id=$1 AND id=$2 RETURNING ${productColumns}`, [context.tenantId, id, name])).rows[0]!);
      await appendAuditEvent(context, stamp, { kind: 'product.update', entityId: id, details: { name } });
      await appendChange(context, stamp, [{ kind: 'products', id }]);
      return result;
    }, { roles: ['admin', 'supervisor'] });
  }
  async list(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const page = pageInput(context, query, ['q'], 'products');
      const rows = (await queryTenant(context, `SELECT ${productColumns} FROM app.products WHERE tenant_id=$1 AND removed_at IS NULL AND id::text>$2 AND (strpos(lower(name),lower($3))>0 OR strpos(sku_key,app.code_key($3))>0) ORDER BY id LIMIT $4`, [context.tenantId, page.after, page.filters.q ?? '', page.limit + 1])).rows.map(productDto);
      return page.finish(rows, row => row.id);
    });
  }
  async remove(headers: CommandHeaders, value: string) {
    const id = entityId(value);
    return this.identity.command(headers, 'product.remove', { id }, async (context, stamp) => {
      await lockResources(context, [{ kind: 'product', id }]);
      await findProduct(context, id);
      const used = (await queryTenant(context, `SELECT
   EXISTS(SELECT 1 FROM app.stock_balances WHERE tenant_id=$1 AND product_id=$2 AND (physical>0 OR reserved>0)) OR
   EXISTS(SELECT 1 FROM app.allocations WHERE tenant_id=$1 AND product_id=$2 AND (reserved>0 OR prepared_pending>0)) OR
   EXISTS(SELECT 1 FROM app.order_lines l JOIN app.orders o ON (o.tenant_id,o.warehouse_id,o.id)=(l.tenant_id,l.warehouse_id,l.order_id) WHERE l.tenant_id=$1 AND l.product_id=$2 AND NOT o.cancelled AND l.dispatched<l.requested) OR
   EXISTS(SELECT 1 FROM app.transfer_lines WHERE tenant_id=$1 AND product_id=$2 AND (departed=0 OR received<departed)) OR
   EXISTS(SELECT 1 FROM app.counts WHERE tenant_id=$1 AND product_id=$2 AND NOT adjusted) AS used`, [context.tenantId, id])).rows[0]!.used;
      if (used)
        throw new DomainError('PRODUCT_IN_USE', 'El producto conserva existencias, reservas o trabajo pendiente.');
      await queryTenant(context, 'UPDATE app.products SET removed_at=$3 WHERE tenant_id=$1 AND id=$2', [context.tenantId, id, stamp.occurredAt]);
      await appendAuditEvent(context, stamp, { kind: 'product.remove', entityId: id, details: { removed: true } });
      await appendChange(context, stamp, [{ kind: 'products', id }]);
      return { id, removed: true };
    }, { roles: ['admin', 'supervisor'], jsonBody: false });
  }
}
