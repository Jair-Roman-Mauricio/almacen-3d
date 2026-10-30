import type { TenantContext } from '@almacen/database';
import { invalidInput } from './operation-input.js';
export function pageInput(context: TenantContext, query: Record<string, unknown>, allowed: readonly string[], resource: string) {
  if (Object.keys(query).some(key => !['cursor', 'limit', ...allowed].includes(key)))
    invalidInput('Hay filtros no admitidos.');
  const filters: Record<string, string> = {};
  for (const key of allowed) {
    if (query[key] !== undefined) {
      if (typeof query[key] !== 'string')
        invalidInput('El filtro no es válido.');
      filters[key] = query[key].trim().normalize('NFC');
    }
  }
  const scope = JSON.stringify({ resource, filters });
  let after = '';
  if (query.cursor !== undefined) {
    if (typeof query.cursor !== 'string' || query.cursor.length > 8192)
      invalidInput('El cursor no es válido.');
    try {
      const value = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as Record<string, unknown>;
      if (value.version !== 1 || value.tenant !== context.tenantId || value.scope !== scope || typeof value.after !== 'string')
        invalidInput('El cursor pertenece a otra consulta.');
      after = value.after;
    }
    catch {
      invalidInput('El cursor no es válido.');
    }
  }
  const limit = query.limit === undefined ? 50 : typeof query.limit === 'string' && /^[1-9]\d*$/u.test(query.limit) ? Number(query.limit) : NaN;
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit >= 2147483647)
    invalidInput('El tamaño de página no es válido.');
  return { filters, after, limit, finish<T>(rows: readonly T[], key: (row: T) => string) {
      const data = rows.slice(0, limit), last = data.at(-1);
      return { data, page: { nextCursor: rows.length > limit && last ? Buffer.from(JSON.stringify({ version: 1, tenant: context.tenantId, scope, after: key(last) })).toString('base64url') : null } };
    } };
}
