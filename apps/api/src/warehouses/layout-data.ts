import { queryTenant, type TenantContext } from '@almacen/database';
import { decimalText } from '../platform/http/operation-input.js';
export const elementColumns = 'id,type,parent_id,code,name,x::text,y::text,z::text,width::text,height::text,depth::text,blocked';
export function elementDto(row: Record<string, unknown>) {
  return { id: row.id as string, type: row.type as string, parentId: row.parent_id as string | null, code: row.code as string, name: row.name as string, position: { x: decimalText(row.x), y: decimalText(row.y), z: decimalText(row.z) }, dimensions: { width: decimalText(row.width), height: decimalText(row.height), depth: decimalText(row.depth) }, blocked: row.blocked as boolean };
}
export async function layoutElements(context: TenantContext, warehouse: string) {
  return (await queryTenant(context, `SELECT ${elementColumns} FROM app.layout_elements WHERE tenant_id=$1 AND warehouse_id=$2 AND removed_at IS NULL ORDER BY id`, [context.tenantId, warehouse])).rows.map(elementDto);
}
