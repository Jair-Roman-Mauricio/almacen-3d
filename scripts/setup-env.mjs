import { randomBytes } from 'node:crypto';
import { writeFile, readFile, appendFile, chmod } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = {};
for (const mode of ['DEV', 'TEST']) {
  for (const role of ['BOOTSTRAP', 'MIGRATION', 'APP', 'PROVISION']) values[`PG_${mode}_${role}_PASSWORD`] = randomBytes(24).toString('hex');
}
values.DATABASE_URL = `postgresql://alm_app:${values.PG_DEV_APP_PASSWORD}@127.0.0.1:55432/almacen_dev`;
values.DATABASE_MIGRATION_URL = `postgresql://alm_migrator:${values.PG_DEV_MIGRATION_PASSWORD}@127.0.0.1:55432/almacen_dev`;
values.TEST_DATABASE_URL = `postgresql://alm_app:${values.PG_TEST_APP_PASSWORD}@127.0.0.1:55433/almacen_test`;
values.TEST_MIGRATION_URL = `postgresql://alm_migrator:${values.PG_TEST_MIGRATION_PASSWORD}@127.0.0.1:55433/almacen_test`;
values.DATABASE_PROVISION_URL = `postgresql://alm_provision:${values.PG_DEV_PROVISION_PASSWORD}@127.0.0.1:55432/almacen_dev`;
values.TEST_PROVISION_URL = `postgresql://alm_provision:${values.PG_TEST_PROVISION_PASSWORD}@127.0.0.1:55433/almacen_test`;
try {
  await writeFile(path.join(root, '.env'), Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log('.env local creado; credenciales omitidas de la salida.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  const file = path.join(root, '.env');
  const existing = await readFile(file, 'utf8');
  const saved = Object.fromEntries(existing.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => [line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
  const added = {};
  for (const [mode, baseKey, urlKey] of [['DEV','DATABASE_URL','DATABASE_PROVISION_URL'],['TEST','TEST_DATABASE_URL','TEST_PROVISION_URL']]) {
    const key = `PG_${mode}_PROVISION_PASSWORD`;
    if (!saved[key]) added[key] = values[key];
    if (!saved[urlKey]) {
      const url = new URL(saved[baseKey]);
      url.username = 'alm_provision'; url.password = saved[key] || added[key];
      added[urlKey] = url.toString();
    }
  }
  if (Object.keys(added).length) await appendFile(file, (existing.endsWith('\n') ? '' : '\n') + Object.entries(added).map(([key,value]) => `${key}=${value}`).join('\n') + '\n');
  await chmod(file,0o600);
  console.log('Credenciales existentes conservadas; campos de provisión añadidos solo si faltaban.');
}
