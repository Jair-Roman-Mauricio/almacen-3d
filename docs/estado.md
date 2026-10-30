# Estado del proyecto

Actualizado el 30/10/2026. Fuente de progreso: [tasks.md](../specs/001-wms-operativo-3d/tasks.md).
Evidencia: [fase 0](evidencias/fase-00.md), [pnpm](cambios/001-pnpm-github.md),
[fase 1](evidencias/fase-01.md), [fase 2](evidencias/fase-02.md) y
[fases 3–4](evidencias/fase-03-04.md) y [fases 5–6](evidencias/fase-05-06.md) y [fases 7–8](evidencias/fase-07-08.md) y [fases 9–10](evidencias/fase-09-10.md) y [fases 11–12](evidencias/fase-11-12.md).

## Implementado: T001–T140

- Workspace Next/Nest con TypeScript, runtime fijado y gestión exclusiva con pnpm.
- PostgreSQL local separado para desarrollo/pruebas, roles distintos y 22
  migraciones con integridad e idempotencia comprobadas.
- Cantidades exactas, normalización Unicode, fechas IANA, reglas puras de
  inventario/pedidos/tránsito y geometría.
- Esquema con claves de ámbito, RLS forzada en 24 tablas e índices de consultas.
- Unidad de trabajo y protocolo de bloqueos, comando atómico, replay y auditoría
  con autor/fecha/referencia. Resultados confirmados inmutables.
- Registro SaaS y setup local conjuntos; exclusión concurrente y recuperación al
  reiniciar la API sin volver a abrir una instalación configurada.
- Acceso por empresa, Argon2id, sesión opaca, Origin/CSRF y logout revocable.
- Alta/lista/cambio de equipo, permisos actuales, último administrador protegido,
  perfil de empresa y consulta autorizada de resultados.

- Almacenes/catálogo y guardado de distribuciones con jerarquía, contención,
  colisiones, revisión concurrente y protección de elementos ocupados.
- Inventario por posición/unidad, recepciones y movimientos atómicos con libro,
  bloqueo/desbloqueo autorizado, historial/auditoría y reconciliación de saldos.

- Pedidos con reservas/preparación/despachos parciales, asignación actual y
  cancelación protegida; reintentos y competencia por saldos.
- Traslados con salida, tránsito y recepción parcial; conteos y ajustes con motivo,
  protección de reservas y referencia física que detecta A→B→A.
- Reconciliación integrada de libro, físico, reservado y tránsito tras combinar flujos.

- Indicadores y alertas; CSV/XLSX con preview, validación y aplicación asíncrona atómica.
- Exportación segura de consultas, outbox/SSE por empresa y seed demo explícito recuperable.

- Interfaz Radix/Tailwind: acceso, registro SaaS/setup local, empresa/equipo,
  almacenes, catálogo e inventario por ubicación/totales; cantidades exactas.
- Proxy Next del mismo origen, caché por identidad/almacén y avisos SSE.
- Consulta/reenvío explícito de resultados inciertos y referencias recuperables
  tras recargar o retirar una fila.

Verificación vigente: **152 unitarias, 191 de integración y 22 flujos SaaS**,
además de una ejecución de setup local vacío; cero fallos.
11 comprobaciones de arquitectura, instalación congelada, lint, tipos y build
correctos. Las pruebas de concurrencia usan PostgreSQL real; la auditoría de acceso
alterna dos empresas sobre una misma conexión reutilizada.

El backend implementado se puede utilizar por HTTP y las primeras pantallas ya
trabajan con él. **Editor/visor 3D, pantallas de operaciones/reportes y landing
siguen pendientes.**
No se presenta este bloque como un WMS completo ni como una versión de producción.

## Hitos pendientes

| Tareas | Contenido |
|---|---|
| T141–T153 | Editor visual y visor 3D |
| T154–T176 | Operaciones y reportes en pantalla |
| T177–T182 | Landing, modalidades y demostración |
| T183–T214 | Instalación, recuperación, mediciones y QA final |

Siguiente tarea: **T141 — borrador de distribución separado de la caché**, no iniciada.
La equivalencia operativa completa SaaS/local, restauración y mediciones del perfil
grande aún requieren sus pruebas posteriores.

## Vista previa y publicación

Desarrollo local. `pnpm run preview:local` abre una instancia temporal de
web/API con datos ficticios en una base privada; la [guía](desarrollo.md#vista-previa-de-la-interfaz)
explica acceso y cierre. Para datos persistentes se conserva el arranque manual.

Los cambios del bloque se revisan en una feature con destino `dev`; la promoción
a `main` se realiza por un PR posterior. No se fusionan automáticamente las ramas.
Railway, releases, cobros reales y servicios externos continúan sin habilitar.
