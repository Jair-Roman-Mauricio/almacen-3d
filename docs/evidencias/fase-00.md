# Ejecución de T001–T010

> Registro del bloque inicial. Por petición del usuario, los comandos aquí mostrados se han normalizado a sus equivalentes pnpm; los resultados narrados pertenecen a la ejecución inicial previa a la migración y no se atribuyen retroactivamente a pnpm. La ejecución real posterior con pnpm se documenta por separado en [la enmienda técnica](../cambios/001-pnpm-github.md).

29/10/2026. El usuario aprobó las tareas y el bloque inicial continuo mediante
«apruebo». El alcance de esta ejecución termina en T010.

## Estado inicial

- Sin package.json ni aplicación previa: no existía suite que ejecutar.
- Se conservaron spec, plan, contratos y constitución aprobados.
- El AGENTS.md del directorio padre se leyó; su contexto Electron/pnpm no
  reemplaza el stack Next/Nest/PostgreSQL acordado para este proyecto.
- No hay interfaz de producto en este bloque; T004 verifica un Route Handler
  técnico, sin adelantar landing, componentes ni layouts operativos.

## T001 — Completada

Archivos: manifiesto raíz y seis workspaces, tsconfig.base.json, configuraciones
de paquetes, eslint.config.mjs y tools/eslint-boundaries.mjs.

Comprobación ejecutada: lectura de manifiestos e importación de la regla local
de arquitectura mediante Node. Resultado: seis workspaces privados con nombres
correctos y regla automática presente; sin errores.

Hecho cuando: «El manifiesto raíz declara los workspaces del plan y la
configuración de lint contiene las prohibiciones automáticas
domain→framework/SQL/red y ui→database; su ejecución se conecta en T005».
Cumplido como comprobación de andamiaje; el ensayo de rechazo real se ejecutará
en T005 con ESLint instalado.

RF: —; habilita el stack y sus verificaciones. No hay tests de aplicación todavía.

## Runtime local

scripts/setup-runtime.mjs obtiene la distribución oficial de Node fijada en
.node-version y comprueba SHA256 contra SHASUMS256.txt del mismo origen.
El helper actual scripts/pnpm-local.mjs invoca pnpm con el Node local en PATH para los
procesos hijos; sustituye al helper de la ejecución inicial. No modifica el Node global ni requiere credenciales externas.

Verificado: Node v24.22.1 y el gestor anterior, dentro de .tools, ignorado por Git.

## T002 — Completada

Archivos: .node-version, pnpm-workspace.yaml, scripts/setup-runtime.mjs, scripts/pnpm-local.mjs, manifiestos y pnpm-lock.yaml (nombres actuales tras la migración).

Comandos: `node scripts/pnpm-local.mjs install --frozen-lockfile` → 318 paquetes instalados, salida 0; `node scripts/pnpm-local.mjs list -r --depth Infinity` → salida 0, sin dependencias inválidas. Node v24.22.1 y el gestor anterior comprobados.

Hecho cuando: «pnpm install --frozen-lockfile termina con las versiones base registradas en el informe de compatibilidad, sin resolver a latest» → cumplido; las versiones directas quedan fijadas en manifiestos/lockfile.

Detalle menor: se retiró eslint-config-next, una configuración auxiliar inicialmente considerada que traía peers incompatibles con ESLint 10. Se conserva ESLint 10.13.0 del plan y la regla propia de capas. No cambió ninguna versión acordada. Se autorizaron únicamente los scripts de instalación de versiones fijadas de esbuild y fsevents requeridas por las herramientas locales. Drizzle Kit mantiene dos avisos de deprecación transitiva de esbuild-kit; no hay error de instalación.

RF: RNF-9 habilitado; no acredita todavía actualización de una instalación con datos.

## T003 — Completada

Archivos: apps/api/package.json, tsconfig.json y src/{app.module,health.controller,create-application,main}.ts.

`node scripts/pnpm-local.mjs --filter @almacen/api run build` → salida 0, compilación ESM con decoradores. Comprobación HTTP sobre la API compilada, puerto efímero y cierre al terminar → 1/1 correcta; GET /api/v1/health respondió 200 con service=almacen-api y status=ok.

Hecho cuando: «El build de apps/api produce el arranque ESM ejecutable con Node 24 y no presenta errores de decoradores» → cumplido. Andamiaje, sin RF de inventario implementados.

## T004 — Completada

Archivos: apps/web/{package.json,tsconfig.json,next.config.ts,next-env.d.ts,src/app/health/route.ts}. Next genera next-env.d.ts; no se crea una pantalla de producto. Se consultaron vercel-react-best-practices y la documentación oficial de Route Handlers/TypeScript de Next.

