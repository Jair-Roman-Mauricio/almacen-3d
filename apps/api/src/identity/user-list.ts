import { queryTenant, type TenantContext } from '@almacen/database';
import { ApiException } from '../platform/http/api-exception.js';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu;
function invalid(): never { throw new ApiException(400, { code: 'INVALID_INPUT', message: 'Los filtros o el cursor no son válidos.', details: [] }); }
export async function listUsers(context: TenantContext, query: Record<string, unknown>) {
  if (Object.keys(query).some(key => !['q', 'limit', 'cursor'].includes(key)))
    invalid();
  const q = query.q ?? '';
  if (typeof q !== 'string')
    invalid();
  const text = q.trim().normalize('NFC').toLowerCase();
  let after: string | null = null;
  if (query.cursor !== undefined) {
    if (typeof query.cursor !== 'string' || query.cursor.length > 4096)
      invalid();
    try {
      const parsed = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as Record<string, unknown>;
      if (parsed.tenant !== context.tenantId || parsed.q !== text || parsed.version !== 1 || typeof parsed.id !== 'string' || !uuid.test(parsed.id))
        invalid();
      after = parsed.id;
    }
    catch {
      invalid();
    }
  }
  const limit = query.limit === undefined ? 50 : typeof query.limit === 'string' && /^[1-9][0-9]*$/u.test(query.limit) ? Number(query.limit) : NaN;
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit >= 2147483647)
    invalid();
  const rows = (await queryTenant(context, `SELECT id,name,email,role,active FROM app.users WHERE tenant_id=$1 AND ($2::uuid IS NULL OR id>$2) AND (strpos(lower(name),$3)>0 OR strpos(email_key,$3)>0) ORDER BY id LIMIT $4`, [context.tenantId, after, text, limit + 1])).rows;
  const more = rows.length > limit;
  const data = rows.slice(0, limit);
  const last = data.at(-1);
  return { data, page: { nextCursor: more && last ? Buffer.from(JSON.stringify({ version: 1, tenant: context.tenantId, q: text, id: last.id })).toString('base64url') : null } };
}
