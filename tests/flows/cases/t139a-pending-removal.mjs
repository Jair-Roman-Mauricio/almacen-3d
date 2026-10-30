export default async function (page, env, h) {
  const session = await h.login(),
    sku = "LOST-REMOVE-" + h.id(),
    created = await h.api("/products", {
      method: "POST",
      session,
      reference: h.id(),
      data: {
        sku,
        name: "Retirada con respuesta perdida",
        unit: { kind: "piece", label: "unidad" },
      },
    }),
    product = (await created.json()).data.result;
  let reference = "",
    sends = 0;
  await page.route("**/api/v1/products/" + product.id, async (route) => {
    if (route.request().method() !== "DELETE") return route.continue();
    reference = route.request().headers()["idempotency-key"];
    sends++;
    await route.fetch();
    await route.abort("failed");
  });
  await page.goto(env.baseUrl + "/app/catalogo");
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
  await h.visible(page.getByRole("heading", { name: "No hay coincidencias" }));
  await h.visible(
    page.getByRole("heading", { name: "Hay operaciones por comprobar" }),
  );
  await page.reload();
  await h.visible(
    page.getByRole("heading", { name: "Hay operaciones por comprobar" }),
  );
  await page
    .getByRole("button", {
      name: "Consultar operación " + reference,
      exact: true,
    })
    .click();
  await h.visible(
    page.getByText("Resultado recuperado. Operación confirmada.", {
      exact: true,
    }),
  );
  h.assert(sends === 1, "La consulta repitió la retirada.");
}
