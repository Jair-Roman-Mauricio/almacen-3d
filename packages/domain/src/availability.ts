import { DomainError } from './domain-error.js';
import { assertSameUnit, quantityFromMinor, type Quantity, type Unit } from './quantity.js';
export interface StockPosition { readonly warehouseId: string; readonly productId: string; readonly locationId: string; readonly physical: Quantity; readonly reserved: Quantity; readonly blocked: boolean }
export interface StockScope { readonly warehouseId: string; readonly productId: string; readonly unit: Unit }
export interface StockTotals { readonly physical: Quantity; readonly reserved: Quantity; readonly available: Quantity }
export interface LowStockAlert { readonly warehouseId: string; readonly productId: string; readonly available: Quantity; readonly threshold: Quantity }
export function positionAvailability(stock: StockPosition): StockPosition & { available: Quantity } {
  assertSameUnit(stock.physical, stock.reserved);
  if (stock.physical.minor < 0n || stock.reserved.minor < 0n || stock.reserved.minor > stock.physical.minor) {
    throw new DomainError('INVALID_STOCK_BALANCE', 'Las existencias deben ser no negativas y cubrir la reserva vigente.');
  }
  return { ...stock, available: quantityFromMinor(stock.blocked ? 0n : stock.physical.minor - stock.reserved.minor, stock.physical.unit) };
}
export function stockTotals(stocks: readonly StockPosition[], scope: StockScope): StockTotals {
  let physical = 0n;
  let reserved = 0n;
  let available = 0n;
  const locations = new Set<string>();
  const zero = quantityFromMinor(0n, scope.unit);
  for (const stock of stocks) {
    if (stock.warehouseId !== scope.warehouseId || stock.productId !== scope.productId) continue;
    if (locations.has(stock.locationId)) throw new DomainError('DUPLICATE_STOCK_POSITION', 'La misma posición de inventario no puede sumarse dos veces.');
    locations.add(stock.locationId);
    const position = positionAvailability(stock);
    assertSameUnit(zero, position.physical);
    physical += position.physical.minor;
    reserved += position.reserved.minor;
    available += position.available.minor;
  }
  return { physical: quantityFromMinor(physical, scope.unit), reserved: quantityFromMinor(reserved, scope.unit), available: quantityFromMinor(available, scope.unit) };
}
export function deriveLowStockAlert(stocks: readonly StockPosition[], scope: StockScope, threshold?: Quantity | null): LowStockAlert | null {
  const totals = stockTotals(stocks, scope);
  if (threshold === undefined || threshold === null) return null;
  assertSameUnit(totals.available, threshold);
  if (threshold.minor < 0n) throw new DomainError('INVALID_THRESHOLD', 'El umbral no puede ser negativo.');
  if (totals.available.minor >= threshold.minor) return null;
  return { warehouseId: scope.warehouseId, productId: scope.productId, available: totals.available, threshold };
}
