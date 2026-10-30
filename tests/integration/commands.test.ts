import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createSchemaFixture, seedIdentity, seedProduct, type SchemaFixture, type IdentitySeed } from './schema-fixture.js';
import { executeCommand, type CommandRequest } from '../../apps/api/dist/platform/commands/command-executor.js';
import { signal, waitForBlockedBy } from './concurrency-helpers.js';
import { queryTenant } from '../../packages/database/dist/tenant-context.js';
let db: SchemaFixture;
let identity: IdentitySeed;
beforeAll(async () => { db = await createSchemaFixture({ appMax: 4 }); identity = await seedIdentity(db.owner); });
afterAll(async () => { if (db)
  await db.close(); });
const requestFor = (product: string): CommandRequest => ({ tenantId: identity.tenant, actorId: identity.actor, reference: randomUUID(), type: 'product.test', data: { productId: product, name: 'Nuevo' } });
describe('I-CMD/commit-resultado', () => {
  it('confirma efecto y resultado juntos con fecha controlada', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    const date = '2026-10-29T20:00:00.000Z';
    const result = await executeCommand(db.app, request, async (ctx) => { await queryTenant(ctx, "UPDATE app.products SET name='Nuevo' WHERE id=$1", [p]); return { productId: p, name: 'Nuevo' }; }, { clock: () => new Date(date) });
    expect(result.operation).toEqual({ reference: request.reference, status: 'confirmed', type: request.type, confirmedAt: date, result: { productId: p, name: 'Nuevo' } });
    expect((await db.owner.query('SELECT name FROM app.products WHERE tenant_id=$1 AND id=$2', [identity.tenant, p])).rows[0].name).toBe('Nuevo');
    await expect(db.owner.query("UPDATE app.commands SET result='{}' WHERE tenant_id=$1 AND reference=$2", [identity.tenant, request.reference])).rejects.toMatchObject({ code: '23514' });
  });
  it('revierte efecto y resultado si falla antes de commit', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    await expect(executeCommand(db.app, request, async (ctx) => { await queryTenant(ctx, "UPDATE app.products SET name='No conservar' WHERE id=$1", [p]); return { productId: p }; }, { beforeCommit: async () => { throw new Error('Fallo antes de commit'); } })).rejects.toThrow('Fallo antes de commit');
    expect((await db.owner.query('SELECT name FROM app.products WHERE tenant_id=$1 AND id=$2', [identity.tenant, p])).rows[0].name).toBe('Motor');
    expect((await db.owner.query('SELECT * FROM app.commands WHERE tenant_id=$1 AND reference=$2', [identity.tenant, request.reference])).rowCount).toBe(0);
  });
  it('conserva el resultado consultable aunque se pierda la respuesta después del commit', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    await expect(executeCommand(db.app, request, async (ctx) => { await queryTenant(ctx, "UPDATE app.products SET name='Persistido' WHERE id=$1", [p]); return { productId: p }; }, { afterCommit: async () => { throw new Error('Respuesta perdida'); } })).rejects.toThrow('Respuesta perdida');
    expect((await db.owner.query('SELECT state,result FROM app.commands WHERE tenant_id=$1 AND reference=$2', [identity.tenant, request.reference])).rows[0]).toEqual({ state: 'confirmed', result: { productId: p } });
  });
});
describe('I-CMD/repeticion-tres-casos', () => {
  it('devuelve el resultado original al repetir exactamente la acción', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    const first = await executeCommand(db.app, request, async (ctx) => { await queryTenant(ctx, "UPDATE app.products SET name=name||'X' WHERE id=$1", [p]); return { productId: p }; });
    const replay = await executeCommand(db.app, request, async () => { throw new Error('No debe ejecutar efectos de nuevo'); });
    expect(replay.replayed).toBe(true);
    expect(replay.operation).toEqual(first.operation);
    expect((await db.owner.query('SELECT name FROM app.products WHERE tenant_id=$1 AND id=$2', [identity.tenant, p])).rows[0].name).toBe('MotorX');
  });
  it('rechaza una referencia con datos distintos sin alterar el resultado', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    await executeCommand(db.app, request, async () => ({ productId: p }));
    await expect(executeCommand(db.app, { ...request, data: { productId: p, name: 'Otro' } }, async () => ({ invalid: true }))).rejects.toMatchObject({ code: 'REFERENCE_REUSED' });
  });
  it('acepta dos referencias nuevas con contenido igual como acciones independientes', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    const apply = async (ctx: Parameters<typeof queryTenant>[0]) => { await queryTenant(ctx, "UPDATE app.products SET name=name||'X' WHERE id=$1", [p]); return { productId: p }; };
    await executeCommand(db.app, request, apply);
    await executeCommand(db.app, { ...request, reference: randomUUID() }, apply);
    expect((await db.owner.query('SELECT name FROM app.products WHERE tenant_id=$1 AND id=$2', [identity.tenant, p])).rows[0].name).toBe('MotorXX');
  });
});
describe('I-CMD/replay-concurrente', () => {
  it('dos conexiones esperan la misma referencia y devuelven un único resultado', async () => {
    const p = await seedProduct(db.owner, identity.tenant);
    const request = requestFor(p);
    const entered = signal();
    const release = signal();
    let pid = 0;
    const first = executeCommand(db.app, request, async (ctx) => { pid = (await queryTenant(ctx, 'SELECT pg_backend_pid() AS pid')).rows[0]!.pid; await queryTenant(ctx, "UPDATE app.products SET name=name||'X' WHERE id=$1", [p]); entered.resolve(); await release.promise; return { productId: p }; });
    await entered.promise;
    const second = executeCommand(db.app, request, async () => { throw new Error('No debe duplicar efectos'); });
    const outcomes = Promise.allSettled([first, second]);
    try {
      await waitForBlockedBy(db.owner, pid);
    }
    finally {
      release.resolve();
    }
    const result = await outcomes;
    expect(result.map(item => item.status)).toEqual(['fulfilled', 'fulfilled']);
    const [left, right] = result;
    if (left?.status === 'fulfilled' && right?.status === 'fulfilled')
      expect(left.value.operation).toEqual(right.value.operation);
    expect((await db.owner.query('SELECT name FROM app.products WHERE tenant_id=$1 AND id=$2', [identity.tenant, p])).rows[0].name).toBe('MotorX');
  });
});
