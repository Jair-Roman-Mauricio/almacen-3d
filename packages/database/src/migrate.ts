import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const migrationsFolder = fileURLToPath(new URL('../migrations/', import.meta.url));
const migrationLock = 1559200008;

export async function runMigrations(connectionString: string): Promise<{ applied: number; total: number }> {
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    let locked = false;
    try {
      const role = await client.query<{ name: string; rolsuper: boolean; rolbypassrls: boolean }>(
        'select current_user as name, rolsuper, rolbypassrls from pg_roles where rolname = current_user',
      );
      const current = role.rows[0];
      if (!current || current.name !== 'alm_migrator' || current.rolsuper || current.rolbypassrls) {
        throw new Error('Las migraciones requieren el rol separado alm_migrator sin privilegios de superusuario.');
      }
      await client.query('select pg_advisory_lock($1::bigint)', [migrationLock]);
      locked = true;
      const files = readMigrationFiles({ migrationsFolder });
      const exists = await client.query<{ present: string | null }>("select to_regclass('app.__drizzle_migrations')::text as present");
      const applied = exists.rows[0]?.present
        ? (await client.query<{ hash: string; created_at: string }>('select hash, created_at from app.__drizzle_migrations order by created_at')).rows
        : [];
      for (const entry of applied) {
        const file = files.find(item => String(item.folderMillis) === String(entry.created_at));
        if (!file || file.hash !== entry.hash) throw new Error('El historial de migraciones aplicado no coincide con los archivos versionados.');
      }
      await migrate(drizzle(client), { migrationsFolder, migrationsSchema: 'app', migrationsTable: '__drizzle_migrations' });
      const result = await client.query<{ total: number }>('select count(*)::integer as total from app.__drizzle_migrations');
      const total = result.rows[0]!.total;
      return { applied: total - applied.length, total };
    } finally {
      try {
        if (locked) await client.query('select pg_advisory_unlock($1::bigint)', [migrationLock]);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

