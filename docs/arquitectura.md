# Arquitectura

## Dirección aprobada

Dos aplicaciones y cuatro paquetes compartidos, con un monolito modular de negocio. SaaS y local compartirán reglas; la modalidad no duplicará la implementación de inventario. El [plan](../specs/001-wms-operativo-3d/plan.md) y los [contratos](../specs/001-wms-operativo-3d/contratos.md) son el acuerdo detallado; esta página explica la base existente.

| Módulo | Responsabilidad actual | Límite |
|---|---|---|
| `apps/api` | Arranque Nest, salud, acceso/equipo, geometría/inventario, comandos, validación y errores | Punto de entrada HTTP; recepciones/movimientos/historial; salidas posteriores pendientes |
| `apps/web` | Next App Router y `/health` | Sin páginas ni componentes de producto |
| `packages/domain` | Cantidades exactas, identificadores, fechas, saldos, geometría y alertas | No importa frameworks, SQL ni red |
| `packages/contracts` | Esquemas compartidos y formato de errores | No accede a datos |
| `packages/database` | Esquema, contexto/repositorio, RLS, transacciones, migraciones y guard de pruebas | Efectos PostgreSQL fuera del dominio |
| `packages/ui` | Base de paquete reservada a componentes futuros | No importa database |

ESLint y `tools/check-boundaries.mjs` verifican importaciones permitidas y prohibidas. El grafo de build compila dependencias antes de consumidores. Las dependencias internas declaran `workspace:*`.

## Borde HTTP

La API usa el prefijo `/api/v1`, asigna `requestId`, valida DTO con esquemas Zod y responde errores con `code`, `message` en español, `details` y `requestId`. Los fallos internos no devuelven su mensaje original al cliente. Los endpoints de prueba viven en fixtures y no se importan en el módulo de producción.

La ruta de salud no comprueba por sí sola la disponibilidad de todas las futuras dependencias ni acredita seguridad multiempresa.

## Persistencia

PostgreSQL local tiene servicios, credenciales y volúmenes separados para desarrollo y pruebas. Las migraciones usan un rol distinto al de aplicación, una única conexión, advisory lock de sesión y comprobación de hashes del diario aplicado. Repetir la migración no reaplica versiones. El diario incluye 18 versiones de base, negocio, aislamiento, índices y acceso: 23 tablas de empresa, control de instalación y diario de Drizzle.

`withTransaction` abre una transacción READ COMMITTED, confirma en éxito y revierte ante error. Si falla el rollback, descarta la conexión para evitar devolverla contaminada al pool. Las pruebas comprueban el comportamiento con PostgreSQL real.

## Reglas puras disponibles

La fase 1 añade valores de cantidad en milésimas BigInt y reglas por unidad, normalización Unicode, días civiles en zona IANA, saldos y estados de salida/tránsito, cajas geométricas exactas con decimal.js y alertas de stock. Las transformaciones no escriben datos ni sustituyen permisos o transacciones. [La evidencia](evidencias/fase-01.md) describe los criterios y resultados.

## Persistencia y contexto implementados

La fase 2 incorpora claves compuestas de ámbito, restricciones sin redondeo, revisión física, comandos/auditoría/outbox y staging. `withTenantTransaction` fija la empresa localmente y caduca el contexto al terminar; el repositorio filtra por esa empresa. RLS forzada y privilegios por tabla/columna añaden una segunda barrera. [Persistencia](persistencia.md) detalla roles y límites; [la evidencia](evidencias/fase-02.md) registra pruebas reales y el [informe de índices](reportes/consultas-fase-02.md) sus planes.

## Transacciones y acceso implementados

La fase 3 añade una unidad de trabajo con barreras ordenadas de permisos,
referencia, geometría y filas. El ejecutor confirma efecto, auditoría, outbox y
resultado en una transacción. Las referencias se serializan por empresa y sus
confirmaciones son inmutables; el dominio canoniza datos sin importar criptografía.

La fase 4 resuelve credenciales/sesiones mediante funciones SQL limitadas. La API
valida Argon2id y almacena solo el hash del token opaco. El tenant procede de la
sesión; la unidad de trabajo relee cuenta/rol/revocación tras adquirir la barrera
de permisos. Los cambios de equipo y logout usan su modo exclusivo. El alta
SaaS/setup local usa la conexión de provisión, sin privilegios generales de datos.

La [evidencia de fases 3–4](evidencias/fase-03-04.md) registra rollback, reintentos,
carreras de setup/permisos y acceso cruzado HTTP con conexiones reutilizadas.

## Geometría e inventario implementados

`OperationsModule` reutiliza el servicio de identidad y registra módulos de
almacenes/distribuciones, catálogo e inventario. Cada acción protegida conserva
el tenant y permiso actuales dentro de la unidad de trabajo. Los comandos físicos
usan barrera compartida de almacén y locks ordenados; el guardado geométrico usa
la exclusiva, relee ocupación y confirma contra la revisión de partida.

`removed_at` conserva las identidades físicas retiradas sin invalidar claves
históricas. Las consultas del layout solo muestran los elementos activos.
La API valida cajas y colisiones con el dominio exacto antes de persistir.
Recepciones y movimientos suman líneas, protegen disponibilidad y escriben libro,
resultado y outbox en el mismo commit. El historial agrupa asientos por referencia;
la auditoría conserva los hechos administrativos y sus motivos.

[Evidencia de fases 5–6](evidencias/fase-05-06.md): aislamiento HTTP completo del
bloque, carreras de editor/stock/bloqueos y reconciliación de cantidades exactas.

## Pendiente según el plan

Pedidos, picking, despachos, traslados/conteos por HTTP, dispatcher outbox/SSE, importaciones, editor y visor 3D se implementarán en sus tareas. No se atribuyen esas capacidades a los helpers actuales. Las mediciones, restauración y equivalencia completa SaaS/local también están pendientes de evidencia.
