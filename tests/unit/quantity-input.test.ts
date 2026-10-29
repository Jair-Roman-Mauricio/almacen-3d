import { describe, expect, it } from 'vitest';
import { validateQuantityInput } from '../../packages/domain/src/quantity-input.js';

describe('U-VAL/cantidad-presente-finita', () => {
  it.each([
    undefined, null, '', ' ', NaN, Infinity, -Infinity,
    'NaN', 'Infinity', '-Infinity', 'abc', '1e309', '1,25', true, {}, [], 12,
  ])('rechaza la entrada inválida %j', value => {
    expect(() => validateQuantityInput(value)).toThrow('cantidad');
  });

  it.each(['0', '12', '-12', '1.25', '900719925474099312345678901234.5'])('conserva el valor decimal exacto %s', value => {
    expect(validateQuantityInput(value)).toBe(value);
  });
});
