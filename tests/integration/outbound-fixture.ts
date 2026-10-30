import { randomUUID } from 'node:crypto';
import { warehouseInput, productInput, simpleLayout, type OperationsFixture, type Access } from './operations-fixture.js';
export async function outboundScene(f: OperationsFixture, quantity = '100', access: Access = f.admin) {
  const warehouse = (await f.mutate(access, 'post', '/warehouses', warehouseInput(randomUUID())).expect(201)).body.data.result.id as string;
  const layout = simpleLayout();
  await f.mutate(access, 'put', '/warehouses/' + warehouse + '/layout', { baseRevision: '0', elements: layout.elements }).expect(200);
  const product = (await f.mutate(access, 'post', '/products', productInput(randomUUID())).expect(201)).body.data.result.id as string;
  if (quantity !== '0')
    await f.mutate(access, 'post', '/receipts', { warehouseId: warehouse, lines: [{ productId: product, targetLocationId: layout.a, quantity }] }).expect(201);
  return { warehouse, product, ...layout };
}
export async function createOrder(f: OperationsFixture, warehouse: string, product: string, quantity = '100', access: Access = f.admin) {
  return (await f.mutate(access, 'post', '/orders', { code: randomUUID(), warehouseId: warehouse, lines: [{ productId: product, quantity }] }).expect(201)).body.data.result;
}
export async function extraOperator(f: OperationsFixture) {
  const email = randomUUID() + '@example.test';
  const user = (await f.mutate(f.admin, 'post', '/users', { name: 'Operario adicional', email, password: 'fixture', role: 'operator' }).expect(201)).body.data.result;
  const code = (await f.db.owner.query('SELECT code FROM app.companies WHERE id=$1', [f.admin.tenant])).rows[0].code;
  const { default: request } = await import('supertest');
  const response = await request(f.server).post('/api/v1/sessions').set('Origin', 'http://localhost:3000').send({ companyCode: code, email, password: 'fixture' }).expect(200);
  return { tenant: f.admin.tenant, actor: user.id as string, cookie: String(response.headers['set-cookie']).split(';')[0]!, csrf: response.body.data.csrfToken as string };
}
