import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
describe('I-CON/cantidades-ausentes', () => {
  it('devuelve el error de cantidad contractual antes de intentar confirmar efectos', async () => {
    const id = randomUUID(), other = randomUUID();
    const cases: [
      string,
      object
    ][] = [['/orders', { code: 'SIN-CANTIDAD', warehouseId: id, lines: [{ productId: other }] }], ['/orders/' + id + '/reservations', { lines: [{ orderLineId: other, sourceLocationId: id }] }], ['/orders/' + id + '/preparations', { lines: [{ allocationId: other }] }], ['/orders/' + id + '/dispatches', { lines: [{ allocationId: other }] }], ['/transfers', { code: 'SIN-CANTIDAD', sourceWarehouseId: id, targetWarehouseId: other, lines: [{ productId: id, sourceLocationId: other }] }], ['/transfers/' + id + '/departure', { lines: [{ transferLineId: other }] }], ['/transfers/' + id + '/receipts', { lines: [{ transferLineId: other, targetLocationId: id }] }]];
    for (const [path, body] of cases) {
      const response = await f.mutate(f.admin, 'post', path, body).expect(422);
      expect(response.body.error.code).toBe('INVALID_QUANTITY');
    }
    expect((await f.db.owner.query('SELECT * FROM app.commands')).rowCount).toBe(0);
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries')).rowCount).toBe(0);
  });
});
