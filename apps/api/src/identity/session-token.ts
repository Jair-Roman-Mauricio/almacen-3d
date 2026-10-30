import { createHash, createHmac, randomBytes } from 'node:crypto';
import { DomainError } from '@almacen/domain';
export const sessionCookie = 'almacen_session';
export function newSessionToken(): string { return randomBytes(32).toString('base64url'); }
export function sessionHash(token: string): string { return createHash('sha256').update(token).digest('hex'); }
export function csrfToken(token: string): string { return createHmac('sha256', token).update('almacen:csrf:v1').digest('base64url'); }
export function readSessionCookie(cookie: string | undefined): string {
  const values = (cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith(`${sessionCookie}=`));
  const value = values[0]?.slice(sessionCookie.length + 1);
  if (values.length !== 1 || !value || !/^[A-Za-z0-9_-]{43}$/u.test(value))
    throw new DomainError('SESSION_INVALID', 'Inicia sesión para continuar.');
  return value;
}
