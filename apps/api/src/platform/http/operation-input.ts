import { DomainError, type Dimensions, validateLayout } from '@almacen/domain';
import { ApiException } from './api-exception.js';
export function invalidInput(message = 'Revisa los datos enviados.'): never {
  throw new ApiException(400, { code: 'INVALID_INPUT', message, details: [] });
}
export function entityId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(value))
    invalidInput('El identificador no es válido.');
  return value.toLowerCase();
}
export function decimalText(value: unknown): string {
  if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/u.test(value))
    throw new DomainError('INVALID_DIMENSIONS', 'El valor debe ser una cadena decimal finita.');
  const [whole = '0', fraction = ''] = value.replace(/^[+-]/u, '').split('.');
  const integer = BigInt(whole).toString(), part = fraction.replace(/0+$/u, '');
  return `${value.startsWith('-') && (integer !== '0' || part) ? '-' : ''}${integer}${part ? '.' + part : ''}`;
}
export function dimensions(input: {
  width: unknown;
  height: unknown;
  depth: unknown;
}): Dimensions {
  const result = { width: decimalText(input.width), height: decimalText(input.height), depth: decimalText(input.depth) };
  validateLayout(result, []);
  return result;
}
export function revision(value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
    return String(value);
  if (typeof value === 'string' && /^\d+$/u.test(value))
    return BigInt(value).toString();
  invalidInput('La revisión no es válida.');
}
