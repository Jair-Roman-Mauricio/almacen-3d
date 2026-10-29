export function validateQuantityInput(value: unknown): string {
  if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/u.test(value)) {
    throw new Error('La cantidad debe ser una cadena decimal presente y finita.');
  }
  return value;
}
