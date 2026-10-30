import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { IdentityAccess } from '../../packages/database/dist/identity-access.js';
let db: SchemaFixture;
let identity: IdentitySeed;
beforeAll(async () => { db = await createSchemaFixture(); identity = await seedIdentity(db.owner); });
afterAll(async () => { if (db)
  await db.close(); });
describe('I-ISO/adaptador-acceso', () => {
  it('resuelve el correo repetido exclusivamente en la empresa indicada sin contexto global', async () => {
    const access = new IdentityAccess(db.app);
    const a = await access.credential(' a-' + identity.tenant.toUpperCase() + ' ', ' ADMIN@EXAMPLE.TEST ');
    const b = await access.credential('B-' + identity.otherTenant, 'admin@example.test');
    expect(a).toMatchObject({ tenant_id: identity.tenant, user_id: identity.actor });
    expect(b).toMatchObject({ tenant_id: identity.otherTenant, user_id: identity.otherActor });
    expect(await access.credential("' OR 1=1 --", 'admin@example.test')).toBeNull();
    expect((await db.app.query('SELECT * FROM app.products')).rows).toEqual([]);
    expect((await db.app.query('SELECT current_user AS role')).rows[0].role).toBe('alm_app');
  });
  it('resuelve solo hashes de sesiones vigentes y conserva el ámbito', async () => {
    const id = randomUUID();
    await db.owner.query('INSERT INTO app.sessions(tenant_id,id,user_id,token_hash) VALUES ($1,$2,$3,$4)', [identity.tenant, id, identity.actor, 'c'.repeat(64)]);
    const access = new IdentityAccess(db.app);
    expect(await access.session('c'.repeat(64))).toEqual({ tenant_id: identity.tenant, user_id: identity.actor, session_id: id });
    await db.owner.query('UPDATE app.sessions SET revoked_at=current_timestamp WHERE tenant_id=$1 AND id=$2', [identity.tenant, id]);
    expect(await access.session('c'.repeat(64))).toBeNull();
  });
  it('fija search_path y no concede ejecución pública de funciones privilegiadas', async () => {
    const functions = (await db.owner.query("SELECT p.proname,p.prosecdef,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='app' AND p.proname IN ('lookup_credential','lookup_session','installation_state')")).rows;
    expect(functions).toHaveLength(3);
    for (const fn of functions) {
      expect(fn.prosecdef).toBe(true);
      expect(fn.proconfig).toContain('search_path=pg_catalog, pg_temp');
    }
    expect((await db.owner.query("SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE n.nspname='app' AND p.prosecdef AND a.grantee=0 AND a.privilege_type='EXECUTE'")).rows[0].n).toBe(0);
  });
});
