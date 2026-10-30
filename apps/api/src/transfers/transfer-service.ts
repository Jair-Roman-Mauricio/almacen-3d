import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, lockResources, appendAuditEvent, appendChange } from '@almacen/database';
import { DomainError, normalizeCode, formatQuantity } from '@almacen/domain';
import type { CreateTransferInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId, invalidInput } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { findLocation } from '../inventory/stock-data.js';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import { loadTransfer, lockTransfer } from './transfer-data.js';
@Injectable()
export class TransferService {
  constructor(private readonly identity: IdentityService) {
  }
  async create(headers: CommandHeaders, input: CreateTransferInput) {
    const sourceWarehouseId = entityId(input.sourceWarehouseId), targetWarehouseId = entityId(input.targetWarehouseId), code = normalizeCode(input.code).value, lines = input.lines.map(line => ({ productId: entityId(line.productId), sourceLocationId: entityId(line.sourceLocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    if (sourceWarehouseId === targetWarehouseId)
      throw new DomainError('SAME_WAREHOUSE', 'El origen y destino deben ser almacenes diferentes.');
    try {
      return await this.identity.command(headers, 'transfer.create', { sourceWarehouseId, targetWarehouseId, code, lines }, async (context, stamp) => {
        await lockResources(context, [{ kind: 'warehouse', id: sourceWarehouseId }, { kind: 'warehouse', id: targetWarehouseId }]);
        await findWarehouse(context, sourceWarehouseId);
        await findWarehouse(context, targetWarehouseId);
        const locations = [...new Set(lines.map(l => l.sourceLocationId))], products = [...new Set(lines.map(l => l.productId))];
        await lockResources(context, [...locations.map(id => ({ kind: 'location' as const, id, warehouseId: sourceWarehouseId })), ...products.map(id => ({ kind: 'product' as const, id }))]);
        for (const id of locations)
          await findLocation(context, id, sourceWarehouseId);
        const units = new Map<string, Awaited<ReturnType<typeof findProduct>>['unit']>();
        for (const id of products)
          units.set(id, (await findProduct(context, id)).unit);
        const cells = new Map<string, {
          locationId: string;
          productId: string;
          quantity: bigint;
        }>();
        for (const line of lines) {
          const quantity = operationQuantity(line.quantity, units.get(line.productId)!).minor, key = line.sourceLocationId + ':' + line.productId;
          cells.set(key, { locationId: line.sourceLocationId, productId: line.productId, quantity: (cells.get(key)?.quantity ?? 0n) + quantity });
        }
        await lockResources(context, [...cells.values()].map(c => ({ kind: 'stock', id: c.locationId, warehouseId: sourceWarehouseId, productId: c.productId })));
        const id = randomUUID();
        await queryTenant(context, 'INSERT INTO app.transfers(tenant_id,id,code,source_warehouse_id,target_warehouse_id) VALUES ($1,$2,$3,$4,$5)', [context.tenantId, id, code, sourceWarehouseId, targetWarehouseId]);
        for (const cell of cells.values())
          await queryTenant(context, 'INSERT INTO app.transfer_lines(tenant_id,transfer_id,id,source_warehouse_id,target_warehouse_id,source_location_id,product_id,declared) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [context.tenantId, id, randomUUID(), sourceWarehouseId, targetWarehouseId, cell.locationId, cell.productId, formatQuantity({ minor: cell.quantity, unit: units.get(cell.productId)! })]);
        await appendAuditEvent(context, stamp, { kind: 'transfer.create', entityId: id, details: { sourceWarehouseId, targetWarehouseId, code } });
        await appendChange(context, stamp, [{ kind: 'transfers', id }, { kind: 'layout', id: sourceWarehouseId }]);
        return (await loadTransfer(context, id)).dto;
      }, { roles: ['admin', 'supervisor'] });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
        throw new DomainError('CODE_EXISTS', 'El código de traslado ya existe en esta empresa.');
      throw error;
    }
  }
  async detail(cookie: string | undefined, value: string) {
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => (await lockTransfer(context, id)).dto);
  }
  async list(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const page = pageInput(context, query, ['warehouseId', 'status'], 'transfers'), warehouse = page.filters.warehouseId ? entityId(page.filters.warehouseId) : null, status = page.filters.status ?? null;
      if (warehouse)
        await findWarehouse(context, warehouse);
      if (status && !['registered', 'in_transit', 'received'].includes(status))
        invalidInput('El estado de traslado no es válido.');
      const rows = (await queryTenant(context, `SELECT * FROM(SELECT t.id,t.source_warehouse_id,t.target_warehouse_id,CASE WHEN bool_and(l.departed=0) THEN 'registered' WHEN bool_and(l.received=l.departed) THEN 'received' ELSE 'in_transit' END AS status FROM app.transfers t JOIN app.transfer_lines l ON (l.tenant_id,l.transfer_id)=(t.tenant_id,t.id) WHERE t.tenant_id=$1 AND ($2::uuid IS NULL OR t.source_warehouse_id=$2 OR t.target_warehouse_id=$2) AND t.id::text>$3 GROUP BY t.tenant_id,t.id) v WHERE ($4::text IS NULL OR status=$4) ORDER BY id LIMIT $5`, [context.tenantId, warehouse, page.after, status, page.limit + 1])).rows;
      const selected = page.finish(rows, row => row.id as string);
      await lockResources(context, [...new Set(selected.data.flatMap(row => [row.source_warehouse_id as string, row.target_warehouse_id as string]))].map(id => ({ kind: 'warehouse', id })));
      await lockResources(context, selected.data.map(row => ({ kind: 'transfer', id: row.id as string })));
      const data = [];
      for (const row of selected.data) {
        const transfer = (await loadTransfer(context, row.id as string)).dto;
        if (!status || transfer.status === status)
          data.push(transfer);
      }
      return { data, page: selected.page };
    });
  }
}
