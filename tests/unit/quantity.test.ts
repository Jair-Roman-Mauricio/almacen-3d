import { describe, expect, it } from 'vitest';
import { parseQuantity, formatQuantity, type Unit } from '../../packages/domain/src/quantity.js';
const piece: Unit = { kind: 'piece', label: 'pieza' };
const kg: Unit = { kind: 'weight', label: 'kg' };
describe('U-VAL/precision-unidades', () => {
  it.each(['piece', 'box', 'pallet'] as const)('conserva enteros exactos en %s', kind => {
    const value = parseQuantity('900719925474099312345678901', { kind, label: kind });
    expect(value.minor).toBe(900719925474099312345678901000n);
    expect(formatQuantity(value)).toBe('900719925474099312345678901');
    expect(() => parseQuantity('1.001', { kind, label: kind })).toThrow();
  });
  it.each(['weight', 'volume', 'length'] as const)('admite tres decimales sin redondear en %s', kind => {
    const value = parseQuantity('9007199254740993.123', { kind, label: kind });
    expect(value.minor).toBe(9007199254740993123n);
    expect(formatQuantity(value)).toBe('9007199254740993.123');
    expect(() => parseQuantity('1.2345', { kind, label: kind })).toThrow();
    expect(() => parseQuantity('1.0000', { kind, label: kind })).toThrow();
  });
  it('permite cero para conteo/umbral y conserva unidad base', () => {
    expect(parseQuantity('0', kg, 'nonnegative')).toEqual({ minor: 0n, unit: kg });
    expect(parseQuantity('0001.200', kg)).toEqual({ minor: 1200n, unit: kg });
    expect(formatQuantity(parseQuantity('+0001.200', kg))).toBe('1.2');
    expect(formatQuantity(parseQuantity('1.000', piece))).toBe('1');
  });
  it.each([undefined, null, '', ' ', 'NaN', 'Infinity', '-Infinity', '1e3', '1,5', 1, NaN, Infinity, '1.', '.1', ' 1'])('rechaza forma inválida %s', value => {
    expect(() => parseQuantity(value, kg)).toThrow();
  });
  it.each(['0', '-0', '-1', '-0.001'])('rechaza operaciones no positivas %s', value => {
    expect(() => parseQuantity(value, kg)).toThrow();
  });
  it('rechaza negativos de conteos y unidades desconocidas', () => {
    expect(() => parseQuantity('-1', kg, 'nonnegative')).toThrow();
    expect(() => parseQuantity('1', { kind: 'other', label: '?' } as unknown as Unit)).toThrow();
  });
});
