import { DomainError } from './domain-error.js';
import { assertSameUnit, quantityFromMinor, type Quantity } from './quantity.js';
export interface Allocation { readonly id: string; readonly locationId: string; readonly reserved: Quantity; readonly preparedPending: Quantity }
export interface OrderLine { readonly productId: string; readonly requested: Quantity; readonly dispatched: Quantity; readonly allocations: readonly Allocation[] }
export interface LineChange { readonly line: OrderLine; readonly physicalDelta: Quantity; readonly reservedDelta: Quantity; readonly preparedDelta: Quantity }
function invalid(code: string, message: string): never { throw new DomainError(code, message); }
export function lineBalances(line: OrderLine): { pending: Quantity; pendingReserve: Quantity; reserved: Quantity; preparedPending: Quantity; allocations: (Allocation & { pendingPrepare: Quantity })[] } {
  const q = (minor: bigint) => quantityFromMinor(minor, line.requested.unit);
  assertSameUnit(line.requested, line.dispatched);
  if (line.requested.minor <= 0n || line.dispatched.minor < 0n || line.dispatched.minor > line.requested.minor) invalid('INVALID_ORDER_BALANCE', 'El saldo del pedido no es válido.');
  const ids = new Set<string>();
  const locations = new Set<string>();
  let reserved = 0n;
  let prepared = 0n;
  const allocations = line.allocations.map(allocation => {
    assertSameUnit(line.requested, allocation.reserved);
    assertSameUnit(line.requested, allocation.preparedPending);
    if (!allocation.id || !allocation.locationId || ids.has(allocation.id) || locations.has(allocation.locationId) || allocation.reserved.minor < 0n || allocation.preparedPending.minor < 0n || allocation.preparedPending.minor > allocation.reserved.minor) invalid('INVALID_ORDER_BALANCE', 'La asignación contiene un saldo o identidad inválidos.');
    ids.add(allocation.id); locations.add(allocation.locationId);
    reserved += allocation.reserved.minor;
    prepared += allocation.preparedPending.minor;
    return { ...allocation, pendingPrepare: q(allocation.reserved.minor - allocation.preparedPending.minor) };
  });
  const pending = line.requested.minor - line.dispatched.minor;
  if (reserved > pending) invalid('ORDER_BALANCE_EXCEEDED', 'La reserva supera el saldo pendiente de la línea.');
  return { pending: q(pending), pendingReserve: q(pending - reserved), reserved: q(reserved), preparedPending: q(prepared), allocations };
}
function positive(line: OrderLine, quantity: Quantity): void {
  assertSameUnit(line.requested, quantity);
  if (quantity.minor <= 0n) invalid('INVALID_QUANTITY', 'La cantidad debe ser positiva.');
}
function result(line: OrderLine, physical: bigint, reserved: bigint, prepared: bigint): LineChange {
  lineBalances(line);
  const q = (minor: bigint) => quantityFromMinor(minor, line.requested.unit);
  return { line, physicalDelta: q(physical), reservedDelta: q(reserved), preparedDelta: q(prepared) };
}
export function reserveLine(line: OrderLine, allocation: { id: string; locationId: string }, quantity: Quantity, available: Quantity): LineChange {
  const balance = lineBalances(line);
  positive(line, quantity);
  assertSameUnit(line.requested, available);
  if (quantity.minor > balance.pendingReserve.minor) invalid('ORDER_BALANCE_EXCEEDED', 'La reserva supera el pendiente de reservar.');
  if (quantity.minor > available.minor) invalid('INSUFFICIENT_AVAILABLE', 'No hay cantidad disponible suficiente.');
  const existing = line.allocations.find(item => item.id === allocation.id);
  if (existing && existing.locationId !== allocation.locationId) invalid('INVALID_ALLOCATION', 'La asignación no pertenece a la ubicación indicada.');
  const updated: Allocation = { ...allocation, reserved: quantityFromMinor((existing?.reserved.minor ?? 0n) + quantity.minor, line.requested.unit), preparedPending: existing?.preparedPending ?? quantityFromMinor(0n, line.requested.unit) };
  const allocations = existing ? line.allocations.map(item => item.id === allocation.id ? updated : item) : [...line.allocations, updated];
  return result({ ...line, allocations }, 0n, quantity.minor, 0n);
}
function allocationFor(line: OrderLine, id: string, quantity: Quantity): Allocation {
  lineBalances(line);
  positive(line, quantity);
  const allocation = line.allocations.find(item => item.id === id);
  if (!allocation) invalid('INVALID_ALLOCATION', 'La asignación no pertenece a la línea.');
  return allocation;
}
export function prepareLine(line: OrderLine, id: string, quantity: Quantity): LineChange {
  const allocation = allocationFor(line, id, quantity);
  if (quantity.minor > allocation.reserved.minor - allocation.preparedPending.minor) invalid('PREPARATION_BALANCE_EXCEEDED', 'La preparación supera la reserva pendiente de preparar.');
  return result({ ...line, allocations: line.allocations.map(item => item.id === id ? { ...item, preparedPending: quantityFromMinor(item.preparedPending.minor + quantity.minor, line.requested.unit) } : item) }, 0n, 0n, quantity.minor);
}
export function dispatchLine(line: OrderLine, id: string, quantity: Quantity): LineChange {
  const allocation = allocationFor(line, id, quantity);
  if (quantity.minor > allocation.preparedPending.minor) invalid('PREPARED_BALANCE_EXCEEDED', 'El despacho supera la preparación pendiente de esa ubicación.');
  const allocations = line.allocations.map(item => item.id === id ? { ...item, reserved: quantityFromMinor(item.reserved.minor - quantity.minor, line.requested.unit), preparedPending: quantityFromMinor(item.preparedPending.minor - quantity.minor, line.requested.unit) } : item);
  return result({ ...line, allocations, dispatched: quantityFromMinor(line.dispatched.minor + quantity.minor, line.requested.unit) }, -quantity.minor, -quantity.minor, -quantity.minor);
}