`NEXT_TELEMETRY_DISABLED=1 node scripts/pnpm-local.mjs --filter @almacen/web run build` → salida 0, Next 16.4.3/Turbopack y TypeScript correctos. Arranque de producción con servidor HTTP de puerto efímero → 1/1 comprobación correcta, /health devuelve 200 y Cache-Control no-store.

Hecho cuando: «El build de apps/web arranca con las versiones Next/React aprobadas sin errores de peers» → cumplido. No hay UI que revisar con capturas todavía.

Fuentes: https://nextjs.org/docs/app/api-reference/file-conventions/route y https://nextjs.org/docs/app/api-reference/config/typescript.

## T005 — Completada

Archivos: scripts/workspaces.mjs, tools/check-boundaries.mjs, scripts de manifiestos compartidos/raíz y README.md.

`node scripts/pnpm-local.mjs run lint` → salida 0, 11/11 comprobaciones de capas, incluidas importaciones prohibidas reales verificadas con ESLint. `node scripts/pnpm-local.mjs run typecheck` → salida 0 en seis workspaces. `node scripts/pnpm-local.mjs run build` → salida 0 en cuatro paquetes, Nest y Next.

Hecho cuando: «pnpm run lint, pnpm run typecheck y pnpm run build verifican el workspace inicial completo» → cumplido. No había suite unitaria/integración antes de T006/T009.

## T006 — Completada

Archivos: vitest.unit.config.ts, tsconfig.tests.json, tests/unit/quantity-input.test.ts, packages/domain/src/quantity-input.ts y exportación; conexión de test:unit y tipos de pruebas.

Rojo real: `node scripts/pnpm-local.mjs run test:unit` → 17 fallidas y 5 pasadas; no se rechazaban entradas inválidas. Registro output/tests/t006-red.log. Después de implementar: mismo comando → 22 pasadas, 0 fallidas. Lint → 11/11 comprobaciones de capas; typecheck → salida 0.

Hecho cuando: «test:unit pasa U-VAL/cantidad-presente-finita después de haber registrado su fallo inicial» → cumplido. RF-107/108 habilitados en presencia/formato finito; enteros, precisión, signo por operación y unidades pertenecen a T011, todavía pendiente.

## T007 — Completada

Archivos: infra/compose.postgres.yml, infra/postgres/init-roles.sql, scripts/setup-env.mjs, .env.example, packages/database/src/test-target.ts y tests/unit/test-target.test.ts. .env real generado, excluido de Git y de las salidas.

Imagen: postgres:18.6@sha256:979bccfde35445db618c65107d27d08c6c21339d8dc3ad4c830c6633947be0e4. Compose validado; ambos contenedores healthy. Dos conexiones reales con alm_app comprobaron versión 18.6, bases distintas y ausencia de superusuario/bypass RLS/CREATE de esquema.

Guarda de destino: rojo 6 fallidas / 23 pasadas por no rechazar URLs incorrectas; tras implementar, test:unit → 29 pasadas, 0 fallidas. Se rechaza desarrollo incluso con otro usuario y alias localhost/127.0.0.1. Registro rojo: output/tests/t007-red.log. Lint y tipos pasaron.

Fallo resuelto: el bind mount del script .sh no permitió ejecutar su intérprete. Se sustituyó por SQL transaccional nativo; se completaron los roles en los volúmenes recién creados sin borrarlos. Un contenedor adicional con volumen nuevo verificó inicialización automática desde cero y roles sin superusuario/bypass; se retiraron solo esos recursos efímeros de comprobación.

Hecho cuando: «La comprobación del entorno identifica PostgreSQL 18.6 y rechaza usar la URL habitual como destino de pruebas» → cumplido. RNF-8/9 habilitados; respaldo/restauración y actualizaciones de negocio todavía pendientes.

Se aplicó supabase-postgres-best-practices para privilegios y conexiones; no se conectó ningún servicio Supabase. Fuente de la imagen: https://github.com/docker-library/docs/blob/master/postgres/README.md.

## T008 — Completada

Archivos: packages/database/src/{migrate,migrate-cli}.ts, migrations/0000_infrastructure.sql, migrations/meta/_journal.json y script raíz db:migrate.

`node scripts/pnpm-local.mjs run db:migrate` → primera ejecución applied=1,total=1; segunda applied=0,total=1. Mismo comando con `--test` aplica el diario en la base de pruebas. Dos llamadas concurrentes posteriores devolvieron applied=0,total=1 cada una; intentar migrar con alm_app fue rechazado. Se valida el hash del historial aplicado y se utiliza advisory lock de sesión en una única conexión.

