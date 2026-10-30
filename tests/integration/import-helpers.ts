import request from 'supertest';
import { origin, type OperationsFixture, type Access } from './operations-fixture.js';
export function uploadFor(f: OperationsFixture, csv: string | Buffer, kind = 'catalogue', warehouseId?: string, access: Access = f.admin, name = 'datos.csv') {
  let r = request(f.server).post('/api/v1/imports').set('Origin', origin).set('Cookie', access.cookie).set('X-CSRF-Token', access.csrf).field('kind', kind);
  if (warehouseId)
    r = r.field('warehouseId', warehouseId);
  return r.attach('file', Buffer.isBuffer(csv) ? csv : Buffer.from(csv), name);
}
export async function importState(f: OperationsFixture, id: string, states = ['preview', 'invalid', 'validated', 'confirmed', 'failed']) {
  for (let i = 0; i < 300; i++) {
    const r = await f.get(f.admin, '/imports/' + id).expect(200);
    if (states.includes(r.body.data.state))
      return r.body.data;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('El trabajo no alcanzó el estado esperado.');
}
export async function validatedImport(f: OperationsFixture, csv: string, kind = 'catalogue', warehouse?: string) {
  const id = (await uploadFor(f, csv, kind, warehouse).expect(202)).body.data.id;
  await importState(f, id);
  return (await f.mutate(f.admin, 'post', `/imports/${id}/validation`, {}).expect(200)).body.data;
}
