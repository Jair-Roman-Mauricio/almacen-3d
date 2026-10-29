# Estado del proyecto

Actualizado el 29/10/2026. Fuente de progreso: [tasks.md](../specs/001-wms-operativo-3d/tasks.md), con evidencia en [fase 0](evidencias/fase-00.md) y [revalidación pnpm](cambios/001-pnpm-github.md).

## Implementado: T001–T019

- Workspace de seis paquetes/aplicaciones, TypeScript y límites automáticos de capas.
- Runtime local fijado; gestión exclusiva con pnpm y dependencias internas `workspace:*`.
- API NestJS ESM y aplicación Next con rutas técnicas de salud.
- PostgreSQL separado para desarrollo y pruebas; credenciales y roles diferenciados.
- Diario de migraciones con hashes, exclusión concurrente e idempotencia.
- Helper de transacciones con rollback y pruebas contra PostgreSQL real.
- Validación inicial de entrada de cantidades y contrato uniforme de errores HTTP.

**No hay aún tablas de negocio, sesiones, operaciones de inventario, pantallas, editor 3D ni landing.** El contrato inicial HTTP no acredita autorización ni aislamiento multiempresa completo.

La fase 1 incorpora cantidades exactas, normalización Unicode, fechas de empresa, saldos de pedidos/traslados, geometría y alertas. Verificación: 149 unitarias y 16 de integración aprobadas; [evidencia](evidencias/fase-01.md).

## Hitos pendientes

| Tareas | Contenido |
|---|---|
| T020–T118 | Persistencia, acceso, operaciones, archivos y sincronización |
| T119–T140 | Fundamentos UI y primeras pantallas |
| T141–T153 | Editor visual y visor 3D |
| T154–T176 | Operaciones y reportes en pantalla |
| T177–T182 | Landing, modalidades y demostración |
| T183–T214 | Instalación, recuperación, mediciones y QA final |

La siguiente tarea funcional es **T020: migrar empresa, instalación, equipo y sesiones**. La preparación de GitHub y pnpm es mantenimiento técnico solicitado, no avance de estas tareas. Solo T001–T019 están marcadas.

## Vista previa y publicación

El repositorio público permite revisar código y documentación. La aplicación continúa en desarrollo local. No se abre un servidor de vista previa visual en esta entrega porque no existe interfaz de producto. Los endpoints de salud se pueden iniciar para diagnóstico siguiendo la guía local.

Railway, cobros reales e integraciones externas no están habilitados. No se ha anunciado una demo funcional ni resultados de rendimiento del perfil grande.
