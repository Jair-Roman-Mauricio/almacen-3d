export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/configuracion-inicial");
  if (env.mode !== "local") {
    await h.visible(
      page.getByRole("heading", { name: "Configuración local no disponible" }),
    );
    h.assert(
      (await page
        .getByRole("button", { name: "Configurar instalación" })
        .count()) === 0,
      "SaaS ofrece alta local.",
    );
    return;
  }
  await h.visible(page.getByLabel(/^Nombre de empresa/));
  for (const [width, height, label] of [
    [1280, 720, "desktop"],
    [360, 800, "mobile"],
  ]) {
    await page.setViewportSize({ width, height });
    await h.noOverflow();
    if (width === 360) {
      const contentHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      if (contentHeight > height)
        await page.setViewportSize({ width, height: contentHeight });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    }
    await page.screenshot({
      path: env.reviewDir + "/local-setup-" + label + ".png",
      fullPage: width !== 360,
    });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  const context = await page.context().browser().newContext();
  const other = await context.newPage();
  try {
    await h.visible(page.getByLabel(/^Nombre de empresa/));
    await other.goto(env.baseUrl + "/configuracion-inicial");
    await h.visible(other.getByLabel(/^Nombre de empresa/));
    const code = "LOCAL-" + h.id();
    const values = {
      "Nombre de empresa": "Empresa local",
      "Código de empresa": code,
      "Zona horaria": "America/Lima",
      "Nombre del administrador": "Admin local",
      "Correo electrónico": "local@example.test",
      Contraseña: "LocalPassword!2026",
    };
    for (const [label, value] of Object.entries(values)) {
      await page.getByLabel(new RegExp("^" + label)).fill(value);
      await other
        .getByLabel(new RegExp("^" + label))
        .fill(label === "Código de empresa" ? "SECOND-" + h.id() : value);
    }
    await page
      .getByRole("button", { name: "Configurar instalación", exact: true })
      .click();
    await h.visible(
      page.getByRole("heading", { name: "Instalación configurada" }),
    );
    await h.visible(page.getByText(code, { exact: true }));
    await other
      .getByRole("button", { name: "Configurar instalación", exact: true })
      .click();
    await h.visible(
      other.getByRole("heading", { name: "Instalación configurada" }),
    );
    h.assert(
      (await other.getByLabel(/^Nombre de empresa/).count()) === 0,
      "Un formulario anterior mantiene disponible la segunda alta.",
    );
    await page.reload();
    await h.visible(
      page.getByRole("heading", { name: "Instalación configurada" }),
    );
    h.assert(
      !(await h.api("/public/config").then((r) => r.json())).data
        .localSetupRequired,
      "La instalación perdió su estado persistido.",
    );
    const response = await page.request.post(env.baseUrl + "/api/v1/sessions", {
      headers: { Origin: env.baseUrl },
      data: {
        companyCode: code,
        email: values["Correo electrónico"],
        password: values["Contraseña"],
      },
    });
    h.assert(
      response.ok(),
      "La configuración no creó las credenciales originales.",
    );
  } finally {
    await context.close();
  }
}
