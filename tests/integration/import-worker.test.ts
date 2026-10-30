import { afterAll, beforeAll, expect, it } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { validatedImport, importState } from './import-helpers.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(1);
});
afterAll(async () => {
  await f.close();
});
it('I-EXC/worker-contexto confirma desde Node separado con RLS y actor vigente', async () => {
  const job = await validatedImport(f, 'sku,nombre,tipo_unidad,unidad_base\nWORKER,Motor sintético,piece,pieza\n');
  const pending = (await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, { contentHash: job.contentHash }).expect(202)).body.data;
  const final = await importState(f, job.id, ['confirmed', 'failed']);
  expect(final.state).toBe('confirmed');
  expect((await f.get(f.admin, '/operations/' + pending.reference).expect(200)).body.data.result.created).toBe(1);
  expect((await f.get(f.other, '/products?q=WORKER').expect(200)).body.data).toEqual([]);
  expect((await f.db.app.query('SELECT id FROM app.products')).rows).toEqual([]);
});
it('I-EXC/job-reinicio-replay recupera una transacción interrumpida y conserva un solo resultado', async () => {
  const { Worker } = await import('node:worker_threads'), { randomUUID } = await import('node:crypto');
  const { ImportWorkerHost } = await import('../../apps/api/dist/exchange/import-worker-host.js');
  const { waitForBlockedBy } = await import('./concurrency-helpers.js');
  const job = await validatedImport(f, 'sku,nombre,tipo_unidad,unidad_base\nREINICIO,Motor sintético,piece,pieza\n');
  await f.app.get(ImportWorkerHost).onModuleDestroy();
  const reference = randomUUID(), body = { contentHash: job.contentHash };
  await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, body, reference).expect(202);
  const gate = await f.db.owner.connect();
  await gate.query('SELECT pg_advisory_lock(4470109)');
  const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  await gate.query("CREATE FUNCTION app.pause_import() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470109);RETURN NEW; END $$;CREATE TRIGGER pause_import BEFORE INSERT ON app.products FOR EACH ROW EXECUTE FUNCTION app.pause_import()");
  const o = f.db.app.options, config = { connectionString: o.connectionString, host: o.host, port: o.port, user: o.user, password: o.password, database: o.database, ssl: o.ssl };
  const worker = new Worker(new URL('../../apps/api/dist/exchange/import-worker.js', import.meta.url), { workerData: config });
  try {
    await waitForBlockedBy(f.db.app, pid);
    await worker.terminate();
  }
  finally {
    await gate.query('SELECT pg_advisory_unlock(4470109)');
    gate.release();
  }
  await f.db.owner.query('DROP TRIGGER pause_import ON app.products;DROP FUNCTION app.pause_import()');
  expect((await f.db.owner.query('SELECT id FROM app.products WHERE sku=$1', ['REINICIO'])).rows).toEqual([]);
  const restarted = new Worker(new URL('../../apps/api/dist/exchange/import-worker.js', import.meta.url), { workerData: config });
  try {
    const final = await importState(f, job.id, ['confirmed', 'failed']);
    expect(final.state).toBe('confirmed');
  }
  finally {
    await restarted.terminate();
  }
  const before = (await f.get(f.admin, '/operations/' + reference).expect(200)).body.data;
  const retries = await Promise.all([f.mutate(f.admin, 'post', `/imports/${job.id}/application`, body, reference), f.mutate(f.admin, 'post', `/imports/${job.id}/application`, body, reference)]);
  expect(retries.map(r => r.status)).toEqual([200, 200]);
  for (const response of retries)
    expect(response.body.data).toEqual(before);
  expect((await f.db.owner.query("SELECT count(*)::int n FROM app.products WHERE sku='REINICIO'")).rows[0].n).toBe(1);
  expect((await f.db.owner.query('SELECT count(*)::int n FROM app.audit_events WHERE operation_reference=$1', [reference])).rows[0].n).toBe(1);
  await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, body).expect(409);
});
