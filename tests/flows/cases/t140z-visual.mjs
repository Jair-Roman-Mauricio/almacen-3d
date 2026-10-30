export default async function (page, env, h) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const session = await h.login("admin", "DEMO-COMERCIO");
  async function shots(name) {
    await page.evaluate(() => document.fonts.ready);
    for (const [width, height, label] of [
      [1280, 720, "desktop"],
      [360, 800, "mobile"],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await h.noOverflow();
      h.assert(
        (await page.getByRole("main").count()) === 1,
        "La página contiene main duplicado.",
      );
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
        path:
          env.reviewDir +
          "/" +
          (name === "inventory" ? label : name + "-" + label) +
          ".png",
        fullPage: width !== 360,
      });
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  await page.goto(env.baseUrl + "/app/inventario");
  await h.visible(page.getByLabel("Buscar inventario", { exact: true }));
  const warehouse = (
    await h.api("/warehouses").then((r) => r.json())
  ).data.find((row) => row.code === "DEMO-ORIGEN");
  await page.getByLabel("Almacén actual").selectOption(warehouse.id);
  await h.visible(
    page.getByRole("table").getByText("MOTOR-DEMO", { exact: true }),
  );
  await shots("inventory");
  await page.goto(env.baseUrl + "/app/catalogo");
  await h.visible(page.getByRole("table"));
  await shots("catalogue");
  await page.goto(env.baseUrl + "/app/almacenes");
  await h.visible(page.getByRole("table"));
  await page
    .getByRole("button", { name: "Nuevo almacén", exact: true })
    .click();
  await h.visible(page.getByLabel(/^Ancho/));
  await shots("warehouses-form");
  await page.goto(env.baseUrl + "/app/equipo");
  await h.visible(page.getByRole("table"));
  await page.getByRole("button", { name: "Nueva cuenta", exact: true }).click();
  await h.visible(page.getByLabel(/^Nombre de la cuenta/));
  await shots("team-form");
  await page.goto(env.baseUrl + "/app/configuracion");
  await h.visible(page.getByLabel(/^Zona horaria/));
  await shots("company");
  await page.goto(env.baseUrl + "/app");
  await h.visible(page.getByRole("heading", { name: "Tu espacio de trabajo" }));
  await shots("workspace");
  await h.api("/sessions/current", { method: "DELETE", session });
  await page.goto(env.baseUrl + "/acceso");
  await h.visible(page.getByLabel(/^Código de empresa/));
  await shots("access");
  await page.goto(env.baseUrl + "/registro");
  await h.visible(page.getByLabel(/^Nombre de empresa/));
  await shots("registration");
  await page.emulateMedia({ reducedMotion: "no-preference" });
}
