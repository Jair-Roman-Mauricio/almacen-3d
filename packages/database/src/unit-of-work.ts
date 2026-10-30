import type { Pool } from 'pg';
import { DomainError } from '@almacen/domain';
import { withTenantTransaction, queryTenant, type TenantContext } from './tenant-context.js';
export interface LockRequest {
  kind: 'permissions' | 'command' | 'warehouse' | 'order' | 'transfer' | 'count' | 'location' | 'product' | 'stock';
  id: string;
  warehouseId?: string;
  productId?: string;
  mode?: 'shared' | 'exclusive';
}
const phases = { permissions: 0, command: 1, warehouse: 2, order: 3, transfer: 3, count: 3, location: 4, product: 5, stock: 6 };
const states = new WeakMap<TenantContext, {
  phase: number;
  last: Map<number, string>;
  held: Map<string, string>;
}>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
function fail(message: string): never { throw new DomainError('LOCK_ORDER', message); }
export async function runUnitOfWork<T>(pool: Pool, tenantId: string, operation: (context: TenantContext) => Promise<T>, options: {
  permissions?: 'shared' | 'exclusive';
} = {}): Promise<T> {
  return withTenantTransaction(pool, tenantId, async (context) => {
    states.set(context, { phase: -1, last: new Map(), held: new Map() });
    try {
      await lockResources(context, [{ kind: 'permissions', id: context.tenantId, mode: options.permissions ?? 'shared' }]);
      return await operation(context);
    }
    finally {
      states.delete(context);
    }
  });
}
export async function lockResources(context: TenantContext, requests: readonly LockRequest[]): Promise<void> {
  const state = states.get(context);
  if (!state)
    fail('Los bloqueos requieren una unidad de trabajo activa.');
  const sorted = requests.map(item => {
    for (const value of [item.id, item.warehouseId, item.productId].filter(v => v !== undefined))
      if (!uuid.test(value!))
        fail('El recurso de bloqueo debe tener identificadores válidos.');
    const request = { ...item, id: item.id.toLowerCase(), ...(item.warehouseId ? { warehouseId: item.warehouseId.toLowerCase() } : {}), ...(item.productId ? { productId: item.productId.toLowerCase() } : {}) };
    const key = [request.kind, request.warehouseId ?? '', request.id, request.productId ?? ''].join(':');
    return { request, key, phase: phases[request.kind] };
  }).sort((a, b) => a.phase - b.phase || a.key.localeCompare(b.key, 'en'));
  for (const { request: r, key, phase } of sorted) {
    const mode = r.mode ?? (r.kind === 'permissions' || r.kind === 'warehouse' ? 'shared' : 'exclusive');
    const held = state.held.get(key);
    if (held) {
      if (held !== mode)
        fail('No se puede cambiar el modo de un bloqueo adquirido.');
      continue;
    }
    if (phase < state.phase || (state.last.has(phase) && key.localeCompare(state.last.get(phase)!, 'en') < 0))
      fail('Se intentó invertir el orden de bloqueos.');
    if (r.kind === 'permissions' && r.id !== context.tenantId)
      fail('La barrera debe pertenecer a la empresa de la transacción.');
    if (['permissions', 'command', 'warehouse'].includes(r.kind)) {
      const resource = r.kind === 'permissions' ? `wms:permissions:${context.tenantId}` : `wms:${r.kind}:${context.tenantId}:${r.id}`;
      const fn = mode === 'shared' ? 'pg_advisory_xact_lock_shared' : 'pg_advisory_xact_lock';
      await queryTenant(context, `SELECT ${fn}(hashtextextended($1,0))`, [resource]);
    }
    else {
      if (mode !== 'exclusive')
        fail('Los bloqueos de filas deben ser exclusivos.');
      let result;
      if (r.kind === 'order' || r.kind === 'location') {
        if (!r.warehouseId)
          fail('El bloqueo requiere almacén.');
        const table = r.kind === 'order' ? 'orders' : 'layout_elements';
        result = await queryTenant(context, `SELECT id FROM app.${table} WHERE tenant_id=$1 AND warehouse_id=$2 AND id=$3 ${r.kind === 'location' ? "AND type='location' AND removed_at IS NULL" : ''} FOR UPDATE`, [context.tenantId, r.warehouseId, r.id]);
      }
      else if (r.kind === 'stock') {
        if (!r.warehouseId || !r.productId)
          fail('La posición requiere almacén y producto.');
        if (!state.held.has(['location', r.warehouseId, r.id, ''].join(':')) || !state.held.has(['product', '', r.productId, ''].join(':')))
          fail('La posición requiere bloquear antes ubicación y producto.');
        await queryTenant(context, 'INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [context.tenantId, r.warehouseId, r.id, r.productId]);
        result = await queryTenant(context, 'SELECT location_id FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4 FOR UPDATE', [context.tenantId, r.warehouseId, r.id, r.productId]);
      }
      else {
        const table = { transfer: 'transfers', count: 'counts', product: 'products' }[r.kind as 'transfer' | 'count' | 'product'];
        result = await queryTenant(context, `SELECT id FROM app.${table} WHERE tenant_id=$1 AND id=$2 FOR UPDATE`, [context.tenantId, r.id]);
      }
      if (!result.rowCount)
        throw new DomainError('NOT_FOUND', 'No se encontró el recurso en la empresa actual.');
    }
    state.phase = phase;
    state.last.set(phase, key);
    state.held.set(key, mode);
  }
}
