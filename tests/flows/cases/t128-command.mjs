export default async function (page, env, h) {
  await h.login();
  await page.goto(env.baseUrl + "/ui-fixtures");
  const code = page.getByLabel("Código de operación de prueba");
  await h.visible(code);
  const refs = [];
  let lose = true,
    corrupt = false;
  await page.route("**/api/v1/warehouses", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    refs.push(route.request().headers()["idempotency-key"]);
    if (corrupt) {
      corrupt = false;
      const response = await route.fetch();
      await route.fulfill({ response, body: '{"data":' });
    } else if (lose) {
      lose = false;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  const a = "REF-" + h.id();
  await code.fill(a);
  await page
    .getByRole("button", { name: "Ejecutar operación de prueba", exact: true })
    .click();
  await h.visible(page.getByText("Resultado no confirmado", { exact: true }));
  await page
    .getByRole("button", { name: "Consultar resultado", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  const b = "REF-" + h.id();
  await code.fill(b);
  lose = true;
  await page
    .getByRole("button", { name: "Ejecutar operación de prueba", exact: true })
    .click();
  await h.visible(page.getByText("Resultado no confirmado", { exact: true }));
  await page
    .getByRole("button", { name: "Reenviar misma operación", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  h.assert(
    refs.length === 3 && refs[1] === refs[2] && refs[0] !== refs[1],
    "El reenvío cambió la referencia o repitió automáticamente.",
  );
  const rows = await h.api("/warehouses?q=" + b);
  h.assert((await rows.json()).data.length === 1, "Se duplicó la operación.");
  await code.fill("PARTIAL-" + h.id());
  corrupt = true;
  await page
    .getByRole("button", { name: "Ejecutar operación de prueba", exact: true })
    .click();
  await h.visible(page.getByText("Resultado no confirmado", { exact: true }));
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...sessionStorage, ...localStorage }),
  );
  h.assert(
    !stored.includes("dimensions") && !stored.includes("DemoAlmacen3D!2026"),
    "Se guardaron cuerpos o credenciales en el navegador.",
  );
  h.assert(stored.includes(refs[3]), "No se conservó la referencia pendiente.");
  await page.reload();
  await h.visible(page.getByText("Resultado no confirmado", { exact: true }));
  h.assert(
    (await page
      .getByRole("button", { name: "Reenviar misma operación", exact: true })
      .count()) === 0,
    "Se reconstruyó una orden desde almacenamiento local.",
  );
  await page
    .getByRole("button", { name: "Consultar resultado", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  h.assert(
    refs.length === 4,
    "La reapertura envió una operación automáticamente.",
  );
}
