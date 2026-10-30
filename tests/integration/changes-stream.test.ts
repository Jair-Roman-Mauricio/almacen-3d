import { expect, it } from 'vitest';
import { operationsFixture } from './operations-fixture.js';
import { outboundScene } from './outbound-fixture.js';
async function waitFor(check: () => boolean) {
  const end = Date.now() + 4500;
  while (Date.now() < end) {
    if (check())
      return;
    await new Promise(r => setTimeout(r, 20));
  }
  throw new Error('No se recibió el estado esperado del stream.');
}
async function stream(url: string, cookie: string) {
  const stop = new AbortController(), response = await fetch(url, { headers: { Cookie: cookie }, signal: stop.signal });
  const state = { text: '', ended: false };
  const reading = (async () => {
    try {
      if (response.body) {
        const decoder = new TextDecoder();
        for await (const chunk of response.body)
          state.text += decoder.decode(chunk, { stream: true });
      }
    }
    catch { /* Explicit disconnect. */
    }
    finally {
      state.ended = true;
    }
  })();
  return { response, state, close: async () => {
      stop.abort();
      await reading;
    } };
}
it('I-SYNC/stream-empresa mantiene RLS, cierra sesión revocada y libera conexiones entre envíos', async () => {
  const f = await operationsFixture(1);
  const connections: Awaited<ReturnType<typeof stream>>[] = [];
  try {
    await f.app.listen(0, '127.0.0.1');
    const address = f.server.address() as {
      port: number;
    }, url = `http://127.0.0.1:${address.port}/api/v1/changes`;
    expect((await fetch(url)).status).toBe(401);
    const a = await stream(url, f.admin.cookie), b = await stream(url, f.other.cookie), operator = await f.role('operator'), o = await stream(url, operator.cookie);
    connections.push(a, b, o);
    expect(a.response.status).toBe(200);
    expect(a.response.headers.get('content-type')).toContain('text/event-stream');
    await waitFor(() => a.state.text.includes('event: ready'));
    const before = f.db.app.totalCount, s = await outboundScene(f, '5');
    await waitFor(() => a.state.text.includes('event: change') && o.state.text.includes('event: change'));
    expect(b.state.text).not.toContain('event: change');
    expect(f.db.app.totalCount).toBe(before);
    await waitFor(() => f.db.app.idleCount === f.db.app.totalCount);
    expect(f.db.app.idleCount).toBe(f.db.app.totalCount);
    const notices = a.state.text.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6))).filter(value => value.eventId);
    expect(notices.length).toBeGreaterThan(0);
    for (const n of notices) {
      expect(Object.keys(n).sort()).toEqual(['eventId', 'occurredAt', 'scopes']);
      expect(n.scopes.every((scope: {
        kind: string;
      }) => ['inventory', 'layout', 'orders', 'transfers', 'reports', 'session'].includes(scope.kind))).toBe(true);
      expect(JSON.stringify(n)).not.toMatch(/physical|quantity|password|token|tenant/iu);
    }
    await f.mutate(f.admin, 'patch', '/users/' + operator.actor, { active: false }).expect(200);
    await waitFor(() => o.state.ended);
    const frozen = o.state.text;
    await f.mutate(f.admin, 'post', '/receipts', { warehouseId: s.warehouse, lines: [{ productId: s.product, targetLocationId: s.a, quantity: '1' }] }).expect(201);
    await new Promise(r => setTimeout(r, 1100));
    expect(o.state.text).toBe(frozen);
    await a.close();
    const reconnected = await stream(url, f.admin.cookie);
    connections.push(reconnected);
    await waitFor(() => reconnected.state.text.includes('event: ready'));
    expect(reconnected.state.text).toContain('"refresh":true');
  }
  finally {
    for (const connection of connections)
      await connection.close();
    await f.close();
  }
}, 15000);
