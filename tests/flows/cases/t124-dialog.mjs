export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/ui-fixtures");
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  await h.visible(trigger);
  await trigger.click();
  await h.visible(page.getByRole("dialog", { name: "Confirmar acción" }));
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Abrir diálogo",
  );
  h.assert(
    await trigger.evaluate((e) => document.activeElement === e),
    "No volvió el foco al activador.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  h.assert(
    await page
      .getByRole("dialog")
      .evaluate((e) => getComputedStyle(e).transitionDuration === "0s"),
    "El diálogo no respeta movimiento reducido.",
  );
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Acciones de prueba" }).click();
  await h.visible(page.getByRole("menuitem", { name: "Acción de ejemplo" }));
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: env.output + "/t124-focus.png",
    fullPage: true,
  });
}
