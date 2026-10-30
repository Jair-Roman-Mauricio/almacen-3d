import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { IdentityService } from '../../apps/api/dist/identity/identity-service.js';
import { waitForBlockedBy } from './concurrency-helpers.js';
import { createSchemaFixture, type SchemaFixture } from './schema-fixture.js';
import { createApplication } from '../../apps/api/dist/create-application.js';
let db: SchemaFixture;
let app: Awaited<ReturnType<typeof createApplication>>;
const origin = 'http://localhost:3000';
const registration = (code: string, email = 'admin@example.test') => ({ company: { code, name: 'Empresa sintética' }, administrator: { name: 'Admin', email, password: '  contraseña exacta  ' } });
beforeAll(async () => { db = await createSchemaFixture({ appMax: 6, provisionMax: 4 }); app = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', origin }); await app.init(); });
afterAll(async () => { await app?.close(); if (db)
  await db.close(); });
describe('I-SET/registro-saas', () => {
  it('crea empresa y primer administrador conjuntamente sin exponer hash o contraseña', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(registration('NUEVA')).expect(201);
    expect(response.body.data).toMatchObject({ company: { code: 'NUEVA', name: 'Empresa sintética', timeZone: 'America/Lima' }, administrator: { email: 'admin@example.test', role: 'admin', active: true }, loginCompanyCode: 'NUEVA' });
    const text = JSON.stringify(response.body);
    expect(text).not.toContain('password');
    expect(text).not.toContain('argon2');
    const row = (await db.owner.query("SELECT u.password_hash FROM app.users u JOIN app.companies c ON c.id=u.tenant_id WHERE c.code_key='NUEVA'")).rows[0];
    expect(row.password_hash).toMatch(/^\$argon2id\$/);
  });
  it('no conserva un alta incompleta si falla el almacenamiento del administrador', async () => {
    await db.owner.query("CREATE FUNCTION app.reject_synthetic_admin() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.email='fallo@example.test' THEN RAISE EXCEPTION 'Fallo sintético de almacenamiento'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_synthetic_admin BEFORE INSERT ON app.users FOR EACH ROW EXECUTE FUNCTION app.reject_synthetic_admin()");
    try {
      await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(registration('FALLO', 'fallo@example.test')).expect(500);
    }
    finally {
      await db.owner.query('DROP TRIGGER reject_synthetic_admin ON app.users; DROP FUNCTION app.reject_synthetic_admin()');
    }
    expect((await db.owner.query("SELECT * FROM app.companies WHERE code_key='FALLO'")).rowCount).toBe(0);
  });
});
describe('I-SET/codigo-concurrente', () => {
  it('confirma una sola pareja empresa/admin ante registros concurrentes del mismo código', async () => {
    const gate = await db.owner.connect();
    let firstPid: number;
    await gate.query('SELECT pg_advisory_lock(4470041)');
    const gatePid = (await gate.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_registration() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.email='race@example.test' THEN PERFORM pg_advisory_xact_lock(4470041); END IF; RETURN NEW; END $$;CREATE TRIGGER pause_registration BEFORE INSERT ON app.users FOR EACH ROW EXECUTE FUNCTION app.pause_registration()");
    const first = request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(registration('RACE', 'race@example.test')).then(value => value);
    let second: Promise<Awaited<typeof first>> | undefined;
    try {
      firstPid = await waitForBlockedBy(db.app, gatePid);
      second = request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(registration(' race ', 'race@example.test')).then(value => value);
      await waitForBlockedBy(db.app, firstPid);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470041)');
      gate.release();
    }
    try {
      const results = await Promise.all([first, second!]);
      expect(results.map(value => value.status).sort()).toEqual([201, 409]);
      expect(results.find(value => value.status === 409)!.body.error.code).toBe('COMPANY_CODE_EXISTS');
    }
    finally {
      await db.owner.query('DROP TRIGGER pause_registration ON app.users;DROP FUNCTION app.pause_registration()');
    }
    expect((await db.owner.query("SELECT count(*)::int AS n FROM app.users u JOIN app.companies c ON c.id=u.tenant_id WHERE c.code_key='RACE'")).rows[0].n).toBe(1);
  });
});
describe('I-SET/alta-local', () => {
  let localDb: SchemaFixture;
  let localApp: Awaited<ReturnType<typeof createApplication>>;
  beforeAll(async () => { localDb = await createSchemaFixture({ provisionMax: 4 }); localApp = await createApplication({ appPool: localDb.app, provisionPool: localDb.provision!, mode: 'local', origin }); await localApp.init(); });
  afterAll(async () => { await localApp?.close(); if (localDb)
    await localDb.close(); });
  it('informa modalidad y completa el setup una sola vez', async () => {
    expect((await request(app.getHttpServer()).get('/api/v1/public/config').expect(200)).body.data).toEqual({ mode: 'saas', demoMode: false, localSetupRequired: false });
    expect((await request(localApp.getHttpServer()).get('/api/v1/public/config').expect(200)).body.data).toEqual({ mode: 'local', demoMode: false, localSetupRequired: true });
    await request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('LOCAL')).expect(201);
    expect((await request(localApp.getHttpServer()).get('/api/v1/public/config').expect(200)).body.data.localSetupRequired).toBe(false);
    const second = await request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('LOCAL2')).expect(409);
    expect(second.body.error.code).toBe('ALREADY_CONFIGURED');
    expect((await localDb.owner.query('SELECT count(*)::int AS n FROM app.companies')).rows[0].n).toBe(1);
    await request(app.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('OTRO')).expect(404);
    await request(localApp.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(registration('OTRO')).expect(404);
  });
});
describe('I-SET/setup-concurrente-reinicio', () => {
  it('serializa finalizaciones y conserva el primer setup tras reiniciar la API', async () => {
    const localDb = await createSchemaFixture({ appMax: 4, provisionMax: 4 });
    let localApp = await createApplication({ appPool: localDb.app, provisionPool: localDb.provision!, mode: 'local', origin });
    await localApp.init();
    const gate = await localDb.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470043)');
    const pid = (await gate.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_setup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470043); RETURN NEW; END $$;CREATE TRIGGER pause_setup BEFORE INSERT ON app.users FOR EACH ROW EXECUTE FUNCTION app.pause_setup()");
    const first = request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('PRIMERA')).then(value => value);
    let second: Promise<Awaited<typeof first>> | undefined;
    try {
      const setupPid = await waitForBlockedBy(localDb.app, pid);
      second = request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('SEGUNDA')).then(value => value);
      await waitForBlockedBy(localDb.app, setupPid);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470043)');
      gate.release();
    }
    try {
      expect((await first).status).toBe(201);
      expect((await second!).body.error.code).toBe('ALREADY_CONFIGURED');
      await localApp.close();
      localApp = await createApplication({ appPool: localDb.app, provisionPool: localDb.provision!, mode: 'local', origin });
      await localApp.init();
      expect((await request(localApp.getHttpServer()).get('/api/v1/public/config')).body.data.localSetupRequired).toBe(false);
      expect((await localDb.owner.query('SELECT code FROM app.companies')).rows).toEqual([{ code: 'PRIMERA' }]);
      expect((await localDb.owner.query('SELECT count(*)::int n FROM app.users')).rows[0].n).toBe(1);
    }
    finally {
      await localApp.close();
      await localDb.close();
    }
  });
});
describe('I-ACC/login-empresa', () => {
  it('resuelve el mismo correo solo dentro de la empresa elegida y no filtra credenciales', async () => {
    const a = registration('LOGIN-A', 'same@example.test'), b = registration('LOGIN-B', 'same@example.test');
    b.administrator.password = 'otra clave';
    await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(a).expect(201);
    await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(b).expect(201);
    const login = await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: ' login-a ', email: ' SAME@example.test ', password: a.administrator.password }).expect(200);
    expect(login.body.data).toMatchObject({ company: { code: 'LOGIN-A' }, user: { email: 'same@example.test', role: 'admin' }, demoMode: false });
    expect(login.body.data.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure');
    const raw = cookie.match(/almacen_session=([^;]+)/)![1]!;
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(login.body)).not.toContain(raw);
    expect(JSON.stringify(login.body)).not.toContain('password');
    expect((await db.owner.query('SELECT token_hash FROM app.sessions')).rows.every(row => row.token_hash !== raw && /^[0-9a-f]{64}$/.test(row.token_hash))).toBe(true);
    for (const companyCode of ['LOGIN-B', 'DESCONOCIDA']) {
      const failed = await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode, email: 'same@example.test', password: a.administrator.password }).expect(401);
      expect(failed.body.error.code).toBe('INVALID_CREDENTIALS');
    }
    await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: 'LOGIN-A', email: 'same@example.test' }).expect(400);
  });
});
describe('I-ACC/accion-protegida', () => {
  it('rechaza sesión ausente/inactiva y vuelve a leer el rol dentro de la transacción', async () => {
    await request(app.getHttpServer()).get('/api/v1/sessions/current').expect(401);
    const data = registration('PROTECTED');
    const created = await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(data).expect(201);
    const login = await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: 'PROTECTED', email: data.administrator.email, password: data.administrator.password }).expect(200);
    const cookie = String(login.headers['set-cookie']).split(';')[0]!;
    const current = await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie).expect(200);
    expect(current.body.data.user.id).toBe(created.body.data.administrator.id);
    await db.owner.query("UPDATE app.users SET role='operator' WHERE tenant_id=$1", [created.body.data.company.id]);
    await expect(app.get(IdentityService).withIdentity(cookie, ['admin'], async () => true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie).expect(200)).body.data.user.role).toBe('operator');
    await db.owner.query('UPDATE app.users SET active=false WHERE tenant_id=$1', [created.body.data.company.id]);
    await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie).expect(401);
    await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie + '; ' + cookie).expect(401);
  });
});
describe('I-ACC/logout-csrf', () => {
  it('rechaza origen/CSRF ajenos, revoca en servidor y retira la cookie', async () => {
    const value = registration('LOGOUT');
    await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(value).expect(201);
    for (const badOrigin of ['https://evil.example', undefined]) {
      const attempt = request(app.getHttpServer()).post('/api/v1/sessions');
      if (badOrigin)
        attempt.set('Origin', badOrigin);
      await attempt.send({ companyCode: 'LOGOUT', ...value.administrator }).expect(400);
    }
    const body = { companyCode: 'LOGOUT', email: value.administrator.email, password: value.administrator.password };
    await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', 'https://evil.example').send(body).expect(403);
    await request(app.getHttpServer()).post('/api/v1/sessions').send(body).expect(403);
    const login = await request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send(body).expect(200);
    const cookie = String(login.headers['set-cookie']).split(';')[0]!;
    await request(app.getHttpServer()).delete('/api/v1/sessions/current').set('Origin', origin).set('Cookie', cookie).expect(403);
    await request(app.getHttpServer()).delete('/api/v1/sessions/current').set('Origin', 'https://evil.example').set('Cookie', cookie).set('X-CSRF-Token', login.body.data.csrfToken).expect(403);
    await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie).expect(200);
    const logout = await request(app.getHttpServer()).delete('/api/v1/sessions/current').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', login.body.data.csrfToken).expect(204);
    expect(String(logout.headers['set-cookie'])).toContain('almacen_session=;');
    await request(app.getHttpServer()).get('/api/v1/sessions/current').set('Cookie', cookie).expect(401);
    await request(app.getHttpServer()).delete('/api/v1/sessions/current').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', login.body.data.csrfToken).expect(401);
    const secureApp = await createApplication({ appPool: db.app, provisionPool: db.provision!, mode: 'saas', origin: 'https://almacen.example' });
    await secureApp.init();
    try {
      const secure = await request(secureApp.getHttpServer()).post('/api/v1/sessions').set('Origin', 'https://almacen.example').send(body).expect(200);
      expect(String(secure.headers['set-cookie'])).toContain('Secure');
    }
    finally {
      await secureApp.close();
    }
  });
});
describe('I-SET/rollback-local', () => {
  it('revierte también el estado de instalación si falla el primer administrador', async () => {
    const localDb = await createSchemaFixture();
    const localApp = await createApplication({ appPool: localDb.app, provisionPool: localDb.provision!, mode: 'local', origin });
    await localApp.init();
    try {
      await localDb.owner.query("CREATE FUNCTION app.reject_local_admin() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético'; END $$;CREATE TRIGGER reject_local_admin BEFORE INSERT ON app.users FOR EACH ROW EXECUTE FUNCTION app.reject_local_admin()");
      await request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('RETRY')).expect(500);
      expect((await localDb.owner.query('SELECT count(*)::int n FROM app.companies')).rows[0].n).toBe(0);
      expect((await localDb.owner.query('SELECT * FROM app.installation')).rowCount).toBe(0);
      expect((await request(localApp.getHttpServer()).get('/api/v1/public/config').expect(200)).body.data.localSetupRequired).toBe(true);
      await localDb.owner.query('DROP TRIGGER reject_local_admin ON app.users;DROP FUNCTION app.reject_local_admin()');
      await request(localApp.getHttpServer()).post('/api/v1/local-setup').set('Origin', origin).send(registration('RETRY')).expect(201);
    }
    finally {
      await localApp.close();
      await localDb.close();
    }
  });
});
describe('I-ACC/login-permisos-concurrentes', () => {
  it('no abre sesión si la cuenta se desactiva tras comprobar la credencial y antes de confirmar', async () => {
    const value = registration('LOGIN-RACE');
    const created = await request(app.getHttpServer()).post('/api/v1/registrations').set('Origin', origin).send(value).expect(201);
    const tenant = created.body.data.company.id;
    const gate = await db.owner.connect();
    await gate.query("SELECT pg_advisory_lock(hashtextextended($1,0))", ['wms:permissions:' + tenant]);
    const pid = (await gate.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    const pending = request(app.getHttpServer()).post('/api/v1/sessions').set('Origin', origin).send({ companyCode: 'LOGIN-RACE', email: value.administrator.email, password: value.administrator.password }).then(response => response);
    try {
      await waitForBlockedBy(db.app, pid);
      await gate.query('UPDATE app.users SET active=false WHERE tenant_id=$1', [tenant]);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', ['wms:permissions:' + tenant]);
      gate.release();
    }
    expect((await pending).status).toBe(401);
    expect((await db.owner.query('SELECT * FROM app.sessions WHERE tenant_id=$1', [tenant])).rowCount).toBe(0);
  });
});
