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

`setup-env.mjs` conserva valores existentes y completa las credenciales de provisión ausentes. El rol `alm_app` no es superusuario, no omite RLS y no crea esquemas. `alm_migrator` aplica migraciones con otra credencial. `alm_provision` tiene una credencial independiente y no puede consultar inventario; ejecuta únicamente las funciones limitadas de alta SaaS/setup local. El diario tiene 17 versiones; RLS está forzada en las 23 tablas de empresa. Ver [persistencia y aislamiento](persistencia.md).

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


## Probar acceso y equipo por HTTP

La API carga las conexiones de `.env` con el comando de arranque anterior. No
utilizar credenciales bootstrap/migraciones en las conexiones de operación.
Puede configurarse en `.env`:

```dotenv
INSTALLATION_MODE=saas
APP_ORIGIN=http://127.0.0.1:3000
DEMO_MODE=false
```

`INSTALLATION_MODE` admite `saas` o `local`. La modalidad persistida al primer alta
no se cambia alternando una variable. Para probar ambas, usar bases/instalaciones
separadas; las pruebas automatizadas ya las crean así. `APP_ORIGIN` debe coincidir
exactamente con el origen del cliente, sin ruta ni barra final; HTTPS fuera de
localhost. `DEMO_MODE` es una indicación del entorno, no crea cuentas demo todavía.

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

Las mutaciones públicas requieren `Origin: <APP_ORIGIN>` y JSON. Las protegidas
requieren además la cookie opaca y `X-CSRF-Token`, recibido al iniciar/consultar
sesión. Los cambios de equipo/perfil llevan `Idempotency-Key: <UUID>`; repetirlo
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
