import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedWarehouse, seedProduct, seedStock, seedCommand, type SchemaFixture } from './schema-fixture.js';
let db: SchemaFixture;
beforeAll(async () => { db=await createSchemaFixture(); });
afterAll(async () => { if (db) await db.close(); });
interface Plan { 'Index Name'?: string; Plans?: Plan[] }
function indexNames(plan: Plan): string[] { return [...(plan['Index Name'] ? [plan['Index Name']] : []), ...(plan.Plans ?? []).flatMap(indexNames)]; }
describe('I-DB/indices-consultas', () => {
  it('identifica índices utilizables para SKU, ubicación, stock e historial y conserva cursores estables', async () => {
    const seed=await seedIdentity(db.owner); const w=await seedWarehouse(db.owner,seed.tenant); const product=await seedProduct(db.owner,seed.tenant); await seedStock(db.owner,seed.tenant,w.warehouse,w.location,product);
    const reference=await seedCommand(db.owner,seed.tenant,seed.actor);
    for (let i=0;i<3;i++) await db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,product_id,warehouse_id,location_id,actor_id,kind,occurred_at,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,'synthetic','2026-10-29T00:00:00Z',1,0,0)",[seed.tenant,randomUUID(),reference,product,w.warehouse,w.location,seed.actor]);
    const required=['stock_tenant_product','history_tenant_time','history_tenant_warehouse_time','history_tenant_product_time'];
    const definitions=(await db.owner.query('SELECT indexname,indexdef FROM pg_indexes WHERE schemaname=$1 AND indexname=ANY($2::text[]) ORDER BY indexname',['app',required])).rows;
    expect(definitions.map(row=>row.indexname).sort()).toEqual([...required].sort());
    for (const row of definitions) expect(row.indexdef).toContain('(tenant_id,');
    await db.owner.query('SET enable_seqscan=off');
    const queries = [
      {name:'SKU',sql:'SELECT id FROM app.products WHERE tenant_id=$1 AND sku_key=$2',values:[seed.tenant,('P-'+product).toUpperCase()]},
      {name:'Ubicación',sql:"SELECT id FROM app.layout_elements WHERE tenant_id=$1 AND warehouse_id=$2 AND type='location' AND code_key=$3",values:[seed.tenant,w.warehouse,'U/1']},
      {name:'Stock por producto',sql:'SELECT location_id,physical,reserved FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND product_id=$3 ORDER BY location_id LIMIT 50',values:[seed.tenant,w.warehouse,product]},
      {name:'Historial',sql:'SELECT id FROM app.inventory_entries WHERE tenant_id=$1 AND (occurred_at,id)>($2::timestamptz,$3::uuid) ORDER BY occurred_at,id LIMIT 2',values:[seed.tenant,'2026-10-28T00:00:00Z','00000000-0000-0000-0000-000000000000']},
    ];
    const reports=[];
    try {
      for (const query of queries) {
        const explain=(await db.owner.query('EXPLAIN (FORMAT JSON, COSTS OFF) '+query.sql,query.values)).rows[0]['QUERY PLAN'][0].Plan as Plan;
        const indexes=indexNames(explain); expect(indexes.length).toBeGreaterThan(0);
        reports.push({name:query.name,sql:query.sql,indexes,plan:explain});
      }
    } finally { await db.owner.query('RESET enable_seqscan'); }
    const first=(await db.owner.query('SELECT id,occurred_at FROM app.inventory_entries WHERE tenant_id=$1 ORDER BY occurred_at,id LIMIT 2',[seed.tenant])).rows;
    const last=first.at(-1)!;
    const next=(await db.owner.query('SELECT id FROM app.inventory_entries WHERE tenant_id=$1 AND (occurred_at,id)>($2,$3) ORDER BY occurred_at,id LIMIT 2',[seed.tenant,last.occurred_at,last.id])).rows;
    expect(new Set([...first,...next].map(row=>row.id)).size).toBe(3); expect(next).toHaveLength(1);
    await mkdir('output/queries',{recursive:true});
    await writeFile('output/queries/fase-02-indexes.json',JSON.stringify({diagnostic:'enable_seqscan=off; elegibilidad, no medición de rendimiento',reports,definitions},null,2)+'\n');
  });
});
