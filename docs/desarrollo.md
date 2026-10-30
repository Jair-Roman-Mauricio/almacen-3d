# Desarrollo local

## Herramientas y dependencias

Versiones: Node 24.22.1 y pnpm 12.16.1. Consultar `.node-version`, `packageManager`, `engines` y `pnpm-workspace.yaml`.

```sh
node scripts/setup-runtime.mjs
node scripts/setup-pnpm.mjs
node scripts/pnpm-local.mjs install --frozen-lockfile
```

Los helpers usan las herramientas de `.tools/` sin cambiar el entorno global. Requieren Internet para la primera descarga. Los scripts de instalación de dependencias permitidos están limitados por versión en `allowBuilds`. Los enlaces `workspace:*` impiden sustituir los paquetes internos por paquetes del registro.

Se utiliza exclusivamente pnpm. Un hook `preinstall` rechaza gestores o versiones distintos; no sustituye una comprobación de seguridad contra una ejecución que omita scripts deliberadamente. Para agregar una dependencia, usar `pnpm --filter @almacen/<paquete> add <nombre>@<versión>` con las herramientas fijadas y revisar el lockfile. Para ejecutar una utilidad, usar `pnpm exec` si está instalada o `pnpm dlx` con versión explícita.

El descargador usa el registro público de paquetes; eso no implica usar otro cliente de gestión. Las variables `npm_config_user_agent` y `npm_execpath` son nombres estándar que pnpm proporciona a los scripts; se mantienen por compatibilidad con su protocolo.

## Bases aisladas

Con Docker Engine disponible:

```sh
node scripts/setup-env.mjs
docker compose --env-file .env -f infra/compose.postgres.yml up -d --wait
node scripts/pnpm-local.mjs run db:roles
node scripts/pnpm-local.mjs run db:migrate
node scripts/pnpm-local.mjs run db:migrate --test
```

| Entorno | Dirección | Base |
|---|---|---|
| Desarrollo | 127.0.0.1:55432 | almacen_dev |
| Pruebas | 127.0.0.1:55433 | almacen_test |

`setup-env.mjs` conserva valores existentes y completa las credenciales de provisión ausentes. El rol `alm_app` no es superusuario, no omite RLS y no crea esquemas. `alm_migrator` aplica migraciones con otra credencial. `alm_provision` tiene una credencial independiente y no puede consultar inventario; ejecuta únicamente las funciones limitadas de alta SaaS/setup local. El diario tiene 18 versiones; RLS está forzada en las 23 tablas de empresa. Ver [persistencia y aislamiento](persistencia.md).

El guard de pruebas exige una base terminada en `_test`, distinta del destino de desarrollo y sin parámetros de URL. Las fixtures iniciales crean esquemas propios. Las pruebas de negocio/RLS crean bases `phase2_<uuid>_test` mediante bootstrap, aplican el diario real y eliminan solo esas bases al terminar; usan `PG_TEST_BOOTSTRAP_PASSWORD` para esa preparación. No ejecutar pruebas contra bases de trabajo reales.

Para detener los contenedores conservando los volúmenes:

```sh
docker compose --env-file .env -f infra/compose.postgres.yml stop
```

Los cambios de contraseña de `.env` no reconfiguran automáticamente roles de un volumen ya inicializado. No borrar volúmenes para resolverlo: revisar credenciales y permisos de esa instalación. `db:roles` prepara la nueva credencial de provisión en volúmenes existentes sin sustituir los de desarrollo/pruebas.

## Comprobaciones disponibles

```sh
node scripts/pnpm-local.mjs run lint
node scripts/pnpm-local.mjs run test:unit
node scripts/pnpm-local.mjs run test:integration
node scripts/pnpm-local.mjs run typecheck
node scripts/pnpm-local.mjs run build
```

Integración y typecheck compilan sus dependencias y fixtures. El build recorre paquetes compartidos antes de apps. Ninguno de esos comandos realiza seed de negocio. Los comandos `dev`, `test:flows`, `test:modes`, `test:load` y `test:recovery` del plan todavía no están implementados.

## Diagnóstico HTTP opcional

Después del build, en terminales independientes:

```sh
node scripts/pnpm-local.mjs exec node --env-file=.env apps/api/dist/main.js
node scripts/pnpm-local.mjs --filter @almacen/web run start --port 3000
```

