import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { appendChange } from '../../packages/database/dist/index.js';
import { operationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
import { executeCommand } from '../../apps/api/dist/platform/commands/command-executor.js';
import { signal } from './concurrency-helpers.js';
it('I-SYNC/outbox-atomico publica solo cambios confirmados y nada tras rollback', async () => {
  const f = await operationsFixture();
  try {
    await outboundScene(f, '10');
    const operations = (await f.db.owner.query("SELECT c.reference FROM app.commands c WHERE c.tenant_id=$1 AND NOT EXISTS(SELECT 1 FROM app.change_outbox o WHERE(o.tenant_id,o.operation_reference)=(c.tenant_id,c.reference))", [f.admin.tenant])).rows;
    expect(operations).toEqual([]);
    const entered = signal(), release = signal(), reference = randomUUID();
    const pending = executeCommand(f.db.app, { tenantId: f.admin.tenant, actorId: f.admin.actor, reference, type: 'inventory.receipt', data: {} }, async (ctx, stamp) => {
      await appendChange(ctx, stamp, [{ kind: 'inventory', id: randomUUID() }]);
      return {};
    }, { beforeCommit: async () => {
        entered.resolve();
        await release.promise;
        throw new Error('Rollback sintético');
      } }).catch(() => null);
    await entered.promise;
    expect((await f.db.owner.query('SELECT id FROM app.change_outbox WHERE operation_reference=$1', [reference])).rows).toEqual([]);
    release.resolve();
    await pending;
    expect((await f.db.owner.query('SELECT id FROM app.change_outbox WHERE operation_reference=$1', [reference])).rows).toEqual([]);
    expect((await f.db.owner.query('SELECT reference FROM app.commands WHERE reference=$1', [reference])).rows).toEqual([]);
  }
  finally {
    await f.close();
  }
});
it('I-SYNC/dispatcher-reinicio recupera commits fuera de orden bajo un solo publicador', async () => {
  const f = await operationsFixture();
  try {
    const path = '../../apps/api/dist/changes/change-service.js';
    const { ChangeService } = await import(path);
    const dispatcher = f.app.get(ChangeService);
    const entered = signal(), release = signal(), old = randomUUID(), recent = randomUUID();
    const first = executeCommand(f.db.app, { tenantId: f.admin.tenant, actorId: f.admin.actor, reference: old, type: 'inventory.receipt', data: {} }, async (ctx, stamp) => {
      await appendChange(ctx, stamp, [{ kind: 'inventory', id: randomUUID() }]);
      return {};
    }, { beforeCommit: async () => {
        entered.resolve();
        await release.promise;
      } });
    await entered.promise;
    await executeCommand(f.db.app, { tenantId: f.admin.tenant, actorId: f.admin.actor, reference: recent, type: 'inventory.receipt', data: {} }, async (ctx, stamp) => {
      await appendChange(ctx, stamp, [{ kind: 'inventory', id: randomUUID() }]);
      return {};
    });
    try {
      await dispatcher.dispatchOnce();
      expect((await f.db.owner.query('SELECT published_at FROM app.change_outbox WHERE operation_reference=$1', [recent])).rows[0].published_at).toBeInstanceOf(Date);
    }
    finally {
      release.resolve();
      await first;
    }
    const gate = await f.db.owner.connect();
    await gate.query('SELECT pg_advisory_lock(4470115)');
    try {
      expect(await dispatcher.dispatchOnce()).toBe(false);
    }
    finally {
      await gate.query('SELECT pg_advisory_unlock(4470115)');
      gate.release();
    }
    await dispatcher.onModuleDestroy();
    const restarted = new ChangeService(f.app.get((await import('../../apps/api/dist/identity/identity-service.js')).IdentityService));
    try {
      await restarted.dispatchOnce();
    }
    finally {
      await restarted.onModuleDestroy();
    }
    expect((await f.db.owner.query('SELECT published_at FROM app.change_outbox WHERE operation_reference=$1', [old])).rows[0].published_at).toBeInstanceOf(Date);
    expect((await f.db.owner.query('SELECT count(*)::int n FROM app.commands WHERE reference=ANY($1::uuid[])', [[old, recent]])).rows[0].n).toBe(2);
  }
  finally {
    await f.close();
  }
});
