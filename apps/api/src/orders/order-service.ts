import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, lockResources, appendAuditEvent, appendChange } from '@almacen/database';
import { DomainError, normalizeCode, formatQuantity } from '@almacen/domain';
import type { CreateOrderInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId, invalidInput } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import { orderRecord, loadOrder } from './order-data.js';
@Injectable()
export class OrderService {
  constructor(private readonly identity: IdentityService) {
  }
  async create(headers: CommandHeaders, input: CreateOrderInput) {
    const warehouseId = entityId(input.warehouseId), code = normalizeCode(input.code).value, lines = input.lines.map(line => ({ productId: entityId(line.productId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    try {
      return await this.identity.command(headers, 'order.create', { warehouseId, code, lines }, async (context, stamp) => {
        await lockResources(context, [{ kind: 'warehouse', id: warehouseId }]);
        await findWarehouse(context, warehouseId);
        await lockResources(context, [...new Set(lines.map(line => line.productId))].map(id => ({ kind: 'product', id })));
        for (const line of lines) {
          const product = await findProduct(context, line.productId);
          operationQuantity(line.quantity, product.unit);
        }
        const id = randomUUID();
        await queryTenant(context, 'INSERT INTO app.orders(tenant_id,warehouse_id,id,code) VALUES ($1,$2,$3,$4)', [context.tenantId, warehouseId, id, code]);
        for (const line of lines)
          await queryTenant(context, 'INSERT INTO app.order_lines(tenant_id,warehouse_id,order_id,id,product_id,requested) VALUES ($1,$2,$3,$4,$5,$6)', [context.tenantId, warehouseId, id, randomUUID(), line.productId, line.quantity]);
        await appendAuditEvent(context, stamp, { kind: 'order.create', entityId: id, details: { warehouseId, code } });
        await appendChange(context, stamp, [{ kind: 'orders', id }]);
        return (await loadOrder(context, id)).dto;
      }, { roles: ['admin', 'supervisor'] });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
        throw new DomainError('CODE_EXISTS', 'El código de pedido ya existe en este almacén.');
      throw error;
    }
  }
  async detail(cookie: string | undefined, value: string) {
    const id = entityId(value);
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context) => {
      const record = await orderRecord(context, id);
      await lockResources(context, [{ kind: 'warehouse', id: record.warehouseId }, { kind: 'order', id, warehouseId: record.warehouseId }]);
      return (await loadOrder(context, id)).dto;
    });
  }
  async list(cookie: string | undefined, query: Record<string, unknown>) {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor', 'operator'], async (context, session) => {
      const warehouse = entityId(query.warehouseId);
      await findWarehouse(context, warehouse);
      const page = pageInput(context, query, ['warehouseId', 'status', 'assignedToMe', 'q'], 'orders');
      const status = page.filters.status ?? null, assigned = page.filters.assignedToMe;
      if (status && !['pending', 'partially_dispatched', 'dispatched', 'cancelled'].includes(status))
        invalidInput('El estado de pedido no es válido.');
      if (assigned !== undefined && !['true', 'false'].includes(assigned))
        invalidInput('El filtro de asignación no es válido.');
      const rows = (await queryTenant(context, `SELECT * FROM(SELECT o.id,o.code,o.warehouse_id AS "warehouseId",CASE WHEN o.cancelled THEN 'cancelled' WHEN bool_and(l.dispatched=l.requested) THEN 'dispatched' WHEN bool_or(l.dispatched>0) THEN 'partially_dispatched' ELSE 'pending' END AS status,CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'role',u.role,'active',u.active) END AS "assignedOperator" FROM app.orders o JOIN app.order_lines l ON (l.tenant_id,l.warehouse_id,l.order_id)=(o.tenant_id,o.warehouse_id,o.id) LEFT JOIN app.users u ON (u.tenant_id,u.id)=(o.tenant_id,o.assigned_operator_id) WHERE o.tenant_id=$1 AND o.warehouse_id=$2 AND o.id::text>$3 AND (strpos(o.code_key,app.code_key($4))>0) AND (NOT $5::boolean OR o.assigned_operator_id=$6) GROUP BY o.tenant_id,o.warehouse_id,o.id,u.tenant_id,u.id) v WHERE ($7::text IS NULL OR status=$7) ORDER BY id LIMIT $8`, [context.tenantId, warehouse, page.after, page.filters.q ?? '', assigned === 'true', session.user_id, status, page.limit + 1])).rows;
      return page.finish(rows, row => row.id as string);
    });
  }
}