API: `http://127.0.0.1:3001/api/v1/health`. Next: `http://127.0.0.1:3000/health`. La API también ofrece acceso y equipo por HTTP; Next solo tiene una ruta técnica, sin páginas del WMS. Usar Ctrl+C para cerrar cada proceso. Esta entrega no deja esos servidores abiertos.

## Diagnóstico de fallos

- Runtime ausente: repetir los dos scripts `setup-*` de herramientas.
- Lockfile desactualizado: revisar manifiestos y actualizarlo expresamente con pnpm; no omitir la comprobación congelada en una reproducción.
- PostgreSQL inaccesible: comprobar `docker compose --env-file .env -f infra/compose.postgres.yml ps` y la disponibilidad de puertos.
- Test que rechaza el destino: revisar los nombres de variables de `.env` sin imprimir contraseñas en registros compartidos.
- Builds ausentes al iniciar un servidor: ejecutar el build raíz primero.

La integración MCP de inspiración se configura por separado según [su guía](integraciones/awwwards-mcp.md); no se necesita para instalar, compilar o probar la base actual.


## Probar el backend por HTTP

La API carga las conexiones de `.env` con el comando de arranque anterior. No
utilizar credenciales bootstrap/migraciones en las conexiones de operación.
Puede configurarse en `.env`:

```dotenv
INSTALLATION_MODE=saas
APP_ORIGIN=http://127.0.0.1:3000
DEMO_MODE=false
API_JSON_LIMIT=16mb
```

`INSTALLATION_MODE` admite `saas` o `local`. La modalidad persistida al primer alta
no se cambia alternando una variable. Para probar ambas, usar bases/instalaciones
separadas; las pruebas automatizadas ya las crean así. `APP_ORIGIN` debe coincidir
exactamente con el origen del cliente, sin ruta ni barra final; HTTPS fuera de
localhost. `DEMO_MODE` es una indicación del entorno, no crea cuentas demo todavía.

El límite técnico JSON es configurable con `API_JSON_LIMIT` (16 MiB por defecto); no impone una cuota de almacenes o elementos. GET layout negocia gzip. Las revisiones de layout se devuelven como cadenas enteras exactas.

Rutas implementadas bajo `/api/v1`:

| Rutas | Uso |
|---|---|
| `GET /public/config` | Modalidad y necesidad de setup local |
| `POST /registrations` | Empresa y administrador SaaS juntos |
| `POST /local-setup` | Primera empresa/admin de un servidor local |
| `POST /sessions`, `GET /sessions/current`, `DELETE /sessions/current` | Acceso, contexto actual y cierre |
| `GET /users`, `POST /users`, `PATCH /users/:id` | Equipo; solo administrador |
| `GET /company`, `PATCH /company` | Consulta para todos los roles, cambios por administrador |
| `GET /operations/:reference` | Resultado persistido con permiso actual del tipo original |
| `GET/POST /warehouses`, `GET/POST /products`, `PATCH/DELETE /products/:id` | Almacenes y catálogo |
| `GET/PUT /warehouses/:id/layout`, `GET /warehouses/:id/locations` | Distribución persistida y lista de ubicaciones |
| `GET /warehouses/:id/spatial-search?kind=sku&code=...` | IDs de ubicaciones con stock del SKU; también `kind=location` |
| `GET /inventory`, `GET /inventory/totals` | Filtro obligatorio `warehouseId`, cantidades exactas por posición/producto |
| `GET /locations/:id/inventory` | Productos/saldos de una ubicación |
| `POST /receipts`, `POST /internal-moves` | Confirmaciones físicas con `lines` y referencia |
| `POST /locations/:id/block`, `POST /locations/:id/unblock` | Solo admin; desbloqueo con motivo |
| `GET /history`, `GET /audit` | Admin/supervisor; filtros de días en zona de empresa |
| `GET/POST /orders`, `GET /orders/:id` | Pedidos y saldos por línea; lista con `warehouseId` obligatorio |
| `POST /orders/:id/reservations`, `PUT /orders/:id/assignment` | Reservas parciales y asignación a operario activo |
| `POST /orders/:id/preparations`, `/dispatches`, `/cancellation` | Avances parciales y cancelación bajo sus restricciones |
| `GET/POST /transfers`, `GET /transfers/:id` | Traslados declarados, todavía sin consumir físico |
| `POST /transfers/:id/departure`, `/receipts` | Salida declarada completa y recepciones parciales explícitas |
| `GET/POST /counts`, `GET /counts/:id` | Observado/físico/revisión/diferencia; lista por `warehouseId` |
| `POST /counts/:id/adjustment` | Ajuste con motivo por admin/supervisor, referencia vigente y reservas protegidas |

