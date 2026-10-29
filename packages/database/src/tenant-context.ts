import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { withTransaction } from './transaction.js';
export interface TenantContext { readonly tenantId: string }
const clients = new WeakMap<TenantContext, PoolClient>();
export async function withTenantTransaction<T>(pool: Pool, tenantId: string, operation: (context: TenantContext) => Promise<T>): Promise<T> {
  if (typeof tenantId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(tenantId)) {
    throw new Error('Se requiere una empresa válida resuelta por el servidor.');
  }
  return withTransaction(pool, async client => {
    const context = Object.freeze({ tenantId: tenantId.toLowerCase() });
    clients.set(context, client);
    try {
      await client.query("SELECT set_config('app.tenant_id',$1,true)", [context.tenantId]);
      return await operation(context);
    } finally { clients.delete(context); }
  });
}
/** Internal SQL only; tenant identity always comes from the server transaction. */
export async function queryTenant<R extends QueryResultRow = QueryResultRow>(context: TenantContext, text: string, values: readonly unknown[] = []): Promise<QueryResult<R>> {
  const client = context && clients.get(context);
  if (!client) throw new Error('Se requiere un contexto activo de empresa; no se admiten contextos forjados o expirados.');
  return client.query<R>(text, [...values]);
}
