export default async function (page, env, h) {
  const first = await h.login();
  await page.goto(env.baseUrl + "/ui-fixtures");
  await h.visible(page.getByRole("heading", { name: "Caché de almacenes" }));
  const scope = page.getByRole("region", { name: "Caché de almacenes" });
  await h.visible(scope.getByText(first.company.code, { exact: true }));
  const context = await page.context().browser().newContext();
  try {
    const response = await context.request.post(
      env.baseUrl + "/api/v1/sessions",
      {
        headers: { Origin: env.baseUrl },
        data: {
          companyCode: first.company.code,
          email: "admin@demo.example.test",
          password: "DemoAlmacen3D!2026",
        },
      },
    );
    const second = (await response.json()).data;
    const name = "Sesión externa " + h.id();
    const changed = await context.request.post(
      env.baseUrl + "/api/v1/warehouses",
      {
        headers: {
          Origin: env.baseUrl,
          "X-CSRF-Token": second.csrfToken,
          "Idempotency-Key": h.id(),
        },
        data: {
          code: "SYNC-" + h.id(),
          name,
          dimensions: { width: "10", height: "5", depth: "10" },
        },
      },
    );
    h.assert(changed.ok(), "No se registró el cambio en la otra sesión.");
    await h.visible(scope.getByText(name, { exact: true }));
    await h.login("admin", "DEMO-COMERCIO");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await h.visible(scope.getByText("DEMO-COMERCIO", { exact: true }));
    await scope.getByText(name, { exact: true }).waitFor({ state: "hidden" });
    await h.api("/sessions/current", {
      method: "DELETE",
      session: (await h.api("/sessions/current").then((r) => r.json())).data,
    });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
      .getByRole("region", { name: "Caché de almacenes" })
      .waitFor({ state: "hidden" });
  } finally {
    await context.close();
  }
}
