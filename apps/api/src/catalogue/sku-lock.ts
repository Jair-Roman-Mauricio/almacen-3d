import { queryTenant, type TenantContext } from '@almacen/database';
/** Serialize creation of the same normalized SKU before taking product rows. */
export async function lockSkuKeys(ctx: TenantContext, keys: readonly string[]) {
  for (const key of [...new Set(keys)].sort())
    await queryTenant(ctx, 'SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['wms:sku:' + ctx.tenantId + ':' + key]);
}
