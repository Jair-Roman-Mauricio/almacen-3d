import { Injectable } from '@nestjs/common';
import { queryTenant } from '@almacen/database';
import { companyDateRange, DomainError } from '@almacen/domain';
import { IdentityService } from '../identity/identity-service.js';
import { entityId, decimalText, invalidInput } from '../platform/http/operation-input.js';
import { pageInput } from '../platform/http/cursor-page.js';
import { headersFor } from './file-parser.js';
import { findWarehouse } from '../warehouses/warehouse-service.js';
import { findProduct } from '../catalogue/catalogue-service.js';
import { findLocation } from '../inventory/stock-data.js';
export const inventoryHeaders = ['almacen', 'ubicacion', 'sku', 'nombre', 'unidad_base', 'fisico', 'reservado', 'disponible', 'bloqueada'];
export const historyHeaders = ['referencia', 'tipo', 'fecha_utc', 'zona_empresa', 'autor', 'almacen', 'ubicacion', 'sku', 'delta_fisico', 'delta_reservado', 'delta_transito', 'motivo'];
const safeText = (v: string) => /^[\s\p{Cc}]*[=+\-@]/u.test(v) ? "'" + v : v;
export function csvFile(headers: readonly string[], rows: readonly string[][], numeric: ReadonlySet<number> = new Set()) {
  const escape = (v: string) => /[",\r\n]/u.test(v) ? '"' + v.replaceAll('"', '""') + '"' : v;
  return Buffer.from('\ufeff' + [headers.join(','), ...rows.map(row => row.map((v, i) => escape(numeric.has(i) ? v : safeText(v))).join(','))].join('\r\n') + '\r\n', 'utf8');
}
@Injectable()
export class ExportService {
  constructor(private readonly identity: IdentityService) {
  }
  async data(cookie: string | undefined, query: Record<string, unknown>, kind: 'inventory' | 'history') {
    return this.identity.withIdentity(cookie, ['admin', 'supervisor'], async (ctx) => {
      if (query.format !== 'csv' && query.format !== 'xlsx')
        invalidInput('El formato debe ser csv o xlsx.');
      const { format, ...filters } = query;
      // Keep the time-zone metadata stable; the business rows below use one MVCC statement.
      const timeZone = (await queryTenant(ctx, 'SELECT time_zone FROM app.companies WHERE id=$1 FOR SHARE', [ctx.tenantId])).rows[0]!.time_zone as string;
      const page = pageInput(ctx, filters, kind === 'inventory' ? ['warehouseId', 'productId', 'locationId', 'q'] : ['warehouseId', 'productId', 'from', 'to'], kind === 'history' ? kind + ':' + timeZone : kind);
      const warehouse = page.filters.warehouseId ? entityId(page.filters.warehouseId) : null, product = page.filters.productId ? entityId(page.filters.productId) : null;
      if (warehouse)
        await findWarehouse(ctx, warehouse);
      else if (kind === 'inventory')
        entityId(undefined);
      if (product) {
        if (kind === 'inventory')
          await findProduct(ctx, product);
        else if (!(await queryTenant(ctx, 'SELECT id FROM app.products WHERE tenant_id=$1 AND id=$2', [ctx.tenantId, product])).rowCount)
          throw new DomainError('NOT_FOUND', 'El producto no pertenece a esta empresa.');
      }
      let rows: string[][];
      if (kind === 'inventory') {
        const location = page.filters.locationId ? entityId(page.filters.locationId) : null;
        if (location)
          await findLocation(ctx, location, warehouse!);
        rows = (await queryTenant(ctx, `SELECT w.code AS almacen,e.code AS ubicacion,p.sku,p.name,p.unit_label,s.physical::text,s.reserved::text,CASE WHEN e.blocked THEN '0' ELSE (s.physical-s.reserved)::text END AS available,e.blocked FROM app.stock_balances s JOIN app.products p ON(p.tenant_id,p.id)=(s.tenant_id,s.product_id) JOIN app.layout_elements e ON(e.tenant_id,e.warehouse_id,e.id)=(s.tenant_id,s.warehouse_id,s.location_id) JOIN app.warehouses w ON(w.tenant_id,w.id)=(s.tenant_id,s.warehouse_id) WHERE s.tenant_id=$1 AND s.warehouse_id=$2 AND p.removed_at IS NULL AND e.removed_at IS NULL AND ($3::uuid IS NULL OR p.id=$3) AND ($4::uuid IS NULL OR e.id=$4) AND (strpos(p.sku_key,app.code_key($5))>0 OR strpos(lower(p.name),lower($5))>0 OR strpos(e.code_key,app.code_key($5))>0) ORDER BY s.location_id,s.product_id`, [ctx.tenantId, warehouse, product, location, page.filters.q ?? ''])).rows.map(r => [r.almacen, r.ubicacion, r.sku, r.name, r.unit_label, decimalText(r.physical), decimalText(r.reserved), decimalText(r.available), String(r.blocked)]);
      }
      else {
        let from: string | null = null, to: string | null = null;
        if (page.filters.from !== undefined || page.filters.to !== undefined) {
          const range = companyDateRange(page.filters.from ?? page.filters.to!, page.filters.to ?? page.filters.from!, timeZone);
          if (page.filters.from)
            from = range.fromInclusive;
          if (page.filters.to)
            to = range.toExclusive;
        }
        rows = (await queryTenant(ctx, `WITH selected AS(SELECT DISTINCT operation_reference FROM app.inventory_entries WHERE tenant_id=$1 AND ($2::uuid IS NULL OR warehouse_id=$2) AND ($3::uuid IS NULL OR product_id=$3) AND ($4::timestamptz IS NULL OR occurred_at>=$4) AND ($5::timestamptz IS NULL OR occurred_at<$5)) SELECT e.operation_reference,c.operation_type,e.occurred_at,u.name AS author,w.code AS warehouse,l.code AS location,p.sku,e.physical_delta::text,e.reserved_delta::text,e.transit_delta::text,e.reason FROM app.inventory_entries e JOIN selected s USING(operation_reference) JOIN app.commands c ON(c.tenant_id,c.reference)=(e.tenant_id,e.operation_reference) JOIN app.users u ON(u.tenant_id,u.id)=(e.tenant_id,e.actor_id) JOIN app.warehouses w ON(w.tenant_id,w.id)=(e.tenant_id,e.warehouse_id) JOIN app.products p ON(p.tenant_id,p.id)=(e.tenant_id,e.product_id) LEFT JOIN app.layout_elements l ON(l.tenant_id,l.warehouse_id,l.id)=(e.tenant_id,e.warehouse_id,e.location_id) WHERE e.tenant_id=$1 AND c.state='confirmed' ORDER BY e.occurred_at,e.operation_reference,e.id`, [ctx.tenantId, warehouse, product, from, to])).rows.map(r => [r.operation_reference, r.operation_type, r.occurred_at.toISOString(), timeZone, r.author, r.warehouse, r.location ?? '', r.sku, decimalText(r.physical_delta), decimalText(r.reserved_delta), decimalText(r.transit_delta), r.reason ?? '']);
      }
      const metadata = { ...page.filters, timeZone }, headers = kind === 'inventory' ? inventoryHeaders : historyHeaders;
      const bytes = format === 'csv' ? csvFile(headers, rows, new Set(kind === 'inventory' ? [5, 6, 7] : [8, 9, 10])) : await this.xlsx(headers, rows, metadata);
      const description = Object.entries(page.filters).map(([k, v]) => k + '-' + v.replace(/[^\p{L}\p{N}_.-]/gu, '_')).join('_').slice(0, 160);
      return { bytes, filters: metadata, fileName: kind + (description ? '_' + description : '_todos') + '.' + format, contentType: format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    });
  }
  async template(cookie: string | undefined, kind: string, format: unknown) {
    return this.identity.withIdentity(cookie, ['admin'], async () => {
      if (kind !== 'catalogue' && kind !== 'initial_stock')
        invalidInput('La plantilla no está admitida.');
      if (format !== 'csv' && format !== 'xlsx')
        invalidInput('El formato debe ser csv o xlsx.');
      const headers = headersFor(kind), rows = [kind === 'catalogue' ? ['MOTOR-DEMO', 'Motor de demostración', 'piece', 'pieza'] : ['MOTOR-DEMO', 'DEMO/A1', '100']];
      return { bytes: format === 'csv' ? csvFile(headers, rows) : await this.xlsx(headers, rows, {}), fileName: 'plantilla-demostracion-' + kind + '.' + format, contentType: format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    });
  }
  private async xlsx(headers: string[], rows: string[][], filters: Record<string, string>): Promise<Buffer> {
    const { default: ExcelJS } = await import('exceljs'), book = new ExcelJS.Workbook(), data = book.addWorksheet('Datos');
    data.addRow(headers);
    for (const row of rows)
      data.addRow(row.map(String));
    if (Object.keys(filters).length) {
      const query = book.addWorksheet('Consulta');
      query.addRow(['filtro', 'valor']);
      for (const [key, value] of Object.entries(filters))
        query.addRow([key, String(value)]);
    }
    return Buffer.from(await book.xlsx.writeBuffer());
  }
}
