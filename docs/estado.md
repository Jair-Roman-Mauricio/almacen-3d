# Estado del proyecto

Actualizado el 29/10/2026. Fuente de progreso: [tasks.md](../specs/001-wms-operativo-3d/tasks.md), con evidencia en [fase 0](evidencias/fase-00.md) y [revalidación pnpm](cambios/001-pnpm-github.md) y [fase 1](evidencias/fase-01.md) y [fase 2](evidencias/fase-02.md).

## Implementado: T001–T031

- Workspace de seis paquetes/aplicaciones, TypeScript y límites automáticos de capas.
- Runtime local fijado; gestión exclusiva con pnpm y dependencias internas `workspace:*`.
- API NestJS ESM y aplicación Next con rutas técnicas de salud.
- PostgreSQL separado para desarrollo y pruebas; credenciales y roles diferenciados.
- Diario de migraciones con hashes, exclusión concurrente e idempotencia.
- Helper de transacciones con rollback y pruebas contra PostgreSQL real.
- Validación inicial de entrada de cantidades y contrato uniforme de errores HTTP.

- Cantidades exactas en BigInt por unidad, normalización Unicode y filtros de fechas en zona de empresa.
- Saldos puros por línea/asignación, estados del pedido y conservación del tránsito.
- Jerarquía y contención geométrica con decimales exactos; detección de solapamientos prohibidos.
- Disponibilidad operativa y alertas por producto/almacén.

- Esquema de negocio con claves de ámbito, cantidades exactas, revisión física y vínculos de confirmación.
- Contexto de empresa por transacción y repositorio acotado; RLS forzada en 23 tablas.
- Aplicación, provisión y migraciones con credenciales/privilegios separados; 13 índices de consultas versionados.

Verificación vigente: **198 pruebas aprobadas** (149 unitarias y 49 de integración), más 11 comprobaciones de arquitectura; lint, tipos y build correctos.

**No hay aún login funcional, endpoints operativos de inventario, pantallas, editor 3D ni landing.** El contrato inicial HTTP no acredita autorización ni aislamiento multiempresa completo.

## Hitos pendientes

| Tareas | Contenido |
|---|---|
| T032–T037 | Transacciones, bloqueos y referencias de operación |
| T038–T118 | Acceso, operaciones, archivos y sincronización |
| T119–T140 | Fundamentos UI y primeras pantallas |
| T141–T153 | Editor visual y visor 3D |
| T154–T176 | Operaciones y reportes en pantalla |
| T177–T182 | Landing, modalidades y demostración |
| T183–T214 | Instalación, recuperación, mediciones y QA final |

La siguiente tarea funcional es **T032: centralizar transacciones y orden de bloqueos**. La preparación de GitHub y pnpm es mantenimiento técnico solicitado, no avance de estas tareas. Solo T001–T031 están marcadas. El dominio y la base de persistencia no sustituyen los servicios de negocio, las sesiones y los flujos completos de las fases siguientes.

## Vista previa y publicación

El repositorio público permite revisar código y documentación. La aplicación continúa en desarrollo local. No se abre un servidor de vista previa visual en esta entrega porque no existe interfaz de producto. Los endpoints de salud se pueden iniciar para diagnóstico siguiendo la guía local.

Railway, cobros reales e integraciones externas no están habilitados. No se ha anunciado una demo funcional ni resultados de rendimiento del perfil grande.
