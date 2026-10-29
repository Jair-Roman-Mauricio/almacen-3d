import { DomainError } from './domain-error.js';
import { validateQuantityInput } from './quantity-input.js';
export type UnitKind = 'piece' | 'box' | 'pallet' | 'weight' | 'volume' | 'length';
export interface Unit { readonly kind: UnitKind; readonly label: string }
export interface Quantity { readonly minor: bigint; readonly unit: Unit }
const kinds: readonly string[] = ['piece', 'box', 'pallet', 'weight', 'volume', 'length'];

export function quantityFromMinor(minor: bigint, unit: Unit): Quantity {
  if (!unit || !kinds.includes(unit.kind) || typeof unit.label !== 'string' || !unit.label.trim()) {
    throw new DomainError('INVALID_UNIT', 'La unidad base no es válida.');
  }
  return Object.freeze({ minor, unit: Object.freeze({ ...unit }) });
}
export function parseQuantity(value: unknown, unit: Unit, mode: 'positive' | 'nonnegative' = 'positive'): Quantity {
  const text = validateQuantityInput(value);
  const [whole = '0', fraction = ''] = text.replace(/^[+-]/u, '').split('.');
  if (fraction.length > 3 || (['piece', 'box', 'pallet'].includes(unit?.kind) && /[1-9]/u.test(fraction))) {
    throw new DomainError('UNIT_PRECISION', 'La cantidad excede la precisión admitida para su unidad.');
  }
  const minor = (BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))) * (text.startsWith('-') ? -1n : 1n);
  if (minor < 0n || (mode === 'positive' && minor === 0n)) {
    throw new DomainError('INVALID_QUANTITY', mode === 'positive' ? 'La cantidad debe ser positiva.' : 'La cantidad no puede ser negativa.');
  }
  return quantityFromMinor(minor, unit);
}
export function formatQuantity(value: Quantity): string {
  const absolute = value.minor < 0n ? -value.minor : value.minor;
  const fraction = (absolute % 1000n).toString().padStart(3, '0').replace(/0+$/u, '');
  return `${value.minor < 0n ? '-' : ''}${absolute / 1000n}${fraction ? '.' + fraction : ''}`;
}
export function assertSameUnit(a: Quantity, b: Quantity): void {
  if (a.unit.kind !== b.unit.kind || a.unit.label !== b.unit.label) {
    throw new DomainError('UNIT_MISMATCH', 'Las cantidades deben tener la misma unidad base.');
  }
}
export function addQuantity(a: Quantity, b: Quantity): Quantity {
  assertSameUnit(a, b);
  return quantityFromMinor(a.minor + b.minor, a.unit);
}
export function subtractQuantity(a: Quantity, b: Quantity): Quantity {
  assertSameUnit(a, b);
  return quantityFromMinor(a.minor - b.minor, a.unit);
}
