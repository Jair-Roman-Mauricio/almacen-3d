import { queryTenant, type TenantContext } from '@almacen/database';
import { normalizeCode, normalizeName, DomainError, formatQuantity, type UnitKind } from '@almacen/domain';
import { operationQuantity } from '../inventory/physical-operations-service.js';
import { productDto } from '../catalogue/catalogue-service.js';
import type { ParsedRow } from './file-parser.js';
export interface ValidatedRow extends ParsedRow {
  action: string;
  product?: ReturnType<typeof productDto>;
  locationId?: string;
}
export async function storedRows(ctx: TenantContext, id: string): Promise<ParsedRow[]> {
  return (await queryTenant(ctx, 'SELECT row_no,values,source_errors FROM app.import_rows WHERE tenant_id=$1 AND job_id=$2 ORDER BY row_no', [ctx.tenantId, id])).rows.map(r => ({ row: r.row_no, values: r.values, errors: r.source_errors }));
}
export async function validateRows(ctx: TenantContext, job: Record<string, unknown>, input: ParsedRow[]): Promise<ValidatedRow[]> {
  const products = new Map((await queryTenant(ctx, 'SELECT id,sku,sku_key,name,unit_kind,unit_label,removed_at FROM app.products WHERE tenant_id=$1', [ctx.tenantId])).rows.map(p => [p.sku_key, p]));
  const locations = job.kind === 'initial_stock' ? new Map((await queryTenant(ctx, "SELECT e.id,e.code_key,e.blocked FROM app.layout_elements e WHERE e.tenant_id=$1 AND e.warehouse_id=$2 AND e.type='location' AND e.removed_at IS NULL", [ctx.tenantId, job.warehouse_id])).rows.map(e => [e.code_key, e])) : new Map();
  const balances = job.kind === 'initial_stock' ? new Map((await queryTenant(ctx, 'SELECT location_id,product_id,physical::text FROM app.stock_balances WHERE tenant_id=$1 AND warehouse_id=$2', [ctx.tenantId, job.warehouse_id])).rows.map(s => [s.location_id + ':' + s.product_id, s.physical])) : new Map();
  const result: ValidatedRow[] = [];
  for (const source of input) {
    const row: ValidatedRow = { row: source.row, values: { ...source.values }, errors: [...source.errors], action: job.kind === 'catalogue' ? 'create' : 'initial_stock' };
    result.push(row);
    let field = 'sku';
    try {
      const sku = normalizeCode(row.values.sku);
      row.values.sku = sku.value;
      const p = products.get(sku.key);
      if (p?.removed_at)
        throw new DomainError('NOT_FOUND', 'El producto fue retirado del catálogo.');
      if (p) {
        row.product = productDto(p);
        if (job.kind === 'catalogue')
          row.action = 'update';
      }
      if (job.kind === 'catalogue') {
        field = 'nombre';
        row.values.nombre = normalizeName(row.values.nombre);
        field = 'tipo_unidad';
        if (!['piece', 'box', 'pallet', 'weight', 'volume', 'length'].includes(row.values.tipo_unidad!))
          throw new DomainError('INVALID_UNIT', 'La categoría de unidad no es válida.');
        field = 'unidad_base';
        row.values.unidad_base = normalizeName(row.values.unidad_base);
        if (p && (p.unit_kind !== row.values.tipo_unidad || p.unit_label !== row.values.unidad_base))
          throw new DomainError('UNIT_MISMATCH', 'La unidad debe coincidir con la unidad vigente del producto.');
      }
      else {
        if (!p)
          throw new DomainError('NOT_FOUND', 'El SKU no existe en esta empresa.');
        field = 'codigo_ubicacion';
        const code = normalizeCode(row.values.codigo_ubicacion);
        row.values.codigo_ubicacion = code.value;
        const location = locations.get(code.key);
        if (!location)
          throw new DomainError('NOT_FOUND', 'La ubicación no existe en el almacén seleccionado.');
        row.locationId = location.id;
        if (location.blocked)
          throw new DomainError('LOCATION_BLOCKED', 'La ubicación está bloqueada.');
        if (!/^0(?:\.0+)?$/u.test(balances.get(location.id + ':' + p.id) ?? '0'))
          throw new DomainError('INITIAL_STOCK_EXISTS', 'La posición ya tiene existencias.');
        field = 'cantidad';
        row.values.cantidad = formatQuantity(operationQuantity(row.values.cantidad, { kind: p.unit_kind as UnitKind, label: p.unit_label }));
      }
    }
    catch (error) {
      row.errors.push({ field, reason: error instanceof DomainError ? error.message : 'Dato inválido.' });
    }
  }
  // Duplicates are checked independently of other semantic errors.
  const keys = new Map<string, ValidatedRow[]>();
  for (const row of result) {
    try {
      let key = normalizeCode(row.values.sku).key;
      if (job.kind === 'initial_stock')
        key += ':' + normalizeCode(row.values.codigo_ubicacion).key;
      const group = keys.get(key) ?? [];
      group.push(row);
      keys.set(key, group);
    }
    catch { /* Invalid codes already have row errors. */
    }
  }
  for (const group of keys.values())
    if (group.length > 1)
      for (const row of group)
        row.errors.push({ field: job.kind === 'catalogue' ? 'sku' : 'codigo_ubicacion', reason: 'Registro duplicado dentro del archivo.' });
  return result;
}
