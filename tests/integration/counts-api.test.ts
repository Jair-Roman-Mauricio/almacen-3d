import { workflowRace } from './workflow-race.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, productInput, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(6);
});
afterAll(async () => {
  await f?.close();
});
async function count(f: OperationsFixture, d: {
  warehouse: string;
  a: string;
  product: string;
}, observed: string) {
  return (await f.mutate(f.admin, 'post', '/counts', { warehouseId: d.warehouse, locationId: d.a, productId: d.product, observed }).expect(201)).body.data.result;
}
describe('I-CNT/conteo', () => {
  it('registra cero y cada SKU de una ubicación con físico/revisión de referencia sin cambiar saldos', async () => {
    const d = await outboundScene(f), weight = (await f.mutate(f.admin, 'post', '/products', productInput(randomUUID(), 'weight')).expect(201)).body.data.result.id as string;
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: weight, targetLocationId: d.a, quantity: '1.125' }] }).expect(201);
    const before = (await f.db.owner.query('SELECT product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1 ORDER BY product_id', [d.warehouse])).rows;
    const zero = await count(f, d, '0');
    expect(zero).toMatchObject({ warehouseId: d.warehouse, locationId: d.a, product: { id: d.product }, observed: '0', referencePhysical: '100', referenceRevision: '1', difference: '-100', adjusted: false, actor: { id: f.admin.actor } });
    const other = await count(f, { ...d, product: weight }, '1.25');
    expect(other).toMatchObject({ product: { id: weight }, observed: '1.25', referencePhysical: '1.125', difference: '0.125' });
    expect((await f.get(f.admin, '/counts/' + zero.id).expect(200)).body.data).toEqual(zero);
    expect((await f.get(f.admin, '/counts').query({ warehouseId: d.warehouse, locationId: d.a }).expect(200)).body.data).toHaveLength(2);
    expect((await f.db.owner.query('SELECT product_id,physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1 ORDER BY product_id', [d.warehouse])).rows).toEqual(before);
    for (const [observed, code] of [['-1', 'INVALID_COUNT'], ['0.5', 'UNIT_PRECISION'], ['1.0001', 'UNIT_PRECISION'], ['NaN', 'INVALID_COUNT']] as const)
      expect((await f.mutate(f.admin, 'post', '/counts', { warehouseId: d.warehouse, locationId: d.a, productId: d.product, observed }).expect(422)).body.error.code).toBe(code);
    expect((await f.mutate(f.admin, 'post', '/counts', { warehouseId: d.warehouse, locationId: d.a, productId: d.product }).expect(422)).body.error.code).toBe('INVALID_COUNT');
  });
});
describe('I-CNT/ajuste-autorizado', () => {
  it('exige motivo, conserva reservas y registra corrección/revisión/resultado de forma indivisible', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '20' }] }).expect(200);
    const observed = await count(f, d, '80');
    await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: ' ' }).expect(422);
    const reference = randomUUID(), body = { reason: ' Conteo verificado ' };
    const adjusted = await f.mutate(await f.role('supervisor'), 'post', '/counts/' + observed.id + '/adjustment', body, reference).expect(200);
    expect(adjusted.body.data.result).toMatchObject({ historyId: reference, count: { id: observed.id, adjusted: true, referencePhysical: '100', observed: '80', difference: '-20' }, balance: { physical: '80', reserved: '20', available: '60' } });
    expect((await f.db.owner.query('SELECT physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0].physical_revision).toBe('2');
    expect((await f.db.owner.query('SELECT physical_delta::text,reason FROM app.inventory_entries WHERE operation_reference=$1', [reference])).rows).toEqual([{ physical_delta: '-20', reason: 'Conteo verificado' }]);
    expect((await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', body, reference).expect(200)).body).toEqual(adjusted.body);
    expect((await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'Otra acción' }).expect(409)).body.error.code).toBe('COUNT_ALREADY_ADJUSTED');
    const protectedCount = await count(f, d, '10');
    expect((await f.mutate(f.admin, 'post', '/counts/' + protectedCount.id + '/adjustment', { reason: 'No puede consumir reservas' }).expect(409)).body.error.code).toBe('RESERVED_STOCK_PROTECTED');
  });
  it('un fallo después de corregir físico revierte saldo, revisión, estado y resultado', async () => {
    const d = await outboundScene(f), observed = await count(f, d, '90'), reference = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_adjustment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético después de corregir físico'; END $$;CREATE TRIGGER fail_adjustment BEFORE INSERT ON app.adjustments FOR EACH ROW EXECUTE FUNCTION app.fail_adjustment()");
    try {
      await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'Verificado' }, reference).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_adjustment ON app.adjustments;DROP FUNCTION app.fail_adjustment()');
    }
    expect((await f.db.owner.query('SELECT physical::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '100', physical_revision: '1' }]);
    expect((await f.get(f.admin, '/counts/' + observed.id).expect(200)).body.data.adjusted).toBe(false);
    expect((await f.db.owner.query('SELECT * FROM app.commands WHERE reference=$1', [reference])).rowCount).toBe(0);
  });
});
describe('I-CNT/revision-fisica', () => {
  it.each([false, true])('rechaza movimiento posterior incluso si el físico vuelve al valor original (ABA=%s)', async (aba) => {
    const d = await outboundScene(f), observed = await count(f, d, '90');
    await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId: d.a, targetLocationId: d.b, quantity: '1' }] }).expect(201);
    if (aba)
      await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId: d.b, targetLocationId: d.a, quantity: '1' }] }).expect(201);
    expect((await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'Referencia obsoleta' }).expect(409)).body.error.code).toBe('COUNT_STALE');
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1 AND location_id=$2', [d.warehouse, d.a])).rows[0].physical).toBe(aba ? '100' : '99');
  });
  it('el movimiento de otro SKU no invalida el conteo del producto contado', async () => {
    const d = await outboundScene(f), observed = await count(f, d, '90'), other = (await f.mutate(f.admin, 'post', '/products', productInput(randomUUID())).expect(201)).body.data.result.id as string;
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: other, targetLocationId: d.a, quantity: '5' }] }).expect(201);
    await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ productId: other, sourceLocationId: d.a, targetLocationId: d.b, quantity: '1' }] }).expect(201);
    const result = await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'Referencia física del SKU intacta' }).expect(200);
    expect(result.body.data.result.balance.physical).toBe('90');
  });
  it('reserva posterior no cambia revisión pero sí protege su cantidad actual', async () => {
    const d = await outboundScene(f), observed = await count(f, d, '20'), order = await createOrder(f, d.warehouse, d.product);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '30' }] }).expect(200);
    expect((await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'No consumir reservas' }).expect(409)).body.error.code).toBe('RESERVED_STOCK_PROTECTED');
    expect((await f.db.owner.query('SELECT physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0].physical_revision).toBe(observed.referenceRevision);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/cancellation', {}).expect(200);
    await f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', { reason: 'Reservas liberadas, físico sin cambios' }).expect(200);
  });
  it('serializa ajustes simultáneos del mismo conteo y conserva una única corrección', async () => {
    const d = await outboundScene(f), observed = await count(f, d, '95'), body = { reason: 'Verificado' };
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', body), () => f.mutate(f.admin, 'post', '/counts/' + observed.id + '/adjustment', body));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('COUNT_ALREADY_ADJUSTED');
    expect((await f.db.owner.query('SELECT * FROM app.adjustments WHERE count_id=$1', [observed.id])).rowCount).toBe(1);
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '95' }]);
  });
});
describe('I-BLK/conteo-ajuste-bloqueado', () => {
  it('permite observar y ajustar con autorización, sin omitir motivo, versión o reservas', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '20' }] }).expect(200);
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/block', {}).expect(200);
    const invalid = await count(f, d, '5');
    await f.mutate(f.admin, 'post', '/counts/' + invalid.id + '/adjustment', { reason: 'No consumir compromisos' }).expect(409);
    const valid = await count(f, d, '80');
    await f.mutate(f.admin, 'post', '/counts/' + valid.id + '/adjustment', { reason: '' }).expect(422);
    const adjusted = await f.mutate(f.admin, 'post', '/counts/' + valid.id + '/adjustment', { reason: 'Corrección física verificada sin liberar reserva' }).expect(200);
    expect(adjusted.body.data.result.balance).toMatchObject({ physical: '80', reserved: '20', available: '0', blocked: true });
    expect((await f.get(f.admin, '/counts/' + invalid.id).expect(200)).body.data.adjusted).toBe(false);
    expect((await f.mutate(f.admin, 'post', '/counts/' + invalid.id + '/adjustment', { reason: 'Referencia anterior al ajuste' }).expect(409)).body.error.code).toBe('COUNT_STALE');
    expect((await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data.lines[0].reserved).toBe('20');
  });
});
