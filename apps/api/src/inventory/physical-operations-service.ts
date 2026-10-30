import { Injectable } from '@nestjs/common';
import { queryTenant, lockResources, appendInventoryEntries, appendChange } from '@almacen/database';
import { DomainError, parseQuantity, formatQuantity, type Unit } from '@almacen/domain';
import type { ReceiptInput, MoveInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { requireEnabledLocation, positionBalance } from './stock-data.js';
export function operationQuantity(value: unknown, unit: Unit = { kind: 'weight', label: 'base' }) {
  try {
    return parseQuantity(value, unit);
  }
  catch (error) {
    if (error instanceof DomainError)
      throw error;
    throw new DomainError('INVALID_QUANTITY', 'La cantidad debe ser una cadena decimal positiva.');
  }
}
@Injectable()
export class PhysicalOperationsService {
  constructor(private readonly identity: IdentityService) {
  }
  async receipt(headers: CommandHeaders, input: ReceiptInput) {
    const warehouseId = entityId(input.warehouseId), lines = input.lines.map(line => ({ productId: entityId(line.productId), targetLocationId: entityId(line.targetLocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    return this.identity.command(headers, 'inventory.receipt', { warehouseId, lines }, async (context, stamp) => {
      await lockResources(context, [{ kind: 'warehouse', id: warehouseId }]);
      await findWarehouse(context, warehouseId);
      const locationIds = [...new Set(lines.map(line => line.targetLocationId))], productIds = [...new Set(lines.map(line => line.productId))];
      await lockResources(context, [...locationIds.map(id => ({ kind: 'location' as const, id, warehouseId })), ...productIds.map(id => ({ kind: 'product' as const, id }))]);
      for (const id of locationIds)
        await requireEnabledLocation(context, id, warehouseId);
      const products = new Map<string, Awaited<ReturnType<typeof findProduct>>>();
      for (const id of productIds)
        products.set(id, await findProduct(context, id));
      const cells = new Map<string, {
        locationId: string;
        productId: string;
        quantity: bigint;
      }>();
      for (const line of lines) {
        const amount = operationQuantity(line.quantity, products.get(line.productId)!.unit);
        const key = line.targetLocationId + ':' + line.productId;
        const old = cells.get(key);
        cells.set(key, { locationId: line.targetLocationId, productId: line.productId, quantity: (old?.quantity ?? 0n) + amount.minor });
      }
      const positions = [...cells.values()].sort((a, b) => (a.locationId + ':' + a.productId).localeCompare(b.locationId + ':' + b.productId));
      await lockResources(context, positions.map(p => ({ kind: 'stock', id: p.locationId, warehouseId, productId: p.productId })));
      const entries = [];
      for (const p of positions) {
        const unit = products.get(p.productId)!.unit, amount = formatQuantity({ minor: p.quantity, unit });
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=physical+$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, p.locationId, p.productId, amount]);
        entries.push({ warehouseId, locationId: p.locationId, productId: p.productId, kind: 'receipt', physicalDelta: amount, reservedDelta: '0', transitDelta: '0' });
      }
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'inventory', id: warehouseId }]);
      const balances = [];
      for (const p of positions)
        balances.push(await positionBalance(context, warehouseId, p.locationId, p.productId));
      return { historyId: stamp.reference, balances };
    }, { roles: ['admin', 'supervisor', 'operator'] });
  }
  async move(headers: CommandHeaders, input: MoveInput) {
    const warehouseId = entityId(input.warehouseId), lines = input.lines.map(line => ({ productId: entityId(line.productId), sourceLocationId: entityId(line.sourceLocationId), targetLocationId: entityId(line.targetLocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    if (lines.some(line => line.sourceLocationId === line.targetLocationId))
      throw new DomainError('SAME_LOCATION', 'El origen y destino deben ser distintos.');
    return this.identity.command(headers, 'inventory.internal-move', { warehouseId, lines }, async (context, stamp) => {
      await lockResources(context, [{ kind: 'warehouse', id: warehouseId }]);
      await findWarehouse(context, warehouseId);
      const locationIds = [...new Set(lines.flatMap(line => [line.sourceLocationId, line.targetLocationId]))], productIds = [...new Set(lines.map(line => line.productId))];
      await lockResources(context, [...locationIds.map(id => ({ kind: 'location' as const, id, warehouseId })), ...productIds.map(id => ({ kind: 'product' as const, id }))]);
      for (const id of locationIds)
        await requireEnabledLocation(context, id, warehouseId);
      const products = new Map<string, Awaited<ReturnType<typeof findProduct>>>();
      for (const id of productIds)
        products.set(id, await findProduct(context, id));
      const cells = new Map<string, {
        locationId: string;
        productId: string;
        incoming: bigint;
        outgoing: bigint;
      }>();
      for (const line of lines) {
        const amount = operationQuantity(line.quantity, products.get(line.productId)!.unit).minor;
        for (const [locationId, side] of [[line.sourceLocationId, 'outgoing'], [line.targetLocationId, 'incoming']] as const) {
          const key = locationId + ':' + line.productId, p = cells.get(key) ?? { locationId, productId: line.productId, incoming: 0n, outgoing: 0n };
          p[side] += amount;
          cells.set(key, p);
        }
      }
      const positions = [...cells.values()].sort((a, b) => (a.locationId + ':' + a.productId).localeCompare(b.locationId + ':' + b.productId));
      await lockResources(context, positions.map(p => ({ kind: 'stock', id: p.locationId, warehouseId, productId: p.productId })));
      for (const p of positions) {
        const balance = await positionBalance(context, warehouseId, p.locationId, p.productId), unit = products.get(p.productId)!.unit;
        if (p.outgoing > parseQuantity(balance.available, unit, 'nonnegative').minor)
          throw new DomainError('INSUFFICIENT_AVAILABLE', 'El origen no tiene cantidad disponible no reservada suficiente.');
      }
      const entries = [];
      // Validate aggregated outgoing quantities first. Record both physical legs
      // so a position touched in both directions still advances its revision.
      for (const side of ['outgoing', 'incoming'] as const)
        for (const p of positions) {
          if (p[side] === 0n)
            continue;
          const unit = products.get(p.productId)!.unit, delta = formatQuantity({ minor: p[side] * (side === 'outgoing' ? -1n : 1n), unit });
          await queryTenant(context, 'UPDATE app.stock_balances SET physical=physical+$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, p.locationId, p.productId, delta]);
          entries.push({ warehouseId, locationId: p.locationId, productId: p.productId, kind: 'internal-move', physicalDelta: delta, reservedDelta: '0', transitDelta: '0' });
        }
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'inventory', id: warehouseId }]);
      const balances = [];
      for (const p of positions)
        balances.push(await positionBalance(context, warehouseId, p.locationId, p.productId));
      return { historyId: stamp.reference, balances };
    }, { roles: ['admin', 'supervisor', 'operator'] });
  }
}
