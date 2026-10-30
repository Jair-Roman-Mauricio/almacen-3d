import { expect, it } from 'vitest';
import { operationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
import { uploadFor, importState } from './import-helpers.js';
import { parseImportFile } from '../../apps/api/dist/exchange/file-parser.js';
it('I-ISO/archivos-reportes protege cada recurso por empresa y rol, y ofrece plantillas válidas', async () => {
  const f = await operationsFixture(1);
  try {
    const s = await outboundScene(f, '10'), supervisor = await f.role('supervisor'), operator = await f.role('operator');
    const job = (await uploadFor(f, 'sku,nombre,tipo_unidad,unidad_base\nAISLADO,Motor ficticio,piece,pieza\n').expect(202)).body.data;
    await importState(f, job.id);
    for (const path of [`/imports/${job.id}`, `/imports/${job.id}/rows`]) {
      await f.get(f.other, path).expect(404);
      for (const who of [supervisor, operator])
        await f.get(who, path).expect(403);
    }
    for (const who of [supervisor, operator]) {
      await uploadFor(f, 'a', 'catalogue', undefined, who).expect(403);
      await f.mutate(who, 'post', `/imports/${job.id}/validation`, {}).expect(403);
      await f.mutate(who, 'post', `/imports/${job.id}/application`, { contentHash: 'a'.repeat(64) }).expect(403);
    }
    for (const path of [`/dashboard?warehouseId=${s.warehouse}&from=2026-01-01&to=2026-12-31`, `/alerts?warehouseId=${s.warehouse}`, `/exports/inventory?warehouseId=${s.warehouse}&format=csv`, `/exports/history?warehouseId=${s.warehouse}&format=xlsx`]) {
      await f.get(f.other, path).expect(404);
      await f.get(operator, path).expect(403);
      await f.get(supervisor, path).expect(200);
    }
    await f.get(f.admin, `/dashboard?warehouseId=${s.warehouse}&from=2026-01-01&from=2026-02-01&to=2026-12-31`).expect(400);
    await f.get(f.other, `/imports/${job.id}/rows?cursor=bad`).expect(404);
    await f.mutate(f.other, 'put', '/thresholds', { warehouseId: s.warehouse, productId: s.product, quantity: '2' }).expect(404);
    await f.mutate(f.admin, 'post', `/imports/${job.id}/validation`, {}).set('Origin', 'https://otro.example').expect(403);
    for (const format of ['csv', 'xlsx']) {
      let r = f.get(f.admin, `/imports/templates/catalogue?format=${format}`);
      if (format === 'xlsx')
        r = r.buffer(true).parse((res, cb) => {
          const parts: Buffer[] = [];
          res.on('data', part => parts.push(Buffer.from(part)));
          res.on('end', () => cb(null, Buffer.concat(parts)));
        });
      const response = await r.expect(200);
      const rows = await parseImportFile(format === 'csv' ? Buffer.from(response.text) : response.body, 'plantilla.' + format, 'catalogue');
      expect(rows[0]!.values.nombre).toContain('demostración');
    }
    expect((await f.db.app.query('SELECT id FROM app.import_jobs')).rows).toEqual([]);
  }
  finally {
    await f.close();
  }
}, 15000);
