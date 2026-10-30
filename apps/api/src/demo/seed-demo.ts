import { createHash } from 'node:crypto';
import { DomainError } from '@almacen/domain';
import { createApplication } from '../create-application.js';
import { IdentityService, type IdentityOptions, type CommandHeaders } from '../identity/identity-service.js';
import { WarehouseService } from '../warehouses/warehouse-service.js';
import { LayoutService } from '../warehouses/layout-service.js';
import { CatalogueService } from '../catalogue/catalogue-service.js';
import { PhysicalOperationsService } from '../inventory/physical-operations-service.js';
import { LocationService } from '../inventory/location-service.js';
import { OrderService } from '../orders/order-service.js';
import { OrderWorkflowService } from '../orders/order-workflow-service.js';
import { TransferService } from '../transfers/transfer-service.js';
import { TransferWorkflowService } from '../transfers/transfer-workflow-service.js';
import { CountService } from '../counts/count-service.js';
import { ReportService } from '../reporting/report-service.js';
import { demoCompanies, demoAccounts, demoPassword } from './manifest.js';
export function demoId(key: string) {
  const h = createHash('sha256').update('almacen-3d-demo-v1:' + key).digest('hex');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-8' + h.slice(17, 20) + '-' + h.slice(20, 32);
}
export async function seedDemo(options: IdentityOptions) {
  if (!options.demoMode)
    throw new DomainError('DEMO_UNAVAILABLE', 'La carga requiere DEMO_MODE=true explícito.');
  if (!options.provisionPool || !options.appPool)
    throw new DomainError('TEMPORARY_FAILURE', 'Configura las conexiones locales de aplicación y provisión.');
  const app = await createApplication(options);
  await app.init();
  try {
    const identity = app.get(IdentityService), mode = identity.mode;
    if (!mode)
      throw new DomainError('MODE_UNAVAILABLE', 'La modalidad no es válida.');
    try {
      await options.provisionPool.query('SELECT app.initialize_demo($1,$2)', [mode, await identity.passwords.hash(demoPassword)]);
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P0001')
        throw new DomainError('DEMO_REQUIRES_EMPTY_DATABASE', 'Usa una instalación vacía o previamente identificada como demo.');
      throw error;
    }
    const companies = mode === 'local' ? demoCompanies.slice(0, 1) : demoCompanies;
    for (const company of companies) {
      const account = demoAccounts.find(a => a.companyCode === company.code && a.role === 'admin')!, operator = demoAccounts.find(a => a.companyCode === company.code && a.role === 'operator')!;
      const login = await identity.login({ companyCode: company.code, email: account.email, password: account.password });
      const headers = (action: string): CommandHeaders => ({ cookie: 'almacen_session=' + login.token, csrf: login.data.csrfToken, origin: identity.origin, contentType: 'application/json', reference: demoId(company.code + ':' + action) });
      const warehouse = app.get(WarehouseService), layout = app.get(LayoutService), catalogue = app.get(CatalogueService), physical = app.get(PhysicalOperationsService), orders = app.get(OrderService), outbound = app.get(OrderWorkflowService), transfers = app.get(TransferService), transfer = app.get(TransferWorkflowService), counts = app.get(CountService);
      const source = (await warehouse.create(headers('source'), { code: 'DEMO-ORIGEN', name: 'Origen ficticio', dimensions: { width: '100', height: '10', depth: '50' } })).operation.result.id as string;
      const target = (await warehouse.create(headers('target'), { code: 'DEMO-DESTINO', name: 'Destino ficticio', dimensions: { width: '100', height: '10', depth: '50' } })).operation.result.id as string;
      const geometry = (key: string) => {
        const zone = demoId(company.code + ':' + key + ':zone'), a = demoId(company.code + ':' + key + ':a'), b = demoId(company.code + ':' + key + ':b');
        const element = (id: string, type: 'zone' | 'location', parentId: string | null, code: string, x: string, width: string) => ({ id, type, parentId, code, name: code, position: { x, y: '0', z: '0' }, dimensions: { width, height: '2', depth: '2' }, blocked: false });
        return { a, b, elements: [element(zone, 'zone', null, 'DEMO/Z', '0', '20'), element(a, 'location', zone, 'DEMO/A1', '0', '2'), element(b, 'location', zone, 'DEMO/A2', '2', '2')] };
      };
      const from = geometry('source'), to = geometry('target');
      await layout.save(headers('source-layout'), source, { baseRevision: '0', elements: from.elements });
      await layout.save(headers('target-layout'), target, { baseRevision: '0', elements: to.elements });
      const motor = (await catalogue.create(headers('motor'), { sku: 'MOTOR-DEMO', name: 'Motor sintético de demostración', unit: { kind: 'piece', label: 'pieza' } })).operation.result.id as string;
      const resin = (await catalogue.create(headers('resin'), { sku: 'RESINA-DEMO', name: 'Resina sintética de demostración', unit: { kind: 'weight', label: 'kg' } })).operation.result.id as string;
      await physical.receipt(headers('receipt'), { warehouseId: source, lines: [{ productId: motor, targetLocationId: from.a, quantity: '100' }, { productId: resin, targetLocationId: from.b, quantity: '25.5' }] });
      const order = (await orders.create(headers('order'), { warehouseId: source, code: 'DEMO-PEDIDO', lines: [{ productId: motor, quantity: '40' }] })).operation.result;
      const orderId = order.id as string, line = (order.lines as {
        id: string;
      }[])[0]!.id;
      const reserved = (await outbound.reserve(headers('reserve'), orderId, { lines: [{ orderLineId: line, sourceLocationId: from.a, quantity: '40' }] })).operation.result;
      const allocation = ((reserved.lines as {
        allocations: {
          id: string;
        }[];
      }[])[0]!.allocations[0]!).id;
      await outbound.assign(headers('assign'), orderId, { operatorId: operator.userId });
      await outbound.prepare(headers('prepare'), orderId, { lines: [{ allocationId: allocation, quantity: '10' }] });
      await outbound.dispatch(headers('dispatch'), orderId, { lines: [{ allocationId: allocation, quantity: '10' }] });
      const movement = (await transfers.create(headers('transfer'), { code: 'DEMO-TRASLADO', sourceWarehouseId: source, targetWarehouseId: target, lines: [{ productId: motor, sourceLocationId: from.a, quantity: '20' }] })).operation.result;
      const transferId = movement.id as string, transferLine = (movement.lines as {
        id: string;
      }[])[0]!.id;
      await transfer.depart(headers('depart'), transferId, { lines: [{ transferLineId: transferLine, quantity: '20' }] });
      await transfer.receive(headers('receive'), transferId, { lines: [{ transferLineId: transferLine, targetLocationId: to.a, quantity: '5' }] });
      const count = (await counts.create(headers('count'), { warehouseId: source, locationId: from.a, productId: motor, observed: '72' })).operation.result;
      await counts.adjust(headers('adjust'), count.id as string, { reason: 'Ajuste sintético de demostración' });
      await app.get(LocationService).change(headers('block'), from.b, true);
      await app.get(ReportService).threshold(headers('threshold'), { warehouseId: source, productId: motor, quantity: '45' });
      await identity.logout(headers('logout'));
    }
    return { synthetic: true, companies: companies.length, accounts: companies.length * 3, version: 1 };
  }
  finally {
    await app.close();
  }
}
