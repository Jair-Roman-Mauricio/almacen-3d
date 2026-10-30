export default async function (page, env, h) {
  await h.login();
  await page.goto(env.baseUrl + "/app/configuracion");
  const zone = page.getByLabel(/^Zona horaria/);
  await h.visible(zone);
  await zone.fill("No/Existe");
  await page
    .getByRole("button", { name: "Guardar empresa", exact: true })
    .click();
  await h.visible(
    page.getByText("La zona horaria IANA no es válida.", { exact: true }),
  );
  h.assert(
    (await zone.getAttribute("aria-invalid")) === "true",
    "La zona inválida no señala su campo.",
  );
  await zone.fill("Pacific/Auckland");
  await page
    .getByRole("button", { name: "Guardar empresa", exact: true })
    .click();
  await h.visible(page.getByText("Operación confirmada", { exact: true }));
  const company = (await h.api("/company").then((r) => r.json())).data;
  h.assert(company.timeZone === "Pacific/Auckland", "La zona no persistió.");
  await page.reload();
  await h.visible(zone);
  h.assert(
    (await zone.inputValue()) === "Pacific/Auckland",
    "La zona no se recuperó.",
  );
  await page.locator('time[data-time-zone="Pacific/Auckland"]').waitFor();
  h.assert(
    (await page.getByLabel(/^Código de empresa/).count()) === 0,
    "El código de empresa es editable.",
  );
}
