import { DomainError } from './domain-error.js';
function trimmed(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new DomainError(code, 'El campo debe contener texto no vacío.');
  return value.trim();
}
export function normalizeName(value: unknown): string {
  const name = trimmed(value, 'INVALID_NAME');
  if ([...name].length > 160) throw new DomainError('INVALID_NAME', 'El nombre no puede superar 160 caracteres.');
  return name;
}
export function normalizeCode(value: unknown): { value: string; key: string } {
  const code = trimmed(value, 'INVALID_CODE').normalize('NFC');
  if ([...code].length > 64 || !/^[\p{L}\p{N}\-_./]+$/u.test(code)) {
    throw new DomainError('INVALID_CODE', 'El código admite hasta 64 letras, números, guion, guion bajo, punto o barra.');
  }
  return { value: code, key: code.toUpperCase().normalize('NFC') };
}
export function normalizeEmail(value: unknown): string {
  const email = trimmed(value, 'INVALID_EMAIL').normalize('NFC').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/u.test(email)) throw new DomainError('INVALID_EMAIL', 'El correo no es válido.');
  return email;
}
