export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/ui-fixtures");
  const state = page.getByLabel("Estado de la lista");
  await h.visible(state);
  for (const [value, title] of [
    ["loading", "Cargando datos"],
    ["empty", "Aún no hay registros"],
    ["no-results", "No hay coincidencias"],
    ["error", "No se pudieron cargar los datos"],
    ["forbidden", "No tienes permiso"],
  ]) {
    await state.selectOption(value);
    await h.visible(page.getByText(title, { exact: true }));
  }
  await state.selectOption("ready");
  await h.visible(page.getByRole("table", { name: "Inventario de prueba" }));
  for (const [width, height, name] of [
    [1280, 720, "desktop"],
    [360, 800, "mobile"],
  ]) {
    await page.setViewportSize({ width, height });
    await h.noOverflow();
    await page.screenshot({
      path: env.output + "/t125-" + name + ".png",
      fullPage: true,
    });
  }
}
