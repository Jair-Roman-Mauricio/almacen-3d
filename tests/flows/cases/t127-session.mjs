export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/app");
  await h.visible(page.getByRole("heading", { name: "Sesión no disponible" }));
  const admin = await h.login();
  await page.reload();
  await h.visible(page.getByRole("link", { name: "Equipo", exact: true }));
  const email = "guard-" + h.id() + "@example.test";
  const created = await h.api("/users", {
    method: "POST",
    session: admin,
    reference: h.id(),
    data: {
      name: "Administrador de prueba",
      email,
      password: "GuardPassword!2026",
      role: "admin",
    },
  });
  h.assert(created.ok(), "No se creó el segundo admin.");
  const context = await page.context().browser().newContext();
  try {
    const login = await context.request.post(env.baseUrl + "/api/v1/sessions", {
      headers: { Origin: env.baseUrl },
      data: {
        companyCode: admin.company.code,
        email,
        password: "GuardPassword!2026",
      },
    });
    const second = (await login.json()).data;
    const changed = await context.request.patch(
      env.baseUrl + "/api/v1/users/" + admin.user.id,
      {
        headers: {
          Origin: env.baseUrl,
          "X-CSRF-Token": second.csrfToken,
          "Idempotency-Key": h.id(),
        },
        data: { role: "operator" },
      },
    );
    h.assert(changed.ok(), "No se cambió el permiso.");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
      .getByRole("link", { name: "Equipo", exact: true })
      .waitFor({ state: "hidden" });
    await h.visible(page.getByText("Operador", { exact: true }));
    await context.request.patch(
      env.baseUrl + "/api/v1/users/" + admin.user.id,
      {
        headers: {
          Origin: env.baseUrl,
          "X-CSRF-Token": second.csrfToken,
          "Idempotency-Key": h.id(),
        },
        data: { role: "admin" },
      },
    );
    const extra = (await created.json()).data.result;
    await h.api("/users/" + extra.id, {
      method: "PATCH",
      session: admin,
      reference: h.id(),
      data: { active: false },
    });
    await page.route("**/api/v1/sessions/current", (route) =>
      route.request().method() === "GET"
        ? route.abort("failed")
        : route.continue(),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await h.visible(
      page.getByText("Sin conexión verificada.", { exact: false }),
    );
    await page.unroute("**/api/v1/sessions/current");
    await h.api("/sessions/current", { method: "DELETE", session: admin });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await h.visible(
      page.getByRole("heading", { name: "Sesión no disponible" }),
    );
  } finally {
    await context.close();
  }
}
