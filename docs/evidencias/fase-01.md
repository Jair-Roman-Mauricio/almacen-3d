# Ejecución de T011–T019 — Valores y reglas puras

Fecha: 29/10/2026. Alcance autorizado expresamente: «continua con T011–T019 de forma seguida». Se aplicó `implementacion-sdd`, sin adelantar T020, persistencia de negocio o UI.

## Estado de partida

- Commit de referencia: `ab9e29faf6fed48954fd93bb7fa53f8f50f4e5a9`.
- T001–T010 completadas; todas las dependencias del bloque se cumplen en su orden.
- Suite inicial ejecutada: 29 pruebas unitarias y 16 de integración pasadas; 45 en total, 0 fallidas.
- Herramientas locales: Node 24.22.1, pnpm 12.16.1. PostgreSQL real para integración.

## Ciclo por tarea

Los archivos de pruebas se escribieron antes de implementar cada comportamiento. Las firmas iniciales sin comportamiento permitieron observar fallos de aserciones o errores explícitos de funcionalidad no implementada; no se usaron errores de instalación como evidencia roja. Las filas indican el resultado de **toda la suite unitaria** en ese punto, no solo los casos nuevos. El prefijo de los comandos es `node scripts/pnpm-local.mjs`.

| Tarea | Familia / criterio comprobado | Rojo observado | Verde tras implementar |
|---|---|---|---|
| T011 | `U-VAL/precision-unidades`: enteros, cero de conteo/umbral, tres decimales, exceso de precisión, magnitudes superiores a Number seguro | 7 fallidas / 49 pasadas | 56 pasadas / 0 fallidas |
| T012 | `U-VAL/nombres-codigos`: límites 160/64 Unicode, NFC, recorte, equivalencia de claves y gramática | 15 fallidas / 56 pasadas | 71 pasadas / 0 fallidas |
| T013 | `U-VAL/fechas-empresa`: Lima, IANA, extremos completos, días de 23/25 horas y medianoche inexistente | 12 fallidas / 77 pasadas | 89 pasadas / 0 fallidas |
| T014 | `U-BAL/saldos-linea`: pedido 100/40, consumo de reserva/preparación, parciales, límites por asignación y unidad | 7 fallidas / 89 pasadas | 96 pasadas / 0 fallidas |
| T015 | `U-BAL/estado-pedido`: todas las líneas, distintas unidades, parcial/completo y cancelabilidad sin liberar saldos | 5 fallidas / 97 pasadas | 102 pasadas / 0 fallidas |
| T016 | `U-BAL/traslado-100-20`: conservación por producto en salida, recepción parcial/total, exceso y tránsito no reservable | 3 fallidas / 103 pasadas | 106 pasadas / 0 fallidas |
| T017 | `U-GEO/jerarquia-contencion`: jerarquía, dimensiones/posiciones, límites en los tres ejes, contenedores anidados y dígitos largos | 4 fallidas / 121 pasadas | 125 pasadas / 0 fallidas |
| T018 | `U-GEO/colisiones`: parejas prohibidas, contención válida, bordes e invasiones diminutas | 6 fallidas / 130 pasadas | 136 pasadas / 0 fallidas |
| T019 | `U-BAL/disponibilidad-alerta`: bajo/igual/sobre umbral, umbral ausente/cero, bloqueo, totales por producto/almacén y exclusión de tránsito | 8 fallidas / 137 pasadas | 145 pasadas / 0 fallidas |

En cada fila, el criterio «Hecho cuando» de tasks.md quedó cumplido mediante la familia nombrada, ejecutada con `run test:unit`. Los rechazos ya presentes en una firma provisional no se consideran prueba de implementación; el verde se acredita al pasar también los flujos válidos y las aserciones de resultados.

Registros locales: `output/tests/t011-red.log` a `t019-red.log` y sus correspondientes `*-green.log`. Son artefactos generados ignorados por Git; esta tabla conserva los resultados en el repositorio.

## Archivos y RF habilitados

Todos los módulos siguientes viven en `packages/domain/src/`, con exportaciones desde `index.ts` y pruebas homónimas en `tests/unit/`.

| Tarea | Archivo | RF de la tarea cubiertos en esta capa |
|---|---|---|
| T011 | `quantity.ts` | RF-43, 51, 107, 108, 123, 124, 125, 182 |
| T012 | `identifiers.ts` | RF-17, 35, 114, 127, 128, 142 |
| T013 | `company-dates.ts` | RF-129, 130, 131, 132, 133 |
| T014 | `order-line.ts` | RF-54, 57, 59, 60, 118, 119, 156, 157, 158, 159, 160 |
| T015 | `order-state.ts` | RF-62, 63, 120, 161, 162 |
| T016 | `transfer-line.ts` | RF-174, 177, 178, 180, 181, 184, 186 |
| T017 | `geometry.ts` | RF-15, 16, 126, 189, 194 |
| T018 | `collisions.ts` | RF-190, 191, 192, 193, 198 |
| T019 | `availability.ts` | RF-37, 40, 75, 76, 77, 78, 79, 178, 201 |

