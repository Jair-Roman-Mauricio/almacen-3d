import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { waitForBlockedBy } from './concurrency-helpers.js';
import { createSchemaFixture, type SchemaFixture } from './schema-fixture.js';
import { createApplication } from '../../apps/api/dist/create-application.js';
let db: SchemaFixture;
let app: Awaited<ReturnType<typeof createApplication>>;
const origin = 'http://localhost:3000';
interface Access {
  cookie: string;
  csrf: string;
  userId: string;
  companyId: string;
}
async function login(code: string, email: string, password: string): Promise<Access> { const r = await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: code, email, password }).expect(200); return { cookie: String(r.headers['set-cookie']).split(';')[0]!, csrf: r.body.data.csrfToken, userId: r.body.data.user.id, companyId: r.body.data.company.id }; }
async function company(code: string): Promise<Access> { await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send({ company: { code, name: code }, administrator: { name: 'Admin', email: 'admin@example.test', password: 'clave exacta' } }).expect(201); return login(code, 'admin@example.test', 'clave exacta'); }
function postUser(access: Access, body: object, reference = randomUUID()) { return request(app.getHttpServer()).post('/api/v1/users').set('Origin', origin).set('Cookie', access.cookie).set('X-CSRF-Token', access.csrf).set('Idempotency-Key', reference).send(body); }
const userInput = (email: string, role = 'operator') => ({ name: 'Operario', email, password: '  clave  ', role });
beforeAll(async () => { db = await createSchemaFixture({ appMax: 4, provisionMax: 2 }); app = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', origin }); await app.init(); });
afterAll(async () => { await app?.close(); if (db)
  await db.close(); });
describe('I-ACC/alta-equipo', () => {
  it('crea y lista cuentas propias, valida campos/rol y conserva el resultado sin secretos', async () => {
    const admin = await company('TEAM');
    const body = userInput('worker@example.test');
    const reference = randomUUID();
    const first = await postUser(admin, body, reference).expect(201);
    expect(first.body.data).toMatchObject({ reference, status: 'confirmed', type: 'user.create', result: { email: body.email, role: 'operator', active: true } });
    expect(JSON.stringify(first.body)).not.toContain('password');
    expect(JSON.stringify(first.body)).not.toContain('argon2');
    const replay = await postUser(admin, body, reference).expect(201);
    expect(replay.body).toEqual(first.body);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    const changed = await postUser(admin, { ...body, password: 'diferente' }, reference).expect(409);
    expect(changed.body.error.code).toBe('REFERENCE_REUSED');
    expect((await postUser(admin, { ...body, email: ' WORKER@example.test ' }).expect(409)).body.error.code).toBe('EMAIL_EXISTS');
    expect((await postUser(admin, userInput('other@example.test', 'owner')).expect(422)).body.error.code).toBe('INVALID_ROLE');
    await postUser(admin, { ...userInput('new@example.test'), tenantId: randomUUID() }).expect(400);
    const page = await request(app.getHttpServer()).get('/api/v1/users?limit=1').set('Cookie', admin.cookie).expect(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.page.nextCursor).toEqual(expect.any(String));
    const next = await request(app.getHttpServer()).get('/api/v1/users').query({ limit: 1, cursor: page.body.page.nextCursor }).set('Cookie', admin.cookie).expect(200);
    expect(next.body.data).toHaveLength(1);
    expect(next.body.data[0].id).not.toBe(page.body.data[0].id);
    expect(next.body.page.nextCursor).toBeNull();
    await request(app.getHttpServer()).get('/api/v1/users').query({ q: 'otra', cursor: page.body.page.nextCursor }).set('Cookie', admin.cookie).expect(400);
    for (const role of ['operator', 'supervisor']) {
      const email = role + '@example.test';
      await postUser(admin, userInput(email, role)).expect(201);
      const other = await login('TEAM', email, '  clave  ');
      await postUser(other, userInput('denied@example.test')).expect(403);
      await request(app.getHttpServer()).get('/api/v1/users').set('Cookie', other.cookie).expect(403);
    }
    const records = (await db.owner.query('SELECT result::text AS result FROM app.commands WHERE tenant_id=$1', [admin.companyId])).rows;
    expect(records).toHaveLength(3);
    for (const record of records)
      expect(record.result).not.toMatch(/password|argon2/u);
    expect((await db.owner.query('SELECT count(*)::int n FROM app.audit_events WHERE tenant_id=$1', [admin.companyId])).rows[0].n).toBe(3);
  });
});
function patchUser(access: Access, id: string, body: object, reference = randomUUID()) { return request(app.getHttpServer()).patch('/api/v1/users/' + id).set('Origin', origin).set('Cookie', access.cookie).set('X-CSRF-Token', access.csrf).set('Idempotency-Key', reference).send(body); }
describe('I-ACC/cambio-permisos', () => {
  it('aplica nombre, rol y desactivación a sesiones ya abiertas sin alterar otras cuentas', async () => {
    const admin = await company('ROLES');
    const second = await postUser(admin, userInput('second@example.test', 'admin')).expect(201);
    const secondId = second.body.data.result.id;
    const open = await login('ROLES', 'second@example.test', '  clave  ');
    await patchUser(admin, secondId, { name: 'Nombre nuevo', role: 'operator' }).expect(200);
    expect((await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', open.cookie).expect(200)).body.data.user).toMatchObject({ id: secondId, name: 'Nombre nuevo', role: 'operator', active: true });
    await postUser(open, userInput('denied@example.test')).expect(403);
    await patchUser(admin, secondId, { active: false }).expect(200);
    await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', open.cookie).expect(401);
    await request(app.getHttpServer()).get('/api/v1/users').set('Cookie', admin.cookie).expect(200);
    expect((await patchUser(admin, secondId, { role: 'owner' }).expect(422)).body.error.code).toBe('INVALID_ROLE');
    await patchUser(admin, secondId, { active: 'false' }).expect(400);
    await patchUser(admin, randomUUID(), { name: 'Ajeno' }).expect(404);
    expect((await db.owner.query('SELECT name,role,active FROM app.users WHERE tenant_id=$1 AND id=$2', [admin.companyId, admin.userId])).rows[0]).toEqual({ name: 'Admin', role: 'admin', active: true });
  });
});
describe('I-ACC/ultimo-admin-concurrente', () => {
  it('impide desactivar o degradar el único administrador activo', async () => {
    const admin = await company('LAST');
    for (const change of [{ active: false }, { role: 'operator' }])
      expect((await patchUser(admin, admin.userId, change).expect(409)).body.error.code).toBe('LAST_ACTIVE_ADMIN');
    expect((await db.owner.query("SELECT count(*)::int n FROM app.users WHERE tenant_id=$1 AND active AND role='admin'", [admin.companyId])).rows[0].n).toBe(1);
  });
  it('serializa dos auto-degradaciones y confirma solo la que deja otro administrador', async () => {
    const admin = await company('LAST-RACE');
    await postUser(admin, userInput('second@example.test', 'admin')).expect(201);
    const second = await login('LAST-RACE', 'second@example.test', '  clave  ');
    const gate = await db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470049)');
    const pid = (await gate.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_role_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470049); RETURN NEW; END $$;CREATE TRIGGER pause_role_change BEFORE UPDATE ON app.users FOR EACH ROW EXECUTE FUNCTION app.pause_role_change()");
    const first = patchUser(admin, admin.userId, { role: 'operator' }).then(value => value);
    let next: Promise<Awaited<typeof first>> | undefined;
    try {
      const firstPid = await waitForBlockedBy(db.app, pid);
      next = patchUser(second, second.userId, { role: 'operator' }).then(value => value);
      await waitForBlockedBy(db.app, firstPid);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470049)');
      gate.release();
    }
    try {
      expect((await first).status).toBe(200);
      const rejected = await next!;
      expect(rejected.status).toBe(409);
      expect(rejected.body.error.code).toBe('LAST_ACTIVE_ADMIN');
    }
    finally {
      await db.owner.query('DROP TRIGGER pause_role_change ON app.users;DROP FUNCTION app.pause_role_change()');
    }
    expect((await db.owner.query("SELECT count(*)::int n FROM app.users WHERE tenant_id=$1 AND active AND role='admin'", [admin.companyId])).rows[0].n).toBe(1);
  });
});
function patchCompany(access: Access, body: object, reference = randomUUID()) { return request(app.getHttpServer()).patch('/api/v1/company').set('Origin', origin).set('Cookie', access.cookie).set('X-CSRF-Token', access.csrf).set('Idempotency-Key', reference).send(body); }
describe('I-ACC/perfil-empresa', () => {
  it('conserva código, aplica nombre y zona IANA y rechaza datos inválidos o roles ajenos', async () => {
    const admin = await company('PROFILE');
    const current = await request(app.getHttpServer()).get('/api/v1/company').set('Cookie', admin.cookie).expect(200);
    expect(current.body.data.timeZone).toBe('America/Lima');
    const reference = randomUUID();
    const body = { name: ' Nueva empresa ', timeZone: 'America/New_York' };
    const updated = await patchCompany(admin, body, reference).expect(200);
    expect(updated.body.data.result).toEqual({ id: admin.companyId, code: 'PROFILE', name: 'Nueva empresa', timeZone: 'America/New_York' });
    expect((await patchCompany(admin, body, reference).expect(200)).body).toEqual(updated.body);
    for (const invalid of [{ name: ' ' }, { timeZone: 'Zona/Inexistente' }, { timeZone: '+02:00' }])
      await patchCompany(admin, invalid).expect(422);
    await patchCompany(admin, { code: 'CHANGE' }).expect(400);
    expect((await request(app.getHttpServer()).get('/api/v1/company').set('Cookie', admin.cookie).expect(200)).body.data).toEqual(updated.body.data.result);
    await postUser(admin, userInput('reader@example.test')).expect(201);
    const reader = await login('PROFILE', 'reader@example.test', '  clave  ');
    await request(app.getHttpServer()).get('/api/v1/company').set('Cookie', reader.cookie).expect(200);
    await patchCompany(reader, { name: 'Denegado' }).expect(403);
    expect((await db.owner.query('SELECT name,time_zone FROM app.companies WHERE id=$1', [admin.companyId])).rows[0]).toEqual({ name: 'Nueva empresa', time_zone: 'America/New_York' });
  });
});
describe('I-CMD/consultar-resultado', () => {
  it('lee confirmaciones y pendientes sin efectos, sin acceso cruzado ni permisos antiguos', async () => {
    const admin = await company('RESULT-A'), other = await company('RESULT-B');
    const created = await postUser(admin, userInput('reader@example.test')).expect(201);
    const reference = created.body.data.reference;
    for (let i = 0; i < 2; i++) {
      const read = await request(app.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', admin.cookie).expect(200);
      expect(read.body).toEqual(created.body);
    }
    const restarted = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', origin });
    await restarted.init();
    try {
      expect((await request(restarted.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', admin.cookie).expect(200)).body).toEqual(created.body);
    }
    finally {
      await restarted.close();
    }
    expect((await request(app.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', other.cookie).expect(404)).body.error.code).toBe('RESULT_NOT_RECORDED');
    const reader = await login('RESULT-A', 'reader@example.test', '  clave  ');
    await request(app.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', reader.cookie).expect(403);
    const missing = await request(app.getHttpServer()).get('/api/v1/operations/' + randomUUID()).set('Cookie', admin.cookie).expect(404);
    expect(missing.body.error.code).toBe('RESULT_NOT_RECORDED');
    await request(app.getHttpServer()).get('/api/v1/operations/no-uuid').set('Cookie', admin.cookie).expect(400);
    const pending = randomUUID(), job = randomUUID();
    await db.owner.query("WITH c AS (INSERT INTO app.commands(tenant_id,reference,operation_type,data_hash,actor_id) VALUES ($1,$2,'import.apply',$3,$4) RETURNING tenant_id,reference,actor_id) INSERT INTO app.import_jobs(tenant_id,id,actor_id,kind,state,file_name,bytes,result_reference) SELECT tenant_id,$5,actor_id,'catalogue','applying','sintetico.csv',0,reference FROM c", [admin.companyId, pending, 'a'.repeat(64), admin.userId, job]);
    const response = await request(app.getHttpServer()).get('/api/v1/operations/' + pending).set('Cookie', admin.cookie).expect(202);
    expect(response.body).toEqual({ data: { reference: pending, status: 'pending', jobId: job } });
    expect((await db.owner.query('SELECT count(*)::int n FROM app.audit_events WHERE tenant_id=$1', [admin.companyId])).rows[0].n).toBe(1);
    await db.owner.query("UPDATE app.users SET role='operator' WHERE tenant_id=$1 AND id=$2", [admin.companyId, admin.userId]);
    await request(app.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', admin.cookie).expect(403);
    await db.owner.query('UPDATE app.users SET active=false WHERE tenant_id=$1 AND id=$2', [admin.companyId, admin.userId]);
    await request(app.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', admin.cookie).expect(401);
  });
});
describe('I-ISO/identidad-rutas', () => {
  it('aísla A/B con cookies reales, IDs y cuerpos manipulados y una única conexión reutilizada', async () => {
    const isolated = await createSchemaFixture({ appMax: 1 });
    const isolatedApp = await createApplication({ appPool: isolated.app, provisionPool: isolated.provision!, mode: 'saas', origin });
    await isolatedApp.init();
    const server = isolatedApp.getHttpServer();
    async function account(code: string) { const result = await request(server).post('/api/v1/registrations').set('Origin', origin).send({ company: { code, name: code }, administrator: { name: 'Admin ' + code, email: 'admin@example.test', password: code } }).expect(201); const auth = await request(server).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: code, email: 'admin@example.test', password: code }).expect(200); return { cookie: String(auth.headers['set-cookie']).split(';')[0]!, csrf: auth.body.data.csrfToken, userId: result.body.data.administrator.id, companyId: result.body.data.company.id }; }
    const mutation = (who: Access, path: string) => request(server).patch(path).set('Origin', origin).set('Cookie', who.cookie).set('X-CSRF-Token', who.csrf).set('Idempotency-Key', randomUUID());
    try {
      const a = await account('ISO-A'), b = await account('ISO-B');
      const pid = (await isolated.app.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      const created = await request(server).post('/api/v1/users').set('Origin', origin).set('Cookie', a.cookie).set('X-CSRF-Token', a.csrf).set('Idempotency-Key', randomUUID()).send(userInput('a@example.test')).expect(201);
      const before = await isolated.owner.query('SELECT tenant_id,id,name,role,active FROM app.users ORDER BY tenant_id,id');
      for (const [own, other] of [[a, b], [b, a]]) {
        await mutation(own!, '/api/v1/users/' + other!.userId).send({ name: 'Invadido' }).expect(404);
        await mutation(own!, '/api/v1/company').send({ name: 'Invadido', tenantId: other!.companyId }).expect(400);
        await mutation(own!, '/api/v1/users/' + own!.userId).send({ name: 'Invadido', id: other!.userId }).expect(400);
        await request(server).post('/api/v1/users').set('Origin', origin).set('Cookie', own!.cookie).set('X-CSRF-Token', own!.csrf).set('Idempotency-Key', randomUUID()).send({ ...userInput('escape@example.test'), tenantId: other!.companyId }).expect(400);
      }
      await mutation(a, '/api/v1/company').set('X-CSRF-Token', b.csrf).send({ name: 'Invadido' }).expect(403);
      await request(server).get('/api/v1/operations/' + created.body.data.reference).set('Cookie', b.cookie).expect(404);
      const page = await request(server).get('/api/v1/users?limit=1').set('Cookie', a.cookie).expect(200);
      await request(server).get('/api/v1/users').query({ cursor: page.body.page.nextCursor }).set('Cookie', b.cookie).expect(400);
      await request(server).get('/api/v1/company').query({ tenantId: b.companyId }).set('Cookie', a.cookie).expect(400);
      for (let i = 0; i < 6; i++) {
        for (const own of [a, b]) {
          expect((await request(server).get('/api/v1/company').set('Cookie', own.cookie).expect(200)).body.data.id).toBe(own.companyId);
          const users = await request(server).get('/api/v1/users').set('Cookie', own.cookie).expect(200);
          expect(users.body.data.some((user: {
            id: string;
          }) => user.id === (own === a ? b : a).userId)).toBe(false);
        }
      }
      expect((await isolated.app.query('SELECT pg_backend_pid() AS pid')).rows[0].pid).toBe(pid);
      expect((await isolated.app.query('SELECT * FROM app.users')).rows).toEqual([]);
      expect((await isolated.owner.query('SELECT tenant_id,id,name,role,active FROM app.users ORDER BY tenant_id,id')).rows).toEqual(before.rows);
      expect((await isolated.owner.query('SELECT count(*)::int n FROM app.commands')).rows[0].n).toBe(1);
    }
    finally {
      await isolatedApp.close();
      await isolated.close();
    }
  });
});
