import { expect, it } from 'vitest';
import request from 'supertest';
import { createSchemaFixture, seedIdentity } from './schema-fixture.js';
const path = '../../apps/api/dist/demo/seed-demo.js';
it('I-ACC/demo-seed crea empresas y tres roles, reconcilia y permite repetir sin reset', async () => {
  const db = await createSchemaFixture();
  try {
    const { seedDemo } = await import(path);
    await expect(seedDemo({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', demoMode: false })).rejects.toMatchObject({ code: 'DEMO_UNAVAILABLE' });
    const result = await seedDemo({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', demoMode: true, origin: 'http://localhost:3000' });
    expect(result.companies).toBe(2);
    expect(result.accounts).toBe(6);
    const quantities = (await db.owner.query("SELECT p.sku,sum(s.physical)::text physical,sum(s.reserved)::text reserved FROM app.stock_balances s JOIN app.products p ON(p.tenant_id,p.id)=(s.tenant_id,s.product_id) GROUP BY p.sku ORDER BY p.sku")).rows;
    expect(quantities).toEqual([{ sku: 'MOTOR-DEMO', physical: '154', reserved: '60' }, { sku: 'RESINA-DEMO', physical: '51.0', reserved: '0' }]);
    const reconciliation = (await db.owner.query('SELECT s.tenant_id,s.location_id,s.product_id FROM app.stock_balances s LEFT JOIN app.inventory_entries e ON(e.tenant_id,e.warehouse_id,e.location_id,e.product_id)=(s.tenant_id,s.warehouse_id,s.location_id,s.product_id) GROUP BY s.tenant_id,s.warehouse_id,s.location_id,s.product_id,s.physical,s.reserved HAVING s.physical<>coalesce(sum(e.physical_delta),0) OR s.reserved<>coalesce(sum(e.reserved_delta),0)')).rows;
    expect(reconciliation).toEqual([]);
    const transit = (await db.owner.query(`WITH ledger AS(SELECT tenant_id,transfer_id,product_id,sum(transit_delta) AS n FROM app.inventory_entries WHERE transfer_id IS NOT NULL GROUP BY tenant_id,transfer_id,product_id),lines AS(SELECT tenant_id,transfer_id,product_id,sum(departed-received) AS n FROM app.transfer_lines GROUP BY tenant_id,transfer_id,product_id) SELECT l.transfer_id FROM lines l LEFT JOIN ledger e USING(tenant_id,transfer_id,product_id) WHERE l.n<>coalesce(e.n,0)`)).rows;
    expect(transit).toEqual([]);
    const before = (await db.owner.query('SELECT count(*)::int n FROM app.inventory_entries')).rows[0].n;
    await seedDemo({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', demoMode: true, origin: 'http://localhost:3000' });
    expect((await db.owner.query('SELECT count(*)::int n FROM app.inventory_entries')).rows[0].n).toBe(before);
    const { demoAccounts } = await import('../../apps/api/dist/demo/manifest.js'), { createApplication } = await import('../../apps/api/dist/create-application.js');
    const app = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', demoMode: true, origin: 'http://localhost:3000' });
    await app.init();
    try {
      for (const account of demoAccounts)
        expect((await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', 'http://localhost:3000').send({ companyCode: account.companyCode, email: account.email, password: account.password }).expect(200)).body.data.user.role).toBe(account.role);
    }
    finally {
      await app.close();
    }
  }
  finally {
    await db.close();
  }
}, 30000);
it('I-ACC/demo-seed rechaza una instalación con datos que no son demo', async () => {
  const db = await createSchemaFixture();
  try {
    await seedIdentity(db.owner);
    const { seedDemo } = await import(path);
    await expect(seedDemo({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', demoMode: true })).rejects.toMatchObject({ code: 'DEMO_REQUIRES_EMPTY_DATABASE' });
    expect((await db.owner.query('SELECT count(*)::int n FROM app.companies')).rows[0].n).toBe(2);
  }
  finally {
    await db.close();
  }
});