`domain-error.ts` añade códigos/motivos de reglas puras sin importar Nest ni HTTP. Son RF **habilitados en dominio**, no una declaración de cumplimiento completo del sistema: faltan servicios, persistencia, permisos, transacciones operativas y pantallas en sus tareas posteriores.

## Decisiones de implementación dentro del plan

- Cantidades: `{minor: bigint, unit: {kind,label}}` con milésimas; escala validada antes de convertir. La serialización decimal no usa Number ni redondea. Las operaciones conservan categoría y etiqueta de unidad base.
- Identificadores: nombres recortados y contados por puntos de código Unicode; códigos NFC con clave en mayúsculas. El correo se normaliza por separado y no se transforma ninguna contraseña. La unicidad persistente corresponde a las tareas de base de datos.
- Fechas: utilidades puras de calendario/Intl, sin reloj del sistema. Se buscan límites de días civiles en la zona IANA, y el final es el comienzo del día siguiente; no se asume duración de 24 horas. Los instantes de presentación requieren zona explícita.
- Saldos: transformaciones puras devuelven el nuevo estado y deltas exactos. No escriben inventario ni sustituyen la transacción que implementarán los servicios. La cancelabilidad no cancela automáticamente.
- Geometría: `decimal.js` **10.6.0**, ya previsto en el plan, añadido solo a domain y al lockfile. Constructor clonado con precisión derivada de dígitos, escala y cota de sumas por árbol; no se usa la precisión global por defecto para decidir límites. X/ancho, Y/alto, Z/profundidad en metros.
- Colisiones: agrupación de hermanos y barrido por X con comparaciones exactas de Y/Z; se detiene ante el primer conflicto y devuelve ambos IDs. No añade prohibiciones entre pasillos, niveles o contenedores y sus hijos. El peor caso de candidatos puede ser cuadrático, como admite el plan; esto no acredita las mediciones del perfil grande.
- Alertas: se derivan de disponible operativo por producto/almacén; el bloqueo conserva físico y reserva. El tránsito se representa aparte y no se incorpora a esos totales.

Referencia consultada para clonación/precisión: [API oficial de decimal.js](https://mikemcl.github.io/decimal.js/).

## Correcciones y comprobaciones adicionales

- Lint detectó un escape innecesario de `/` en la gramática de códigos; se corrigió conservando el comportamiento.
- El chequeo estricto de TypeScript detectó índices posiblemente ausentes. Se hicieron explícitos los valores validados y los campos producidos por Intl; en tests, las posiciones de fixtures conocidas. No se desactivaron opciones del compilador ni se relajaron aserciones.
- La revisión de T013 detectó instantes sin zona explícita y fechas imposibles que Date.parse podía normalizar. Tres pruebas adicionales fallaron antes de corregir el helper (`t013-instant-red.log`: 3 fallidas / 145 pasadas). Después pasan las tres.
- Se añadió una comprobación de regresión de la secuencia completa 100 → despacho 40 → despacho 60. Pasó sin cambios adicionales de comportamiento: no se presenta como otro ciclo rojo.
- La familia de fechas se ejecutó con el dispositivo en `TZ=Pacific/Honolulu`: **21 pruebas pasadas** con resultados de empresa en Lima/Nueva York/Tokio. No se cambió la zona del sistema operativo.

## Verificación final

| Comando | Resultado real |
|---|---|
| `install --frozen-lockfile` | Salida 0; lockfile vigente, sin resolución nueva |
| `run test:unit` | **149 pasadas**, 0 fallidas, 11 archivos |
| `run lint` | Salida 0; **11/11** comprobaciones de arquitectura |
| `run typecheck` | Salida 0 en paquetes, apps, fixtures y pruebas |
| `run test:integration` | **16 pasadas**, 0 fallidas, 3 archivos; PostgreSQL real |
| `run build` | Salida 0; cuatro paquetes, Nest ESM y Next producción |

Total final: **165 pruebas pasadas, 0 fallidas**, más 11 comprobaciones de arquitectura. Son 120 pruebas unitarias nuevas respecto a la base. La pasada adicional de 21 fechas es un subconjunto y no se suma otra vez al total.

Spec, plan, contratos y constitución no se modificaron durante este bloque; se contrastaron con Git. No se crearon migraciones ni se modificaron tablas o volúmenes. No se ejecutaron pruebas de UI porque no hay cambios UI ni pantallas implementadas.

T011–T019 completadas. Siguiente: **T020 — Migra empresa, instalación, equipo y sesiones**, no iniciada. Cambios locales, sin commit/push ni despliegue en este bloque.
