import { Injectable } from '@nestjs/common';
import { queryTenant, lockResources, appendAuditEvent, appendChange } from '@almacen/database';
import { DomainError } from '@almacen/domain';
import { IdentityService, type CommandHeaders } from '../identity/identity-service.js';
import { entityId } from '../platform/http/operation-input.js';
import { findLocation } from './stock-data.js';
@Injectable()
export class LocationService {
  constructor(private readonly identity: IdentityService) {
  }
  async change(headers: CommandHeaders, value: string, blocked: boolean, reasonValue?: unknown) {
    const locationId = entityId(value);
    let reason: string | undefined;
    if (!blocked) {
      if (typeof reasonValue !== 'string' || !reasonValue.trim())
        throw new DomainError('REASON_REQUIRED', 'Indica el motivo del desbloqueo.', { field: 'reason' });
      reason = reasonValue.trim();
    }
    return this.identity.command(headers, blocked ? 'location.block' : 'location.unblock', { locationId, ...(reason === undefined ? {} : { reason }) }, async (context, stamp) => {
      const resolved = await findLocation(context, locationId);
      await lockResources(context, [{ kind: 'warehouse', id: resolved.warehouseId }, { kind: 'location', id: locationId, warehouseId: resolved.warehouseId }]);
      const current = await findLocation(context, locationId, resolved.warehouseId);
      await queryTenant(context, 'UPDATE app.layout_elements SET blocked=$3 WHERE tenant_id=$1 AND id=$2', [context.tenantId, locationId, blocked]);
      const auditId = await appendAuditEvent(context, stamp, { kind: blocked ? 'location.block' : 'location.unblock', entityId: locationId, ...(reason === undefined ? {} : { reason }), details: { before: current.blocked, blocked, warehouseId: current.warehouseId } });
      await appendChange(context, stamp, [{ kind: 'inventory', id: current.warehouseId }, { kind: 'layout', id: current.warehouseId }]);
      return blocked ? { locationId, blocked } : { locationId, blocked, auditId };
    });
  }
}
