import { expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createSchemaFixture } from './schema-fixture.js';
import { createApplication } from '../../apps/api/dist/create-application.js';
import { seedDemo } from '../../apps/api/dist/demo/seed-demo.js';
import { demoAccounts, publicDemoAccount } from '../../apps/api/dist/demo/manifest.js';
it('I-ACC/demo-manifiesto solo publica cuentas identificadas como demo y respeta modalidad local', async () => {
  const db = await createSchemaFixture();
  const apps: Awaited<ReturnType<typeof createApplication>>[] = [];
  try {
    const normal = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'local', demoMode: false, origin: 'http://localhost:3000' });
    apps.push(normal);
    await normal.init();
    await request(normal.getHttpServer()).get('/api/v1/public/demo-access').expect(404);
    const demo = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'local', demoMode: true, origin: 'http://localhost:3000' });
    apps.push(demo);
    await demo.init();
    await request(demo.getHttpServer()).get('/api/v1/public/demo-access').expect(404);
    await seedDemo({ appPool: db.app, provisionPool: db.provision!, mode: 'local', demoMode: true, origin: 'http://localhost:3000' });
    const manifest = await request(demo.getHttpServer()).get('/api/v1/public/demo-access').expect(200);
    expect(manifest.body.data).toEqual({ synthetic: true, accounts: demoAccounts.filter(a => a.companyCode === 'DEMO-ROBOTICA').map(publicDemoAccount) });
    const account = manifest.body.data.accounts[0], login = await request(demo.getHttpServer()).post('/api/v1/sessions').set('Origin', 'http://localhost:3000').send({ companyCode: account.companyCode, email: account.email, password: account.password }).expect(200);
    await request(demo.getHttpServer()).post('/api/v1/users').set('Origin', 'http://localhost:3000').set('Cookie', String(login.headers['set-cookie']).split(';')[0]!).set('X-CSRF-Token', login.body.data.csrfToken).set('Idempotency-Key', randomUUID()).send({ name: 'Cuenta fuera del manifiesto', email: 'privada@example.test', password: 'Dato-local-No-Publicar', role: 'supervisor' }).expect(201);
    const after = await request(demo.getHttpServer()).get('/api/v1/public/demo-access').expect(200);
    expect(after.body).toEqual(manifest.body);
    expect(JSON.stringify(after.body)).not.toMatch(/privada|Dato-local-No-Publicar|password_hash|tenant_id/u);
    expect((await request(demo.getHttpServer()).get('/api/v1/public/config').expect(200)).body.data).toEqual({ mode: 'local', demoMode: true, localSetupRequired: false });
    await request(normal.getHttpServer()).get('/api/v1/public/demo-access').expect(404);
    expect((await db.owner.query('SELECT count(*)::int n FROM app.companies')).rows[0].n).toBe(1);
    await expect(db.app.query('SELECT * FROM app.demo_seed')).rejects.toMatchObject({ code: '42501' });
    await expect(db.app.query("SELECT app.initialize_demo('local','x')")).rejects.toMatchObject({ code: '42501' });
  }
  finally {
    for (const app of apps)
      await app.close();
    await db.close();
  }
}, 30000);
