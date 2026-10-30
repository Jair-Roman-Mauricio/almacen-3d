import type { Pool } from 'pg';
import { queryTenant, runUnitOfWork, lockResources, type TenantContext } from '@almacen/database';
import { canonicalCommand, DomainError } from '@almacen/domain';
import { fingerprintCanonicalData } from './fingerprint.js';
export interface CommandRequest {
  tenantId: string;
  actorId: string;
  reference: string;
  type: string;
  data: unknown;
}
export interface CommandStamp {
  actorId: string;
  reference: string;
  occurredAt: string;
  type: string;
}
export interface CommandOptions {
  /** Internal durable-job continuation; never selected by an HTTP request. */
  resumePending?: boolean;
  clock?: () => Date;
  permissions?: 'shared' | 'exclusive';
  authorize?: (context: TenantContext) => Promise<void>;
  validateReplay?: (context: TenantContext, result: Record<string, unknown>) => Promise<void>;
  beforeCommit?: (context: TenantContext) => Promise<void>;
  afterCommit?: () => Promise<void>;
}
export interface ConfirmedOperation {
  reference: string;
  status: 'confirmed';
  type: string;
  confirmedAt: string;
  result: Record<string, unknown>;
}
export async function executeCommand(pool: Pool, request: CommandRequest, apply: (context: TenantContext, stamp: CommandStamp) => Promise<Record<string, unknown>>, options: CommandOptions = {}): Promise<{
  operation: ConfirmedOperation;
  replayed: boolean;
}> {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(request.reference))
    throw new DomainError('INVALID_REFERENCE', 'La referencia de operación no es válida.');
  const reference = request.reference.toLowerCase();
  const hash = fingerprintCanonicalData(canonicalCommand(request));
  const result = await runUnitOfWork(pool, request.tenantId, async (context) => {
    const actor = (await queryTenant(context, 'SELECT id,role FROM app.users WHERE tenant_id=$1 AND id=$2 AND active', [context.tenantId, request.actorId])).rows[0];
    if (!actor)
      throw new DomainError('SESSION_INVALID', 'La cuenta no está activa.');
    await options.authorize?.(context);
    await lockResources(context, [{ kind: 'command', id: reference }]);
    const existing = (await queryTenant(context, 'SELECT * FROM app.commands WHERE tenant_id=$1 AND reference=$2', [context.tenantId, reference])).rows[0];
    if (existing) {
      if (existing.operation_type !== request.type || existing.data_hash !== hash)
        throw new DomainError('REFERENCE_REUSED', 'La referencia ya fue utilizada con otros datos.');
      if (existing.state !== 'confirmed' && (!options.resumePending || existing.actor_id !== request.actorId))
        throw new DomainError('TEMPORARY_FAILURE', 'La operación todavía no tiene resultado confirmado.');
      if (existing.state === 'confirmed') {
        await options.validateReplay?.(context, existing.result as Record<string, unknown>);
        return { operation: { reference, status: 'confirmed' as const, type: existing.operation_type as string, confirmedAt: (existing.confirmed_at as Date).toISOString(), result: existing.result as Record<string, unknown> }, replayed: true };
      }
    }
    const date = (options.clock ?? (() => new Date()))();
    if (!Number.isFinite(date.getTime()))
      throw new Error('El reloj no devolvió una fecha válida.');
    const stamp = Object.freeze({ actorId: actor.id as string, reference, occurredAt: date.toISOString(), type: request.type });
    if (!existing)
      await queryTenant(context, "INSERT INTO app.commands(tenant_id,reference,operation_type,data_hash,actor_id) VALUES ($1,$2,$3,$4,$5)", [context.tenantId, reference, request.type, hash, request.actorId]);
    const applied = await apply(context, stamp);
    const serialized = JSON.stringify(applied);
    if (!applied || Array.isArray(applied) || typeof applied !== 'object')
      throw new Error('El resultado debe ser un objeto JSON.');
    const row = (await queryTenant(context, "UPDATE app.commands SET state='confirmed',result=$3,confirmed_at=$4 WHERE tenant_id=$1 AND reference=$2 RETURNING result,confirmed_at", [context.tenantId, reference, serialized, stamp.occurredAt])).rows[0]!;
    await options.beforeCommit?.(context);
    return { operation: { reference, status: 'confirmed' as const, type: request.type, confirmedAt: (row.confirmed_at as Date).toISOString(), result: row.result as Record<string, unknown> }, replayed: false };
  }, { permissions: options.permissions ?? 'shared' });
  await options.afterCommit?.();
  return result;
}
