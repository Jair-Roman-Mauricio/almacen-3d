import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { queryTenant, lockResources, appendInventoryEntries, appendChange, appendAuditEvent } from '@almacen/database';
import { DomainError, formatQuantity, parseQuantity, reserveLine, prepareLine, dispatchLine } from '@almacen/domain';
import type { ReservationsInput, AllocationActionInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import { positionBalance, requireEnabledLocation } from '../inventory/stock-data.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { lockOrder, requireOpenOrder, requireAssigned } from './order-guards.js';
import { allocationRequests, lockAllocationPositions } from './allocation-actions.js';
import { loadOrder } from './order-data.js';
@Injectable()
export class OrderWorkflowService {
  constructor(private readonly identity: IdentityService) {
  }
  async reserve(headers: CommandHeaders, value: string, input: ReservationsInput) {
    const orderId = entityId(value), lines = input.lines.map(line => ({ orderLineId: entityId(line.orderLineId), sourceLocationId: entityId(line.sourceLocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    return this.identity.command(headers, 'order.reserve', { orderId, lines }, async (context, stamp) => {
      const order = await lockOrder(context, orderId);
      requireOpenOrder(order);
      const warehouseId = order.record.warehouseId;
      const pairs = new Map<string, {
        lineId: string;
        locationId: string;
        productId: string;
        quantity: bigint;
      }>();
      for (const item of lines) {
        const line = order.lines.find(l => l.id === item.orderLineId);
        if (!line)
          throw new DomainError('NOT_FOUND', 'La línea no pertenece a este pedido.');
        const key = line.id + ':' + item.sourceLocationId, existing = pairs.get(key), quantity = operationQuantity(item.quantity, line.product.unit).minor;
        pairs.set(key, { lineId: line.id, locationId: item.sourceLocationId, productId: line.product.id, quantity: (existing?.quantity ?? 0n) + quantity });
      }
      const requests = [...pairs.values()], locationIds = [...new Set(requests.map(r => r.locationId))], productIds = [...new Set(requests.map(r => r.productId))];
      await lockResources(context, [...locationIds.map(id => ({ kind: 'location' as const, id, warehouseId })), ...productIds.map(id => ({ kind: 'product' as const, id }))]);
      for (const id of locationIds)
        await requireEnabledLocation(context, id, warehouseId);
      for (const id of productIds)
        await findProduct(context, id);
      const positions = new Map(requests.map(r => [r.locationId + ':' + r.productId, { locationId: r.locationId, productId: r.productId }]));
      await lockResources(context, [...positions.values()].map(p => ({ kind: 'stock', id: p.locationId, warehouseId, productId: p.productId })));
      const available = new Map<string, bigint>();
      for (const [key, p] of positions) {
        const balance = await positionBalance(context, warehouseId, p.locationId, p.productId);
        available.set(key, parseQuantity(balance.available, balance.product.unit, 'nonnegative').minor);
      }
      const models = new Map(order.lines.map(l => [l.id, l.model]));
      const planned = [];
      for (const r of requests) {
        const model = models.get(r.lineId)!, key = r.locationId + ':' + r.productId, unit = model.requested.unit, id = model.allocations.find(a => a.locationId === r.locationId)?.id ?? randomUUID();
        const change = reserveLine(model, { id, locationId: r.locationId }, { minor: r.quantity, unit }, { minor: available.get(key)!, unit });
        models.set(r.lineId, change.line);
        available.set(key, available.get(key)! - r.quantity);
        planned.push({ ...r, id, unit });
      }
      const entries = [];
      for (const r of planned) {
        const model = models.get(r.lineId)!, allocation = model.allocations.find(a => a.id === r.id)!;
        await queryTenant(context, 'INSERT INTO app.allocations(tenant_id,warehouse_id,id,order_id,line_id,product_id,location_id,reserved,prepared_pending) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,warehouse_id,line_id,location_id) DO UPDATE SET reserved=excluded.reserved,prepared_pending=excluded.prepared_pending', [context.tenantId, warehouseId, r.id, orderId, r.lineId, r.productId, r.locationId, formatQuantity(allocation.reserved), formatQuantity(allocation.preparedPending)]);
        const amount = formatQuantity({ minor: r.quantity, unit: r.unit });
        await queryTenant(context, 'UPDATE app.stock_balances SET reserved=reserved+$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, r.locationId, r.productId, amount]);
        entries.push({ warehouseId, productId: r.productId, locationId: r.locationId, kind: 'reservation', physicalDelta: '0', reservedDelta: amount, transitDelta: '0' });
      }
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'orders', id: orderId }, { kind: 'inventory', id: warehouseId }]);
      return (await loadOrder(context, orderId)).dto;
    }, { roles: ['admin', 'supervisor'] });
  }
  async assign(headers: CommandHeaders, value: string, input: {
    operatorId: string;
  }) {
    const orderId = entityId(value), operatorId = entityId(input.operatorId);
    return this.identity.command(headers, 'order.assign', { orderId, operatorId }, async (context, stamp) => {
      const order = await lockOrder(context, orderId);
      requireOpenOrder(order);
      const user = (await queryTenant(context, 'SELECT role,active FROM app.users WHERE tenant_id=$1 AND id=$2', [context.tenantId, operatorId])).rows[0];
      if (!user)
        throw new DomainError('NOT_FOUND', 'No se encontró el usuario en esta empresa.');
      if (!user.active || user.role !== 'operator')
        throw new DomainError('INVALID_ASSIGNEE', 'La preparación requiere un operario activo.');
      await queryTenant(context, 'UPDATE app.orders SET assigned_operator_id=$3 WHERE tenant_id=$1 AND id=$2', [context.tenantId, orderId, operatorId]);
      const auditId = await appendAuditEvent(context, stamp, { kind: 'order.assign', entityId: orderId, details: { previousOperatorId: order.record.assignedId, operatorId } });
      await appendChange(context, stamp, [{ kind: 'orders', id: orderId }]);
      return { order: (await loadOrder(context, orderId)).dto, auditId };
    }, { roles: ['admin', 'supervisor'] });
  }
  async prepare(headers: CommandHeaders, value: string, input: AllocationActionInput) {
    const orderId = entityId(value), lines = input.lines.map(line => ({ allocationId: entityId(line.allocationId), quantity: formatQuantity(operationQuantity(line.quantity)) })), session = await this.identity.resolveSession(headers.cookie);
    return this.identity.command(headers, 'order.prepare', { orderId, lines }, async (context, stamp) => {
      const order = await lockOrder(context, orderId);
      requireOpenOrder(order);
      await requireAssigned(context, order, stamp.actorId);
      const requests = allocationRequests(order, lines);
      await lockAllocationPositions(context, order.record.warehouseId, requests);
      const models = new Map(order.lines.map(l => [l.id, l.model]));
      for (const r of requests)
        models.set(r.lineId, prepareLine(models.get(r.lineId)!, r.id, { minor: r.quantity, unit: r.unit }).line);
      for (const r of requests) {
        const allocation = models.get(r.lineId)!.allocations.find(a => a.id === r.id)!;
        await queryTenant(context, 'UPDATE app.allocations SET prepared_pending=$4 WHERE tenant_id=$1 AND warehouse_id=$2 AND id=$3', [context.tenantId, order.record.warehouseId, r.id, formatQuantity(allocation.preparedPending)]);
      }
      await appendAuditEvent(context, stamp, { kind: 'order.prepare', entityId: orderId, details: { lines } });
      await appendChange(context, stamp, [{ kind: 'orders', id: orderId }]);
      return (await loadOrder(context, orderId)).dto;
    }, { roles: ['admin', 'supervisor', 'operator'], validateReplay: async (context, result) => {
        const current = await lockOrder(context, String(result.id));
        await requireAssigned(context, current, session.user_id);
      } });
  }
  async dispatch(headers: CommandHeaders, value: string, input: AllocationActionInput) {
    const orderId = entityId(value), lines = input.lines.map(line => ({ allocationId: entityId(line.allocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    return this.identity.command(headers, 'order.dispatch', { orderId, lines }, async (context, stamp) => {
      const order = await lockOrder(context, orderId);
      requireOpenOrder(order);
      const warehouseId = order.record.warehouseId, requests = allocationRequests(order, lines);
      await lockAllocationPositions(context, warehouseId, requests);
      const models = new Map(order.lines.map(line => [line.id, line.model]));
      for (const r of requests)
        models.set(r.lineId, dispatchLine(models.get(r.lineId)!, r.id, { minor: r.quantity, unit: r.unit }).line);
      const positions = new Map<string, {
        locationId: string;
        productId: string;
        quantity: bigint;
        unit: typeof requests[number]['unit'];
      }>();
      for (const r of requests) {
        const key = r.locationId + ':' + r.productId, previous = positions.get(key);
        positions.set(key, { ...r, quantity: (previous?.quantity ?? 0n) + r.quantity });
      }
      for (const p of positions.values()) {
        const balance = await positionBalance(context, warehouseId, p.locationId, p.productId);
        if (p.quantity > parseQuantity(balance.reserved, p.unit, 'nonnegative').minor || p.quantity > parseQuantity(balance.physical, p.unit, 'nonnegative').minor)
          throw new DomainError('RESERVATION_BALANCE_EXCEEDED', 'El saldo reservado actual no cubre este despacho.');
      }
      for (const p of positions.values())
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=physical-$5::numeric,reserved=reserved-$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, p.locationId, p.productId, formatQuantity({ minor: p.quantity, unit: p.unit })]);
      const entries = [];
      for (const r of requests) {
        const allocation = models.get(r.lineId)!.allocations.find(a => a.id === r.id)!;
        await queryTenant(context, 'UPDATE app.allocations SET reserved=$4,prepared_pending=$5 WHERE tenant_id=$1 AND warehouse_id=$2 AND id=$3', [context.tenantId, warehouseId, r.id, formatQuantity(allocation.reserved), formatQuantity(allocation.preparedPending)]);
        const delta = formatQuantity({ minor: -r.quantity, unit: r.unit });
        entries.push({ warehouseId, locationId: r.locationId, productId: r.productId, kind: 'dispatch', physicalDelta: delta, reservedDelta: delta, transitDelta: '0' });
      }
      for (const lineId of new Set(requests.map(r => r.lineId)))
        await queryTenant(context, 'UPDATE app.order_lines SET dispatched=$4 WHERE tenant_id=$1 AND warehouse_id=$2 AND id=$3', [context.tenantId, warehouseId, lineId, formatQuantity(models.get(lineId)!.dispatched)]);
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'orders', id: orderId }, { kind: 'inventory', id: warehouseId }]);
      return { order: (await loadOrder(context, orderId)).dto, historyId: stamp.reference };
    }, { roles: ['admin', 'supervisor'] });
  }
  async cancel(headers: CommandHeaders, value: string) {
    const orderId = entityId(value);
    return this.identity.command(headers, 'order.cancel', { orderId }, async (context, stamp) => {
      const order = await lockOrder(context, orderId);
      requireOpenOrder(order);
      if (order.lines.some(l => l.model.dispatched.minor > 0n))
        throw new DomainError('ORDER_ALREADY_DISPATCHED', 'El pedido ya tiene cantidades despachadas.');
      if (order.lines.some(l => l.model.allocations.some(a => a.preparedPending.minor > 0n)))
        throw new DomainError('ORDER_ALREADY_PREPARED', 'El pedido ya tiene cantidades preparadas.');
      const warehouseId = order.record.warehouseId, requests = order.lines.flatMap(line => line.model.allocations.filter(a => a.reserved.minor > 0n).map(a => ({ id: a.id, locationId: a.locationId, productId: line.product.id, quantity: a.reserved.minor, unit: line.product.unit })));
      await lockAllocationPositions(context, warehouseId, requests, false);
      const positions = new Map<string, {
        locationId: string;
        productId: string;
        quantity: bigint;
        unit: typeof requests[number]['unit'];
      }>();
      for (const r of requests) {
        const key = r.locationId + ':' + r.productId, old = positions.get(key);
        positions.set(key, { ...r, quantity: (old?.quantity ?? 0n) + r.quantity });
      }
      for (const p of positions.values()) {
        const balance = await positionBalance(context, warehouseId, p.locationId, p.productId);
        if (parseQuantity(balance.reserved, p.unit, 'nonnegative').minor < p.quantity)
          throw new DomainError('RESERVATION_BALANCE_EXCEEDED', 'El saldo reservado actual no cubre la liberación.');
      }
      for (const p of positions.values())
        await queryTenant(context, 'UPDATE app.stock_balances SET reserved=reserved-$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, p.locationId, p.productId, formatQuantity({ minor: p.quantity, unit: p.unit })]);
      await queryTenant(context, 'UPDATE app.allocations SET reserved=0,prepared_pending=0 WHERE tenant_id=$1 AND warehouse_id=$2 AND order_id=$3', [context.tenantId, warehouseId, orderId]);
      await queryTenant(context, 'UPDATE app.orders SET cancelled=true WHERE tenant_id=$1 AND id=$2', [context.tenantId, orderId]);
      await appendInventoryEntries(context, stamp, requests.map(r => ({ warehouseId, locationId: r.locationId, productId: r.productId, kind: 'reservation-release', physicalDelta: '0', reservedDelta: formatQuantity({ minor: -r.quantity, unit: r.unit }), transitDelta: '0' })));
      await appendAuditEvent(context, stamp, { kind: 'order.cancel', entityId: orderId, details: { warehouseId } });
      await appendChange(context, stamp, [{ kind: 'orders', id: orderId }, { kind: 'inventory', id: warehouseId }]);
      return (await loadOrder(context, orderId)).dto;
    }, { roles: ['admin', 'supervisor'] });
  }
}
