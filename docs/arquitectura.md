# Arquitectura

## Dirección aprobada

Dos aplicaciones y cuatro paquetes compartidos, con un monolito modular de negocio. SaaS y local compartirán reglas; la modalidad no duplicará la implementación de inventario. El [plan](../specs/001-wms-operativo-3d/plan.md) y los [contratos](../specs/001-wms-operativo-3d/contratos.md) son el acuerdo detallado; esta página explica la base existente.

| Módulo | Responsabilidad actual | Límite |
|---|---|---|
| `apps/api` | Arranque Nest, salud, validación y errores | Punto de entrada HTTP; sin operaciones WMS todavía |
| `apps/web` | Next App Router y `/health` | Sin páginas ni componentes de producto |
| `packages/domain` | Validación pura inicial de cantidades | No importa frameworks, SQL ni red |
| `packages/contracts` | Esquemas compartidos y formato de errores | No accede a datos |
| `packages/database` | Conexiones, transacciones, migraciones y guard de pruebas | Efectos PostgreSQL fuera del dominio |
| `packages/ui` | Base de paquete reservada a componentes futuros | No importa database |

ESLint y `tools/check-boundaries.mjs` verifican importaciones permitidas y prohibidas. El grafo de build compila dependencias antes de consumidores. Las dependencias internas declaran `workspace:*`.

## Borde HTTP

La API usa el prefijo `/api/v1`, asigna `requestId`, valida DTO con esquemas Zod y responde errores con `code`, `message` en español, `details` y `requestId`. Los fallos internos no devuelven su mensaje original al cliente. Los endpoints de prueba viven en fixtures y no se importan en el módulo de producción.

La ruta de salud no comprueba por sí sola la disponibilidad de todas las futuras dependencias ni acredita seguridad multiempresa.

## Persistencia

PostgreSQL local tiene servicios, credenciales y volúmenes separados para desarrollo y pruebas. Las migraciones usan un rol distinto al de aplicación, una única conexión, advisory lock de sesión y comprobación de hashes del diario aplicado. Repetir la migración no reaplica versiones. La migración inicial es técnica; no crea tablas de negocio.

`withTransaction` abre una transacción READ COMMITTED, confirma en éxito y revierte ante error. Si falla el rollback, descarta la conexión para evitar devolverla contaminada al pool. Las pruebas comprueban el comportamiento con PostgreSQL real.

## Pendiente según el plan

Las sesiones, RLS de negocio, inventario, idempotencia operativa, outbox/SSE, importaciones, editor y visor 3D se implementarán en sus tareas. No se atribuyen esas capacidades a los helpers actuales. Las mediciones, restauración y equivalencia completa SaaS/local también están pendientes de evidencia.
