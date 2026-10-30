import { randomUUID } from 'node:crypto';
import { seedWarehouse, seedProduct, seedStock, seedOrder, seedTransfer, seedCommand } from './schema-fixture.js';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { operationsFixture, productInput, type OperationsFixture } from './operations-fixture.js';
let f: OperationsFixture;
beforeAll(async () => {
  f = await operationsFixture();
});
afterAll(async () => {
  await f?.close();
});
describe('I-CAT/catalogo-rutas', () => {
  it('permite catálogo a supervisor y conserva identidad, SKU y unidad al editar el nombre', async () => {
    const supervisor = await f.role('supervisor');
    const input = productInput(' Mótor/1 ', 'weight');
    const created = await f.mutate(supervisor, 'post', '/products', input).expect(201);
    const product = created.body.data.result;
    expect(product).toMatchObject({ ...input, sku: 'Mótor/1' });
    expect((await f.mutate(f.admin, 'post', '/products', productInput('mótor/1')).expect(409)).body.error.code).toBe('SKU_EXISTS');
    const updated = await f.mutate(supervisor, 'patch', '/products/' + product.id, { name: ' Nombre nuevo ' }).expect(200);
    expect(updated.body.data.result).toEqual({ ...product, name: 'Nombre nuevo' });
    await f.mutate(f.admin, 'patch', '/products/' + product.id, { name: 'Nombre', sku: 'CAMBIO' }).expect(400);
    expect((await f.get(f.admin, '/products?q=mótor').expect(200)).body.data).toEqual([updated.body.data.result]);
    expect((await f.get(f.other, '/products').expect(200)).body.data).toEqual([]);
    await f.mutate(f.other, 'patch', '/products/' + product.id, { name: 'Ajeno' }).expect(404);
    await f.mutate(f.admin, 'post', '/products', productInput('INVALID', 'other')).expect(422);
    await f.mutate(await f.role('operator'), 'post', '/products', productInput('DENIED')).expect(403);
  });
});
describe('I-CAT/eliminacion-protegida', () => {
  it('bloquea stock/reservas y referencias abiertas; retira sin destruir las referencias históricas', async () => {
    const w = await seedWarehouse(f.db.owner, f.admin.tenant), target = await seedWarehouse(f.db.owner, f.admin.tenant);
    const stock = await seedProduct(f.db.owner, f.admin.tenant);
    await seedStock(f.db.owner, f.admin.tenant, w.warehouse, w.location, stock);
    expect((await f.mutate(f.admin, 'delete', '/products/' + stock).expect(409)).body.error.code).toBe('PRODUCT_IN_USE');
    await f.db.owner.query('UPDATE app.stock_balances SET reserved=10 WHERE tenant_id=$1 AND product_id=$2', [f.admin.tenant, stock]);
    await f.mutate(f.admin, 'delete', '/products/' + stock).expect(409);
    const orderProduct = await seedProduct(f.db.owner, f.admin.tenant);
    const order = await seedOrder(f.db.owner, f.admin.tenant, w.warehouse, orderProduct);
    await f.mutate(f.admin, 'delete', '/products/' + orderProduct).expect(409);
    await f.db.owner.query('UPDATE app.orders SET cancelled=true WHERE tenant_id=$1 AND id=$2', [f.admin.tenant, order.order]);
    await f.mutate(f.admin, 'delete', '/products/' + orderProduct).expect(200);
    expect((await f.db.owner.query('SELECT * FROM app.order_lines WHERE product_id=$1', [orderProduct])).rowCount).toBe(1);
    const transferProduct = await seedProduct(f.db.owner, f.admin.tenant);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)', [f.admin.tenant, w.warehouse, w.location, transferProduct]);
    await seedTransfer(f.db.owner, f.admin.tenant, w.warehouse, target.warehouse, w.location, transferProduct);
    await f.mutate(f.admin, 'delete', '/products/' + transferProduct).expect(409);
    const historical = await seedProduct(f.db.owner, f.admin.tenant);
    await f.db.owner.query('INSERT INTO app.stock_balances(tenant_id,warehouse_id,location_id,product_id) VALUES ($1,$2,$3,$4)', [f.admin.tenant, w.warehouse, w.location, historical]);
    const reference = await seedCommand(f.db.owner, f.admin.tenant, f.admin.actor);
    await f.db.owner.query("INSERT INTO app.inventory_entries(tenant_id,id,operation_reference,actor_id,warehouse_id,location_id,product_id,kind,physical_delta,reserved_delta,transit_delta) VALUES ($1,$2,$3,$4,$5,$6,$7,'synthetic',0,0,0)", [f.admin.tenant, randomUUID(), reference, f.admin.actor, w.warehouse, w.location, historical]);
    const deleted = await f.mutate(f.admin, 'delete', '/products/' + historical).expect(200);
    expect(deleted.body.data.result).toEqual({ id: historical, removed: true });
    expect((await f.db.owner.query('SELECT * FROM app.inventory_entries WHERE product_id=$1', [historical])).rowCount).toBe(1);
    expect((await f.get(f.admin, '/products').expect(200)).body.data.some((p: {
      id: string;
    }) => p.id === historical)).toBe(false);
  });
});
