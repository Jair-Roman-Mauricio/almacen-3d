import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { operationsFixture, origin, type OperationsFixture } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f.close();
});
export const catalogueCsv = 'sku,nombre,tipo_unidad,unidad_base\nNUEVO,Motor sintético,piece,pieza\n';
function upload(bytes: Buffer, name = 'catalogo.csv', kind = 'catalogue', warehouseId?: string) {
  let r = request(f.server).post('/api/v1/imports').set('Origin', origin).set('Cookie', f.admin.cookie).set('X-CSRF-Token', f.admin.csrf).field('kind', kind);
  if (warehouseId)
    r = r.field('warehouseId', warehouseId);
  return r.attach('file', bytes, name);
}
it('I-EXC/upload-limitado conserva staging y rechaza exceso y formato', async () => {
  const r = await upload(Buffer.from(catalogueCsv)).expect(202);
  expect(r.body.data).toMatchObject({ kind: 'catalogue', state: 'parsing', bytes: Buffer.byteLength(catalogueCsv) });
  await upload(Buffer.alloc(20000001), 'exceso.csv').expect(413);
  await upload(Buffer.from('abc'), 'archivo.xls').expect(422);
  expect((await f.db.owner.query('SELECT count(*)::int n FROM app.products')).rows[0].n).toBe(0);
});
async function waitJob(id: string, states = ['preview', 'invalid', 'validated', 'confirmed', 'failed']) {
  for (let i = 0; i < 150; i++) {
    const r = await f.get(f.admin, '/imports/' + id).expect(200);
    if (states.includes(r.body.data.state))
      return r.body.data;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error('La importación no terminó.');
}
it('I-EXC/preview-mixto pagina altas y actualizaciones sin modificar catálogo', async () => {
  await f.mutate(f.admin, 'post', '/products', { sku: 'EXISTENTE', name: 'Anterior', unit: { kind: 'piece', label: 'pieza' } }).expect(201);
  const r = await upload(Buffer.from('sku,nombre,tipo_unidad,unidad_base\nEXISTENTE,Nombre nuevo,piece,pieza\nALTA,Alta sintética,piece,pieza\n')).expect(202), id = r.body.data.id;
  const job = await waitJob(id);
  expect(job.state).toBe('preview');
  expect(job.contentHash).toMatch(/^[0-9a-f]{64}$/);
  const first = await f.get(f.admin, `/imports/${id}/rows?limit=1`).expect(200);
  expect(first.body.data[0]).toMatchObject({ row: 2, action: 'update', values: { nombre: 'Nombre nuevo' } });
  const second = await f.get(f.admin, `/imports/${id}/rows?limit=1&cursor=${encodeURIComponent(first.body.page.nextCursor)}`).expect(200);
  expect(second.body.data[0].action).toBe('create');
  expect((await f.get(f.admin, '/products?q=EXISTENTE').expect(200)).body.data[0].name).toBe('Anterior');
  expect((await f.get(f.admin, '/products?q=ALTA').expect(200)).body.data).toEqual([]);
});
it('I-EXC/validacion-filas detecta duplicados normalizados y cambios de unidad', async () => {
  const r = await upload(Buffer.from('sku,nombre,tipo_unidad,unidad_base\n EXISTENTE ,Cambio,weight,kg\nexistente,Duplicado,piece,pieza\n')).expect(202), id = r.body.data.id;
  await waitJob(id);
  const validated = await f.mutate(f.admin, 'post', `/imports/${id}/validation`, {}).expect(200);
  expect(validated.body.data.state).toBe('invalid');
  const rows = (await f.get(f.admin, `/imports/${id}/rows`).expect(200)).body.data;
  expect(rows.every((r: {
    errors: unknown[];
  }) => r.errors.length > 0)).toBe(true);
  expect(JSON.stringify(rows)).toMatch(/duplicad/iu);
  expect(JSON.stringify(rows)).toMatch(/unidad/iu);
  expect((await f.get(f.admin, '/products?q=EXISTENTE').expect(200)).body.data[0].name).toBe('Anterior');
});
it('I-CMD/importacion-pendiente conserva referencia y huella bajo replay simultáneo', async () => {
  const { randomUUID } = await import('node:crypto');
  const id = (await upload(Buffer.from(catalogueCsv)).expect(202)).body.data.id;
  await waitJob(id);
  const job = (await f.mutate(f.admin, 'post', `/imports/${id}/validation`, {}).expect(200)).body.data;
  expect(job.state).toBe('validated');
  const { ImportWorkerHost } = await import('../../apps/api/dist/exchange/import-worker-host.js');
  await f.app.get(ImportWorkerHost).onModuleDestroy();
  const reference = randomUUID(), body = { contentHash: job.contentHash };
  const responses = await Promise.all([f.mutate(f.admin, 'post', `/imports/${id}/application`, body, reference), f.mutate(f.admin, 'post', `/imports/${id}/application`, body, reference)]);
  expect(responses.map(r => r.status)).toEqual([202, 202]);
  expect(responses[0].body.data).toEqual(responses[1].body.data);
  expect(responses[0].body.data.jobId).toBe(id);
  await f.get(f.admin, '/operations/' + reference).expect(202);
  await f.mutate(f.admin, 'post', `/imports/${id}/application`, { contentHash: 'f'.repeat(64) }, reference).expect(409);
});
