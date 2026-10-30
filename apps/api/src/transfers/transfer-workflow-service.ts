import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { queryTenant, lockResources, appendInventoryEntries, appendChange, type TenantContext } from '@almacen/database';
import { DomainError, formatQuantity, parseQuantity, departTransferLine, receiveTransferLine } from '@almacen/domain';
import type { TransferDepartureInput, TransferReceiptInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import { requireEnabledLocation, positionBalance } from '../inventory/stock-data.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { lockTransfer, loadTransfer } from './transfer-data.js';
async function lockStagePositions(context: TenantContext, warehouseId: string, rows: readonly {
  locationId: string;
  productId: string;
}[]) {
  const locations = [...new Set(rows.map(row => row.locationId))], products = [...new Set(rows.map(row => row.productId))];
  await lockResources(context, [...locations.map(id => ({ kind: 'location' as const, id, warehouseId })), ...products.map(id => ({ kind: 'product' as const, id }))]);
  for (const id of locations)
    await requireEnabledLocation(context, id, warehouseId);
  for (const id of products)
    await findProduct(context, id);
  const positions = new Map(rows.map(row => [row.locationId + ':' + row.productId, { locationId: row.locationId, productId: row.productId }]));
  await lockResources(context, [...positions.values()].map(p => ({ kind: 'stock', id: p.locationId, warehouseId, productId: p.productId })));
  return positions;
}
@Injectable()
export class TransferWorkflowService {
  constructor(private readonly identity: IdentityService) {
  }
  async depart(headers: CommandHeaders, value: string, input: TransferDepartureInput) {
    const transferId = entityId(value), lines = input.lines.map(line => ({ transferLineId: entityId(line.transferLineId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    return this.identity.command(headers, 'transfer.depart', { transferId, lines }, async (context, stamp) => {
      const transfer = await lockTransfer(context, transferId);
      if (transfer.record.departureReference)
        throw new DomainError('ALREADY_DEPARTED', 'La salida del traslado ya fue confirmada.');
      const warehouseId = transfer.record.sourceWarehouseId;
      const amounts = new Map<string, bigint>();
      for (const item of lines) {
        const line = transfer.lines.find(line => line.id === item.transferLineId);
        if (!line)
          throw new DomainError('NOT_FOUND', 'La línea no pertenece a este traslado.');
        amounts.set(line.id, (amounts.get(line.id) ?? 0n) + operationQuantity(item.quantity, line.product.unit).minor);
      }
      if (amounts.size !== transfer.lines.length || transfer.lines.some(line => amounts.get(line.id) !== line.model.declared.minor))
        throw new DomainError('INVALID_TRANSFER', 'La salida debe confirmar todas las cantidades declaradas.', { field: 'lines' });
      const positions = await lockStagePositions(context, warehouseId, transfer.lines.map(line => ({ locationId: line.sourceLocationId, productId: line.product.id }))), available = new Map<string, bigint>();
      for (const [key, p] of positions) {
        const balance = await positionBalance(context, warehouseId, p.locationId, p.productId);
        available.set(key, parseQuantity(balance.available, balance.product.unit, 'nonnegative').minor);
      }
      for (const line of transfer.lines) {
        const key = line.sourceLocationId + ':' + line.product.id;
        departTransferLine(line.model, { minor: available.get(key)!, unit: line.product.unit });
        available.set(key, available.get(key)! - line.model.declared.minor);
      }
      const entries = [];
      for (const line of transfer.lines) {
        const amount = formatQuantity(line.model.declared), negative = formatQuantity({ minor: -line.model.declared.minor, unit: line.product.unit });
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=physical-$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, line.sourceLocationId, line.product.id, amount]);
        await queryTenant(context, 'UPDATE app.transfer_lines SET departed=declared WHERE tenant_id=$1 AND transfer_id=$2 AND id=$3', [context.tenantId, transferId, line.id]);
        entries.push({ warehouseId, locationId: line.sourceLocationId, productId: line.product.id, transferId, kind: 'transfer-departure', physicalDelta: negative, reservedDelta: '0', transitDelta: amount });
      }
      await queryTenant(context, 'UPDATE app.transfers SET departure_reference=$3,departed_at=$4 WHERE tenant_id=$1 AND id=$2', [context.tenantId, transferId, stamp.reference, stamp.occurredAt]);
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'transfers', id: transferId }, { kind: 'inventory', id: warehouseId }]);
      return { transfer: (await loadTransfer(context, transferId)).dto, historyId: stamp.reference };
    }, { roles: ['admin', 'supervisor'] });
  }
  async receive(headers: CommandHeaders, value: string, input: TransferReceiptInput) {
    const transferId = entityId(value), lines = input.lines.map(line => ({ transferLineId: entityId(line.transferLineId), targetLocationId: entityId(line.targetLocationId), quantity: formatQuantity(operationQuantity(line.quantity)) }));
    return this.identity.command(headers, 'transfer.receive', { transferId, lines }, async (context, stamp) => {
      const transfer = await lockTransfer(context, transferId);
      if (!transfer.record.departureReference)
        throw new DomainError('NOT_DEPARTED', 'No se puede recibir antes de confirmar la salida.');
      const warehouseId = transfer.record.targetWarehouseId;
      const pairs = new Map<string, {
        lineId: string;
        locationId: string;
        productId: string;
        quantity: bigint;
        unit: typeof transfer.lines[number]['product']['unit'];
      }>();
      for (const item of lines) {
        const line = transfer.lines.find(l => l.id === item.transferLineId);
        if (!line)
          throw new DomainError('NOT_FOUND', 'La línea no pertenece al traslado.');
        const key = line.id + ':' + item.targetLocationId, quantity = operationQuantity(item.quantity, line.product.unit).minor;
        pairs.set(key, { lineId: line.id, locationId: item.targetLocationId, productId: line.product.id, quantity: (pairs.get(key)?.quantity ?? 0n) + quantity, unit: line.product.unit });
      }
      const requests = [...pairs.values()], models = new Map(transfer.lines.map(line => [line.id, line.model]));
      for (const r of requests)
        models.set(r.lineId, receiveTransferLine(models.get(r.lineId)!, { minor: r.quantity, unit: r.unit }).line);
      await lockStagePositions(context, warehouseId, requests);
      const receiptId = randomUUID();
      await queryTenant(context, 'INSERT INTO app.transfer_receipts(tenant_id,id,transfer_id,operation_reference,actor_id,confirmed_at) VALUES ($1,$2,$3,$4,$5,$6)', [context.tenantId, receiptId, transferId, stamp.reference, stamp.actorId, stamp.occurredAt]);
      const entries = [];
      for (const r of requests) {
        const amount = formatQuantity({ minor: r.quantity, unit: r.unit });
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=physical+$5::numeric WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, warehouseId, r.locationId, r.productId, amount]);
        await queryTenant(context, 'INSERT INTO app.transfer_receipt_lines(tenant_id,receipt_id,transfer_id,line_id,product_id,target_warehouse_id,target_location_id,quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [context.tenantId, receiptId, transferId, r.lineId, r.productId, warehouseId, r.locationId, amount]);
        entries.push({ warehouseId, locationId: r.locationId, productId: r.productId, transferId, kind: 'transfer-receipt', physicalDelta: amount, reservedDelta: '0', transitDelta: formatQuantity({ minor: -r.quantity, unit: r.unit }) });
      }
      for (const lineId of new Set(requests.map(r => r.lineId)))
        await queryTenant(context, 'UPDATE app.transfer_lines SET received=$4 WHERE tenant_id=$1 AND transfer_id=$2 AND id=$3', [context.tenantId, transferId, lineId, formatQuantity(models.get(lineId)!.received)]);
      await appendInventoryEntries(context, stamp, entries);
      await appendChange(context, stamp, [{ kind: 'transfers', id: transferId }, { kind: 'inventory', id: warehouseId }]);
      return { transfer: (await loadTransfer(context, transferId)).dto, historyId: stamp.reference };
    }, { roles: ['admin', 'supervisor', 'operator'] });
  }
}
