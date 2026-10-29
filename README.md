# Almacén 3D

Sistema de gestión de almacenes (WMS) en desarrollo para empresas con almacenes de mediano y gran tamaño. El proyecto contempla inventario trazable y un editor configurable de zonas, pasillos, racks, niveles y ubicaciones, con visualización 3D.

Se construye siguiendo **Specification Driven Development (SDD)**: requisitos, contratos, plan, tareas y evidencia verificable antes de dar una capacidad por terminada.

> **Estado al 29/10/2026:** base técnica completada, **19 de 214 tareas**. Hay compilación web/API, rutas de salud, migraciones y reglas puras de cantidades, fechas, saldos, tránsito, geometría y alertas. La interfaz operativa, el editor 3D y la landing todavía no están implementados. Este repositorio documenta el desarrollo; aún no ofrece una demo del WMS.

## Producto previsto

- Inventario, recepciones, movimientos, reservas, picking, despachos y traslados.
- Conteos, ajustes, bloqueos, historial, reportes e intercambio CSV/XLSX.
- Editor visual de la distribución física y consulta de ubicaciones en 3D.
- Modalidad SaaS con suscripción e infraestructura mantenida por el proveedor.
- Modalidad local en infraestructura del cliente, con instalación y servicios asociados.

Estas capacidades están **especificadas**, no disponibles todavía. El núcleo de negocio será compartido entre ambas modalidades. Los datos de demostración serán sintéticos y los cobros, simulados en esta etapa.

## Base técnica

| Área | Tecnología fijada |
|---|---|
| Runtime | Node.js 24.22.1 |
| Dependencias | pnpm 12.16.1, un único `pnpm-lock.yaml` |
| Web | Next.js 16.4.3, React 19.3.1, TypeScript |
| API | NestJS 12.3.2, ESM, TypeScript |
| Datos | PostgreSQL 18.6, pg y Drizzle |
| Verificación | Vitest, Supertest, ESLint y TypeScript |

La instalación local no requiere cuentas de servicios cloud. El [plan técnico](specs/001-wms-operativo-3d/plan.md) identifica también las tecnologías previstas para fases futuras.

## Preparación local

Requisitos: Git, un Node existente para ejecutar los descargadores y Docker con Compose para PostgreSQL. Los helpers de runtime están preparados para macOS/Linux, ARM64/x64; no se afirma compatibilidad probada en otras plataformas.

```sh
git clone https://github.com/Jair-Roman-Mauricio/almacen-3d.git
cd almacen-3d
node scripts/setup-runtime.mjs
node scripts/setup-pnpm.mjs
node scripts/pnpm-local.mjs install --frozen-lockfile
node scripts/setup-env.mjs
docker compose --env-file .env -f infra/compose.postgres.yml up -d --wait
node scripts/pnpm-local.mjs run db:migrate
node scripts/pnpm-local.mjs run db:migrate --test
```

Los descargadores comprueban la integridad de las herramientas y las guardan en `.tools/`; no cambian instalaciones globales. `setup-env.mjs` genera credenciales aleatorias y conserva un `.env` existente. **No subir `.env` al repositorio.**

## Verificación

```sh
node scripts/pnpm-local.mjs run lint
node scripts/pnpm-local.mjs run test:unit
node scripts/pnpm-local.mjs run test:integration
node scripts/pnpm-local.mjs run typecheck
node scripts/pnpm-local.mjs run build
```

Si Node y pnpm ya coinciden con las versiones fijadas y están en `PATH`, se puede usar directamente `pnpm install --frozen-lockfile` y `pnpm run <script>`.

Las pruebas actuales cubren validación inicial de cantidades, protección de la base de pruebas, rollback real y contrato de errores HTTP. No acreditan todavía el WMS completo. Los resultados ejecutados de la migración a pnpm están en [la evidencia técnica](docs/cambios/001-pnpm-github.md).

La fase 1 está verificada con **149 pruebas unitarias y 16 de integración aprobadas**, más 11 comprobaciones de arquitectura. Ver [su evidencia](docs/evidencias/fase-01.md).

## Estructura

```text
apps/api/       API NestJS
apps/web/       Base Next.js; solo ruta técnica /health
packages/       domain, contracts, database y ui
infra/          PostgreSQL local y roles separados
scripts/        Preparación y ejecución reproducible
tests/          Pruebas unitarias, integración y fixtures
specs/          Requisitos, contratos, plan y 214 tareas
docs/           Arquitectura, guías, decisiones y evidencia
investigacion/  Investigación de mercado inicial
```

## Documentación

- [Índice documental](docs/README.md) y [estado del proyecto](docs/estado.md).
- [Constitución](docs/constitution.md) y [flujo SDD](docs/flujo-sdd.md).
- [Especificación](specs/001-wms-operativo-3d/spec.md), [contratos](specs/001-wms-operativo-3d/contratos.md), [plan](specs/001-wms-operativo-3d/plan.md) y [tareas](specs/001-wms-operativo-3d/tasks.md).
- [Arquitectura](docs/arquitectura.md), [desarrollo local](docs/desarrollo.md) y [contribución](CONTRIBUTING.md).
- [Investigación de mercado](investigacion/mercado-almacen-3d.md) y [referencias de diseño](specs/001-wms-operativo-3d/referencias-ui.md).

La interfaz comienza en T119; el editor y visor 3D, en T141. Actualmente solo existen comprobaciones de salud, por lo que no hay una vista previa visual que mostrar. El despliegue de la aplicación en Railway requiere una indicación posterior expresa.

## Licencia

Pendiente de definición por el titular. La publicación del código no concede por sí sola una licencia de uso, modificación o distribución.
