export default async function (page, env, h) {
  const session = await h.login(),
    warehouses = (await h.api("/warehouses").then((r) => r.json())).data,
    warehouse = warehouses.find((row) => row.code === "DEMO-ORIGEN"),
    destination = warehouses.find((row) => row.code === "DEMO-DESTINO"),
    locations = (
      await h
        .api("/warehouses/" + warehouse.id + "/locations")
        .then((r) => r.json())
    ).data,
    location = locations.find((row) => row.code === "DEMO/A1"),
    sku = "SHARED-" + h.id();
  const created = await h.api("/products", {
    method: "POST",
    session,
    reference: h.id(),
    data: {
      sku,
      name: "Producto en ubicación compartida",
      unit: { kind: "piece", label: "unidad" },
    },
  });
  const product = (await created.json()).data.result;
  const receipt = await h.api("/receipts", {
    method: "POST",
    session,
    reference: h.id(),
    data: {
      warehouseId: warehouse.id,
      lines: [
        { productId: product.id, targetLocationId: location.id, quantity: "7" },
      ],
    },
  });
  h.assert(receipt.ok(), "No se preparó el inventario compartido.");
  await page.goto(env.baseUrl + "/app/inventario");
  await h.visible(page.getByLabel("Buscar inventario", { exact: true }));
  await page.getByLabel("Almacén actual").selectOption(warehouse.id);
  await page.getByLabel("Buscar inventario", { exact: true }).fill("DEMO/A1");
  const table = page.getByRole("table", { name: "Inventario por ubicación" });
  await h.visible(table.getByText(sku, { exact: true }));
  await h.visible(table.getByText("MOTOR-DEMO", { exact: true }));
  h.assert(
    (await table.locator("tbody tr").count()) === 2,
    "La lista no admite varios SKU en una ubicación.",
  );
  const context = await page.context().browser().newContext();
  try {
    const login = await context.request.post(env.baseUrl + "/api/v1/sessions", {
        headers: { Origin: env.baseUrl },
        data: {
          companyCode: session.company.code,
          email: "operator@demo.example.test",
          password: "DemoAlmacen3D!2026",
        },
      }),
      other = (await login.json()).data;
    await context.request.post(env.baseUrl + "/api/v1/receipts", {
      headers: {
        Origin: env.baseUrl,
        "X-CSRF-Token": other.csrfToken,
        "Idempotency-Key": h.id(),
      },
      data: {
        warehouseId: warehouse.id,
        lines: [
          {
            productId: product.id,
            targetLocationId: location.id,
            quantity: "3",
          },
        ],
      },
    });
    await h.visible(
      table
        .getByRole("row")
        .filter({ hasText: sku })
        .locator('td[data-label="Físico"]')
        .filter({ hasText: /^10 unidad$/ }),
    );
  } finally {
    await context.close();
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await h.noOverflow();
  await page
    .getByLabel("Buscar inventario", { exact: true })
    .fill("MOTOR-DEMO");
  await h.visible(table.getByText("MOTOR-DEMO", { exact: true }));
  await page
    .getByRole("button", { name: "Totales por producto", exact: true })
    .click();
  const totals = page.getByRole("table", { name: "Totales por producto" });
  await h.visible(totals.getByText("MOTOR-DEMO", { exact: true }));
  await h.visible(
    totals.locator('td[data-label="Físico"]').filter({ hasText: /^72 pieza$/ }),
  );
  await page.getByLabel("Almacén actual").selectOption(destination.id);
  await h.visible(
    totals.locator('td[data-label="Físico"]').filter({ hasText: /^5 pieza$/ }),
  );
  h.assert(
    (await totals
      .locator('td[data-label="Físico"]')
      .filter({ hasText: /^72 pieza$/ })
      .count()) === 0,
    "Se conservaron cantidades del almacén anterior.",
  );
  await h.noOverflow();
  await page.screenshot({
    path: env.output + "/t140-inventory-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByLabel("Almacén actual").selectOption(warehouse.id);
  await h.visible(
    totals.locator('td[data-label="Físico"]').filter({ hasText: /^72 pieza$/ }),
  );
  await h.noOverflow();
  await page.screenshot({
    path: env.output + "/t140-inventory-desktop.png",
    fullPage: true,
  });
}
