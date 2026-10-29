import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedProduct, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { withTenantTransaction, queryTenant, type TenantContext } from '../../packages/database/dist/tenant-context.js';
import { ProductRepository } from '../../packages/database/dist/product-repository.js';
let db: SchemaFixture; let identity: IdentitySeed; let productA: string; let productB: string;
beforeAll(async () => {
  db = await createSchemaFixture(); identity = await seedIdentity(db.owner);
  productA = await seedProduct(db.owner,identity.tenant); productB = await seedProduct(db.owner,identity.otherTenant);
  await db.owner.query('GRANT SELECT ON app.products TO alm_app');
});
afterAll(async () => { if (db) await db.close(); });
describe('I-ISO/pool-contexto', () => {
  it('alterna dos empresas con el mismo backend y claves de repositorio acotadas', async () => {
    let pid: number | undefined;
    for (const [tenant, own, foreign] of [[identity.tenant,productA,productB],[identity.otherTenant,productB,productA],[identity.tenant,productA,productB]]) {
      await withTenantTransaction(db.app,tenant!,async context => {
        const current=(await queryTenant<{pid:number;tenant:string}>(context,"SELECT pg_backend_pid() AS pid, current_setting('app.tenant_id') AS tenant")).rows[0]!;
        if (pid !== undefined) expect(current.pid).toBe(pid);
        pid = current.pid; expect(current.tenant).toBe(tenant);
        const repository=new ProductRepository(context);
        expect(await repository.findById(own!)).toMatchObject({id:own});
        expect(await repository.findById(foreign!)).toBeNull();
      });
      expect((await db.app.query("SELECT nullif(current_setting('app.tenant_id',true),'') AS tenant")).rows[0].tenant).toBeNull();
    }
  });
  it('limpia contexto tras rollback y rechaza contexto ausente, forjado o expirado', async () => {
    let expired: TenantContext | undefined;
    await expect(withTenantTransaction(db.app,identity.tenant,async context => { expired=context; await queryTenant(context,'SELECT 1'); throw new Error('Fallo inyectado'); })).rejects.toThrow('Fallo inyectado');
    expect((await db.app.query("SELECT nullif(current_setting('app.tenant_id',true),'') AS tenant")).rows[0].tenant).toBeNull();
    await expect(withTenantTransaction(db.app,'',async () => 1)).rejects.toThrow();
    await expect(queryTenant({tenantId:identity.tenant},'SELECT 1')).rejects.toThrow();
    await expect(queryTenant(expired!,'SELECT 1')).rejects.toThrow();
  });
});
