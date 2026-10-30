export async function helpers(page, env) {
  const errors = [],
    consoleMessages = [];
  const onError = (error) => errors.push(error.message),
    onConsole = (msg) => {
      if (["error", "warning"].includes(msg.type()))
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  async function visible(locator) {
    await locator.waitFor({ state: "visible", timeout: 15000 });
  }
  async function login(role = "admin", companyCode = "DEMO-ROBOTICA") {
    const response = await page.request.post(env.apiUrl + "/api/v1/sessions", {
      headers: { Origin: env.baseUrl },
      data: {
        companyCode,
        email: role + "@demo.example.test",
        password: "DemoAlmacen3D!2026",
      },
    });
    assert(response.ok(), "No se pudo autenticar la cuenta sintética.");
    return (await response.json()).data;
  }
  async function api(path, { method = "GET", data, reference, session } = {}) {
    const result = await page.request.fetch(env.baseUrl + "/api/v1" + path, {
      method,
      headers: {
        Origin: env.baseUrl,
        ...(session ? { "X-CSRF-Token": session.csrfToken } : {}),
        ...(reference ? { "Idempotency-Key": reference } : {}),
      },
      ...(data === undefined ? {} : { data }),
    });
    return result;
  }
  async function noOverflow() {
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "La página desborda horizontalmente.",
    );
  }
  return {
    assert,
    visible,
    login,
    api,
    noOverflow,
    id: () => globalThis.crypto.randomUUID(),
    finish: async () => {
      page.off("pageerror", onError);
      page.off("console", onConsole);
      assert(!errors.length, "Errores JavaScript: " + errors.join(";"));
      return { console: consoleMessages };
    },
  };
}
