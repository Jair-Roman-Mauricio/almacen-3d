export default async function (page, env, h) {
  await h.login();
  await page.goto(env.baseUrl + "/app/equipo");
  await h.visible(
    page.getByRole("button", { name: "Nueva cuenta", exact: true }),
  );
  await page.getByRole("button", { name: "Nueva cuenta", exact: true }).click();
  await page.getByLabel(/^Nombre de la cuenta/).fill("Supervisión de prueba");
  await page.getByLabel(/^Correo electrónico/).fill("admin@demo.example.test");
  await page.getByLabel(/^Contraseña/).fill("CuentaPassword!2026");
  const role = page.getByLabel(/^Rol de la nueva cuenta/);
  await role.evaluate((select) => select.add(new Option("Inválido", "owner")));
  await role.selectOption("owner");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await h.visible(page.getByText("Selecciona un rol válido.", { exact: true }));
  h.assert(
    (await role.getAttribute("aria-invalid")) === "true",
    "El rol inválido no señala su campo.",
  );
  await role.selectOption("supervisor");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await h.visible(
    page.getByText("El correo ya existe en esta empresa.", { exact: true }),
  );
  h.assert(
    (await page
      .getByLabel(/^Correo electrónico/)
      .getAttribute("aria-invalid")) === "true",
    "El correo duplicado no señala su campo.",
  );
  const email = "team-" + h.id() + "@example.test";
  await page.getByLabel(/^Correo electrónico/).fill(email);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await h.visible(page.getByText(email, { exact: true }));
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  h.assert(
    !(await page
      .locator("body")
      .innerText()
      .then((text) => text.includes("CuentaPassword!2026"))),
    "La contraseña aparece en texto visible.",
  );
}
