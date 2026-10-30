export default async function (page, env, h) {
  const admin = await h.login();
  await page.goto(env.baseUrl + "/app/catalogo");
  await h.visible(
    page.getByRole("button", { name: "Nuevo producto", exact: true }),
  );
  await page
    .getByRole("button", { name: "Nuevo producto", exact: true })
    .click();
  await page.getByLabel(/^SKU/).fill(" motor-demo ");
  await page.getByLabel(/^Nombre del producto/).fill("Sensor industrial");
  await page
    .getByRole("button", { name: "Crear producto", exact: true })
    .click();
  await h.visible(
    page.getByText("El SKU ya existe en esta empresa.", { exact: true }),
  );
  h.assert(
    (await page.getByLabel(/^SKU/).getAttribute("aria-invalid")) === "true",
    "El SKU duplicado no señala su campo.",
  );
  const sku = "SENSOR-" + h.id();
  await page.getByLabel(/^SKU/).fill(sku);
  await page.getByLabel(/^Tipo de unidad/).selectOption("weight");
  await page.getByLabel(/^Unidad base/).fill("kg");
  await page
    .getByRole("button", { name: "Crear producto", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  await page.getByLabel("Buscar productos", { exact: true }).fill(sku);
  await h.visible(page.getByRole("table").getByText(sku, { exact: true }));
  await h.visible(page.getByRole("table").getByText("kg", { exact: true }));
  const prefix = "PAGE-" + h.id();
  const responses = await Promise.all(
    Array.from({ length: 26 }, (_, i) =>
      h.api("/products", {
        method: "POST",
        session: admin,
        reference: h.id(),
        data: {
          sku: prefix + "-" + i,
          name: "Producto paginado " + i,
          unit: { kind: "piece", label: "unidad" },
        },
      }),
    ),
  );
  h.assert(
    responses.every((response) => response.ok()),
    "No se prepararon los productos de paginación.",
  );
  await page.getByLabel("Buscar productos", { exact: true }).fill(prefix);
  await h.visible(page.getByRole("button", { name: "Siguiente", exact: true }));
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await h.visible(page.getByText("Página 2", { exact: true }));
  await h.visible(page.getByRole("table"));
  h.assert(
    (await page.getByRole("table").locator("tbody tr").count()) === 1,
    "La segunda página no tiene el registro restante.",
  );
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await h.visible(page.getByText("Página 1", { exact: true }));
  await h.login("operator");
  await page.reload();
  await h.visible(page.getByRole("heading", { name: "Catálogo", exact: true }));
  h.assert(
    (await page
      .getByRole("button", { name: "Nuevo producto", exact: true })
      .count()) === 0,
    "El operador tiene controles de alta.",
  );
}
