import { Injectable, Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';
import { runUnitOfWork, queryTenant } from '@almacen/database';
import { IdentityService } from '../identity/identity-service.js';
export interface ChangeNotice {
  eventId: string;
  scopes: {
    kind: string;
    id?: string;
  }[];
  occurredAt: string;
}
export function publicScopes(scopes: {
  kind: string;
  id: string;
}[]) {
  const result: ChangeNotice['scopes'] = [];
  const names: Record<string, string> = { inventory: 'inventory', layout: 'layout', orders: 'orders', transfers: 'transfers', reports: 'reports', users: 'session', company: 'session', warehouses: 'layout', products: 'inventory' };
  for (const scope of scopes) {
    const kind = names[scope.kind];
    if (kind)
      result.push(scope.kind === 'products' ? { kind } : { kind, id: scope.id });
  }
  if (result.some(s => s.kind !== 'session' && s.kind !== 'reports'))
    result.push({ kind: 'reports' });
  return result;
}
@Injectable()
export class ChangeService implements OnModuleInit, OnModuleDestroy {
  private leader: pg.Pool | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private running: Promise<boolean> | undefined;
  private readonly listeners = new Set<{
    tenant: string;
    send: (notice: ChangeNotice) => Promise<void>;
  }>();
  constructor(private readonly identity: IdentityService) {
  }
  listen(tenant: string, send: (notice: ChangeNotice) => Promise<void>) {
    const listener = { tenant, send };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  onModuleInit() {
    this.schedule();
  }
  private schedule() {
    if (!this.stopped)
      this.timer = setTimeout(async () => {
        try {
          await this.dispatchOnce();
        }
        catch {
          new Logger('ChangeDispatcher').warn('Avisos pendientes: se reintentará su publicación.');
        }
        finally {
          this.schedule();
        }
      }, 1000);
  }
  dispatchOnce(): Promise<boolean> {
    if (this.running)
      return Promise.resolve(false);
    this.running = this.dispatch().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async dispatch() {
    if (!this.leader) {
      const o = this.identity.backgroundDatabase().options;
      this.leader = new pg.Pool({ connectionString: o.connectionString, host: o.host, port: o.port, user: o.user, password: o.password, database: o.database, ssl: o.ssl, max: 1 });
      this.leader.on('error', () => {
      });
    }
    const client = await this.leader.connect();
    let locked = false;
    try {
      locked = (await client.query('SELECT pg_try_advisory_lock(4470115) AS locked')).rows[0].locked;
      if (!locked)
        return false;
      const tenants = (await client.query('SELECT * FROM app.pending_change_tenants()')).rows;
      for (const tenant of tenants) {
        const events = await runUnitOfWork(this.identity.backgroundDatabase(), tenant.tenant_id, async (ctx) => (await queryTenant(ctx, 'SELECT id,scopes,created_at FROM app.change_outbox WHERE tenant_id=$1 AND published_at IS NULL ORDER BY created_at,id LIMIT 1000', [ctx.tenantId])).rows);
        for (const event of events) {
          const notice: ChangeNotice = { eventId: event.id, scopes: publicScopes(event.scopes), occurredAt: event.created_at.toISOString() };
          for (const listener of this.listeners)
            if (listener.tenant === tenant.tenant_id)
              await listener.send(notice);
          await runUnitOfWork(this.identity.backgroundDatabase(), tenant.tenant_id, ctx => queryTenant(ctx, 'UPDATE app.change_outbox SET published_at=clock_timestamp() WHERE tenant_id=$1 AND id=$2 AND published_at IS NULL', [ctx.tenantId, event.id]));
        }
      }
      return true;
    }
    finally {
      try {
        if (locked)
          await client.query('SELECT pg_advisory_unlock(4470115)');
      }
      finally {
        client.release();
      }
    }
  }
  async onModuleDestroy() {
    this.stopped = true;
    if (this.timer)
      clearTimeout(this.timer);
    await this.running;
    this.listeners.clear();
    if (this.leader) {
      await this.leader.end();
      this.leader = undefined;
    }
  }
}
