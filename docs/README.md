# Documentación del proyecto

## Para empezar

| Documento | Propósito |
|---|---|
| [README principal](../README.md) | Producto, estado real y preparación rápida |
| [Estado](estado.md) | Qué funciona, qué falta y próxima tarea |
| [Desarrollo](desarrollo.md) | Herramientas, bases, comandos y diagnóstico |
| [Arquitectura](arquitectura.md) | Módulos y límites implementados |
| [Persistencia](persistencia.md) | Tablas, restricciones, contexto y roles PostgreSQL |
| [Consultas e índices](reportes/consultas-fase-02.md) | Planes ejecutados y límites de la evidencia |
| [Contribución](../CONTRIBUTING.md) | Reglas para cambios y revisiones |

## Acuerdo SDD

1. [Constitución](constitution.md): principios aprobados.
2. [Entrevista](entrevista-requisitos.md) y [especificación](../specs/001-wms-operativo-3d/spec.md): alcance y requisitos.
3. [Plan](../specs/001-wms-operativo-3d/plan.md), [contratos](../specs/001-wms-operativo-3d/contratos.md) y [trazabilidad](../specs/001-wms-operativo-3d/trazabilidad-plan.md): decisiones y comprobaciones previstas.
4. [Tareas](../specs/001-wms-operativo-3d/tasks.md): 214 unidades ordenadas por dependencia.
5. [Flujo y aprobaciones](flujo-sdd.md): estado de las fases.

Las revisiones `revision-*.md` y `revision-*.diff` de la carpeta de la spec documentan correcciones del acuerdo. Una prueba descrita en el plan no cuenta como prueba ejecutada.

## Evidencia y decisiones

- [Ejecución inicial T001–T010](evidencias/fase-00.md): pruebas y decisiones del primer bloque.
- [Ejecución T011–T019](evidencias/fase-01.md): reglas puras, rojo/verde y verificación final.
- [Ejecución T020–T031](evidencias/fase-02.md): migraciones, aislamiento y privilegios con PostgreSQL real.
- [Ejecución T032–T052](evidencias/fase-03-04.md): transacciones, altas, sesiones y equipo con carreras reales.
- [Ejecución T053–T072](evidencias/fase-05-06.md): almacenes, catálogo, geometría e inventario con reconciliación y carreras.
- [Ejecución T073–T095](evidencias/fase-07-08.md): salidas parciales, traslados, conteos/ajustes y reconciliación integrada.
- [Ejecución T096–T118](evidencias/fase-09-10.md): indicadores/alertas, intercambio atómico, SSE y seed demo explícito.
- [Ejecución T119–T140](evidencias/fase-11-12.md): fundamentos, primeras pantallas, proxy, caché/SSE y referencias de operación.
- [Enmienda pnpm y GitHub](cambios/001-pnpm-github.md): cambios técnicos autorizados y revalidación.
- [Historial de entregas](../CHANGELOG.md).

## Investigación y diseño

- [Investigación de mercado](../investigacion/mercado-almacen-3d.md).
- [Integración Awwwards](integraciones/awwwards-mcp.md).
- [Registro de referencias UI](../specs/001-wms-operativo-3d/referencias-ui.md).

Los registros de referencias contienen rutas locales de capturas usadas durante el análisis; esas imágenes de terceros no se distribuyen en el repositorio. La integración de inspiración es una herramienta de desarrollo opcional para ejecutar el código actual; no es una dependencia del runtime WMS.

- [Contexto de producto](../apps/web/PRODUCT.md) y [sistema visual](../apps/web/DESIGN.md).
