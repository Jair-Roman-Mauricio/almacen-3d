import { describe, expect, it } from 'vitest';
import { parseQuantity as parse, type Quantity, type Unit } from '../../packages/domain/src/quantity.js';
import { lineBalances, reserveLine, prepareLine, dispatchLine, type OrderLine } from '../../packages/domain/src/order-line.js';
const unit: Unit = { kind: 'piece', label: 'pieza' };
const q = (value: string): Quantity => parse(value, unit, 'nonnegative');
const line = (): OrderLine => ({ productId: 'motor', requested: q('100'), dispatched: q('0'), allocations: [] });
const at = { id: 'a', locationId: 'A/1' };
describe('U-BAL/saldos-linea', () => {
  it('reserva/prepara/despacha 40 de 100 y consume solo sus reservas/preparación', () => {
    const initial = line();
    const reserved = reserveLine(initial, at, q('40'), q('100'));
    expect(reserved.physicalDelta.minor).toBe(0n);
    expect(reserved.reservedDelta).toEqual(q('40'));
    expect(lineBalances(reserved.line)).toMatchObject({ pending: q('100'), pendingReserve: q('60'), reserved: q('40'), preparedPending: q('0') });
    const prepared = prepareLine(reserved.line, 'a', q('40'));
    expect(prepared.physicalDelta.minor).toBe(0n);
    const dispatched = dispatchLine(prepared.line, 'a', q('40'));
    expect(dispatched.physicalDelta.minor).toBe(-40000n);
    expect(dispatched.reservedDelta.minor).toBe(-40000n);
    expect(lineBalances(dispatched.line)).toMatchObject({ pending: q('60'), pendingReserve: q('60'), reserved: q('0'), preparedPending: q('0') });
    expect(initial).toEqual(line());
  });
  it('completa 100 mediante despachos de 40 y 60 sin reutilizar saldos consumidos', () => {
    let current = line();
    for (const amount of ['40', '60']) {
      current = reserveLine(current, at, q(amount), q('100')).line;
      current = prepareLine(current, 'a', q(amount)).line;
      current = dispatchLine(current, 'a', q(amount)).line;
    }
    expect(lineBalances(current)).toMatchObject({ pending: q('0'), pendingReserve: q('0'), reserved: q('0'), preparedPending: q('0') });
    expect(current.dispatched).toEqual(q('100'));
    expect(() => reserveLine(current, at, q('1'), q('1000'))).toThrow();
    expect(() => dispatchLine(current, 'a', q('1'))).toThrow();
  });
  it('preserva el resto preparado y reservado en un despacho parcial', () => {
    const a = reserveLine(line(), at, q('100'), q('100')).line;
    const b = prepareLine(a, 'a', q('70')).line;
    const c = dispatchLine(b, 'a', q('40')).line;
    expect(lineBalances(c)).toMatchObject({ pending: q('60'), pendingReserve: q('0'), reserved: q('60'), preparedPending: q('30') });
    expect(lineBalances(c).allocations[0]!.pendingPrepare).toEqual(q('30'));
  });
  it('calcula por asignación y no usa la preparación de otra ubicación', () => {
    const a = reserveLine(line(), at, q('40'), q('100')).line;
    const b = reserveLine(a, { id: 'b', locationId: 'B/1' }, q('60'), q('100')).line;
    const c = prepareLine(b, 'a', q('40')).line;
    expect(lineBalances(c).allocations.map(item => item.pendingPrepare.minor)).toEqual([0n, 60000n]);
    expect(() => dispatchLine(c, 'b', q('1'))).toThrow();
  });
  it('limita reserva por pendiente de línea aunque sobre inventario', () => {
    const a = reserveLine(line(), at, q('40'), q('1000')).line;
    expect(() => reserveLine(a, at, q('61'), q('1000'))).toThrow();
    expect(() => reserveLine(line(), at, q('40'), q('39'))).toThrow();
  });
  it('rechaza preparar más que la reserva y despachar más que lo preparado', () => {
    const a = reserveLine(line(), at, q('40'), q('100')).line;
    expect(() => prepareLine(a, 'a', q('41'))).toThrow();
    expect(() => dispatchLine(prepareLine(a, 'a', q('20')).line, 'a', q('21'))).toThrow();
    expect(() => prepareLine(a, 'ajena', q('1'))).toThrow();
  });
  it('mantiene precisión y etiqueta de unidad base', () => {
    const kg: Unit = { kind: 'weight', label: 'kg' };
    const k = (value: string) => parse(value, kg, 'nonnegative');
    const a: OrderLine = { ...line(), requested: k('1.001'), dispatched: k('0') };
    const b = reserveLine(a, at, k('0.999'), k('2')).line;
    expect(lineBalances(b).pendingReserve).toEqual(k('0.002'));
    expect(() => reserveLine(a, at, q('1'), q('2'))).toThrow();
    expect(() => reserveLine(a, at, parse('1', { kind: 'weight', label: 'g' }), k('2'))).toThrow();
  });
  it('rechaza cero, estado inconsistente y cambio de ubicación de una asignación', () => {
    expect(() => reserveLine(line(), at, q('0'), q('100'))).toThrow();
    expect(() => lineBalances({ ...line(), dispatched: q('101') })).toThrow();
    const a = reserveLine(line(), at, q('1'), q('100')).line;
    expect(() => reserveLine(a, { ...at, locationId: 'otra' }, q('1'), q('100'))).toThrow();
  });
});
