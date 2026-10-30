import { timingSafeEqual } from 'node:crypto';
import { DomainError } from '@almacen/domain';
import { csrfToken, readSessionCookie } from './session-token.js';
export interface MutationHeaders {
  cookie?: string | undefined;
  origin?: string | undefined;
  csrf?: string | undefined;
  contentType?: string | undefined;
}
export function validateOrigin(expected: string, actual: string | undefined): void {
  let url: URL;
  try {
    url = new URL(expected);
  }
  catch {
    throw new DomainError('TEMPORARY_FAILURE', 'Configura un origen válido para la aplicación.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (expected !== url.origin || url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)))
    throw new DomainError('TEMPORARY_FAILURE', 'Configura HTTPS o un origen local de desarrollo.');
  if (actual !== expected)
    throw new DomainError('ORIGIN_INVALID', 'El origen de la solicitud no está autorizado.');
}
export function validateCsrf(cookie: string | undefined, value: string | undefined): void {
  const expected = csrfToken(readSessionCookie(cookie));
  if (!value || !/^[A-Za-z0-9_-]{43}$/u.test(value) || !timingSafeEqual(Buffer.from(expected), Buffer.from(value)))
    throw new DomainError('CSRF_INVALID', 'La protección de la sesión no es válida.');
}
