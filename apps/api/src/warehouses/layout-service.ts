import { Injectable } from '@nestjs/common';
import { queryTenant, lockResources, appendAuditEvent, appendChange } from '@almacen/database';
import { DomainError, normalizeCode, normalizeName, validateLayout, findFirstOverlap, type ElementType } from '@almacen/domain';
import type { SaveLayoutInput } from '@almacen/contracts';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { ApiException } from '../platform/http/api-exception.js';
import { entityId, decimalText, dimensions, revision } from '../platform/http/operation-input.js';
import { findWarehouse } from './warehouse-service.js';
import { assertLayoutChanges } from './layout-occupancy.js';
import { layoutElements } from './layout-data.js';
@Injectable()
export class LayoutService {
  constructor(private readonly identity: IdentityService) {
  }
  async save(headers: CommandHeaders, value: string, input: SaveLayoutInput) {
    const warehouseId = entityId(value), baseRevision = revision(input.baseRevision);
    const elements = input.elements.map(e => {
      const id = entityId(e.id);
      const at = <T>(field: string, read: () => T): T => {
        try {
          return read();
        }
        catch (error) {
          if (error instanceof DomainError)
            throw new DomainError(error.code, error.message, { ...error.details, elementId: id, field });
          throw error;
        }
      };
      return { id, type: e.type as ElementType, parentId: e.parentId === null ? null : entityId(e.parentId), code: at('code', () => normalizeCode(e.code).value), name: at('name', () => normalizeName(e.name)), position: { x: at('position.x', () => decimalText(e.position.x)), y: at('position.y', () => decimalText(e.position.y)), z: at('position.z', () => decimalText(e.position.z)) }, dimensions: at('dimensions', () => dimensions(e.dimensions)), blocked: e.blocked };
    });
    try {
      return await this.identity.command(headers, 'layout.save', { warehouseId, baseRevision, elements }, async (context, stamp) => {
        await lockResources(context, [{ kind: 'warehouse', id: warehouseId, mode: 'exclusive' }]);
        const warehouse = await findWarehouse(context, warehouseId);
        if (warehouse.layoutRevision !== baseRevision)
          throw new DomainError('LAYOUT_STALE', 'Otra edición modificó la distribución.', { field: 'baseRevision', currentRevision: warehouse.layoutRevision });
        const previous = await layoutElements(context, warehouseId), byId = new Map(previous.map(e => [e.id, e]));
        const known = (await queryTenant(context, 'SELECT id,warehouse_id,type,removed_at FROM app.layout_elements WHERE tenant_id=$1 AND id=ANY($2::uuid[])', [context.tenantId, elements.map(e => e.id)])).rows;
        for (const row of known) {
          if (row.warehouse_id !== warehouseId || row.removed_at)
            throw new DomainError('INVALID_HIERARCHY', 'El identificador pertenece a otro elemento persistido.', { elementId: row.id as string, field: 'id' });
        }
        const codes = new Set<string>();
        for (const e of elements) {
          const old = byId.get(e.id);
          if (old && old.type !== e.type)
            throw new DomainError('INVALID_HIERARCHY', 'No se puede cambiar el tipo de un elemento existente.', { elementId: e.id, field: 'type' });
          if (e.blocked !== (old?.blocked ?? false))
            throw new DomainError('INVALID_HIERARCHY', 'El bloqueo se cambia mediante su operación específica.', { elementId: e.id, field: 'blocked' });
          const key = e.type + ':' + normalizeCode(e.code).key;
          if (codes.has(key))
            throw new DomainError('INVALID_CODE', 'El código está repetido en el almacén para este tipo.', { elementId: e.id, field: 'code' });
          codes.add(key);
        }
        const boxes = validateLayout(warehouse.dimensions, elements);
        const overlap = findFirstOverlap(boxes);
        if (overlap)
          throw new ApiException(422, { code: 'OVERLAP', message: 'Dos elementos invaden el mismo espacio interior.', details: overlap.elementIds.map(elementId => ({ elementId, field: 'position', reason: 'Solapamiento de interiores con el otro elemento indicado.' })) });
        await assertLayoutChanges(context, warehouseId, previous, elements);
        await queryTenant(context, 'SET CONSTRAINTS ALL DEFERRED');
        // Temporarily retire active codes inside this transaction so valid code
        // swaps are atomic and do not destroy rows referenced by history.
        await queryTenant(context, 'UPDATE app.layout_elements SET removed_at=$3 WHERE tenant_id=$1 AND warehouse_id=$2 AND removed_at IS NULL', [context.tenantId, warehouseId, stamp.occurredAt]);
        const byProposal = new Map(elements.map(e => [e.id, e]));
        const rows = elements.map(e => ({ ...e, parentType: e.parentId === null ? null : byProposal.get(e.parentId)!.type }));
        if (rows.length)
          await queryTenant(context, `INSERT INTO app.layout_elements(tenant_id,warehouse_id,id,type,parent_id,parent_type,code,name,x,y,z,width,height,depth,blocked)
    SELECT $1,$2,e.id,e.type,e."parentId",e."parentType",e.code,e.name,(e.position->>'x')::numeric,(e.position->>'y')::numeric,(e.position->>'z')::numeric,(e.dimensions->>'width')::numeric,(e.dimensions->>'height')::numeric,(e.dimensions->>'depth')::numeric,false
    FROM jsonb_to_recordset($3::jsonb) AS e(id uuid,type text,"parentId" uuid,"parentType" text,code text,name text,position jsonb,dimensions jsonb)
    ON CONFLICT(tenant_id,warehouse_id,id) DO UPDATE SET parent_id=excluded.parent_id,parent_type=excluded.parent_type,code=excluded.code,name=excluded.name,x=excluded.x,y=excluded.y,z=excluded.z,width=excluded.width,height=excluded.height,depth=excluded.depth,removed_at=NULL`, [context.tenantId, warehouseId, JSON.stringify(rows)]);
        const next = (await queryTenant(context, 'UPDATE app.warehouses SET layout_revision=layout_revision+1 WHERE tenant_id=$1 AND id=$2 RETURNING layout_revision::text AS revision', [context.tenantId, warehouseId])).rows[0]!.revision as string;
        await appendAuditEvent(context, stamp, { kind: 'layout.save', entityId: warehouseId, details: { baseRevision, revision: next, elementCount: elements.length } });
        await appendChange(context, stamp, [{ kind: 'layout', id: warehouseId }]);
        return { warehouseId, revision: next, elements: await layoutElements(context, warehouseId) };
      });
    }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505')
        throw new DomainError('INVALID_HIERARCHY', 'Un identificador de elemento ya está asignado.', { field: 'id' });
      throw error;
    }
  }
}
