import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { runMigrations } from '../../packages/database/dist/migrate.js';
import { assertTestDatabaseTarget } from '../../packages/database/dist/test-target.js';
export interface SchemaFixture { owner: pg.Pool; app: pg.Pool; provision: pg.Pool | undefined; close(): Promise<void> }
export async function createSchemaFixture(options: { appMax?: number; provisionMax?: number } = {}): Promise<SchemaFixture> {
  const testUrl = process.env.TEST_MIGRATION_URL!;
  assertTestDatabaseTarget(testUrl, process.env.DATABASE_MIGRATION_URL!);
  if (!process.env.PG_TEST_BOOTSTRAP_PASSWORD) throw new Error('Falta la credencial local de bootstrap de pruebas.');
  const bootstrapUrl = new URL(testUrl);
  bootstrapUrl.username = 'alm_bootstrap'; bootstrapUrl.password = process.env.PG_TEST_BOOTSTRAP_PASSWORD;
  const bootstrap = new pg.Pool({ connectionString: bootstrapUrl.toString(), max: 1 });
  const name = `phase2_${randomUUID().replaceAll('-', '')}_test`;
  const ownerUrl = new URL(testUrl); ownerUrl.pathname = '/' + name;
  const appUrl = new URL(process.env.TEST_DATABASE_URL!); appUrl.pathname = '/' + name;
  await bootstrap.query(`CREATE DATABASE "${name}" OWNER alm_migrator`);
  const owner = new pg.Pool({ connectionString: ownerUrl.toString(), max: 1 });
  const app = new pg.Pool({ connectionString: appUrl.toString(), max: options.appMax ?? 1 });
  const provisionUrl = process.env.TEST_PROVISION_URL ? new URL(process.env.TEST_PROVISION_URL) : undefined;
  if (provisionUrl) provisionUrl.pathname = '/' + name;
  const provision = provisionUrl ? new pg.Pool({connectionString:provisionUrl.toString(),max:options.provisionMax??1}) : undefined;
  async function close(): Promise<void> {
    await app.end(); await provision?.end(); await owner.end();
    try {
      // Pool.end closes sockets; wait for PostgreSQL to observe their exit.
      let idle=false;
      for(let attempt=0;attempt<100;attempt++){
        const count=(await bootstrap.query('SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=$1',[name])).rows[0].n;
        if(count===0){idle=true;break;}await new Promise(done=>setTimeout(done,5));
      }
      if(!idle)throw new Error('La base temporal conserva conexiones; no se fuerza su terminación.');
      await bootstrap.query(`DROP DATABASE "${name}"`);
    }
    finally { await bootstrap.end(); }
  }
  try { await runMigrations(ownerUrl.toString()); }
  catch (error) { await close(); throw error; }
  return { owner, app, provision, close };
}
export async function seedIdentity(owner: pg.Pool) {
  const tenant = randomUUID(); const otherTenant = randomUUID(); const actor = randomUUID(); const otherActor = randomUUID();
  await owner.query('INSERT INTO app.companies(id,code,name) VALUES ($1,$2,$3),($4,$5,$3)', [tenant, 'A-' + tenant, 'Empresa sintética', otherTenant, 'B-' + otherTenant]);
  await owner.query("INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES ($1,$2,'Admin','admin@example.test','synthetic-hash','admin'),($3,$4,'Admin','admin@example.test','synthetic-hash','admin')", [tenant, actor, otherTenant, otherActor]);
  return { tenant, otherTenant, actor, otherActor };
}
export type IdentitySeed = Awaited<ReturnType<typeof seedIdentity>>;
export async function seedWarehouse(owner: pg.Pool, tenant: string) {
  const warehouse = randomUUID(); const zone = randomUUID(); const location = randomUUID();
  await owner.query("INSERT INTO app.warehouses(tenant_id,id,code,name,width,height,depth) VALUES ($1,$2,$3,'Central',100,100,100)", [tenant, warehouse, 'W-' + warehouse]);
  await owner.query("INSERT INTO app.layout_elements(tenant_id,warehouse_id,id,type,code,name,width,height,depth) VALUES ($1,$2,$3,'zone','Z','Zona',50,50,50)", [tenant, warehouse, zone]);
  await owner.query("INSERT INTO app.layout_elements(tenant_id,warehouse_id,id,type,parent_id,parent_type,code,name,width,height,depth) VALUES ($1,$2,$3,'location',$4,'zone','U/1','Ubicación',1,1,1)", [tenant, warehouse, location, zone]);
  return { warehouse, zone, location };
}
export async function seedProduct(owner: pg.Pool, tenant: string) {
  const product = randomUUID();
  await owner.query("INSERT INTO app.products(tenant_id,id,sku,name,unit_kind,unit_label) VALUES ($1,$2,$3,'Motor','piece','pieza')", [tenant, product, 'P-' + product]);
  return product;
}
export async function seedStock(owner: pg.Pool, tenant: string, warehouse: string, location: string, product: string) {
  await owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id,physical) VALUES ($1,$2,$3,$4,100)',[tenant,warehouse,location,product]);
}
export async function seedOrder(owner: pg.Pool, tenant: string, warehouse: string, product: string) {
  const order = randomUUID(); const line = randomUUID();
  await owner.query("INSERT INTO app.orders(tenant_id,warehouse_id,id,code) VALUES ($1,$2,$3,$4)",[tenant,warehouse,order,'O-'+order]);
  await owner.query('INSERT INTO app.order_lines(tenant_id,warehouse_id,order_id,id,product_id,requested) VALUES ($1,$2,$3,$4,$5,100)',[tenant,warehouse,order,line,product]);
  return { order, line };
}
export async function seedTransfer(owner: pg.Pool, tenant: string, source: string, target: string, location: string, product: string) {
  const transfer = randomUUID(); const line = randomUUID();
  await owner.query('INSERT INTO app.transfers(tenant_id,id,code,source_warehouse_id,target_warehouse_id) VALUES ($1,$2,$3,$4,$5)',[tenant,transfer,'T-'+transfer,source,target]);
  await owner.query('INSERT INTO app.transfer_lines(tenant_id,transfer_id,id,source_warehouse_id,target_warehouse_id,source_location_id,product_id,declared) VALUES ($1,$2,$3,$4,$5,$6,$7,20)',[tenant,transfer,line,source,target,location,product]);
  return { transfer, line };
}
export async function seedCount(owner: pg.Pool, seed: IdentitySeed, warehouse: string, location: string, product: string) {
  const count = randomUUID(); const reference = await seedCommand(owner, seed.tenant, seed.actor);
  await owner.query('INSERT INTO app.counts(tenant_id,id,warehouse_id,location_id,product_id,observed,reference_physical,reference_revision,actor_id,operation_reference) VALUES ($1,$2,$3,$4,$5,0,100,0,$6,$7)',[seed.tenant,count,warehouse,location,product,seed.actor,reference]);
  return count;
}
export async function seedCommand(owner: pg.Pool, tenant: string, actor: string, reference = randomUUID()) {
  await owner.query("INSERT INTO app.commands(tenant_id,reference,operation_type,data_hash,actor_id,state,result,confirmed_at) VALUES ($1,$2,'synthetic',$3,$4,'confirmed',$5,current_timestamp)",[tenant,reference,'a'.repeat(64),actor,JSON.stringify({synthetic:true})]);
  return reference;
}
