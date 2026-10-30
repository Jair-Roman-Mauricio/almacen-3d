import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { openSync, closeSync } from "node:fs";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { createSchemaFixture } from "../tests/integration/schema-fixture.ts";
import { seedDemo } from "../apps/api/dist/demo/seed-demo.js";
import { createApplication } from "../apps/api/dist/create-application.js";
import { helpers } from "../tests/flows/browser-helpers.mjs";
const preview = process.argv.includes("--preview");
const root = fileURLToPath(new URL("../", import.meta.url)),
  output = path.join(root, preview ? "output/preview" : "output/playwright");
await mkdir(output, { recursive: true });
const caseArg = process.argv.indexOf("--case"),
  only = caseArg < 0 ? null : process.argv[caseArg + 1],
  mode = process.argv.includes("--local") ? "local" : "saas";
async function freePort() {
  const server = net.createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  return port;
}
const webPort = await freePort(),
  apiPort = await freePort(),
  baseUrl = "http://127.0.0.1:" + webPort,
  apiUrl = "http://127.0.0.1:" + apiPort;
const reviewDir = path.join(root, "apps/web/.impeccable/review");
await mkdir(reviewDir, { recursive: true });
const db = await createSchemaFixture({ appMax: 6 }),
  options = {
    appPool: db.app,
    provisionPool: db.provision,
    mode,
    origin: baseUrl,
    demoMode: true,
  };
let api,
  web,
  browserOpened = false;
const session = "almacen-flows-" + process.pid,
  cli = path.join(root, "node_modules/@playwright/cli/playwright-cli.js");
const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/(DATABASE|MIGRATION_URL|PROVISION_URL|PG_.*PASSWORD)/u.test(key),
  ),
);
const exec = promisify(execFile),
  results = [];
async function command(args) {
  const result = await exec(process.execPath, [cli, "-s=" + session, ...args], {
    cwd: root,
    env: cleanEnv,
    maxBuffer: 3_000_000,
  });
  if (/^### Error/mu.test(result.stdout)) throw new Error(result.stdout);
  return result.stdout;
}
try {
  if (!process.argv.includes("--empty")) await seedDemo(options);
  api = await createApplication(options);
  await api.listen(apiPort, "127.0.0.1");
  const built = await exec(
    process.execPath,
    [path.join(root, "apps/web/node_modules/next/dist/bin/next"), "build"],
    {
      cwd: path.join(root, "apps/web"),
      env: {
        ...cleanEnv,
        API_UPSTREAM_URL: apiUrl,
        APP_ORIGIN: baseUrl,
        WMS_UI_FIXTURES: preview ? "false" : "true",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      maxBuffer: 3_000_000,
    },
  );
  await writeFile(
    path.join(output, "web-build.log"),
    built.stdout + built.stderr,
  );
  const log = openSync(path.join(output, "web.log"), "w");
  web = spawn(
    process.execPath,
    [
      path.join(root, "apps/web/node_modules/next/dist/bin/next"),
      "start",
      "--port",
      String(webPort),
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: path.join(root, "apps/web"),
      env: {
        ...cleanEnv,
        API_UPSTREAM_URL: apiUrl,
        APP_ORIGIN: baseUrl,
        WMS_UI_FIXTURES: preview ? "false" : "true",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", log, log],
    },
  );
  closeSync(log);
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(baseUrl + "/health")).ok) break;
    } catch {
      /* Wait until the local server is listening. */
    }
    if (i === 149)
      throw new Error(
        "Next no pudo iniciar; revisa output/playwright/web.log.",
      );
    await new Promise((r) => setTimeout(r, 100));
  }
  if (preview) {
    console.log("Vista previa local: " + baseUrl + "/acceso");
    console.log(
      "Datos ficticios en una base privada. Ctrl+C cierra los servicios y elimina esa base.",
    );
    await new Promise((resolve) => {
      const stop = () => {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
        resolve();
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    });
  } else {
    browserOpened = true;
    await command(["open", baseUrl + "/health", "--browser", "chrome"]);
    await command(["snapshot"]);
    const files = (await readdir(path.join(root, "tests/flows/cases")))
      .filter((f) => f.endsWith(".mjs") && (!only || f.includes(only)))
      .sort();
    if (!files.length) throw new Error("No hay casos de flujo que coincidan.");
    for (const file of files) {
      const { default: test } = await import(
        new URL("../tests/flows/cases/" + file, import.meta.url)
      );
      const env = { baseUrl, apiUrl, output, mode, reviewDir };
      const source = `async(page)=>{await page.setViewportSize({width:1280,height:720});await page.unrouteAll({behavior:'wait'});await page.context().clearCookies();await page.goto(${JSON.stringify(baseUrl + "/health")});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});const env=${JSON.stringify(env)};const h=await (${helpers.toString()})(page,env);const details=await (${test.toString()})(page,env,h);return {ok:true,case:${JSON.stringify(file)},...details,...await h.finish()};}`;
      const scriptFile = path.join(output, "active-case.mjs");
      await writeFile(scriptFile, source);
      const start = Date.now();
      try {
        const result = await command(["run-code", "--filename", scriptFile]);
        if (!/"ok":\s*true/u.test(result)) throw new Error(result);
        await writeFile(path.join(output, file + ".log"), result);
        results.push({
          case: file,
          status: "passed",
          durationMs: Date.now() - start,
        });
        console.log("✔ " + file);
      } catch (error) {
        await command(["snapshot"])
          .then((t) => writeFile(path.join(output, "failure-snapshot.txt"), t))
          .catch(() => {});
        await command([
          "screenshot",
          "--filename",
          path.join(output, "failure.png"),
          "--full-page",
        ]).catch(() => {});
        results.push({ case: file, status: "failed", reason: error.message });
        throw error;
      }
    }
    await writeFile(
      path.join(output, "browser-console.txt"),
      await command(["console"]),
    );
    console.log(`Flujos aprobados: ${results.length}; fallidos: 0.`);
  }
} finally {
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify({ mode, results }, null, 2),
  );
  if (browserOpened) await command(["close"]).catch(() => {});
  if (web) {
    web.kill("SIGTERM");
    await new Promise((resolve) => {
      if (web.exitCode !== null) resolve();
      else web.once("exit", resolve);
    });
  }
  if (api) await api.close();
  await db.close();
}
