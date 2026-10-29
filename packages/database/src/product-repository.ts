import { queryTenant, type TenantContext } from './tenant-context.js';
export interface StoredProduct { id: string; sku: string; name: string; unit_kind: string; unit_label: string }
export class ProductRepository {
  constructor(private readonly context: TenantContext) {}
  async findById(id: string): Promise<StoredProduct | null> {
    const result = await queryTenant<StoredProduct>(this.context,
      'SELECT id,sku,name,unit_kind,unit_label FROM app.products WHERE tenant_id=$1 AND id=$2 AND removed_at IS NULL',
      [this.context.tenantId,id]);
    return result.rows[0] ?? null;
  }
}
