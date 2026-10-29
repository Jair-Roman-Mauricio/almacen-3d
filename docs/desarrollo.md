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
node scripts/pnpm-local.mjs run db:migrate
node scripts/pnpm-local.mjs run db:migrate --test
```

| Entorno | Dirección | Base |
|---|---|---|
| Desarrollo | 127.0.0.1:55432 | almacen_dev |
| Pruebas | 127.0.0.1:55433 | almacen_test |

`setup-env.mjs` conserva un `.env` existente. El rol `alm_app` no es superusuario, no omite RLS y no crea esquemas. `alm_migrator` aplica migraciones con otra credencial. Las tablas y políticas de negocio pertenecen a tareas posteriores. El diario inicial solo verifica la infraestructura.

El guard de pruebas exige una base terminada en `_test`, distinta del destino de desarrollo y sin parámetros de URL. Las fixtures de integración crean esquemas propios y los eliminan al terminar. No ejecutar pruebas contra bases de trabajo reales.

Para detener los contenedores conservando los volúmenes:

```sh
docker compose --env-file .env -f infra/compose.postgres.yml stop
```

Los cambios de contraseña de `.env` no reconfiguran automáticamente roles de un volumen ya inicializado. No borrar volúmenes para resolverlo: revisar credenciales y permisos de esa instalación.

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
node scripts/pnpm-local.mjs --filter @almacen/api run start
node scripts/pnpm-local.mjs --filter @almacen/web run start --port 3000
```

API: `http://127.0.0.1:3001/api/v1/health`. Next: `http://127.0.0.1:3000/health`. Son rutas técnicas, sin páginas del WMS. Usar Ctrl+C para cerrar cada proceso. Esta entrega no deja esos servidores abiertos.

## Diagnóstico de fallos

- Runtime ausente: repetir los dos scripts `setup-*` de herramientas.
- Lockfile desactualizado: revisar manifiestos y actualizarlo expresamente con pnpm; no omitir la comprobación congelada en una reproducción.
- PostgreSQL inaccesible: comprobar `docker compose --env-file .env -f infra/compose.postgres.yml ps` y la disponibilidad de puertos.
- Test que rechaza el destino: revisar los nombres de variables de `.env` sin imprimir contraseñas en registros compartidos.
- Builds ausentes al iniciar un servidor: ejecutar el build raíz primero.

La integración MCP de inspiración se configura por separado según [su guía](integraciones/awwwards-mcp.md); no se necesita para instalar, compilar o probar la base actual.
