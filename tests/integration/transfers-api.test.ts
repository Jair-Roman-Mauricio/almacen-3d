import { workflowRace } from './workflow-race.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(6);
});
afterAll(async () => {
  await f?.close();
});
async function transferScene(quantity = '20', stock = '100') {
  const source = await outboundScene(f, stock), target = await outboundScene(f, '0');
  const body = { code: randomUUID(), sourceWarehouseId: source.warehouse, targetWarehouseId: target.warehouse, lines: [{ productId: source.product, sourceLocationId: source.a, quantity }] };
  return { source, target, body };
}
describe('I-TRA/registro-consulta', () => {
  it('registra origen declarado sin consumir stock y consulta ambas rutas por empresa', async () => {
    const d = await transferScene();
    const registered = await f.mutate(f.admin, 'post', '/transfers', d.body).expect(201);
    const transfer = registered.body.data.result;
    expect(transfer).toMatchObject({ sourceWarehouseId: d.source.warehouse, targetWarehouseId: d.target.warehouse, status: 'registered', departureReference: null, lines: [{ product: { id: d.source.product }, sourceLocationId: d.source.a, declared: '20', departed: '0', received: '0', inTransit: '0' }] });
    expect((await f.get(f.admin, '/transfers/' + transfer.id).expect(200)).body.data).toEqual(transfer);
    for (const warehouseId of [d.source.warehouse, d.target.warehouse])
      expect((await f.get(f.admin, '/transfers').query({ warehouseId, status: 'registered' }).expect(200)).body.data.map((x: {
        id: string;
      }) => x.id)).toContain(transfer.id);
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.source.warehouse])).rows).toEqual([{ physical: '100', reserved: '0' }]);
    await f.mutate(f.admin, 'post', '/transfers', { ...d.body, code: randomUUID(), targetWarehouseId: d.source.warehouse }).expect(422);
    await f.get(f.other, '/transfers/' + transfer.id).expect(404);
    await f.get(f.other, '/transfers').query({ warehouseId: d.source.warehouse }).expect(404);
    await f.mutate(f.other, 'post', '/transfers', d.body).expect(404);
    const layout = (await f.get(f.admin, '/warehouses/' + d.source.warehouse + '/layout').expect(200)).body.data;
    await f.mutate(f.admin, 'put', '/warehouses/' + d.source.warehouse + '/layout', { baseRevision: layout.revision, elements: layout.elements.map((e: {
        id: string;
        position: {
          x: string;
          y: string;
          z: string;
        };
      }) => e.id === d.source.zone ? { ...e, position: { ...e.position, x: '1' } } : e) }).expect(409);
    const empty = await transferScene('20', '0');
    await f.mutate(f.admin, 'post', '/transfers', empty.body).expect(201);
    const emptyLayout = (await f.get(f.admin, '/warehouses/' + empty.source.warehouse + '/layout').expect(200)).body.data;
    const rejected = await f.mutate(f.admin, 'put', '/warehouses/' + empty.source.warehouse + '/layout', { baseRevision: emptyLayout.revision, elements: emptyLayout.elements.map((e: {
        id: string;
        position: {
          x: string;
          y: string;
          z: string;
        };
      }) => e.id === empty.source.zone ? { ...e, position: { ...e.position, x: '1' } } : e) }).expect(409);
    expect(rejected.body.error.code).toBe('OPEN_WORK');
  });
});
async function registered(quantity = '20') {
  const d = await transferScene(quantity);
  const transfer = (await f.mutate(f.admin, 'post', '/transfers', d.body).expect(201)).body.data.result;
  return { ...d, transfer };
}
describe('I-TRA/salida-100-20', () => {
  it('confirma cantidades declaradas completas, dejando 80 físicas y 20 en tránsito sin sumar destino', async () => {
    const d = await registered(), reference = randomUUID(), lineId = d.transfer.lines[0].id;
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', { lines: [{ transferLineId: lineId, quantity: '19' }] }).expect(422);
    const result = await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', { lines: [{ transferLineId: lineId, quantity: '20' }] }, reference).expect(200);
    expect(result.body.data.result).toMatchObject({ historyId: reference, transfer: { status: 'in_transit', departureReference: reference, lines: [{ declared: '20', departed: '20', received: '0', inTransit: '20' }] } });
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.source.warehouse])).rows).toEqual([{ physical: '80', reserved: '0' }]);
    expect((await f.get(f.admin, '/inventory/totals').query({ warehouseId: d.target.warehouse }).expect(200)).body.data).toEqual([]);
    expect((await f.db.owner.query('SELECT physical_delta::text,transit_delta::text,transfer_id,actor_id FROM app.inventory_entries WHERE operation_reference=$1', [reference])).rows).toEqual([{ physical_delta: '-20', transit_delta: '20', transfer_id: d.transfer.id, actor_id: f.admin.actor }]);
  });
});
async function departed(quantity = '20') {
  const d = await registered(quantity);
  const body = { lines: d.transfer.lines.map((line: {
      id: string;
      declared: string;
    }) => ({ transferLineId: line.id, quantity: line.declared })) };
  await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', body).expect(200);
  return { ...d, departureBody: body };
}
describe('I-TRA/recepcion', () => {
  it('recibe por cantidades parciales y ubicaciones de destino hasta agotar todas las líneas', async () => {
    const notDeparted = await registered();
    await f.mutate(f.admin, 'post', '/transfers/' + notDeparted.transfer.id + '/receipts', { lines: [{ transferLineId: notDeparted.transfer.lines[0].id, targetLocationId: notDeparted.target.a, quantity: '1' }] }).expect(409);
    const d = await departed(), lineId = d.transfer.lines[0].id;
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: lineId, targetLocationId: d.source.a, quantity: '1' }] }).expect(404);
    const partial = await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: lineId, targetLocationId: d.target.a, quantity: '3' }, { transferLineId: lineId, targetLocationId: d.target.a, quantity: '4' }] }).expect(200);
    expect(partial.body.data.result.transfer).toMatchObject({ status: 'in_transit', lines: [{ received: '7', inTransit: '13' }] });
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: lineId, targetLocationId: d.target.a, quantity: '14' }] }).expect(409);
    const completed = await f.mutate(await f.role('operator'), 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: lineId, targetLocationId: d.target.a, quantity: '5' }, { transferLineId: lineId, targetLocationId: d.target.b, quantity: '8' }] }).expect(200);
    expect(completed.body.data.result.transfer).toMatchObject({ status: 'received', lines: [{ declared: '20', departed: '20', received: '20', inTransit: '0' }] });
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1 ORDER BY app.stock_balances.physical', [d.target.warehouse])).rows).toEqual([{ physical: '8' }, { physical: '12' }]);
    expect((await f.db.owner.query('SELECT * FROM app.transfer_receipts WHERE transfer_id=$1', [d.transfer.id])).rowCount).toBe(2);
    expect((await f.db.owner.query('SELECT * FROM app.transfer_receipt_lines WHERE transfer_id=$1', [d.transfer.id])).rowCount).toBe(3);
  });
});
describe('I-TRA/etapas-concurrentes', () => {
  it('conserva replays anteriores tras recibir y rechaza una segunda salida nueva', async () => {
    const d = await registered(), reference = randomUUID(), body = { lines: [{ transferLineId: d.transfer.lines[0].id, quantity: '20' }] };
    const original = await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', body, reference).expect(200);
    const receiptRef = randomUUID(), receiptBody = { lines: [{ transferLineId: d.transfer.lines[0].id, targetLocationId: d.target.a, quantity: '7' }] };
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', receiptBody, receiptRef), () => f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', receiptBody, receiptRef));
    expect(results.map(r => r.status)).toEqual([200, 200]);
    expect(results[1]!.body).toEqual(results[0]!.body);
    expect(results[1]!.headers['idempotent-replayed']).toBe('true');
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: d.transfer.lines[0].id, targetLocationId: d.target.b, quantity: '13' }] }).expect(200);
    expect((await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', body, reference).expect(200)).body).toEqual(original.body);
    expect((await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', receiptBody, receiptRef).expect(200)).body).toEqual(results[0]!.body);
    expect((await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', body).expect(409)).body.error.code).toBe('ALREADY_DEPARTED');
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ ...receiptBody.lines[0]!, quantity: '8' }] }, receiptRef).expect(409);
    expect((await f.db.owner.query('SELECT * FROM app.transfer_receipts WHERE transfer_id=$1', [d.transfer.id])).rowCount).toBe(2);
  });
  it('recepciones nuevas concurrentes no exceden el tránsito común de una línea', async () => {
    const d = await departed();
    const make = (targetLocationId: string) => ({ lines: [{ transferLineId: d.transfer.lines[0].id, targetLocationId, quantity: '6' }, { transferLineId: d.transfer.lines[0].id, targetLocationId, quantity: '6' }] });
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', make(d.target.a)), () => f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', make(d.target.b)));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('TRANSIT_BALANCE_EXCEEDED');
    expect((await f.get(f.admin, '/transfers/' + d.transfer.id).expect(200)).body.data.lines[0]).toMatchObject({ received: '12', inTransit: '8' });
  });
});
async function conservation(product: string) {
  const row = (await f.db.owner.query(`WITH totals AS(SELECT coalesce((SELECT sum(physical) FROM app.stock_balances WHERE tenant_id=$1 AND product_id=$2),0) AS physical,coalesce((SELECT sum(reserved) FROM app.stock_balances WHERE tenant_id=$1 AND product_id=$2),0) AS reserved,coalesce((SELECT sum(in_transit) FROM app.transfer_lines WHERE tenant_id=$1 AND product_id=$2),0) AS transit,coalesce((SELECT sum(physical_delta) FROM app.inventory_entries WHERE tenant_id=$1 AND product_id=$2),0) AS book_physical,coalesce((SELECT sum(reserved_delta) FROM app.inventory_entries WHERE tenant_id=$1 AND product_id=$2),0) AS book_reserved,coalesce((SELECT sum(transit_delta) FROM app.inventory_entries WHERE tenant_id=$1 AND product_id=$2),0) AS book_transit) SELECT physical+transit=100 AND physical=book_physical AND reserved=book_reserved AND transit=book_transit AS valid FROM totals`, [f.admin.tenant, product])).rows[0];
  expect(row.valid).toBe(true);
}
describe('I-TRA/conservacion-y-bloqueo', () => {
  it('conserva físico más tránsito, protege reservas y rechaza extremos bloqueados sin consumir tránsito', async () => {
    const d = await registered(), order = await createOrder(f, d.source.warehouse, d.source.product);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.source.a, quantity: '90' }] }).expect(200);
    const departure = { lines: [{ transferLineId: d.transfer.lines[0].id, quantity: '20' }] };
    expect((await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', departure).expect(409)).body.error.code).toBe('INSUFFICIENT_AVAILABLE');
    await conservation(d.source.product);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/cancellation', {}).expect(200);
    await f.mutate(f.admin, 'post', '/locations/' + d.source.a + '/block', {}).expect(200);
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', departure).expect(409);
    await conservation(d.source.product);
    await f.mutate(f.admin, 'post', '/locations/' + d.source.a + '/unblock', { reason: 'Origen liberado' }).expect(200);
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', departure).expect(200);
    await conservation(d.source.product);
    const targetOrder = await createOrder(f, d.target.warehouse, d.source.product, '1');
    await f.mutate(f.admin, 'post', '/orders/' + targetOrder.id + '/reservations', { lines: [{ orderLineId: targetOrder.lines[0].id, sourceLocationId: d.target.a, quantity: '1' }] }).expect(409);
    await f.mutate(f.admin, 'post', '/locations/' + d.target.a + '/block', {}).expect(200);
    const receipt = { lines: [{ transferLineId: d.transfer.lines[0].id, targetLocationId: d.target.a, quantity: '20' }] };
    expect((await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', receipt).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    await conservation(d.source.product);
    await f.mutate(f.admin, 'post', '/locations/' + d.target.a + '/unblock', { reason: 'Destino liberado' }).expect(200);
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', receipt).expect(200);
    await conservation(d.source.product);
  });
  it('revierte físico, tránsito, recibos y resultado ante fallos intermedios en ambas etapas', async () => {
    const d = await registered('21'), departure = { lines: [{ transferLineId: d.transfer.lines[0].id, quantity: '21' }] }, failedDeparture = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_transfer_departure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.departed=21 THEN RAISE EXCEPTION 'Fallo sintético salida después de físico'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_transfer_departure BEFORE UPDATE ON app.transfer_lines FOR EACH ROW EXECUTE FUNCTION app.fail_transfer_departure()");
    try {
      await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', departure, failedDeparture).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_transfer_departure ON app.transfer_lines;DROP FUNCTION app.fail_transfer_departure()');
    }
    await conservation(d.source.product);
    expect((await f.get(f.admin, '/transfers/' + d.transfer.id).expect(200)).body.data.status).toBe('registered');
    await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/departure', departure).expect(200);
    await conservation(d.source.product);
    const failedReceipt = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_transfer_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético recepción después de físico'; END $$;CREATE TRIGGER fail_transfer_receipt BEFORE INSERT ON app.transfer_receipt_lines FOR EACH ROW EXECUTE FUNCTION app.fail_transfer_receipt()");
    try {
      await f.mutate(f.admin, 'post', '/transfers/' + d.transfer.id + '/receipts', { lines: [{ transferLineId: d.transfer.lines[0].id, targetLocationId: d.target.a, quantity: '7' }] }, failedReceipt).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_transfer_receipt ON app.transfer_receipt_lines;DROP FUNCTION app.fail_transfer_receipt()');
    }
    await conservation(d.source.product);
    expect((await f.db.owner.query('SELECT * FROM app.transfer_receipts WHERE transfer_id=$1', [d.transfer.id])).rowCount).toBe(0);
    expect((await f.db.owner.query('SELECT * FROM app.commands WHERE reference=ANY($1::uuid[])', [[failedDeparture, failedReceipt]])).rowCount).toBe(0);
    expect((await f.get(f.admin, '/transfers/' + d.transfer.id).expect(200)).body.data.lines[0].inTransit).toBe('21');
  });
});
