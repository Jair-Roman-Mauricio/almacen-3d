import { queryTenant, type TenantContext } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import type { layoutElements } from './layout-data.js';
type Element = Awaited<ReturnType<typeof layoutElements>>[number];
export async function assertLayoutChanges(context: TenantContext, warehouse: string, previous: readonly Element[], proposal: readonly Element[]): Promise<void> {
  const old = new Map(previous.map(e => [e.id, e])), next = new Map(proposal.map(e => [e.id, e])), children = new Map<string, string[]>();
  for (const e of previous)
    if (e.parentId)
      children.set(e.parentId, [...(children.get(e.parentId) ?? []), e.id]);
  const geometry = (e: Element) => JSON.stringify({ parentId: e.parentId, position: e.position, dimensions: e.dimensions });
  const depth = (e: Element) => {
    let count = 0, parent = e.parentId;
    while (parent) {
      count++;
      parent = old.get(parent)?.parentId ?? null;
    }
    return count;
  };
  const changed = previous.filter(e => !next.has(e.id) || geometry(e) !== geometry(next.get(e.id)!)).sort((a, b) => depth(a) - depth(b) || a.id.localeCompare(b.id));
  const affected = changed.map(element => {
    const locations = new Set<string>(), pending = [element.id];
    while (pending.length) {
      const id = pending.pop()!;
      if (old.get(id)?.type === 'location')
        locations.add(id);
      pending.push(...(children.get(id) ?? []));
    }
    return { element, locations };
  });
  const ids = [...new Set(affected.flatMap(item => [...item.locations]))];
  if (!ids.length)
    return;
  const physical = (await queryTenant(context, 'SELECT location_id FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=ANY($3::uuid[]) AND (physical>0 OR reserved>0) LIMIT 1', [context.tenantId, warehouse, ids])).rows[0];
  const open = physical ? null : (await queryTenant(context, `SELECT location_id FROM app.allocations WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=ANY($3::uuid[]) AND (reserved>0 OR prepared_pending>0)
  UNION ALL SELECT source_location_id FROM app.transfer_lines WHERE tenant_id=$1 AND source_warehouse_id=$2 AND source_location_id=ANY($3::uuid[]) AND departed=0
  UNION ALL SELECT location_id FROM app.counts WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=ANY($3::uuid[]) AND NOT adjusted LIMIT 1`, [context.tenantId, warehouse, ids])).rows[0];
  const location = (physical ?? open)?.location_id as string | undefined;
  if (location) {
    const root = affected.find(item => item.locations.has(location))!.element;
    throw new DomainError(physical ? 'ELEMENT_OCCUPIED' : 'OPEN_WORK', physical ? 'El elemento o un descendiente conserva existencias.' : 'El elemento o un descendiente conserva trabajo pendiente.', { elementId: root.id, field: next.has(root.id) ? 'position/dimensions' : 'removed', locationId: location });
  }
}
