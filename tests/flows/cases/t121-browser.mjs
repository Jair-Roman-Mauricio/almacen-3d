export default async function (page, env, h) {
  const session = await h.login();
  h.assert(session.user.role === "admin", "Rol sintético incorrecto.");
  await page.goto(env.baseUrl + "/health");
  h.assert(
    (await page.textContent("body")).includes("ok"),
    "La web no abrió su ruta de salud.",
  );
  await page.screenshot({ path: env.output + "/t121-health.png" });
  return { sessionRole: session.user.role };
}
