# Historial de entregas

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

Estado actual: 31/214 tareas completadas; la siguiente es T032. Las pantallas comienzan en T119. Esta entrega documenta una base en desarrollo y no constituye una versión de producción del WMS.
