import { describe, expect, it } from 'vitest';
import { parseQuantity as parse, quantityFromMinor, type Unit } from '../../packages/domain/src/quantity.js';
import { positionAvailability, stockTotals, deriveLowStockAlert, type StockPosition, type StockScope } from '../../packages/domain/src/availability.js';
const unit: Unit = { kind: 'piece', label: 'pieza' };
const q = (value: string) => parse(value, unit, 'nonnegative');
const scope: StockScope = { warehouseId: 'central', productId: 'motor', unit };
const stock = (physical = '10', reserved = '0', blocked = false): StockPosition => ({ ...scope, locationId: 'A/1', physical: q(physical), reserved: q(reserved), blocked });
describe('U-BAL/disponibilidad-alerta', () => {
  it('deriva físico menos reservado y conserva compromisos al bloquear', () => {
    const initial = stock('100', '40');
    expect(positionAvailability(initial).available).toEqual(q('60'));
    expect(positionAvailability({ ...initial, blocked: true })).toMatchObject({ physical: q('100'), reserved: q('40'), available: q('0') });
    expect(initial.reserved).toEqual(q('40'));
    expect(positionAvailability(initial).available).toEqual(q('60'));
  });
  it.each([['5', false], ['10', false], ['15', true]])('con disponible 10, umbral %s produce alerta %s', (threshold, active) => {
    const alert = deriveLowStockAlert([stock()], scope, q(threshold));
    if (active) expect(alert).toEqual({ warehouseId: 'central', productId: 'motor', available: q('10'), threshold: q(threshold) });
    else expect(alert).toBeNull();
  });
  it('no genera alerta sin umbral, admite umbral cero y la retira al recuperarse', () => {
    expect(deriveLowStockAlert([stock('0')], scope)).toBeNull();
    expect(deriveLowStockAlert([stock('0')], scope, null)).toBeNull();
    expect(deriveLowStockAlert([stock('0')], scope, q('0'))).toBeNull();
    expect(deriveLowStockAlert([stock('4')], scope, q('5'))).not.toBeNull();
    expect(deriveLowStockAlert([stock('5')], scope, q('5'))).toBeNull();
    expect(deriveLowStockAlert([stock('99')], scope, q('5'))).toBeNull();
  });
  it('agrega solo el producto/almacén y excluye bloqueadas de disponible, no del físico', () => {
    const positions = [stock('100', '40', true), { ...stock('10', '4'), locationId: 'B/1' }, { ...stock('999'), warehouseId: 'otro' }, { ...stock('999'), productId: 'otro' }];
    expect(stockTotals(positions, scope)).toEqual({ physical: q('110'), reserved: q('44'), available: q('6') });
    expect(stockTotals([], scope)).toEqual({ physical: q('0'), reserved: q('0'), available: q('0') });
  });
  it('no incorpora el tránsito al stock reservable ni a los totales físicos', () => {
    const inTransit = { ...stock('0'), inTransit: q('100') };
    expect(stockTotals([inTransit], scope).available).toEqual(q('0'));
    expect(deriveLowStockAlert([inTransit], scope, q('1'))?.available).toEqual(q('0'));
  });
  it('mantiene exactitud decimal y rechaza mezcla de unidad base', () => {
    const kg: Unit = { kind: 'weight', label: 'kg' };
    const k = (value: string) => parse(value, kg, 'nonnegative');
    const position = { ...stock(), physical: k('0.003'), reserved: k('0.001') };
    expect(positionAvailability(position).available).toEqual(k('0.002'));
    expect(() => stockTotals([position], scope)).toThrow();
    expect(() => deriveLowStockAlert([stock()], scope, k('1'))).toThrow();
  });
  it('rechaza stock inconsistente, umbral negativo y posiciones duplicadas', () => {
    expect(() => positionAvailability(stock('1', '2'))).toThrow();
    expect(() => positionAvailability({ ...stock(), reserved: quantityFromMinor(-1n, unit) })).toThrow();
    expect(() => deriveLowStockAlert([stock()], scope, quantityFromMinor(-1n, unit))).toThrow();
    expect(() => stockTotals([stock(), stock()], scope)).toThrow();
  });
});
