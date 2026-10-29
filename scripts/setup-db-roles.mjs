import pg from 'pg';

try {
  for (const [mode, connectionKey] of [['DEV','DATABASE_MIGRATION_URL'],['TEST','TEST_MIGRATION_URL']]) {
    const url = new URL(process.env[connectionKey]);
    if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('Este helper de roles solo admite PostgreSQL local.');
    const password = process.env[`PG_${mode}_PROVISION_PASSWORD`];
    const bootstrap = process.env[`PG_${mode}_BOOTSTRAP_PASSWORD`];
    if (!password || !bootstrap) throw new Error('Ejecuta setup-env.mjs antes de preparar roles.');
    url.username = 'alm_bootstrap'; url.password = bootstrap;
    const pool = new pg.Pool({connectionString:url.toString(),max:1});
    try {
      await pool.query("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='alm_provision') THEN CREATE ROLE alm_provision LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT; END IF; END $$");
      const sql = (await pool.query("SELECT format('ALTER ROLE alm_provision PASSWORD %L',$1::text) AS sql",[password])).rows[0].sql;
      await pool.query(sql);
      await pool.query((await pool.query("SELECT format('GRANT CONNECT ON DATABASE %I TO alm_provision',current_database()) AS sql")).rows[0].sql);
      console.log(`Rol de provisión preparado en ${mode}; credenciales omitidas.`);
    } finally { await pool.end(); }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudieron preparar los roles.');
  process.exitCode = 1;
}
