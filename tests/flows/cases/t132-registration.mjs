export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/registro");
  await h.visible(page.getByLabel(/^Nombre de empresa/));
  const values = {
    "Nombre de empresa": "Empresa de prueba de registro",
    "Código de empresa": "DEMO-ROBOTICA",
    "Zona horaria": "America/Lima",
    "Nombre del administrador": "Admin registro",
    "Correo electrónico": "registro@example.test",
    Contraseña: "RegistroPassword!2026",
  };
  for (const [label, value] of Object.entries(values))
    await page.getByLabel(new RegExp("^" + label)).fill(value);
  await page
    .getByRole("button", { name: "Crear empresa", exact: true })
    .click();
  await h.visible(
    page.getByText("El código de empresa ya existe.", { exact: true }),
  );
  h.assert(
    (await page
      .getByLabel(/^Código de empresa/)
      .getAttribute("aria-invalid")) === "true",
    "El código duplicado no señala su campo.",
  );
  const code = "REGISTER-" + h.id();
  await page.getByLabel(/^Código de empresa/).fill(code);
  await page
    .getByRole("button", { name: "Crear empresa", exact: true })
    .click();
  await h.visible(page.getByRole("heading", { name: "Empresa creada" }));
  await h.visible(page.getByText(code, { exact: true }));
  await page.getByRole("link", { name: "Ir al acceso", exact: true }).click();
  await h.visible(page.getByLabel(/^Código de empresa/));
  h.assert(
    (await page.getByLabel(/^Código de empresa/).inputValue()) === code,
    "No se trasladó el código confirmado.",
  );
  await page
    .getByLabel(/^Correo electrónico/)
    .fill(values["Correo electrónico"]);
  await page.getByLabel(/^Contraseña/).fill(values["Contraseña"]);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.waitForURL("**/app");
  await h.visible(
    page.getByRole("heading", { name: "Esta empresa aún no tiene almacenes" }),
  );
}
