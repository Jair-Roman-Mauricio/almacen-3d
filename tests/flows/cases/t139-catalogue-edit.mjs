export default async function (page, env, h) {
  await h.login();
  const before = (await h.api("/products?q=MOTOR-DEMO").then((r) => r.json()))
    .data[0];
  await page.goto(env.baseUrl + "/app/catalogo");
  await page.getByLabel("Buscar productos", { exact: true }).fill("MOTOR-DEMO");
  await h.visible(
    page.getByRole("button", { name: "Editar MOTOR-DEMO", exact: true }),
  );
  await page
    .getByRole("button", { name: "Editar MOTOR-DEMO", exact: true })
    .click();
  await page.getByLabel(/^Nombre del producto/).fill("Motor revisado");
  h.assert(
    (await page.getByLabel(/^SKU/).count()) === 0,
    "La identidad es editable.",
  );
  await page
    .getByRole("button", { name: "Guardar producto", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await h.visible(
    page.getByRole("table").getByText("Motor revisado", { exact: true }),
  );
  const after = (await h.api("/products?q=MOTOR-DEMO").then((r) => r.json()))
    .data[0];
  h.assert(
    after.id === before.id &&
      after.sku === before.sku &&
      JSON.stringify(after.unit) === JSON.stringify(before.unit),
    "La edición cambió identidad o unidad.",
  );
  await page
    .getByRole("button", { name: "Retirar MOTOR-DEMO", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar retirada", exact: true })
    .click();
  await h.visible(
    page.getByText(
      "El producto conserva existencias, reservas o trabajo pendiente.",
      { exact: true },
    ),
  );
  h.assert(
    (await h.api("/products?q=MOTOR-DEMO").then((r) => r.json())).data
      .length === 1,
    "El producto con stock fue retirado.",
  );
  await page.keyboard.press("Escape");
  const admin = (await h.api("/sessions/current").then((r) => r.json())).data,
    sku = "REMOVE-" + h.id();
  await h.api("/products", {
    method: "POST",
    session: admin,
    reference: h.id(),
    data: {
      sku,
      name: "Producto sin uso",
      unit: { kind: "piece", label: "unidad" },
    },
  });
  await page.getByLabel("Buscar productos", { exact: true }).fill(sku);
  await h.visible(
    page.getByRole("button", { name: "Retirar " + sku, exact: true }),
  );
  await page
    .getByRole("button", { name: "Retirar " + sku, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar retirada", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await h.visible(page.getByRole("heading", { name: "No hay coincidencias" }));
}