Regresión: test:unit → 29 pasadas, 0 fallidas; lint → 11/11 comprobaciones de capas, salida 0. La compilación del paquete database pasó al ejecutar cada migración.

Hecho cuando: «db:migrate aplica el diario sobre una base vacía y su segunda ejecución no repite cambios» → cumplido. La única migración es una base técnica sin tablas de negocio; no se adelanta T020.

Detalle menor: el diario Drizzle se aloja en app, bajo el rol de migración separado; el CLI acepta --test para escoger el destino aislado con la misma guarda de seguridad.

## T009 — Completada

Archivos: packages/database/src/transaction.ts, vitest.integration.config.ts, tests/integration/{setup,health.test,rollback.test}.ts y scripts de compilación/ejecución.

Rojo real: test:integration → 1 fallida / 2 pasadas; tras el fallo inyectado el origen quedó en 90 en vez de 100. Registro output/tests/t009-red.log. Después de implementar BEGIN/COMMIT/ROLLBACK y liberar conexión: mismo comando → 3 pasadas, 0 fallidas. Test:unit → 29 pasadas; lint → 11/11; typecheck → salida 0.

Hecho cuando: «test:integration pasa I-INV/rollback-inyectado usando una conexión PostgreSQL real» → cumplido con tabla de fixture en esquema aleatorio de almacen_test y rol alm_app. El esquema de fixture se elimina al terminar; no se cambia la base de desarrollo. Supertest utiliza la API compilada, no un mock del servidor.

RF-48/RNF-2 habilitados como infraestructura. Las recepciones y movimientos del producto todavía no existen; no se declara cumplido el flujo de inventario por este ensayo. Las barreras de concurrencia de T032 siguen pendientes.

## T010 — Completada

Archivos: apps/api/src/platform/http/{api-exception,api-exception.filter,zod-validation.pipe}.ts, create-application.ts, packages/contracts/src/quantity-input.ts, tests/fixtures/http.module.ts, tests/integration/error-contract.test.ts y compilación de fixtures/manifiestos.

Rojo real: test:integration → 12 fallidas / 4 pasadas, por falta de rechazo/serialización de errores. Registro output/tests/t010-red.log. Tras implementar Zod estricto, pipe global, filtro y correlación de solicitud: mismo comando → 16 pasadas, 0 fallidas. Los probes de prueba se compilan aparte y no se importan en AppModule de producción.

Hecho cuando: «test:integration pasa I-ACC/error-contract con code, message en español, details y requestId sin devolver éxito a una entrada inválida» → cumplido. Se verifican campos adicionales, cantidad ausente/no numérica/no finita, cantidad grande exacta, JSON inválido, códigos 401/403/404/409/500 y ausencia de mensajes internos en respuesta.

RF-107/108 y RNF-1/2 habilitados en el borde HTTP; autenticación, permisos y validación de cantidades por operación/unidad siguen perteneciendo a sus tareas posteriores.

## Verificación final del bloque

Ejecutada nuevamente desde instalación limpia del lockfile, usando Node 24.22.1 y el gestor anterior locales:

| Comando (prefijo node scripts/pnpm-local.mjs) | Resultado real |
|---|---|
| install --frozen-lockfile (equivalente actual) | 318 paquetes, salida 0 |
| run lint | Salida 0; 11/11 comprobaciones de capas |
| run test:unit | 29 pasadas, 0 fallidas; 2 archivos |
| run test:integration | 16 pasadas, 0 fallidas; 3 archivos, PostgreSQL real |
| run typecheck | Salida 0 en workspaces, fixtures y pruebas |
| run build | Salida 0: paquetes, Nest ESM y Next producción |

Total de pruebas: **45 pasadas, 0 fallidas**, más 11 comprobaciones de arquitectura.
Migraciones probadas en desarrollo y pruebas, con idempotencia y exclusión concurrente. No se ejecutaron métricas del perfil grande, backup/restore ni pruebas de pantallas: esas capacidades no corresponden a T001–T010.

T001–T010 completadas. Siguiente pendiente: **T011 — Implementa cantidades exactas y unidades**, no iniciada. El bloque acordado termina aquí.

Spec, plan, contratos y constitución conservan sus hashes anteriores. No hubo commits, push ni despliegue; no se configuraron credenciales externas. Los dos contenedores PostgreSQL del proyecto quedan disponibles; los servidores de comprobación HTTP de puerto efímero se cerraron al finalizar cada ensayo.
