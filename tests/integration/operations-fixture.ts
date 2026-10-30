import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApplication } from '../../apps/api/dist/create-application.js';
import { PasswordService } from '../../apps/api/dist/identity/password-service.js';
import { createSchemaFixture, seedIdentity } from './schema-fixture.js';
export interface Access {
  cookie: string;
  csrf: string;
  tenant: string;
  actor: string;
}
export const origin = 'http://localhost:3000';
export async function operationsFixture(appMax = 4) {
  const db = await createSchemaFixture({ appMax });
  const seed = await seedIdentity(db.owner);
  const hash = await new PasswordService().hash('fixture');
  await db.owner.query('UPDATE app.users SET password_hash=$1', [hash]);
  const app = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', origin });
  await app.init();
  const server = app.getHttpServer();
  async function login(tenant: string, actor: string, email = 'admin@example.test'): Promise<Access> {
    const code = (await db.owner.query('SELECT code FROM app.companies WHERE id=$1', [tenant])).rows[0].code;
    const response = await request(server).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: code, email, password: 'fixture' }).expect(200);
    return { tenant, actor, cookie: String(response.headers['set-cookie']).split(';')[0]!, csrf: response.body.data.csrfToken };
  }
  const admin = await login(seed.tenant, seed.actor), other = await login(seed.otherTenant, seed.otherActor);
  const roles = new Map<string, Access>();
  async function role(role: 'supervisor' | 'operator') {
    const cached = roles.get(role);
    if (cached)
      return cached;
    const actor = randomUUID(), email = role + '@example.test';
    await db.owner.query('INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5,$3)', [admin.tenant, actor, role, email, hash]);
    const access = await login(admin.tenant, actor, email);
    roles.set(role, access);
    return access;
  }
  function mutate(who: Access, method: 'post' | 'patch' | 'put' | 'delete', path: string, body?: object | string, reference = randomUUID()) {
    const test = request(server)[method]('/api/v1' + path).set('Origin', origin).set('Content-Type', 'application/json').set('Cookie', who.cookie).set('X-CSRF-Token', who.csrf).set('Idempotency-Key', reference);
    return body === undefined ? test : test.send(body);
  }
  function get(who: Access, path: string) {
    return request(server).get('/api/v1' + path).set('Cookie', who.cookie);
  }
  return { db, app, server, admin, other, role, mutate, get, close: async () => {
      await app.close();
      await db.close();
    } };
}
export type OperationsFixture = Awaited<ReturnType<typeof operationsFixture>>;
export const warehouseInput = (code = 'CENTRAL') => ({ code, name: 'Central', dimensions: { width: '100', height: '10', depth: '50' } });
export const productInput = (sku = 'MOTOR', kind = 'piece') => ({ sku, name: 'Motor', unit: { kind, label: kind === 'piece' ? 'pieza' : 'kg' } });
export function simpleLayout() {
  const zone = randomUUID(), a = randomUUID(), b = randomUUID();
  const element = (id: string, type: string, parentId: string | null, code: string, x: string, width: string) => ({ id, type, parentId, code, name: code, position: { x, y: '0', z: '0' }, dimensions: { width, height: '2', depth: '2' }, blocked: false });
  return { zone, a, b, elements: [element(zone, 'zone', null, 'Z', '0', '20'), element(a, 'location', zone, 'A/1', '0', '2'), element(b, 'location', zone, 'A/2', '2', '2')] };
}
