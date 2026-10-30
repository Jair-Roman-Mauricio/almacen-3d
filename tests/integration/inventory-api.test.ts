import request from 'supertest';
interface LossRequest {
  method: string;
  path: string;
}
interface LossResponse {
  json: (body: unknown) => LossResponse;
  destroy(): void;
}
import { createApplication } from '../../apps/api/dist/create-application.js';
import { origin } from './operations-fixture.js';
import { waitForBlockedBy } from './concurrency-helpers.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, simpleLayout, warehouseInput, type OperationsFixture } from './operations-fixture.js';
import { seedWarehouse, seedProduct, seedStock } from './schema-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(6);
});
afterAll(async () => {
  await f?.close();
});
describe('I-INV/consultas-saldos', () => {
  it('consulta varios productos por ubicación y totales exactos por unidad y almacén', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), other = await seedWarehouse(f.db.owner, f.admin.tenant), a = await seedProduct(f.db.owner, f.admin.tenant), b = await seedProduct(f.db.owner, f.admin.tenant);
    await seedStock(f.db.owner, f.admin.tenant, w.warehouse, w.location, a);
    await seedStock(f.db.owner, f.admin.tenant, other.warehouse, other.location, a);
    await f.db.owner.query("UPDATE app.products SET unit_kind='weight',unit_label='kg' WHERE tenant_id=$1 AND id=$2", [f.admin.tenant, b]);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id,physical,reserved) VALUES ($1,$2,$3,$4,1.125,0.125)', [f.admin.tenant, w.warehouse, w.location, b]);
    const inventory = await f.get(f.admin, '/inventory').query({ warehouseId: w.warehouse, limit: 1 }).expect(200);
    expect(inventory.body.data).toHaveLength(1);
    expect(inventory.body.page.nextCursor).toEqual(expect.any(String));
    const detail = await f.get(f.admin, '/locations/' + w.location + '/inventory').expect(200);
    expect(detail.body.data).toHaveLength(2);
    expect(detail.body.data.find((s: {
      product: {
        id: string;
      };
    }) => s.product.id === b)).toMatchObject({ physical: '1.125', reserved: '0.125', available: '1', product: { unit: { kind: 'weight', label: 'kg' } } });
    const totals = await f.get(f.admin, '/inventory/totals').query({ warehouseId: w.warehouse }).expect(200);
    expect(totals.body.data).toHaveLength(2);
    expect(totals.body.data.find((s: {
      product: {
        id: string;
      };
    }) => s.product.id === a).physical).toBe('100');
    await f.db.owner.query('UPDATE app.layout_elements SET blocked=true WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, w.location]);
    expect((await f.get(f.admin, '/inventory/totals').query({ warehouseId: w.warehouse }).expect(200)).body.data.every((s: {
      available: string;
    }) => s.available === '0')).toBe(true);
    await f.get(f.other, '/inventory').query({ warehouseId: w.warehouse }).expect(404);
    await f.get(f.admin, '/inventory').expect(400);
  });
});
describe('I-INV/recepcion', () => {
  it('agrega líneas repetidas, valida unidades y confirma libro, revisión y resultado juntos', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant), reference = randomUUID();
    const body = { warehouseId: w.warehouse, lines: [{ productId: product, targetLocationId: w.location, quantity: '2' }, { productId: product, targetLocationId: w.location, quantity: '3' }] };
    const received = await f.mutate(f.admin, 'post', '/receipts', body, reference).expect(201);
    expect(received.body.data.result).toMatchObject({ historyId: reference, balances: [{ product: { id: product }, physical: '5', reserved: '0', available: '5' }] });
    expect((await f.db.owner.query('SELECT physical_revision::text FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2', [f.admin.tenant, w.warehouse])).rows[0].physical_revision).toBe('1');
    expect((await f.db.owner.query('SELECT physical_delta::text FROM app.inventory_entries WHERE tenant_id=$1 AND operation_reference=$2', [f.admin.tenant, reference])).rows).toEqual([{ physical_delta: '5' }]);
    for (const quantity of ['0', '-1', '0.5', '1.0001', 'NaN'])
      await f.mutate(f.admin, 'post', '/receipts', { warehouseId: w.warehouse, lines: [{ productId: product, targetLocationId: w.location, quantity }] }).expect(422);
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: w.warehouse, lines: [{ productId: randomUUID(), targetLocationId: w.location, quantity: '1' }] }).expect(404);
  });
  it('revierte todos los saldos/asientos/resultados si falla una línea al persistir', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), a = await seedProduct(f.db.owner, f.admin.tenant), b = await seedProduct(f.db.owner, f.admin.tenant), reference = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_receipt_line() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.physical=7 THEN RAISE EXCEPTION 'Fallo sintético segunda línea'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_receipt_line BEFORE UPDATE ON app.stock_balances FOR EACH ROW EXECUTE FUNCTION app.fail_receipt_line()");
    try {
      await f.mutate(f.admin, 'post', '/receipts', { warehouseId: w.warehouse, lines: [{ productId: [a, b].sort()[0]!, targetLocationId: w.location, quantity: '3' }, { productId: [a, b].sort()[1]!, targetLocationId: w.location, quantity: '7' }] }, reference).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_receipt_line ON app.stock_balances;DROP FUNCTION app.fail_receipt_line()');
    }
    expect((await f.db.owner.query('SELECT * FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2', [f.admin.tenant, w.warehouse])).rowCount).toBe(0);
    expect((await f.db.owner.query('SELECT * FROM app.commands WHERE tenant_id=$1 AND reference=$2', [f.admin.tenant, reference])).rowCount).toBe(0);
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries WHERE tenant_id=$1 AND operation_reference=$2', [f.admin.tenant, reference])).rowCount).toBe(0);
  });
});
describe('I-CMD/recepcion-real', () => {
  it('un envío concurrente y un replay posterior no duplican stock ni asientos', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant), reference = randomUUID(), body = { warehouseId: w.warehouse, lines: [{ productId: product, targetLocationId: w.location, quantity: '10' }] };
    const gate = await f.db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470065)');
    const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470065); RETURN NEW; END $$;CREATE TRIGGER pause_receipt BEFORE UPDATE ON app.stock_balances FOR EACH ROW EXECUTE FUNCTION app.pause_receipt()");
    const first = f.mutate(f.admin, 'post', '/receipts', body, reference).then(r => r);
    let second: Promise<Awaited<typeof first>> | undefined;
    try {
      const receiptPid = await waitForBlockedBy(f.db.app, pid);
      second = f.mutate(f.admin, 'post', '/receipts', body, reference).then(r => r);
      await waitForBlockedBy(f.db.app, receiptPid);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470065)');
      gate.release();
    }
    try {
      const a = await first, b = await second!;
      expect(a.status).toBe(201);
      expect(b.status).toBe(201);
      expect(b.body).toEqual(a.body);
      expect(b.headers['idempotent-replayed']).toBe('true');
    }
    finally {
      await f.db.owner.query('DROP TRIGGER pause_receipt ON app.stock_balances;DROP FUNCTION app.pause_receipt()');
    }
    await f.mutate(f.admin, 'post', '/receipts', { ...body, lines: [{ ...body.lines[0]!, quantity: '11' }] }, reference).expect(409);
    await f.mutate(f.admin, 'post', '/receipts', body).expect(201);
    expect((await f.db.owner.query('SELECT physical::text,physical_revision::text FROM app.stock_balances WHERE warehouse_id=$1', [w.warehouse])).rows).toEqual([{ physical: '20', physical_revision: '2' }]);
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries WHERE warehouse_id=$1', [w.warehouse])).rowCount).toBe(2);
  });
  it('conserva la confirmación tras perder la respuesta y reiniciar la API', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), product = await seedProduct(f.db.owner, f.admin.tenant), reference = randomUUID(), body = { warehouseId: w.warehouse, lines: [{ productId: product, targetLocationId: w.location, quantity: '4' }] };
    const lost = await createApplication({ appPool: f.db.app, provisionPool: f.db.provision!, mode: 'saas', origin });
    lost.use((req: LossRequest, res: LossResponse, next: () => void) => {
      if (req.method === 'POST' && req.path === '/api/v1/receipts') {
        res.json = () => {
          res.destroy();
          return res;
        };
      }
      next();
    });
    await lost.init();
    try {
      await expect(request(lost.getHttpServer()).post('/api/v1/receipts').set('Origin', origin).set('Cookie', f.admin.cookie).set('X-CSRF-Token', f.admin.csrf).set('Idempotency-Key', reference).send(body)).rejects.toThrow();
    }
    finally {
      await lost.close();
    }
    const restarted = await createApplication({ appPool: f.db.app, provisionPool: f.db.provision!, mode: 'saas', origin });
    await restarted.init();
    try {
      const result = await request(restarted.getHttpServer()).get('/api/v1/operations/' + reference).set('Cookie', f.admin.cookie).expect(200);
      const replay = await f.mutate(f.admin, 'post', '/receipts', body, reference).expect(201);
      expect(replay.body).toEqual(result.body);
      expect(replay.headers['idempotent-replayed']).toBe('true');
    }
    finally {
      await restarted.close();
    }
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1', [w.warehouse])).rows).toEqual([{ physical: '4' }]);
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries WHERE operation_reference=$1', [reference])).rowCount).toBe(1);
  });
});
async function moveScene() {
  const warehouse = (await f.mutate(f.admin, 'post', '/warehouses', warehouseInput(randomUUID())).expect(201)).body.data.result.id as string;
  const d = simpleLayout();
  await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
  const product = await seedProduct(f.db.owner, f.admin.tenant);
  return { warehouse, product, ...d };
}
describe('I-INV/movimiento', () => {
  it('mueve cantidades exactas no reservadas, agrega líneas y conserva todo ante rechazo', async () => {
    const d = await moveScene();
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: d.product, targetLocationId: d.a, quantity: '100' }] }).expect(201);
    await f.db.owner.query('UPDATE app.stock_balances SET reserved=90 WHERE warehouse_id=$1 AND location_id=$2', [d.warehouse, d.a]);
    const line = { productId: d.product, sourceLocationId: d.a, targetLocationId: d.b, quantity: '6' };
    expect((await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [line, line] }).expect(409)).body.error.code).toBe('INSUFFICIENT_AVAILABLE');
    await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ ...line, targetLocationId: d.a }] }).expect(422);
    const moved = await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ ...line, quantity: '4' }, { ...line, quantity: '6' }] }).expect(201);
    expect(moved.body.data.result.balances.find((x: {
      locationId: string;
    }) => x.locationId === d.a)).toMatchObject({ physical: '90', reserved: '90', available: '0' });
    expect(moved.body.data.result.balances.find((x: {
      locationId: string;
    }) => x.locationId === d.b)).toMatchObject({ physical: '10', reserved: '0', available: '10' });
    const reference = randomUUID();
    await f.db.owner.query("CREATE FUNCTION app.fail_move_target() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.physical=91 THEN RAISE EXCEPTION 'Fallo sintético destino'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_move_target BEFORE UPDATE ON app.stock_balances FOR EACH ROW EXECUTE FUNCTION app.fail_move_target()");
    try {
      await f.mutate(f.admin, 'post', '/internal-moves', { warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId: d.b, targetLocationId: d.a, quantity: '1' }] }, reference).expect(500);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER fail_move_target ON app.stock_balances;DROP FUNCTION app.fail_move_target()');
    }
    expect((await f.db.owner.query('SELECT sum(physical)::text AS physical,sum(reserved)::text AS reserved FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0]).toEqual({ physical: '100', reserved: '90' });
    expect((await f.db.owner.query('SELECT * FROM app.commands WHERE reference=$1', [reference])).rowCount).toBe(0);
  });
});
async function raceMoves(left: object, right: object) {
  const gate = await f.db.owner.connect();
  await gate.query('SELECT pg_advisory_lock(4470067)');
  const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  await gate.query("CREATE FUNCTION app.pause_competing_moves() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470067); RETURN NEW; END $$;CREATE TRIGGER pause_competing_moves BEFORE UPDATE ON app.stock_balances FOR EACH ROW EXECUTE FUNCTION app.pause_competing_moves()");
  const first = f.mutate(f.admin, 'post', '/internal-moves', left).then(r => r);
  let second: Promise<Awaited<typeof first>> | undefined;
  try {
    const writer = await waitForBlockedBy(f.db.app, pid);
    second = f.mutate(f.admin, 'post', '/internal-moves', right).then(r => r);
    await waitForBlockedBy(f.db.app, writer);
  }
  finally {
    await gate.query('SELECT pg_advisory_unlock(4470067)');
    gate.release();
  }
  try {
    return await Promise.all([first, second!]);
  }
  finally {
    await f.db.owner.query('DROP TRIGGER pause_competing_moves ON app.stock_balances;DROP FUNCTION app.pause_competing_moves()');
  }
}
describe('I-INV/ultima-existencia', () => {
  it('confirma solo un competidor por la última unidad y nunca crea físico negativo', async () => {
    const d = await moveScene();
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: d.product, targetLocationId: d.a, quantity: '1' }] }).expect(201);
    const body = { warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId: d.a, targetLocationId: d.b, quantity: '1' }] };
    const result = await raceMoves(body, body);
    expect(result.map(r => r.status).sort()).toEqual([201, 409]);
    expect(result.find(r => r.status === 409)!.body.error.code).toBe('INSUFFICIENT_AVAILABLE');
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1 ORDER BY location_id', [d.warehouse])).rows.map(r => r.physical).sort()).toEqual(['0', '1']);
  });
  it('dos orígenes crean de forma segura una posición destino inicialmente inexistente', async () => {
    const d = await moveScene(), c = randomUUID();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: [...d.elements, { ...d.elements[1]!, id: c, code: 'C', position: { x: '4', y: '0', z: '0' } }] }).expect(200);
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: d.warehouse, lines: [{ productId: d.product, targetLocationId: d.a, quantity: '1' }, { productId: d.product, targetLocationId: d.b, quantity: '1' }] }).expect(201);
    const make = (sourceLocationId: string) => ({ warehouseId: d.warehouse, lines: [{ productId: d.product, sourceLocationId, targetLocationId: c, quantity: '1' }] });
    expect((await raceMoves(make(d.a), make(d.b))).map(r => r.status)).toEqual([201, 201]);
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE warehouse_id=$1 AND location_id=$2', [d.warehouse, c])).rows).toEqual([{ physical: '2' }]);
    expect((await f.db.owner.query('SELECT sum(physical)::text AS physical FROM app.stock_balances WHERE warehouse_id=$1', [d.warehouse])).rows[0].physical).toBe('2');
  });
});
