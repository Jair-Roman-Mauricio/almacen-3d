import { describe, expect, it } from 'vitest';
import { parseQuantity as parse, type Unit } from '../../packages/domain/src/quantity.js';
import { transferBalances, transferState, departTransferLine, receiveTransferLine, type TransferLine } from '../../packages/domain/src/transfer-line.js';
const unit: Unit = { kind: 'piece', label: 'pieza' };
const q = (value: string) => parse(value, unit, 'nonnegative');
const line = (): TransferLine => ({ productId: 'motor', declared: q('20'), departed: q('0'), received: q('0') });
describe('U-BAL/traslado-100-20', () => {
  it('conserva 100 durante salida, recepción parcial y total, con tránsito no reservable', () => {
    const initial = line();
    expect(transferState([initial])).toBe('registered');
    const departure = departTransferLine(initial, q('100'));
    const source = 100000n + departure.physicalDelta.minor;
    expect(source).toBe(80000n);
    expect(departure.transitDelta.minor).toBe(20000n);
    expect(transferBalances(departure.line)).toEqual({ inTransit: q('20'), available: q('0') });
    const partial = receiveTransferLine(departure.line, q('7'));
    expect(source + partial.physicalDelta.minor + transferBalances(partial.line).inTransit.minor).toBe(100000n);
    expect(transferState([partial.line])).toBe('in_transit');
    const final = receiveTransferLine(partial.line, q('13'));
    expect(source + partial.physicalDelta.minor + final.physicalDelta.minor + transferBalances(final.line).inTransit.minor).toBe(100000n);
    expect(final.transitDelta.minor).toBe(-13000n);
    expect(transferState([final.line])).toBe('received');
    expect(initial).toEqual(line());
  });
  it('rechaza recibir antes de salir, salir dos veces o recibir por encima del tránsito', () => {
    expect(() => receiveTransferLine(line(), q('1'))).toThrow();
    const departed = departTransferLine(line(), q('20')).line;
    expect(() => departTransferLine(departed, q('100'))).toThrow();
    expect(() => receiveTransferLine(departed, q('21'))).toThrow();
    expect(() => receiveTransferLine(departed, q('0'))).toThrow();
    expect(() => departTransferLine(line(), q('19'))).toThrow();
  });
  it('conserva cantidades decimales por producto y no mezcla unidades', () => {
    const kg: Unit = { kind: 'weight', label: 'kg' };
    const k = (value: string) => parse(value, kg, 'nonnegative');
    const other: TransferLine = { productId: 'aceite', declared: k('0.123'), departed: k('0'), received: k('0') };
    const a = departTransferLine(line(), q('20')).line;
    const b = departTransferLine(other, k('1')).line;
    expect(transferState([receiveTransferLine(a, q('20')).line, b])).toBe('in_transit');
    expect(transferBalances(receiveTransferLine(b, k('0.001')).line).inTransit).toEqual(k('0.122'));
    expect(() => receiveTransferLine(b, q('1'))).toThrow();
  });
  it('rechaza acumulados negativos, salidas parciales y estados inconsistentes', () => {
    expect(() => transferBalances({ ...line(), departed: q('19') })).toThrow();
    expect(() => transferBalances({ ...line(), received: q('1') })).toThrow();
    expect(() => transferState([])).toThrow();
    expect(() => transferState([line(), departTransferLine(line(), q('20')).line])).toThrow();
  });
});
