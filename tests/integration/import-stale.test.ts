import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { operationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
import { validatedImport } from './import-helpers.js';
import { ImportWorkerHost } from '../../apps/api/dist/exchange/import-worker-host.js';
import { applyImportJob } from '../../apps/api/dist/exchange/import-application.js';
for (const change of ['stock', 'block', 'unit', 'permissions', 'failure'] as const)
  it('I-EXC/preview-obsoleta-' + change + ' preserva todo el negocio', async () => {
    const f = await operationsFixture();
    try {
      const s = await outboundScene(f, '0'), sku = (await f.db.owner.query('SELECT sku FROM app.products WHERE id=$1', [s.product])).rows[0].sku;
      const catalogue = ['unit', 'permissions', 'failure'].includes(change);
      const csv = catalogue ? `sku,nombre,tipo_unidad,unidad_base\nALTA-FALLIDA,Alta,piece,pieza\n${sku},Renombrado,piece,pieza\n` : `sku,codigo_ubicacion,cantidad\n${sku},A/1,12\n${sku},A/2,8\n`;
      const job = await validatedImport(f, csv, catalogue ? 'catalogue' : 'initial_stock', catalogue ? undefined : s.warehouse);
      expect(job.state).toBe('validated');
      await f.app.get(ImportWorkerHost).onModuleDestroy();
      const ref = randomUUID();
      await f.mutate(f.admin, 'post', `/imports/${job.id}/application`, { contentHash: job.contentHash }, ref).expect(202);
      if (change === 'stock')
        await f.mutate(f.admin, 'post', '/receipts', { warehouseId: s.warehouse, lines: [{ productId: s.product, targetLocationId: s.b, quantity: '3' }] }).expect(201);
      if (change === 'block')
        await f.mutate(f.admin, 'post', `/locations/${s.b}/block`, {}).expect(200);
      if (change === 'unit')
        await f.db.owner.query("UPDATE app.products SET unit_label='otra unidad' WHERE id=$1", [s.product]);
      if (change === 'permissions')
        await f.db.owner.query('UPDATE app.users SET active=false WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, f.admin.actor]);
      if (change === 'failure')
        await f.db.owner.query("CREATE FUNCTION app.fail_import_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético a mitad del lote'; END $$;CREATE TRIGGER fail_import_update BEFORE UPDATE ON app.products FOR EACH ROW EXECUTE FUNCTION app.fail_import_update()");
      const before = (await f.db.owner.query('SELECT location_id,product_id,physical::text,reserved::text,physical_revision FROM app.stock_balances ORDER BY location_id,product_id')).rows;
      await applyImportJob(f.db.app, f.admin.tenant, job.id);
      expect((await f.db.owner.query('SELECT state,errors FROM app.import_jobs WHERE id=$1', [job.id])).rows[0]).toMatchObject({ state: 'failed', errors: expect.any(Array) });
      expect((await f.db.owner.query('SELECT location_id,product_id,physical::text,reserved::text,physical_revision FROM app.stock_balances ORDER BY location_id,product_id')).rows).toEqual(before);
      expect((await f.db.owner.query('SELECT id FROM app.products WHERE sku=$1', ['ALTA-FALLIDA'])).rows).toEqual([]);
      expect((await f.db.owner.query('SELECT id FROM app.inventory_entries WHERE operation_reference=$1', [ref])).rows).toEqual([]);
      expect((await f.db.owner.query('SELECT id FROM app.change_outbox WHERE operation_reference=$1', [ref])).rows).toEqual([]);
    }
    finally {
      await f.close();
    }
  }, 15000);
