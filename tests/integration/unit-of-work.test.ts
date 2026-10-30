import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedWarehouse, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { runUnitOfWork, lockResources } from '../../packages/database/dist/unit-of-work.js';
import { queryTenant } from '../../packages/database/dist/tenant-context.js';
import { signal, waitForLock, waitForBlockedBy } from './concurrency-helpers.js';
let db: SchemaFixture;
let identity: IdentitySeed;
beforeAll(async () => { db = await createSchemaFixture({ appMax: 4 }); identity = await seedIdentity(db.owner); });
afterAll(async () => { if (db)
  await db.close(); });
describe('I-INV/orden-bloqueos', () => {
  it('rechaza inversión de etapas y transacciones anidadas independientes', async () => {
    await expect(runUnitOfWork(db.app, identity.tenant, async (ctx) => { await lockResources(ctx, [{ kind: 'warehouse', id: identity.tenant }]); await lockResources(ctx, [{ kind: 'command', id: identity.actor }]); })).rejects.toThrow();
    await expect(runUnitOfWork(db.app, identity.tenant, () => runUnitOfWork(db.app, identity.tenant, async () => 1))).rejects.toThrow();
  });
  it('serializa permisos compartidos frente a exclusivos en conexiones diferentes', async () => {
    const entered = signal();
    const release = signal();
    let firstPid = 0;
    let secondPid = 0;
    let waitingPid: number;
    const first = runUnitOfWork(db.app, identity.tenant, async (ctx) => { firstPid = (await queryTenant(ctx, 'SELECT pg_backend_pid() AS pid')).rows[0]!.pid; entered.resolve(); await release.promise; });
    await entered.promise;
    const second = runUnitOfWork(db.app, identity.tenant, async (ctx) => { secondPid = (await queryTenant(ctx, 'SELECT pg_backend_pid() AS pid')).rows[0]!.pid; }, { permissions: 'exclusive' });
    try {
      waitingPid = await waitForBlockedBy(db.owner, firstPid);
    }
    finally {
      release.resolve();
    }
    await Promise.all([first, second]);
    expect(firstPid).not.toBe(secondPid);
    expect(waitingPid).toBe(secondPid);
  });
  it('bloquea un cambio geométrico exclusivo hasta terminar una operación compartida', async () => {
    const w = await seedWarehouse(db.owner, identity.tenant);
    const entered = signal();
    const release = signal();
    const started = signal();
    let pid = 0;
    const first = runUnitOfWork(db.app, identity.tenant, async (ctx) => { await lockResources(ctx, [{ kind: 'warehouse', id: w.warehouse, mode: 'shared' }]); entered.resolve(); await release.promise; });
    await entered.promise;
    const second = runUnitOfWork(db.app, identity.tenant, async (ctx) => { pid = (await queryTenant(ctx, 'SELECT pg_backend_pid() AS pid')).rows[0]!.pid; started.resolve(); await lockResources(ctx, [{ kind: 'warehouse', id: w.warehouse, mode: 'exclusive' }]); });
    await started.promise;
    try {
      await waitForLock(db.owner, pid);
    }
    finally {
      release.resolve();
    }
    await Promise.all([first, second]);
  });
});
