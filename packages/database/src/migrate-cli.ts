import { runMigrations } from './migrate.js';
import { assertTestDatabaseTarget } from './test-target.js';

const test = process.argv.includes('--test');
const connection = test ? process.env.TEST_MIGRATION_URL : process.env.DATABASE_MIGRATION_URL;
try {
  if (!connection) throw new Error('Configura la conexión de migraciones en .env.');
  if (test) assertTestDatabaseTarget(connection, process.env.DATABASE_MIGRATION_URL ?? '');
  const result = await runMigrations(connection);
  console.log(`Migraciones aplicadas: ${result.applied}; total versionado: ${result.total}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudieron aplicar las migraciones.');
  process.exitCode = 1;
}

