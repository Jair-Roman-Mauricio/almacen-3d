import { workflowRace } from './workflow-race.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, productInput, type OperationsFixture } from './operations-fixture.js';
import { outboundScene, createOrder, extraOperator } from './outbound-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(6);
});
afterAll(async () => {
  await f?.close();
});
describe('I-OUT/alta-consulta-pedido', () => {
  it('crea, lista y lee líneas con sus saldos exactos; rechaza duplicados/cantidades inválidas', async () => {
    const d = await outboundScene(f), supervisor = await f.role('supervisor');
    const input = { code: ' SALIDA/1 ', warehouseId: d.warehouse, lines: [{ productId: d.product, quantity: '100' }] };
    const created = await f.mutate(supervisor, 'post', '/orders', input).expect(201);
    const order = created.body.data.result;
    expect(order).toMatchObject({ code: 'SALIDA/1', warehouseId: d.warehouse, status: 'pending', assignedOperator: null, lines: [{ product: { id: d.product }, requested: '100', dispatched: '0', pending: '100', pendingReserve: '100', reserved: '0', preparedPending: '0', allocations: [] }] });
    expect((await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data).toEqual(order);
    expect((await f.get(f.admin, '/orders').query({ warehouseId: d.warehouse, status: 'pending', q: 'salida' }).expect(200)).body.data).toHaveLength(1);
    await f.mutate(f.admin, 'post', '/orders', { ...input, code: 'salida/1' }).expect(409);
    for (const quantity of ['0', '-1', '0.1', '1.0001', 'NaN'])
      await f.mutate(f.admin, 'post', '/orders', { ...input, code: randomUUID(), lines: [{ productId: d.product, quantity }] }).expect(422);
    await f.get(f.other, '/orders/' + order.id).expect(404);
    await f.get(f.other, '/orders').query({ warehouseId: d.warehouse }).expect(404);
  });
});
describe('I-OUT/reserva-parcial', () => {
  it('reserva 40 de 100 sin cambiar físico/revisión y rechaza saldo, ubicación o cantidad inválidos', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product), lineId = order.lines[0].id;
    const reservation = { orderLineId: lineId, sourceLocationId: d.a, quantity: '40' };
    const result = await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [reservation] }).expect(200);
    expect(result.body.data.result.lines[0]).toMatchObject({ requested: '100', dispatched: '0', pending: '100', pendingReserve: '60', reserved: '40', preparedPending: '0', allocations: [{ locationId: d.a, reserved: '40', preparedPending: '0', pendingPrepare: '40' }] });
    expect((await f.get(f.admin, '/locations/' + d.a + '/inventory').expect(200)).body.data[0]).toMatchObject({ physical: '100', reserved: '40', available: '60' });
    expect((await f.db.owner.query('SELECT physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0].physical_revision).toBe('1');
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ ...reservation, quantity: '30' }, { ...reservation, quantity: '31' }] }).expect(409);
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/block', {}).expect(200);
    expect((await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ ...reservation, quantity: '1' }] }).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ ...reservation, orderLineId: randomUUID(), quantity: '1' }] }).expect(404);
    expect((await f.db.owner.query('SELECT reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0].reserved).toBe('40');
  });
});
describe('I-OUT/reserva-concurrente', () => {
  it('dos pedidos no reservan más físico del disponible en una posición', async () => {
    const d = await outboundScene(f, '10'), a = await createOrder(f, d.warehouse, d.product, '10'), b = await createOrder(f, d.warehouse, d.product, '10');
    const reserve = (order: typeof a) => f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '6' }] });
    const results = await workflowRace(f, 'stock_balances', () => reserve(a), () => reserve(b));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('INSUFFICIENT_AVAILABLE');
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '10', reserved: '6' }]);
  });
  it('el saldo de línea limita competidores aunque sobre stock en otros orígenes', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product, '10');
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: d.product, targetLocationId: d.b, quantity: '100' }] }).expect(201);
    const first = { orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '3' }, second = { ...first, sourceLocationId: d.b, quantity: '6' };
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [first, first] }), () => f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [second] }));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('ORDER_BALANCE_EXCEEDED');
    expect((await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data.lines[0]).toMatchObject({ reserved: '6', pendingReserve: '4' });
  });
});
describe('I-OUT/asignacion', () => {
  it('asigna/reasigna un operario activo propio con auditoría y conserva saldos anteriores', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product), operator = await f.role('operator'), another = await extraOperator(f);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '20' }] }).expect(200);
    const before = (await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data.lines;
    const reference = randomUUID();
    const assigned = await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: operator.actor }, reference).expect(200);
    expect(assigned.body.data.result.order.assignedOperator).toMatchObject({ id: operator.actor, role: 'operator', active: true });
    expect(assigned.body.data.result.order.lines).toEqual(before);
    expect((await f.db.owner.query('SELECT actor_id,operation_reference FROM app.audit_events WHERE id=$1', [assigned.body.data.result.auditId])).rows[0]).toEqual({ actor_id: f.admin.actor, operation_reference: reference });
    const reassigned = await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: another.actor }).expect(200);
    expect(reassigned.body.data.result.order.lines).toEqual(before);
    expect((await f.get(another, '/orders').query({ warehouseId: d.warehouse, assignedToMe: 'true' }).expect(200)).body.data.map((x: {
      id: string;
    }) => x.id)).toContain(order.id);
    expect((await f.get(operator, '/orders').query({ warehouseId: d.warehouse, assignedToMe: 'true' }).expect(200)).body.data).toEqual([]);
    await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: f.other.actor }).expect(404);
    await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: f.admin.actor }).expect(422);
    await f.mutate(f.admin, 'patch', '/users/' + another.actor, { active: false }).expect(200);
    await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: another.actor }).expect(422);
  });
});
describe('I-OUT/picking-parcial', () => {
  it('prepara solo una reserva propia asignada sin reducir físico o reservas', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product), operator = await f.role('operator'), other = await extraOperator(f);
    const reserved = (await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '40' }] }).expect(200)).body.data.result;
    const allocationId = reserved.lines[0].allocations[0].id;
    await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: operator.actor }).expect(200);
    const prepared = await f.mutate(operator, 'post', '/orders/' + order.id + '/preparations', { lines: [{ allocationId, quantity: '15' }] }).expect(200);
    expect(prepared.body.data.result.lines[0]).toMatchObject({ reserved: '40', preparedPending: '15', allocations: [{ pendingPrepare: '25' }] });
    expect((await f.db.owner.query('SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '100', reserved: '40', physical_revision: '1' }]);
    expect((await f.mutate(other, 'post', '/orders/' + order.id + '/preparations', { lines: [{ allocationId, quantity: '1' }] }).expect(403)).body.error.code).toBe('NOT_ASSIGNED');
    expect((await f.mutate(operator, 'post', '/orders/' + order.id + '/preparations', { lines: [{ allocationId, quantity: '13' }, { allocationId, quantity: '13' }] }).expect(409)).body.error.code).toBe('PREPARATION_BALANCE_EXCEEDED');
    await f.mutate(operator, 'post', '/orders/' + order.id + '/preparations', { lines: [{ allocationId: randomUUID(), quantity: '1' }] }).expect(404);
  });
});
async function picking(f: OperationsFixture, quantity = '10') {
  const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product), operator = await extraOperator(f);
  const reserved = (await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity }] }).expect(200)).body.data.result;
  await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: operator.actor }).expect(200);
  return { ...d, order, operator, allocationId: reserved.lines[0].allocations[0].id as string };
}
describe('I-OUT/picking-carrera', () => {
  it('dos avances simultáneos no exceden la reserva pendiente de preparar', async () => {
    const d = await picking(f);
    const line = { allocationId: d.allocationId, quantity: '3' };
    const results = await workflowRace(f, 'allocations', () => f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [line, line] }), () => f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ ...line, quantity: '6' }] }));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('PREPARATION_BALANCE_EXCEEDED');
  });
  it('una reasignación confirmada revoca al operario anterior y conserva los avances', async () => {
    const d = await picking(f), next = await extraOperator(f);
    await f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity: '3' }] }).expect(200);
    const results = await workflowRace(f, 'orders', () => f.mutate(f.admin, 'put', '/orders/' + d.order.id + '/assignment', { operatorId: next.actor }), () => f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity: '1' }] }));
    expect(results.map(r => r.status)).toEqual([200, 403]);
    expect(results[1]!.body.error.code).toBe('NOT_ASSIGNED');
    const progress = await f.mutate(next, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity: '1' }] }).expect(200);
    expect(progress.body.data.result.lines[0].preparedPending).toBe('4');
  });
  it('una desactivación confirmada antes del avance impide usar una sesión abierta', async () => {
    const d = await picking(f);
    const results = await workflowRace(f, 'users', () => f.mutate(f.admin, 'patch', '/users/' + d.operator.actor, { active: false }), () => f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity: '1' }] }));
    expect(results.map(r => r.status)).toEqual([200, 401]);
    expect((await f.get(f.admin, '/orders/' + d.order.id).expect(200)).body.data.lines[0].preparedPending).toBe('0');
  });
});
describe('I-OUT/despacho-parcial', () => {
  it('consume físico/reserva/preparación juntos y revierte un fallo intermedio', async () => {
    const d = await picking(f, '40');
    await f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity: '40' }] }).expect(200);
    const reference = randomUUID();
    const dispatched = await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', { lines: [{ allocationId: d.allocationId, quantity: '15' }] }, reference).expect(200);
    expect(dispatched.body.data.result).toMatchObject({ historyId: reference, order: { status: 'partially_dispatched', lines: [{ dispatched: '15', reserved: '25', preparedPending: '25', pending: '85', pendingReserve: '60' }] } });
    const read = () => f.db.owner.query('SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse]);
    expect((await read()).rows).toEqual([{ physical: '85', reserved: '25', physical_revision: '2' }]);
    expect((await f.db.owner.query('SELECT physical_delta::text,reserved_delta::text FROM app.inventory_entries WHERE operation_reference=$1', [reference])).rows).toEqual([{ physical_delta: '-15', reserved_delta: '-15' }]);
    const failedReference = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_dispatch_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.prepared_pending=18 THEN RAISE EXCEPTION 'Fallo sintético después del descuento físico'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_dispatch_allocation BEFORE UPDATE ON app.allocations FOR EACH ROW EXECUTE FUNCTION app.fail_dispatch_allocation()");
    try {
      await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', { lines: [{ allocationId: d.allocationId, quantity: '7' }] }, failedReference).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_dispatch_allocation ON app.allocations;DROP FUNCTION app.fail_dispatch_allocation()');
    }
    expect((await read()).rows).toEqual([{ physical: '85', reserved: '25', physical_revision: '2' }]);
    expect((await f.db.owner.query('SELECT * FROM app.commands WHERE reference=$1', [failedReference])).rowCount).toBe(0);
    expect((await f.get(f.admin, '/orders/' + d.order.id).expect(200)).body.data.lines[0].dispatched).toBe('15');
  });
});
async function ready(f: OperationsFixture, quantity = '10') {
  const d = await picking(f, quantity);
  await f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: d.allocationId, quantity }] }).expect(200);
  return d;
}
describe('I-OUT/despacho-repetido-concurrente', () => {
  it('un replay simultáneo conserva resultado original y una referencia nueva no consume preparación agotada', async () => {
    const d = await ready(f), reference = randomUUID(), body = { lines: [{ allocationId: d.allocationId, quantity: '5' }] };
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body, reference), () => f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body, reference));
    expect(results.map(r => r.status)).toEqual([200, 200]);
    expect(results[1]!.body).toEqual(results[0]!.body);
    expect(results[1]!.headers['idempotent-replayed']).toBe('true');
    await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body).expect(200);
    await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body).expect(409);
    await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', { lines: [{ allocationId: d.allocationId, quantity: '4' }] }, reference).expect(409);
    expect((await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body, reference).expect(200)).body).toEqual(results[0]!.body);
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '90', reserved: '0' }]);
  });
  it('despachos nuevos concurrentes no exceden la cantidad preparada conjunta', async () => {
    const d = await ready(f), body = { lines: [{ allocationId: d.allocationId, quantity: '6' }] };
    const results = await workflowRace(f, 'stock_balances', () => f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body), () => f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', body));
    expect(results.map(r => r.status)).toEqual([200, 409]);
    expect(results[1]!.body.error.code).toBe('PREPARED_BALANCE_EXCEEDED');
    expect((await f.get(f.admin, '/orders/' + d.order.id).expect(200)).body.data.lines[0]).toMatchObject({ dispatched: '6', reserved: '4', preparedPending: '4' });
  });
});
describe('I-OUT/ciclo-100-40-60', () => {
  it('solo cierra el pedido tras completar los avances de 40 y 60', async () => {
    const d = await picking(f, '40');
    let allocation = d.allocationId;
    for (const quantity of ['40', '60']) {
      if (quantity === '60') {
        const reserved = await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/reservations', { lines: [{ orderLineId: d.order.lines[0].id, sourceLocationId: d.a, quantity }] }).expect(200);
        allocation = reserved.body.data.result.lines[0].allocations[0].id;
      }
      await f.mutate(d.operator, 'post', '/orders/' + d.order.id + '/preparations', { lines: [{ allocationId: allocation, quantity }] }).expect(200);
      const dispatched = await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/dispatches', { lines: [{ allocationId: allocation, quantity }] }).expect(200);
      expect(dispatched.body.data.result.order).toMatchObject({ status: quantity === '40' ? 'partially_dispatched' : 'dispatched', lines: [{ dispatched: quantity === '40' ? '40' : '100', pending: quantity === '40' ? '60' : '0', pendingReserve: quantity === '40' ? '60' : '0', reserved: '0', preparedPending: '0' }] });
    }
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '0', reserved: '0' }]);
  });
  it('deriva el cierre por todas las líneas sin sumar unidades incompatibles', async () => {
    const d = await outboundScene(f);
    const weight = (await f.mutate(f.admin, 'post', '/products', productInput(randomUUID(), 'weight')).expect(201)).body.data.result.id as string;
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: weight, targetLocationId: d.a, quantity: '1000.5' }] }).expect(201);
    const order = (await f.mutate(f.admin, 'post', '/orders', { code: randomUUID(), warehouseId: d.warehouse, lines: [{ productId: d.product, quantity: '1' }, { productId: weight, quantity: '1000.5' }] }).expect(201)).body.data.result;
    const reserved = (await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', { lines: order.lines.map((line: {
        id: string;
        requested: string;
      }) => ({ orderLineId: line.id, sourceLocationId: d.a, quantity: line.requested })) }).expect(200)).body.data.result;
    const actions = reserved.lines.map((line: {
      product: {
        id: string;
      };
      allocations: {
        id: string;
      }[];
      requested: string;
    }) => ({ productId: line.product.id, allocationId: line.allocations[0]!.id, quantity: line.requested }));
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/preparations', { lines: actions.map((a: {
        allocationId: string;
        quantity: string;
      }) => ({ allocationId: a.allocationId, quantity: a.quantity })) }).expect(200);
    for (const productId of [d.product, weight]) {
      const action = actions.find((a: {
        productId: string;
      }) => a.productId === productId)!;
      const result = await f.mutate(f.admin, 'post', '/orders/' + order.id + '/dispatches', { lines: [{ allocationId: action.allocationId, quantity: action.quantity }] }).expect(200);
      expect(result.body.data.result.order.status).toBe(productId === d.product ? 'partially_dispatched' : 'dispatched');
    }
  });
});
describe('I-OUT/cancelacion', () => {
  it('libera reservas sin alterar físico ni historia; rechaza cancelación con preparación/despacho', async () => {
    const d = await picking(f, '40');
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/block', {}).expect(200);
    const reference = randomUUID();
    const cancelled = await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/cancellation', {}, reference).expect(200);
    expect(cancelled.body.data.result).toMatchObject({ status: 'cancelled', lines: [{ reserved: '0', preparedPending: '0', dispatched: '0' }] });
    expect((await f.db.owner.query('SELECT physical::text,reserved::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '100', reserved: '0', physical_revision: '1' }]);
    expect((await f.db.owner.query('SELECT reserved_delta::text FROM app.inventory_entries WHERE operation_reference=$1', [reference])).rows).toEqual([{ reserved_delta: '-40' }]);
    await f.mutate(f.admin, 'post', '/orders/' + d.order.id + '/cancellation', {}).expect(409);
    const prepared = await ready(f);
    expect((await f.mutate(f.admin, 'post', '/orders/' + prepared.order.id + '/cancellation', {}).expect(409)).body.error.code).toBe('ORDER_ALREADY_PREPARED');
    await f.mutate(f.admin, 'post', '/orders/' + prepared.order.id + '/dispatches', { lines: [{ allocationId: prepared.allocationId, quantity: '5' }] }).expect(200);
    expect((await f.mutate(f.admin, 'post', '/orders/' + prepared.order.id + '/cancellation', {}).expect(409)).body.error.code).toBe('ORDER_ALREADY_DISPATCHED');
    expect((await f.get(f.admin, '/orders/' + prepared.order.id).expect(200)).body.data.lines[0]).toMatchObject({ reserved: '5', preparedPending: '5', dispatched: '5' });
  });
});
describe('I-BLK/salida-suspendida', () => {
  it('suspende acciones nuevas y conserva replays y compromisos hasta confirmación manual tras desbloquear', async () => {
    const d = await outboundScene(f), order = await createOrder(f, d.warehouse, d.product), operator = await extraOperator(f), reserveRef = randomUUID(), prepareRef = randomUUID(), dispatchRef = randomUUID();
    const reserveBody = { lines: [{ orderLineId: order.lines[0].id, sourceLocationId: d.a, quantity: '40' }] };
    const reserved = await f.mutate(f.admin, 'post', '/orders/' + order.id + '/reservations', reserveBody, reserveRef).expect(200);
    const allocationId = reserved.body.data.result.lines[0].allocations[0].id;
    await f.mutate(f.admin, 'put', '/orders/' + order.id + '/assignment', { operatorId: operator.actor }).expect(200);
    const prepareBody = { lines: [{ allocationId, quantity: '20' }] }, dispatchBody = { lines: [{ allocationId, quantity: '5' }] };
    const prepared = await f.mutate(operator, 'post', '/orders/' + order.id + '/preparations', prepareBody, prepareRef).expect(200), dispatched = await f.mutate(f.admin, 'post', '/orders/' + order.id + '/dispatches', dispatchBody, dispatchRef).expect(200);
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/block', {}).expect(200);
    for (const [path, who, body] of [['reservations', f.admin, { lines: [{ ...reserveBody.lines[0]!, quantity: '1' }] }], ['preparations', operator, { lines: [{ allocationId, quantity: '1' }] }], ['dispatches', f.admin, { lines: [{ allocationId, quantity: '1' }] }]] as const)
      expect((await f.mutate(who, 'post', '/orders/' + order.id + '/' + path, body).expect(409)).body.error.code).toBe('LOCATION_BLOCKED');
    for (const [path, who, body, reference, original] of [['reservations', f.admin, reserveBody, reserveRef, reserved], ['preparations', operator, prepareBody, prepareRef, prepared], ['dispatches', f.admin, dispatchBody, dispatchRef, dispatched]] as const) {
      const replay = await f.mutate(who, 'post', '/orders/' + order.id + '/' + path, body, reference).expect(200);
      expect(replay.body).toEqual(original.body);
      expect(replay.headers['idempotent-replayed']).toBe('true');
    }
    await f.mutate(f.admin, 'post', '/locations/' + d.a + '/unblock', { reason: 'Trabajo puede continuar' }).expect(200);
    expect((await f.get(f.admin, '/orders/' + order.id).expect(200)).body.data.lines[0]).toMatchObject({ dispatched: '5', reserved: '35', preparedPending: '15' });
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '95', reserved: '35' }]);
    await f.mutate(f.admin, 'post', '/orders/' + order.id + '/dispatches', { lines: [{ allocationId, quantity: '1' }] }).expect(200);
    expect((await f.db.owner.query('SELECT physical::text,reserved::text FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows).toEqual([{ physical: '94', reserved: '34' }]);
  });
});
