import { expect, it } from 'vitest';
import { operationsFixture } from './operations-fixture.js';
import { uploadFor, importState } from './import-helpers.js';
it('I-EXC/upload-frontera acepta conjuntamente 20.000 filas y 20.000.000 bytes sin aplicar negocio', async () => {
  const f = await operationsFixture();
  try {
    const text = 'sku,nombre,tipo_unidad,unidad_base\n' + Array.from({ length: 20000 }, (_, i) => `LIM-${i},Motor,piece,pieza\n`).join(''), base = Buffer.from(text), point = base.indexOf(Buffer.from('Motor')), bytes = Buffer.concat([base.subarray(0, point), Buffer.alloc(20000000 - base.length, 32), base.subarray(point)]);
    const response = await uploadFor(f, bytes).expect(202), job = await importState(f, response.body.data.id, ['preview', 'failed']);
    expect(job).toMatchObject({ state: 'preview', rowCount: 20000, bytes: 20000000 });
    const valid = (await f.mutate(f.admin, 'post', `/imports/${job.id}/validation`, {}).expect(200)).body.data;
    expect(valid.state).toBe('validated');
    expect((await f.db.owner.query('SELECT count(*)::int n FROM app.products')).rows[0].n).toBe(0);
  }
  finally {
    await f.close();
  }
}, 30000);
