export default async function (page, env, h) {
  const session = await h.login();
  await page.goto(env.baseUrl + "/ui-fixtures");
  const current = await page.request.get(
    env.baseUrl + "/api/v1/sessions/current",
  );
  h.assert(current.ok(), "Next no propagó la cookie.");
  h.assert(
    (await current.json()).data.company.id === session.company.id,
    "La identidad del proxy no coincide.",
  );
  h.assert(
    current.headers()["cache-control"] === "no-store",
    "El proxy permite caché.",
  );
  const ready = await page.evaluate(async () => {
    const r = await fetch("/api/v1/changes");
    const reader = r.body.getReader();
    const next = await reader.read();
    await reader.cancel();
    return new TextDecoder().decode(next.value);
  });
  h.assert(ready.includes("event: ready"), "Next bloqueó el stream SSE.");
}
