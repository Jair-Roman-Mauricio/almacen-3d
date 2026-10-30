export default async function (page, env, h) {
  await page.goto(env.baseUrl + "/ui-fixtures");
  await h.visible(page.getByLabel("Cantidad exacta"));
  await page.getByLabel("Cantidad exacta").fill("-1");
  await page.getByRole("button", { name: "Validar cantidad" }).click();
  await h.visible(page.getByText("La cantidad debe ser positiva."));
  h.assert(
    (await page.getByLabel("Cantidad exacta").getAttribute("aria-invalid")) ===
      "true",
    "El campo no expone su error.",
  );
  await page.getByLabel("Cantidad exacta").fill("9007199254740993.125");
  await page.getByRole("button", { name: "Validar cantidad" }).click();
  await h.visible(
    page.getByText("9.007.199.254.740.993,125 kg", { exact: true }),
  );
  await page.getByLabel("Cantidad exacta").focus();
  await page.keyboard.press("Tab");
  h.assert(
    await page
      .getByRole("button", { name: "Validar cantidad" })
      .evaluate((e) => e === document.activeElement),
    "No se puede recorrer el formulario con teclado.",
  );
  await page.screenshot({
    path: env.output + "/t123-fields.png",
    fullPage: true,
  });
}
