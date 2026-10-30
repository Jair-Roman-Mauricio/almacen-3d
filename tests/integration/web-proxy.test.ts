import { expect, it } from "vitest";
import { operationsFixture } from "./operations-fixture.js";
const path = "../../apps/web/src/server/api-proxy.ts";
it("I-ACC/proxy-mismo-origen conserva cookie, Origin, CSRF y aislamiento sin caché", async () => {
  const f = await operationsFixture();
  try {
    await f.app.listen(0, "127.0.0.1");
    const port = (f.server.address() as { port: number }).port,
      { proxyRequest } = await import(path),
      upstream = "http://127.0.0.1:" + port;
    for (const who of [f.admin, f.other, f.admin]) {
      const r = await proxyRequest(
        new Request("http://localhost:3000/api/v1/sessions/current", {
          headers: { Cookie: who.cookie },
        }),
        upstream,
      );
      expect(r.status).toBe(200);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect((await r.json()).data.company.id).toBe(who.tenant);
    }
    const denied = await proxyRequest(
      new Request("http://localhost:3000/api/v1/warehouses", {
        method: "POST",
        headers: {
          Cookie: f.admin.cookie,
          Origin: "https://extra.example",
          "Content-Type": "application/json",
          "X-CSRF-Token": f.admin.csrf,
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          code: "TEST",
          name: "Prueba",
          dimensions: { width: "2", height: "2", depth: "2" },
        }),
      }),
      upstream,
    );
    expect(denied.status).toBe(403);
    const code = (
      await f.db.owner.query("SELECT code FROM app.companies WHERE id=$1", [
        f.admin.tenant,
      ])
    ).rows[0].code;
    const login = await proxyRequest(
      new Request("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyCode: code,
          email: "admin@example.test",
          password: "fixture",
        }),
      }),
      upstream,
    );
    expect(login.status).toBe(200);
    expect(login.headers.get("set-cookie")).toMatch(/HttpOnly/iu);
  } finally {
    await f.close();
  }
});
it("I-SYNC/proxy-stream transmite SSE sin esperar el fin del stream", async () => {
  const f = await operationsFixture();
  const abort = new AbortController();
  try {
    await f.app.listen(0, "127.0.0.1");
    const port = (f.server.address() as { port: number }).port,
      { proxyRequest } = await import(path);
    const r = await proxyRequest(
      new Request("http://localhost:3000/api/v1/changes", {
        headers: { Cookie: f.admin.cookie },
        signal: abort.signal,
      }),
      "http://127.0.0.1:" + port,
    );
    expect(r.headers.get("content-type")).toContain("text/event-stream");
    const reader = r.body!.getReader(),
      first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain("event: ready");
    await reader.cancel();
  } finally {
    abort.abort();
    await f.close();
  }
}, 15000);
