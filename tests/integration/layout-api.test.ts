import { runUnitOfWork, lockResources } from '../../packages/database/dist/unit-of-work.js';
import { queryTenant } from '../../packages/database/dist/tenant-context.js';
import { signal, waitForBlockedBy } from './concurrency-helpers.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, warehouseInput, simpleLayout, type OperationsFixture } from './operations-fixture.js';
import { seedProduct, seedStock, seedWarehouse, seedTransfer, seedCommand } from './schema-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture(5);
});
afterAll(async () => {
  await f?.close();
});
async function draft() {
  const warehouse = (await f.mutate(f.admin, 'post', '/warehouses', warehouseInput(randomUUID())).expect(201)).body.data.result.id as string;
  return { warehouse, ...simpleLayout() };
}
async function read(warehouse: string) {
  return (await f.get(f.admin, '/warehouses/' + warehouse + '/layout').expect(200)).body.data;
}
describe('I-GEO/guardar-reabrir', () => {
  it('persiste jerarquía, conserva IDs y stock y revierte una propuesta inválida completa', async () => {
    const d = await draft();
    const first = await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    expect(first.body.data.result).toMatchObject({ warehouseId: d.warehouse, revision: '1' });
    expect((await read(d.warehouse)).elements.map((e: {
      id: string;
    }) => e.id).sort()).toEqual(d.elements.map(e => e.id).sort());
    const product = await seedProduct(f.db.owner, f.admin.tenant);
    await seedStock(f.db.owner, f.admin.tenant, d.warehouse, d.a, product);
    const renamed = d.elements.map(e => ({ ...e, name: e.name + ' nuevo' }));
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: renamed }).expect(200);
    expect((await f.db.owner.query('SELECT physical::text FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2', [f.admin.tenant, d.warehouse])).rows).toEqual([{ physical: '100' }]);
    const before = await read(d.warehouse);
    const invalid = renamed.map(e => e.id === d.b ? { ...e, position: { ...e.position, x: '100' } } : e);
    expect((await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '2', elements: invalid }).expect(422)).body.error.code).toBe('CONTAINMENT');
    expect(await read(d.warehouse)).toEqual(before);
    const changed = renamed.map(e => e.id === d.b ? { ...e, type: 'rack' } : e);
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '2', elements: changed }).expect(422);
  });
});
describe('I-GEO/solapamientos-api', () => {
  it.each(['zones', 'racks', 'rack-aisle', 'direct-locations', 'level-locations'])('rechaza %s con IDs explicativos y conserva todo el layout', async (kind) => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const before = await read(d.warehouse);
    const sample = d.elements[0]!;
    const make = (type: string, parentId: string | null, code: string, x = '0', width = '2') => ({ ...sample, id: randomUUID(), type, parentId, code, name: code, position: { x, y: '0', z: '0' }, dimensions: { width, height: '2', depth: '2' } });
    let elements;
    if (kind === 'zones')
      elements = [make('zone', null, 'Z1'), make('zone', null, 'Z2', '1')];
    else if (kind === 'racks' || kind === 'rack-aisle')
      elements = [sample, make('rack', d.zone, 'R1'), make(kind === 'racks' ? 'rack' : 'aisle', d.zone, 'R2', '1')];
    else if (kind === 'level-locations') {
      const rack = make('rack', d.zone, 'R', '0', '8'), level = make('level', rack.id, 'N', '0', '8');
      elements = [sample, rack, level, make('location', level.id, 'U1'), make('location', level.id, 'U2', '1')];
    }
    else
      elements = [sample, make('location', d.zone, 'U1'), make('location', d.zone, 'U2', '1')];
    const invalid = await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements }).expect(422);
    expect(invalid.body.error.code).toBe('OVERLAP');
    expect(invalid.body.error.details).toHaveLength(2);
    for (const detail of invalid.body.error.details)
      expect(elements.some(e => e.id === detail.elementId)).toBe(true);
    expect(await read(d.warehouse)).toEqual(before);
  });
  it('permite bordes en contacto y contención entre elementos y descendientes', async () => {
    const d = await draft();
    const rack = { ...d.elements[0]!, id: randomUUID(), type: 'rack', parentId: d.zone, code: 'R', dimensions: { width: '4', height: '2', depth: '2' } };
    const level = { ...rack, id: randomUUID(), type: 'level', parentId: rack.id, code: 'N' };
    const elements = [d.elements[0]!, rack, level, ...d.elements.slice(1).map(e => ({ ...e, parentId: level.id }))];
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements }).expect(200);
  });
});
describe('I-GEO/revision-concurrente', () => {
  it('serializa dos guardados de la misma revisión y devuelve la revisión actual al segundo', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const gate = await f.db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470059)');
    const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_layout_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470059); RETURN NEW; END $$;CREATE TRIGGER pause_layout_revision BEFORE UPDATE ON app.warehouses FOR EACH ROW EXECUTE FUNCTION app.pause_layout_revision()");
    const first = f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.map(e => ({ ...e, name: 'Primero' })) }).then(r => r);
    let second: Promise<Awaited<typeof first>> | undefined;
    try {
      const blocked = await waitForBlockedBy(f.db.app, pid);
      second = f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.map(e => ({ ...e, name: 'Segundo' })) }).then(r => r);
      await waitForBlockedBy(f.db.app, blocked);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470059)');
      gate.release();
    }
    try {
      expect((await first).status).toBe(200);
      const rejected = await second!;
      expect(rejected.status).toBe(409);
      expect(rejected.body.error).toMatchObject({ code: 'LAYOUT_STALE', details: [{ field: 'baseRevision', currentRevision: '2' }] });
      expect((await read(d.warehouse)).elements.every((e: {
        name: string;
      }) => e.name === 'Primero')).toBe(true);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER pause_layout_revision ON app.warehouses;DROP FUNCTION app.pause_layout_revision()');
    }
  });
});
describe('I-GEO/ocupacion-descendientes', () => {
  it('rechaza mover, redimensionar o eliminar el contenedor cuando un descendiente tiene stock', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const product = await seedProduct(f.db.owner, f.admin.tenant);
    await seedStock(f.db.owner, f.admin.tenant, d.warehouse, d.a, product);
    const before = await read(d.warehouse);
    for (const elements of [d.elements.map(e => e.id === d.zone ? { ...e, position: { ...e.position, x: '1' } } : e), d.elements.map(e => e.id === d.zone ? { ...e, dimensions: { ...e.dimensions, width: '21' } } : e), []]) {
      const response = await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements }).expect(409);
      expect(response.body.error.code).toBe('ELEMENT_OCCUPIED');
      expect(response.body.error.details[0].elementId).toBe(d.zone);
      expect(await read(d.warehouse)).toEqual(before);
    }
  });
  it('protege orígenes de traslado registrado aunque estén vacíos', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const product = await seedProduct(f.db.owner, f.admin.tenant), target = await seedWarehouse(f.db.owner, f.admin.tenant);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)', [f.admin.tenant, d.warehouse, d.a, product]);
    await seedTransfer(f.db.owner, f.admin.tenant, d.warehouse, target.warehouse, d.a, product);
    const response = await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.map(e => e.id === d.zone ? { ...e, position: { ...e.position, x: '1' } } : e) }).expect(409);
    expect(response.body.error.code).toBe('OPEN_WORK');
    expect(response.body.error.details[0].elementId).toBe(d.zone);
  });
  it('retira una ubicación vacía conservando asientos y permite reutilizar su código con un nuevo ID', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const product = await seedProduct(f.db.owner, f.admin.tenant), reference = await seedCommand(f.db.owner, f.admin.tenant, f.admin.actor);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)', [f.admin.tenant, d.warehouse, d.a, product]);
    await f.db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,actor_id,warehouse_id,location_id,product_id,kind,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,'synthetic',0,0,0)", [f.admin.tenant, randomUUID(), reference, f.admin.actor, d.warehouse, d.a, product]);
    const replacement = randomUUID();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.map(e => e.id === d.a ? { ...e, id: replacement } : e) }).expect(200);
    expect((await read(d.warehouse)).elements.map((e: {
      id: string;
    }) => e.id)).toContain(replacement);
    expect((await f.db.owner.query('SELECT removed_at FROM app.layout_elements WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, d.a])).rows[0].removed_at).not.toBeNull();
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries WHERE location_id=$1', [d.a])).rowCount).toBe(1);
  });
});
describe('I-GEO/ocupacion-carrera', () => {
  it.each(['stock', 'open-work'])('relee %s confirmado antes de la edición y rechaza el movimiento', async (kind) => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const product = await seedProduct(f.db.owner, f.admin.tenant), target = await seedWarehouse(f.db.owner, f.admin.tenant);
    const entered = signal(), release = signal();
    let pid = 0;
    const writer = runUnitOfWork(f.db.app, f.admin.tenant, async (context) => {
      await lockResources(context, [{ kind: 'warehouse', id: d.warehouse }, { kind: 'location', id: d.a, warehouseId: d.warehouse }, { kind: 'product', id: product }, { kind: 'stock', id: d.a, warehouseId: d.warehouse, productId: product }]);
      pid = (await queryTenant(context, 'SELECT pg_backend_pid() AS pid')).rows[0]!.pid;
      entered.resolve();
      await release.promise;
      if (kind === 'stock')
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=1 WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, d.warehouse, d.a, product]);
      else {
        const transfer = randomUUID();
        await queryTenant(context, 'INSERT INTO app.transfers(tenant_id,id,code,source_warehouse_id,target_warehouse_id) VALUES ($1,$2,$3,$4,$5)', [context.tenantId, transfer, transfer, d.warehouse, target.warehouse]);
        await queryTenant(context, 'INSERT INTO app.transfer_lines(tenant_id,transfer_id,id,source_warehouse_id,target_warehouse_id,source_location_id,product_id,declared) VALUES ($1,$2,$3,$4,$5,$6,$7,1)', [context.tenantId, transfer, randomUUID(), d.warehouse, target.warehouse, d.a, product]);
      }
    });
    await entered.promise;
    const edit = f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.map(e => e.id === d.zone ? { ...e, position: { ...e.position, x: '1' } } : e) }).then(r => r);
    try {
      await waitForBlockedBy(f.db.owner, pid);
    }
    finally {
      release.resolve();
    }
    await writer;
    const response = await edit;
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe(kind === 'stock' ? 'ELEMENT_OCCUPIED' : 'OPEN_WORK');
    expect((await read(d.warehouse)).revision).toBe('1');
  });
  it('una operación que espera al editor no puede recrear stock en una ubicación retirada', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const product = await seedProduct(f.db.owner, f.admin.tenant);
    const gate = await f.db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470061)');
    const pid = (await gate.query('SELECT pg_backend_pid() pid')).rows[0].pid;
    await gate.query("CREATE FUNCTION app.pause_layout_removal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(4470061); RETURN NEW; END $$;CREATE TRIGGER pause_layout_removal BEFORE UPDATE ON app.warehouses FOR EACH ROW EXECUTE FUNCTION app.pause_layout_removal()");
    const edit = f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: d.elements.filter(e => e.id !== d.a) }).then(r => r);
    let writer: Promise<unknown> | undefined;
    let outcome: Promise<PromiseSettledResult<unknown>[]> | undefined;
    try {
      const editingPid = await waitForBlockedBy(f.db.app, pid);
      writer = runUnitOfWork(f.db.app, f.admin.tenant, async (context) => {
        await lockResources(context, [{ kind: 'warehouse', id: d.warehouse }, { kind: 'location', id: d.a, warehouseId: d.warehouse }, { kind: 'product', id: product }, { kind: 'stock', id: d.a, warehouseId: d.warehouse, productId: product }]);
        await queryTenant(context, 'UPDATE app.stock_balances SET physical=1 WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3 AND product_id=$4', [context.tenantId, d.warehouse, d.a, product]);
      });
      outcome = Promise.allSettled([writer]);
      await waitForBlockedBy(f.db.app, editingPid);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470061)');
      gate.release();
    }
    try {
      expect((await edit).status).toBe(200);
      expect((await outcome!)[0]).toMatchObject({ status: 'rejected', reason: { code: 'NOT_FOUND' } });
      expect((await f.db.owner.query('SELECT * FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2 AND location_id=$3', [f.admin.tenant, d.warehouse, d.a])).rowCount).toBe(0);
    }
    finally {
      await f.db.owner.query('DROP TRIGGER pause_layout_removal ON app.warehouses;DROP FUNCTION app.pause_layout_removal()');
    }
  });
});
describe('I-GEO/revision-del-contrato', () => {
  it('conserva identidad entre almacenes, permite intercambiar códigos y localiza dimensiones inválidas', async () => {
    const d = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(200);
    const other = await draft();
    await f.mutate(f.admin, 'put', '/warehouses/' + other.warehouse + '/layout', { baseRevision: '0', elements: d.elements }).expect(422);
    const swapped = d.elements.map(e => ({ ...e, code: e.id === d.a ? 'A/2' : e.id === d.b ? 'A/1' : e.code }));
    await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '1', elements: swapped }).expect(200);
    const invalid = await f.mutate(f.admin, 'put', '/warehouses/' + d.warehouse + '/layout', { baseRevision: '2', elements: swapped.map(e => e.id === d.b ? { ...e, dimensions: { ...e.dimensions, width: 'NaN' } } : e) }).expect(422);
    expect(invalid.body.error.details[0]).toMatchObject({ elementId: d.b, field: expect.any(String), reason: expect.any(String) });
  });
  it('guarda y recupera una distribución válida cuyo JSON supera el límite HTTP inicial', async () => {
    const warehouse = (await f.mutate(f.admin, 'post', '/warehouses', { ...warehouseInput(randomUUID()), dimensions: { width: '3000', height: '10', depth: '50' } }).expect(201)).body.data.result.id as string;
    const d = simpleLayout();
    const zone = { ...d.elements[0]!, dimensions: { width: '2500', height: '2', depth: '2' } };
    const locations = Array.from({ length: 1000 }, (_, i) => ({ ...d.elements[1]!, id: randomUUID(), code: 'U-' + i, position: { x: String(i * 2), y: '0', z: '0' } }));
    const elements = [zone, ...locations];
    expect(Buffer.byteLength(JSON.stringify(elements))).toBeGreaterThan(100 * 1024);
    await f.mutate(f.admin, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements }).expect(200);
    expect((await read(warehouse)).elements).toHaveLength(1001);
  });
});
