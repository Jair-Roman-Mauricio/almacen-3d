import { assertTestDatabaseTarget } from '../../packages/database/dist/test-target.js';

if (!process.env.TEST_DATABASE_URL || !process.env.DATABASE_URL || !process.env.TEST_MIGRATION_URL || !process.env.DATABASE_MIGRATION_URL) {
  throw new Error('Prepara .env y PostgreSQL local antes de ejecutar integración.');
}
assertTestDatabaseTarget(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
assertTestDatabaseTarget(process.env.TEST_MIGRATION_URL, process.env.DATABASE_MIGRATION_URL);
