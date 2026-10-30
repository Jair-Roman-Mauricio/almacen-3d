import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
import { validatedImport } from './import-helpers.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f.close();
});
const modulePath = '../../apps/api/dist/exchange/import-application.js';
it('I-EXC/aplicar-catalogo-mixto conserva identidad, SKU, unidad y stock', async () => {
  const scene = await outboundScene(f, '20'), p = (await f.get(f.admin, '/products?q=' + scene.product).expect(200)).body.data;
  const product = (await f.db.owner.query('SELECT sku FROM app.products WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, scene.product])).rows[0];
  void p;
  const job = await validatedImport(f, `sku,nombre,tipo_unidad,unidad_base\n${product.sku},Renombrado,piece,pieza\nNUEVO-LOTE,Alta,piece,pieza\n`);
  expect(job.state).toBe('validated');
  const ref = randomUUID();
  await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, { contentHash: job.contentHash }, ref).expect(202);
  const { applyImportJob } = await import(modulePath);
  await applyImportJob(f.db.app, f.admin.tenant, job.id);
  const result = (await f.get(f.admin, '/operations/' + ref).expect(200)).body.data.result;
  expect(result).toMatchObject({ jobId: job.id, created: 1, updated: 1, stockEntries: 0 });
  const row = (await f.db.owner.query('SELECT id,sku,name,unit_kind,unit_label FROM app.products WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, scene.product])).rows[0];
  expect(row).toMatchObject({ id: scene.product, sku: product.sku, name: 'Renombrado', unit_kind: 'piece', unit_label: 'pieza' });
  expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE tenant_id=$1 AND product_id=$2', [f.admin.tenant, scene.product])).rows[0].physical).toBe('20');
});
it('I-EXC/aplicar-stock-inicial registra entradas con actor y referencia, sin sobrescribir', async () => {
  const s = await outboundScene(f, '0'), product = (await f.db.owner.query('SELECT sku FROM app.products WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, s.product])).rows[0];
  const job = await validatedImport(f, `sku,codigo_ubicacion,cantidad\n${product.sku},A/1,12\n${product.sku},A/2,8\n`, 'initial_stock', s.warehouse);
  expect(job.state).toBe('validated');
  const ref = randomUUID();
  await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, { contentHash: job.contentHash }, ref).expect(202);
  const { applyImportJob } = await import(modulePath);
  await applyImportJob(f.db.app, f.admin.tenant, job.id);
  const result = (await f.get(f.admin, '/operations/' + ref).expect(200)).body.data.result;
  expect(result).toMatchObject({ jobId: job.id, created: 0, updated: 0, stockEntries: 2 });
  const entries = (await f.db.owner.query('SELECT actor_id,physical_delta::text FROM app.inventory_entries WHERE tenant_id=$1 AND operation_reference=$2 ORDER BY app.inventory_entries.physical_delta', [f.admin.tenant, ref])).rows;
  expect(entries).toEqual([{ actor_id: f.admin.actor, physical_delta: '8' }, { actor_id: f.admin.actor, physical_delta: '12' }]);
  const invalid = await validatedImport(f, `sku,codigo_ubicacion,cantidad\n${product.sku},A/1,1\n`, 'initial_stock', s.warehouse);
  expect(invalid.state).toBe('invalid');
});
