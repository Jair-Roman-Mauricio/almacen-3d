import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedProduct, seedWarehouse, seedStock, seedCommand, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { withTenantTransaction, queryTenant } from '../../packages/database/dist/tenant-context.js';
let db: SchemaFixture; let identity: IdentitySeed; let productA: string; let warehouseA: Awaited<ReturnType<typeof seedWarehouse>>; let productB: string;
beforeAll(async () => {
  db=await createSchemaFixture(); identity=await seedIdentity(db.owner);
  productA=await seedProduct(db.owner,identity.tenant); productB=await seedProduct(db.owner,identity.otherTenant);
  warehouseA=await seedWarehouse(db.owner,identity.tenant); await seedStock(db.owner,identity.tenant,warehouseA.warehouse,warehouseA.location,productA);
  const reference=await seedCommand(db.owner,identity.tenant,identity.actor);
  await db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,product_id,warehouse_id,location_id,actor_id,kind,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,'receipt',100,0,0)",[identity.tenant,randomUUID(),reference,productA,warehouseA.warehouse,warehouseA.location,identity.actor]);
  await db.owner.query("INSERT INTO app.audit_events(tenant_id,id,operation_reference,actor_id,kind,entity_id,details) VALUES ($1,$2,$3,$4,'synthetic',$5,'{}')",[identity.tenant,randomUUID(),reference,identity.actor,productA]);
});
afterAll(async () => { if (db) await db.close(); });
describe('I-ISO/rls-sin-bypass', () => {
  it('sin contexto no muestra datos y con contexto limita SELECT/UPDATE/INSERT', async () => {
    expect((await db.app.query('SELECT id FROM app.products')).rows).toEqual([]);
    await withTenantTransaction(db.app,identity.tenant,async ctx => {
      expect((await queryTenant(ctx,'SELECT id FROM app.products')).rows).toEqual([{id:productA}]);
      expect((await queryTenant(ctx,'UPDATE app.products SET name=$1 WHERE id=$2',['Ajeno',productB])).rowCount).toBe(0);
      expect((await queryTenant(ctx,'UPDATE app.products SET name=$1 WHERE id=$2',['Propio',productA])).rowCount).toBe(1);
    });
    await expect(withTenantTransaction(db.app,identity.tenant,ctx => queryTenant(ctx,"INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,'INTRUSO','Intruso','piece','pieza')",[identity.otherTenant,randomUUID()]))).rejects.toMatchObject({code:'42501'});
  });
  it('permite actualizar físico propio y el trigger conserva su revisión con privilegios limitados', async () => {
    await withTenantTransaction(db.app,identity.tenant,async ctx => {
      const updated=await queryTenant(ctx,'UPDATE app.stock_balances SET physical=physical+1 WHERE product_id=$1 RETURNING physical::text,physical_revision::text',[productA]);
      expect(updated.rows).toEqual([{physical:'101',physical_revision:'1'}]);
    });
  });
  it('impide claves foráneas cruzadas incluso enviando IDs válidos de otra empresa', async () => {
    await expect(withTenantTransaction(db.app,identity.tenant,ctx => queryTenant(ctx,'INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)',[identity.tenant,warehouseA.warehouse,warehouseA.location,productB]))).rejects.toMatchObject({code:'23503'});
  });
  it('deniega UPDATE/DELETE de libro y auditoría, TRUNCATE y cambio de SKU', async () => {
    for (const table of ['inventory_entries','audit_events']) {
      for (const statement of [`UPDATE app.${table} SET kind='alterado'`, `DELETE FROM app.${table}`]) {
        await expect(withTenantTransaction(db.app,identity.tenant,ctx => queryTenant(ctx,statement))).rejects.toMatchObject({code:'42501'});
      }
    }
    await expect(db.app.query('TRUNCATE app.stock_balances')).rejects.toMatchObject({code:'42501'});
    await expect(withTenantTransaction(db.app,identity.tenant,ctx => queryTenant(ctx,"UPDATE app.products SET sku='OTRO' WHERE id=$1",[productA]))).rejects.toMatchObject({code:'42501'});
  });
  it('no permite desactivar RLS o asumir roles privilegiados', async () => {
    await expect(withTenantTransaction(db.app,identity.tenant,async ctx => { await queryTenant(ctx,'SET LOCAL row_security=off'); await queryTenant(ctx,'SELECT * FROM app.products'); })).rejects.toMatchObject({code:'42501'});
    await expect(db.app.query('SET ROLE alm_migrator')).rejects.toMatchObject({code:'42501'});
    await expect(db.app.query('SET ROLE alm_provision')).rejects.toMatchObject({code:'42501'});
  });
  it('reserva el alta global para provisión y su conexión no puede leer inventario', async () => {
    expect((await db.owner.query("SELECT has_table_privilege('alm_app','app.companies','INSERT') AS allowed")).rows[0].allowed).toBe(false);
    expect(db.provision).toBeDefined();
    await db.provision!.query("SELECT set_config('app.tenant_id',$1,false)",[identity.tenant]);
    await expect(db.provision!.query('SELECT * FROM app.products')).rejects.toMatchObject({code:'42501'});
  });
  it('cubre todas las tablas de empresa con RLS forzada y separa tres roles sin bypass', async () => {
    const tables=(await db.owner.query("SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='app' AND c.relkind='r' AND (c.relname='companies' OR EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='tenant_id'))")).rows;
    expect(tables).toHaveLength(24);
    expect(tables.some(table=>table.relname==='demo_accounts')).toBe(true);
    for (const table of tables) expect(table).toMatchObject({relrowsecurity:true,relforcerowsecurity:true,owner:'alm_migrator'});
    const roles=(await db.owner.query("SELECT rolname,rolsuper,rolbypassrls,rolcreaterole FROM pg_roles WHERE rolname IN ('alm_app','alm_migrator','alm_provision') ORDER BY rolname")).rows;
    expect(roles).toHaveLength(3);
    for (const role of roles) expect(role).toMatchObject({rolsuper:false,rolbypassrls:false,rolcreaterole:false});
    expect((await db.owner.query("SELECT has_table_privilege('alm_provision','app.products','SELECT') AS inventory")).rows[0].inventory).toBe(false);
  });
});
