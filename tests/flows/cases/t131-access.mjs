export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/acceso");
  const code = page.getByLabel(/^Código de empresa/),
    email = page.getByLabel(/^Correo electrónico/),
    password = page.getByLabel(/^Contraseña/);
  await h.visible(code);
  await code.fill("EMPRESA-INEXISTENTE");
  await email.fill("admin@demo.example.test");
  await password.fill("PasswordIncorrecto!2026");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  const rejection = page
    .getByRole("alert")
    .filter({ hasText: "La empresa o las credenciales no son válidas." });
  await h.visible(rejection);
  const generic = await rejection.textContent();
  await code.fill("DEMO-ROBOTICA");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await h.visible(rejection);
  h.assert(
    (await rejection.textContent()) === generic,
    "El rechazo revela si existe la empresa.",
  );
  await password.fill("DemoAlmacen3D!2026");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.waitForURL("**/app");
  await h.visible(page.getByRole("heading", { name: "Tu espacio de trabajo" }));
  await page.getByRole("button", { name: "Opciones de cuenta" }).click();
  await page
    .getByRole("menuitem", { name: "Cerrar sesión", exact: true })
    .click();
  await page.waitForURL("**/acceso");
  h.assert(
    (await h.api("/sessions/current")).status() === 401,
    "La sesión continúa activa.",
  );
  for (const [width, height, label] of [
    [1280, 720, "desktop"],
    [360, 800, "mobile"],
  ]) {
    await page.setViewportSize({ width, height });
    await h.visible(code);
    await h.noOverflow();
    await page.screenshot({
      path: env.output + "/t131-access-" + label + ".png",
      fullPage: true,
    });
  }
  await page.goto(env.baseUrl + "/app");
  await h.visible(page.getByRole("heading", { name: "Sesión no disponible" }));
}
