export default async function (page, env, h) {
  const admin = await h.login();
  await page.goto(env.baseUrl + "/app/equipo");
  await h.visible(
    page.getByRole("button", {
      name: "Gestionar admin@demo.example.test",
      exact: true,
    }),
  );
  await page
    .getByRole("button", {
      name: "Gestionar admin@demo.example.test",
      exact: true,
    })
    .click();
  await page.getByLabel(/^Rol de la cuenta/).selectOption("operator");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/users?") &&
        response.request().method() === "GET",
    ),
    page.evaluate(() => window.dispatchEvent(new Event("operation-confirmed"))),
  ]);
  await h.visible(page.getByRole("dialog", { name: "Gestionar cuenta" }));
  h.assert(
    (await page.getByLabel(/^Rol de la cuenta/).inputValue()) === "operator",
    "La recarga perdió el borrador del diálogo.",
  );
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await h.visible(
    page.getByText("Debe permanecer al menos un administrador activo.", {
      exact: true,
    }),
  );
  await page.keyboard.press("Escape");
  const email = "permissions-" + h.id() + "@example.test",
    password = "PermissionsPassword!2026";
  const created = await h.api("/users", {
    method: "POST",
    session: admin,
    reference: h.id(),
    data: { name: "Segunda sesión de equipo", email, password, role: "admin" },
  });
  h.assert(created.ok(), "No se creó el segundo administrador.");
  const context = await page.context().browser().newContext();
  const second = await context.newPage();
  try {
    await context.request.post(env.baseUrl + "/api/v1/sessions", {
      headers: { Origin: env.baseUrl },
      data: { companyCode: admin.company.code, email, password },
    });
    await second.goto(env.baseUrl + "/app/configuracion");
    await h.visible(second.getByLabel(/^Nombre de empresa/));
    await h.visible(
      page.getByRole("button", { name: "Gestionar " + email, exact: true }),
    );
    await page
      .getByRole("button", { name: "Gestionar " + email, exact: true })
      .click();
    await page.getByLabel(/^Rol de la cuenta/).selectOption("operator");
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await h.visible(second.getByRole("heading", { name: "No tienes permiso" }));
    h.assert(
      (await second.getByLabel(/^Nombre de empresa/).count()) === 0,
      "Quedó el formulario privilegiado.",
    );
    h.assert(
      (await second
        .getByRole("link", { name: "Equipo", exact: true })
        .count()) === 0,
      "Quedó la navegación privilegiada.",
    );
    await page
      .getByRole("button", { name: "Gestionar " + email, exact: true })
      .click();
    await page.getByLabel("Cuenta activa", { exact: true }).uncheck();
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await h.visible(
      second.getByRole("heading", { name: "Sesión no disponible" }),
    );
  } finally {
    await context.close();
  }
}
