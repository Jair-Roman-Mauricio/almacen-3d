import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = {};
for (const mode of ['DEV', 'TEST']) {
  for (const role of ['BOOTSTRAP', 'MIGRATION', 'APP']) values[`PG_${mode}_${role}_PASSWORD`] = randomBytes(24).toString('hex');
}
values.DATABASE_URL = `postgresql://alm_app:${values.PG_DEV_APP_PASSWORD}@127.0.0.1:55432/almacen_dev`;
values.DATABASE_MIGRATION_URL = `postgresql://alm_migrator:${values.PG_DEV_MIGRATION_PASSWORD}@127.0.0.1:55432/almacen_dev`;
values.TEST_DATABASE_URL = `postgresql://alm_app:${values.PG_TEST_APP_PASSWORD}@127.0.0.1:55433/almacen_test`;
values.TEST_MIGRATION_URL = `postgresql://alm_migrator:${values.PG_TEST_MIGRATION_PASSWORD}@127.0.0.1:55433/almacen_test`;
try {
  await writeFile(path.join(root, '.env'), Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log('.env local creado; credenciales omitidas de la salida.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env existente conservado sin modificaciones.');
}