Las mutaciones públicas requieren `Origin: <APP_ORIGIN>` y JSON. Las protegidas
requieren además la cookie opaca y `X-CSRF-Token`, recibido al iniciar/consultar
sesión. Los cambios de equipo/perfil y las nuevas operaciones llevan `Idempotency-Key: <UUID>`; repetirlo
con los mismos datos devuelve la confirmación original. Un timeout se resuelve
consultando la referencia antes de decidir el siguiente reintento.

Ejemplo con datos sintéticos, mientras la API está iniciada:

```sh
curl --fail-with-body http://127.0.0.1:3001/api/v1/public/config
curl --fail-with-body http://127.0.0.1:3001/api/v1/registrations \
  -H 'Origin: http://127.0.0.1:3000' -H 'Content-Type: application/json' \
  --data '{"company":{"code":"EJEMPLO","name":"Empresa sintética"},"administrator":{"name":"Admin","email":"admin@example.test","password":"clave sintética"}}'
curl --fail-with-body -c .tools/session.cookies http://127.0.0.1:3001/api/v1/sessions \
  -H 'Origin: http://127.0.0.1:3000' -H 'Content-Type: application/json' \
  --data '{"companyCode":"EJEMPLO","email":"admin@example.test","password":"clave sintética"}'
curl --fail-with-body -b .tools/session.cookies http://127.0.0.1:3001/api/v1/sessions/current
```

En local, sustituir `/registrations` por `/local-setup` únicamente antes de
configurar esa instalación. Un reenvío no sustituye una empresa ni reabre el setup.
El fichero de cookies es privado e ignorado por Git; eliminarlo al terminar.
Los ejemplos no crean datos al instalar, compilar o ejecutar la suite.


Los contratos exactos de almacenes, catálogo, layout, recepción, movimiento e
historial están en [contratos.md](../specs/001-wms-operativo-3d/contratos.md).
Al confirmar un PUT de layout, conservar `baseRevision` y los UUID existentes;
omitir un elemento solicita retirarlo, sujeto a stock/trabajo de descendientes.
Un conflicto no sustituye el borrador: recuperar o revisar la distribución actual.
Los cambios físicos se confirman mediante operaciones; no hay un PATCH directo
de cantidades. Consultar [evidencia de fases 5–6](evidencias/fase-05-06.md).


## Flujos de salida y corrección

Pedidos y traslados usan las mismas referencias UUID, cookie, CSRF y Origin que
las recepciones. Las cantidades son cadenas decimales exactas; no enviar números
binarios de JSON ni campos de control/empresa ajenos al contrato.

1. Crear pedido con `code`, `warehouseId` y `lines:[{productId,quantity}]`.
2. Reservar con `lines:[{orderLineId,sourceLocationId,quantity}]`; tomar los IDs de
   las líneas devueltas, conservando sus reservas/asignaciones de stock.
3. Asignar con `{operatorId}` y preparar `lines:[{allocationId,quantity}]`. El
   operario requiere asignación actual; admin/supervisor conservan permiso.
4. Despachar cantidades explícitas de esas asignaciones. Cada parcial confirma
   todo su lote o lo revierte, y deja el pendiente para otra acción con otra referencia.
5. Para traslado, registrar la ruta y confirmar todas las cantidades declaradas
   con `transferLineId`; recibirlas explícitamente con `targetLocationId`. El
   tránsito sigue separado de físico y disponible hasta confirmar cada recepción.
6. Registrar conteo con `{warehouseId,locationId,productId,observed}`. El ajuste
   posterior solo recibe `{reason}`: el cliente no sustituye observado, revisión
   o reservas. Si el físico cambió, registrar un conteo nuevo.

Una referencia nueva representa otra acción; no reutilizarla para otros datos.
Tras timeout, consultar `/operations/:reference` y reintentar con la misma
referencia si corresponde. Desbloquear o reasignar no ejecuta avances pendientes.
Ver [evidencia de fases 7–8](evidencias/fase-07-08.md). No hay todavía pantallas de
producto para estos flujos; la prueba funcional actual se realiza por HTTP.
