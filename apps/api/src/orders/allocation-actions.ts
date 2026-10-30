import { lockResources, type TenantContext } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import { findProduct } from '../catalogue/catalogue-service.js';
import { requireEnabledLocation, findLocation } from '../inventory/stock-data.js';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import type { LoadedOrder } from './order-data.js';
export function allocationRequests(order: LoadedOrder, lines: readonly {
  allocationId: string;
  quantity: string;
}[]) {
  const requests = new Map<string, {
    id: string;
    lineId: string;
    productId: string;
    locationId: string;
    quantity: bigint;
    unit: LoadedOrder['lines'][number]['product']['unit'];
  }>();
  for (const item of lines) {
    const line = order.lines.find(line => line.model.allocations.some(a => a.id === item.allocationId)), allocation = line?.model.allocations.find(a => a.id === item.allocationId);
    if (!line || !allocation)
      throw new DomainError('NOT_FOUND', 'La asignación de stock no pertenece al pedido.');
    const previous = requests.get(allocation.id), quantity = operationQuantity(item.quantity, line.product.unit).minor;
    requests.set(allocation.id, { id: allocation.id, lineId: line.id, productId: line.product.id, locationId: allocation.locationId, quantity: (previous?.quantity ?? 0n) + quantity, unit: line.product.unit });
  }
  return [...requests.values()];
}
export async function lockAllocationPositions(context: TenantContext, warehouseId: string, requests: readonly {
  locationId: string;
  productId: string;
}[], enabled = true) {
  const locations = [...new Set(requests.map(r => r.locationId))], products = [...new Set(requests.map(r => r.productId))];
  await lockResources(context, [...locations.map(id => ({ kind: 'location' as const, id, warehouseId })), ...products.map(id => ({ kind: 'product' as const, id }))]);
  for (const id of locations)
    await (enabled ? requireEnabledLocation(context, id, warehouseId) : findLocation(context, id, warehouseId));
  for (const id of products)
    await findProduct(context, id);
  const positions = new Map(requests.map(r => [r.locationId + ':' + r.productId, { locationId: r.locationId, productId: r.productId }]));
  await lockResources(context, [...positions.values()].map(p => ({ kind: 'stock', id: p.locationId, warehouseId, productId: p.productId })));
  return positions;
}
