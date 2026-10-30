# Estado del proyecto

Actualizado el 29/10/2026. Fuente de progreso: [tasks.md](../specs/001-wms-operativo-3d/tasks.md).
Evidencia: [fase 0](evidencias/fase-00.md), [pnpm](cambios/001-pnpm-github.md),
[fase 1](evidencias/fase-01.md), [fase 2](evidencias/fase-02.md) y
[fases 3–4](evidencias/fase-03-04.md).

## Implementado: T001–T052

- Workspace Next/Nest con TypeScript, runtime fijado y gestión exclusiva con pnpm.
- PostgreSQL local separado para desarrollo/pruebas, roles distintos y 17
  migraciones con integridad e idempotencia comprobadas.
- Cantidades exactas, normalización Unicode, fechas IANA, reglas puras de
  inventario/pedidos/tránsito y geometría.
- Esquema con claves de ámbito, RLS forzada en 23 tablas e índices de consultas.
- Unidad de trabajo y protocolo de bloqueos, comando atómico, replay y auditoría
  con autor/fecha/referencia. Resultados confirmados inmutables.
- Registro SaaS y setup local conjuntos; exclusión concurrente y recuperación al
  reiniciar la API sin volver a abrir una instalación configurada.
- Acceso por empresa, Argon2id, sesión opaca, Origin/CSRF y logout revocable.
- Alta/lista/cambio de equipo, permisos actuales, último administrador protegido,
  perfil de empresa y consulta autorizada de resultados.

Verificación vigente: **235 pruebas aprobadas** (152 unitarias y 83 de integración),
11 comprobaciones de arquitectura, instalación congelada, lint, tipos y build
correctos. Las pruebas de concurrencia usan PostgreSQL real; la auditoría de acceso
alterna dos empresas sobre una misma conexión reutilizada.

El backend de acceso/equipo funciona por HTTP. **La interfaz del producto, las
operaciones HTTP de inventario, el editor 3D y la landing siguen pendientes.**
No se presenta este bloque como un WMS completo ni como una versión de producción.

## Hitos pendientes

| Tareas | Contenido |
|---|---|
| T053–T062 | Almacenes, geometría y catálogo |
| T063–T095 | Inventario, pedidos, picking, traslados y conteos |
| T096–T118 | Reportes, archivos y sincronización |
| T119–T140 | Fundamentos UI y primeras pantallas |
| T141–T153 | Editor visual y visor 3D |
| T154–T176 | Operaciones y reportes en pantalla |
| T177–T182 | Landing, modalidades y demostración |
| T183–T214 | Instalación, recuperación, mediciones y QA final |

Siguiente tarea: **T053 — registrar y consultar almacenes**, no iniciada.
La equivalencia operativa completa SaaS/local, restauración y mediciones del perfil
grande aún requieren sus pruebas posteriores.

## Vista previa y publicación

Desarrollo local. La [guía](desarrollo.md) permite iniciar la API para probar altas,
login y equipo; Next mantiene únicamente su ruta técnica de salud. No hay una
pantalla de producto que previsualizar todavía.

Los cambios del bloque se revisan en una feature con destino `dev`; la promoción
a `main` se realiza por un PR posterior. No se fusionan automáticamente las ramas.
Railway, releases, cobros reales y servicios externos continúan sin habilitar.
