# Enmienda técnica 001: pnpm y publicación del repositorio

Fecha: 29/10/2026. Estado: implementada y verificada localmente.

## Autorización y alcance

El usuario pidió publicar el estado actual en GitHub, documentarlo profesionalmente y añadir como regla pnpm. Confirmó repositorio **público** para mostrar el desarrollo en LinkedIn y precisó que el reemplazo debía cubrir todo el proyecto sin romperlo.

Es mantenimiento técnico de C1/RNF-9. No añade RF, no altera la spec o los contratos y no cambia el modelo de datos. T001–T010 siguen completadas; T011 no se inicia. No se construye UI ni se despliega en Railway.

## Cambios

| Antes | Después | Motivo |
|---|---|---|
| Gestor y lockfile anteriores | pnpm 12.16.1 y `pnpm-lock.yaml` | Petición expresa; una única fuente de resolución |
| Workspaces declarados en manifiesto raíz | `pnpm-workspace.yaml` | Configuración nativa del gestor |
| Versiones internas convencionales | `workspace:*` | Resolución explícita de paquetes locales |
| Helper anterior | `setup-pnpm.mjs` y `pnpm-local.mjs` | Herramientas verificadas dentro de `.tools/` |
| Configuración anterior de instalación | `saveExact`, `engineStrict` y `allowBuilds` por versión en el workspace | Versiones exactas y scripts de instalación limitados |
| Herramienta libre por entorno | `packageManager`, `engines`, `preinstall` y regla en `AGENTS.md`/C1 | Unificar el flujo de instalación y ejecución |
| Importaciones disponibles por hoisting | Dependencias de pruebas declaradas explícitamente en la raíz | Instalación aislada de pnpm |
| README inicial | Guías de arquitectura, desarrollo, estado y contribución | Entrada profesional y reproducible al repositorio |

Se retiraron el helper y lockfile anteriores. Todos los comandos activos, criterios de tareas y guías usan pnpm, incluidos filtros y argumentos. Los nombres estándar `npm_config_user_agent`/`npm_execpath` se conservan porque pnpm los usa para comunicar su entorno; no invocan el cliente anterior. El registro de paquetes conserva su dominio oficial.

Los documentos de revisión y evidencia inicial identifican la normalización de comandos. Sus resultados antiguos no se atribuyen a pnpm: la tabla siguiente es una ejecución nueva. El diff documental de C1/plan/tareas está en [001-pnpm-sdd.diff](001-pnpm-sdd.diff).

## Revalidación ejecutada

Entorno: macOS ARM64, Node 24.22.1 y pnpm 12.16.1 locales; PostgreSQL 18.6 en Docker. Se apartaron **todos** los `node_modules`, builds y caches de compilación de apps/paquetes, dentro de `.tools/` ignorado, antes de reinstalar. No se reutilizó la disposición del gestor anterior. El store de contenido de pnpm sí se reutiliza; la resolución se obtiene del lockfile congelado.

Prefijo de comandos: `node scripts/pnpm-local.mjs`.

| Comando | Resultado ejecutado |
|---|---|
| `install --frozen-lockfile` | Salida 0, 306 paquetes; 7 proyectos contando la raíz; preinstall correcto |
| `run lint` | Salida 0; 11/11 comprobaciones de capas |
| `run test:unit` | 29/29 pasadas, 2 archivos |
| `run typecheck` | Salida 0; paquetes, apps, fixtures y pruebas |
| `run test:integration` | 16/16 pasadas, 3 archivos; PostgreSQL real |
| `run build` | Salida 0; cuatro paquetes, Nest ESM y Next producción |
| `run db:migrate` | Salida 0; 0 nuevas, 1 total versionada en desarrollo |
| `run db:migrate --test` | Salida 0; 0 nuevas, 1 total versionada en pruebas |

**45 pruebas pasadas, 0 fallidas**, más 11 comprobaciones de arquitectura. Next solo genera su página interna de error y la ruta técnica `/health`; no hay pantallas del producto.

La importación del lockfile notificó dos subdependencias deprecadas de Drizzle Kit (`@esbuild-kit/core-utils` y `@esbuild-kit/esm-loader`); no impidieron instalar ni verificar. Se conserva el stack aprobado. Esto no equivale a una auditoría de vulnerabilidades ni a validar las 214 tareas.

## Integridad del acuerdo

Se conservan los hashes SHA256 de los documentos funcionales:

- `spec.md`: `a2012e80d3b24ff235f8f77d85a29a3d2998217e7efce2791be92158325ae436`.
- `contratos.md`: `06f26ea509fdd3f419839153cf49617cc01f6dd70c4fceea189a89cc25f33f7a`.

Solo se adapta la gestión técnica de dependencias en constitución/plan/tareas, con anotación D23. No se renumeran tareas, requisitos, casos o criterios de finalización.

## Publicación y límites

Repositorio autorizado: [Jair-Roman-Mauricio/almacen-3d](https://github.com/Jair-Roman-Mauricio/almacen-3d). Se utiliza la cuenta conectada de GitHub; la creación y el push usan GitHub CLI porque el complemento disponible permite consulta pero no creación/push.

La revisión del contenido a publicar excluye `.env`, `.tools`, `node_modules`, builds, logs y capturas locales de terceros. No se agregan licencias, CI remota, despliegues o credenciales por inferencia. El repositorio documenta una base en desarrollo; no se presenta como producto terminado.

## Fuentes técnicas

- [Instalación oficial de pnpm](https://pnpm.io/installation).
- [Configuración de pnpm](https://pnpm.io/settings).
- [Importación de lockfiles](https://pnpm.io/cli/import).

La política vigente se consulta en [AGENTS.md](../../AGENTS.md), [constitución](../constitution.md) y [guía de desarrollo](../desarrollo.md).
