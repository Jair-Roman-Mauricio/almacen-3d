# Historial de entregas

## 2026-10-30 — Reportes, archivos, avisos y demo

- T096–T118: indicadores, umbrales y alertas derivados de cantidades operativas.
- CSV/XLSX con plantillas, staging, preview, validación persistida y aplicación
  asíncrona íntegra; huellas/reintentos, revalidación y recuperación tras interrupción.
- Exportación filtrada segura y cantidades exactas; límites inclusivos de 20 MB/20.000 filas.
- Publicador único de outbox y SSE por empresa con comprobación de sesión vigente.
- Seed demo explícito, repetible y protegido frente a bases con datos no demo;
  manifiesto público limitado a cuentas ficticias precargadas.
- 152 unitarias y 189 de integración (341 pruebas); lint, tipos y build correctos.
- Cuatro migraciones nuevas (22 totales), RLS forzada en 24 tablas de empresa.
- Dependencias previstas: ExcelJS 4.4.0 y csv-parse 7.0.3; instalación congelada comprobada.
- [Evidencia de ejecución](docs/evidencias/fase-09-10.md). Siguiente: T119; UI no iniciada.

## 2026-10-30 — Pedidos, traslados y ajustes

- T073–T095: pedidos, reservas parciales, asignación, picking, despacho y cancelación protegida.
- Traslados con declaración, salida completa, tránsito y recepciones parciales por destino.
- Conteos por posición/SKU, ajustes con motivo, protección de reservas y referencia física contra ABA.
- Permisos/asignación actuales, aislamiento de todas las rutas y reintentos sin duplicar efectos.
- 152 unitarias y 159 de integración (311 pruebas); lint, 11 controles de arquitectura, tipos y build correctos.
- 18 migraciones conservadas y comprobadas; sin dependencias nuevas ni cambios en los documentos aprobados del acuerdo SDD.
- [Evidencia de ejecución](docs/evidencias/fase-07-08.md). Siguiente: T096.

## 2026-10-29 — Almacenes, geometría e inventario

- T053–T072: almacenes y catálogo, distribuciones persistentes, contención/colisiones y revisión concurrente.
- Protección de elementos ocupados y de sus descendientes, con identidad y referencias históricas conservadas.
- Consultas de inventario, recepciones/movimientos atómicos, reintentos y competencia por stock disponible.
- Bloqueos autorizados, motivo de desbloqueo, historial/auditoría por zona de empresa y reconciliación del libro.
- 18 migraciones e idempotencia en desarrollo/pruebas; JSON configurable y gzip para layouts.
- 152 pruebas unitarias y 121 de integración; lint, 11 controles de arquitectura, tipos y build correctos.
- [Evidencia de ejecución](docs/evidencias/fase-05-06.md). Siguiente: T073.

## 2026-10-29 — Transacciones, acceso y equipo

- T032–T052: unidad de trabajo, bloqueos, referencias y resultados atómicos, auditoría inmutable.
- Registro SaaS/setup local, credenciales Argon2id, sesiones opacas, Origin/CSRF y revocación.
- Equipo con permisos actuales, protección del último administrador, perfil de empresa y consulta segura de resultados.
- Cinco migraciones nuevas; 17 totales e idempotentes en desarrollo/pruebas.
- 152 pruebas unitarias y 83 de integración; lint, 11 controles de arquitectura, tipos y build correctos.
- [Evidencia de ejecución](docs/evidencias/fase-03-04.md). Siguiente: T053.

## 2026-10-29 — Persistencia y aislamiento

- T020–T031: 11 migraciones nuevas, 23 tablas de empresa, claves compuestas, cantidades exactas y referencias de operaciones.
- Contexto transaccional, repositorio acotado, RLS forzada y roles separados de aplicación/provisión/migraciones.
- Compatibilidad Unicode del runtime con normalización SQL verificada; 13 índices nuevos e informe de consultas.
- Total vigente: 149 pruebas unitarias y 49 de integración aprobadas; 11 comprobaciones de arquitectura.
- [Evidencia de ejecución](docs/evidencias/fase-02.md). Siguiente: T032.

## 2026-10-29 — Valores y reglas puras

- T011–T019: cantidades exactas por unidad, Unicode, fechas de empresa, saldos de pedidos/traslados, geometría exacta, colisiones y alertas.
- 120 pruebas unitarias nuevas; total vigente: 165 pruebas aprobadas y 11 comprobaciones de arquitectura.
- Sin cambios de spec/plan/contratos/constitución, tablas de negocio o UI. Siguiente: T020.
- [Evidencia de ejecución](docs/evidencias/fase-01.md).

## 2026-10-29 — Base técnica y publicación inicial

- Acuerdo SDD: constitución, especificación, contratos, plan y 214 tareas.
- T001–T010: workspace, API y web técnicas, validación HTTP, PostgreSQL aislado, migraciones, rollback y primeras pruebas.
- Enmienda solicitada: gestión exclusiva con pnpm, lockfile único y herramientas locales fijadas.
- Documentación de arquitectura, preparación, estado y contribución.
- Repositorio público autorizado para mostrar el desarrollo; aplicación todavía local.

Estado actual: 118/214 tareas completadas; la siguiente es T119. Las pantallas comienzan en T119. Esta entrega documenta una base en desarrollo y no constituye una versión de producción del WMS.
