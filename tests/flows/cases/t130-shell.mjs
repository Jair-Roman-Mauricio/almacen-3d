export default async function (page, env, h) {
  const code = "EMPTY-" + h.id(),
    email = "empty@example.test",
    password = "EmptyPassword!2026";
  const created = await h.api("/registrations", {
    method: "POST",
    data: {
      company: { code, name: "Empresa sin almacenes" },
      administrator: { name: "Cuenta inicial", email, password },
    },
  });
  h.assert(created.ok(), "No se creó la empresa vacía.");
  const response = await page.request.post(env.baseUrl + "/api/v1/sessions", {
    headers: { Origin: env.baseUrl },
    data: { companyCode: code, email, password },
  });
  const admin = (await response.json()).data;
  await page.goto(env.baseUrl + "/app");
  await h.visible(
    page.getByRole("heading", { name: "Esta empresa aún no tiene almacenes" }),
  );
  await h.visible(page.getByRole("link", { name: "Crear primer almacén" }));
  await h.visible(page.getByLabel("Almacén actual"));
  h.assert(
    await page.getByLabel("Almacén actual").isDisabled(),
    "El selector vacío está activo.",
  );
  await h.api("/users", {
    method: "POST",
    session: admin,
    reference: h.id(),
    data: {
      name: "Operador vacío",
      email: "operator-empty@example.test",
      password,
      role: "operator",
    },
  });
  await page.request.post(env.baseUrl + "/api/v1/sessions", {
    headers: { Origin: env.baseUrl },
    data: { companyCode: code, email: "operator-empty@example.test", password },
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  await h.visible(
    page.getByRole("heading", { name: "Esta empresa aún no tiene almacenes" }),
  );
  h.assert(
    (await page.getByRole("link", { name: "Crear primer almacén" }).count()) ===
      0,
    "Un operador puede crear almacenes.",
  );
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await h.visible(page.getByRole("dialog", { name: "Navegación" }));
  await h.visible(page.getByRole("link", { name: "Catálogo", exact: true }));
  h.assert(
    (await page.getByRole("link", { name: "Equipo", exact: true }).count()) ===
      0,
    "El menú conserva permisos de admin.",
  );
  await page.keyboard.press("Escape");
  await h.noOverflow();
  await page.screenshot({
    path: env.output + "/t130-empty-mobile.png",
    fullPage: true,
  });
}
