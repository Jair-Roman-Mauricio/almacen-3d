export default async function (page, env, h) {
  const code = "WAREHOUSE-" + h.id(),
    email = "warehouses@example.test",
    password = "WarehousePassword!2026";
  await h.api("/registrations", {
    method: "POST",
    data: {
      company: { code, name: "Empresa de almacenes" },
      administrator: { name: "Admin almacenes", email, password },
    },
  });
  await page.request.post(env.baseUrl + "/api/v1/sessions", {
    headers: { Origin: env.baseUrl },
    data: { companyCode: code, email, password },
  });
  await page.goto(env.baseUrl + "/app/almacenes");
  await h.visible(
    page.getByRole("heading", { name: "Esta empresa aún no tiene almacenes" }),
  );
  await page
    .getByRole("button", { name: "Nuevo almacén", exact: true })
    .click();
  const values = {
    "Código del almacén": "CENTRAL",
    "Nombre del almacén": "Almacén central",
    "Ancho (m)": "24.5",
    "Alto (m)": "8",
    "Profundidad (m)": "40",
  };
  for (const [label, value] of Object.entries(values))
    await page
      .getByLabel(new RegExp("^" + label.replace(/[()]/g, "\\$&")))
      .fill(value);
  await page
    .getByRole("button", { name: "Crear almacén", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  const selector = page.getByLabel("Almacén actual");
  await h.visible(selector);
  await selector
    .locator("option")
    .filter({ hasText: "CENTRAL · Almacén central" })
    .waitFor({ state: "attached" });
  h.assert(
    (await selector.locator("option:checked").textContent()) ===
      "CENTRAL · Almacén central",
    "No se seleccionó el almacén creado.",
  );
  await page.getByLabel(/^Código del almacén/).fill("NORTE");
  await page.getByLabel(/^Nombre del almacén/).fill("Almacén norte");
  await page
    .getByRole("button", { name: "Crear almacén", exact: true })
    .click();
  await selector
    .locator("option")
    .filter({ hasText: "NORTE · Almacén norte" })
    .waitFor({ state: "attached" });
  h.assert(
    (await selector.locator("option:checked").textContent()) ===
      "NORTE · Almacén norte",
    "El segundo almacén no quedó seleccionado.",
  );
  const rows = (await h.api("/warehouses").then((r) => r.json())).data;
  h.assert(
    rows.length === 2 &&
      rows.find((row) => row.code === "CENTRAL").dimensions.width === "24.5",
    "Las dimensiones se alteraron.",
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await h.noOverflow();
  await page.screenshot({
    path: env.output + "/t137-warehouses-mobile.png",
    fullPage: true,
  });
}
