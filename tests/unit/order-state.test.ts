import { describe, expect, it } from 'vitest';
import { parseQuantity as parse, type Unit } from '../../packages/domain/src/quantity.js';
import { type OrderLine } from '../../packages/domain/src/order-line.js';
import { deriveOrderState } from '../../packages/domain/src/order-state.js';
function line(productId: string, unit: Unit, requested: string, dispatched: string, reserved = '0', prepared = '0'): OrderLine {
  const q = (value: string) => parse(value, unit, 'nonnegative');
  return { productId, requested: q(requested), dispatched: q(dispatched), allocations: [{ id: productId, locationId: 'loc', reserved: q(reserved), preparedPending: q(prepared) }] };
}
const pieces: Unit = { kind: 'piece', label: 'pieza' };
const kg: Unit = { kind: 'weight', label: 'kg' };
describe('U-BAL/estado-pedido', () => {
  it('permanece pendiente aunque esté totalmente reservado/preparado', () => {
    expect(deriveOrderState([line('motor', pieces, '100', '0', '100', '40')])).toEqual({ status: 'pending', cancelable: false });
  });
  it('es parcial si una línea está completa y otra de unidad distinta pendiente', () => {
    expect(deriveOrderState([line('motor', pieces, '100', '100'), line('aceite', kg, '0.001', '0')])).toEqual({ status: 'partially_dispatched', cancelable: false });
  });
  it('es completo solo si todas las líneas de diferentes unidades están completas', () => {
    expect(deriveOrderState([line('motor', pieces, '100', '100'), line('aceite', kg, '1.001', '1.001')])).toEqual({ status: 'dispatched', cancelable: false });
  });
  it('mantiene el estado parcial del ejemplo 100/40 y no cancela sus 60 pendientes', () => {
    const input = [line('motor', pieces, '100', '40')];
    expect(deriveOrderState(input)).toEqual({ status: 'partially_dispatched', cancelable: false });
    expect(input[0]!.requested.minor - input[0]!.dispatched.minor).toBe(60000n);
  });
  it('permite cancelar antes de preparar o despachar, conservando reservas hasta confirmación', () => {
    const input = [line('motor', pieces, '100', '0', '40')];
    expect(deriveOrderState(input)).toEqual({ status: 'pending', cancelable: true });
    expect(input[0]!.allocations[0]!.reserved.minor).toBe(40000n);
    expect(() => deriveOrderState(input, true)).toThrow();
    expect(deriveOrderState([line('motor', pieces, '100', '0')], true)).toEqual({ status: 'cancelled', cancelable: false });
  });
  it('rechaza cancelado con preparación/despacho y pedido sin líneas', () => {
    expect(() => deriveOrderState([line('motor', pieces, '1', '0', '1', '1')], true)).toThrow();
    expect(() => deriveOrderState([line('motor', pieces, '1', '1')], true)).toThrow();
    expect(() => deriveOrderState([])).toThrow();
  });
});
