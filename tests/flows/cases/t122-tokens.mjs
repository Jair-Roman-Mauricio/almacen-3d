export default async function (page, env, h) {
  const fonts = [];
  page.on("request", (r) => {
    if (r.resourceType() === "font") fonts.push(r.url());
  });
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === env.baseUrl
      ? r.continue()
      : r.abort(),
  );
  await page.goto(env.baseUrl + "/ui-fixtures");
  await h.visible(
    page.getByRole("heading", { name: "Componentes de interfaz" }),
  );
  await page.waitForFunction(() =>
    [...document.fonts].some(
      (f) => f.family === "Manrope" && f.status === "loaded",
    ),
  );
  const contrast = await page
    .getByRole("button", { name: "Acción principal", exact: true })
    .evaluate((el) => {
      const c = getComputedStyle(el),
        lum = (s) => {
          const a = s
            .match(/[0-9.]+/g)
            .slice(0, 3)
            .map(Number)
            .map((n) => {
              const v = n / 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
          return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        };
      const a = lum(c.color),
        b = lum(c.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  h.assert(contrast >= 4.5, "El botón no alcanza contraste AA.");
  await page.keyboard.press("Tab");
  h.assert(
    await page
      .getByRole("button", { name: "Acción principal", exact: true })
      .evaluate((e) => getComputedStyle(e).outlineStyle !== "none"),
    "Falta foco visible.",
  );
  h.assert(
    await page.evaluate(() =>
      [...document.fonts].some(
        (f) => f.family === "Manrope" && f.status === "loaded",
      ),
    ),
    "La fuente local no cargó.",
  );
  const external = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter(
        (r) =>
          /font/iu.test(r.name) && new URL(r.name).origin !== location.origin,
      ),
  );
  h.assert(
    fonts.length > 0 &&
      fonts.every((url) => new URL(url).origin === env.baseUrl),
    "No se comprobó una fuente del servidor local.",
  );
  h.assert(!external.length, "Las fuentes dependen de una red externa.");
  for (const [width, height, name] of [
    [1280, 720, "desktop"],
    [360, 800, "mobile"],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: env.output + "/t122-" + name + ".png",
      fullPage: true,
    });
    await h.noOverflow();
  }
  return { font: "Manrope local", contrast };
}
