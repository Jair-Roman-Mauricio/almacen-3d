# Anexo del plan 001 — Contratos de interfaz

Estado: propuesto junto a [plan.md](plan.md), 29/10/2026. Contrato de diseño,
sin implementación. Cubre RF-1–207 y RNF-1–7, RNF-14, RNF-17–18.

## Convenciones comunes

Base `/api/v1`. JSON UTF-8 salvo multipart, archivos y SSE. UUID para IDs y
referencias internas; códigos de negocio viajan en campos JSON/query, nunca como
segmentos de ruta, pues admiten `/`. Cantidades y coordenadas son cadenas
decimales exactas. Fechas de eventos ISO 8601 UTC; la UI presenta la zona de empresa.
`tenantId` de una mutación nunca se toma del cuerpo: se deriva de la sesión.
Campos desconocidos en solicitudes se rechazan para evitar asignación masiva.

Roles: A administrador, S supervisor, O operario. Todos requieren pertenencia al
ámbito. Las rutas públicas se marcan P. Roles citados no sustituyen las restricciones
de asignación, bloqueo, stock y referencias del plan. GET no modifica inventario.

Respuesta de entidad: `{data: <forma indicada>}`. Lista:
`{data: [<forma>], page: {nextCursor: <cadena o null>}}`. Paginación por cursor opaco
ligado a filtros y orden estable, `limit` positivo; valor técnico inicial 50 filas,
configurable sin imponer un límite comercial. Filtros comunes `q`, `warehouseId`,
`productId`, `locationId`, `from`, `to`, `cursor`, `limit`, solo los aplicables a cada
ruta. Los filtros no se reinterpretan a otra empresa. Un resultado vacío es `data: []`.

Error exacto: `{error: {code, message, details: [], requestId}}`. `details` puede
contener `{field, reason}`, `{row, field, reason}` o `{elementId, field, reason}`,
sin exponer datos ajenos. Las tablas enumeran códigos de dominio; todas las rutas
protegidas pueden devolver 401/403 y 404 por ámbito. Todos los comandos pueden
devolver 409 `REFERENCE_REUSED` y 503 `TEMPORARY_FAILURE`.

Comando con `Idempotency-Key: <UUID>`:
`{data: {reference, status: "confirmed", type, confirmedAt, result: <forma>}}`.
201 si crea recurso; 200 si confirma/modifica; un replay devuelve la misma forma,
referencia, fecha y resultado originales, sin nuevos asientos. Cabecera
`Idempotent-Replayed: true` informa de repetición. Los cambios posteriores de
inventario no reescriben resultados pasados. No hay respuesta 2xx de confirmación
si el resultado no quedó persistido. Alta pública no requiere este encabezado:
unicidad/cierre del asistente impiden crear empresas duplicadas ante reenvío.

## Formas de salida

Los nombres siguientes son esquemas de datos, no clases implementadas. `?` significa
campo que puede ser null, no dato de otra empresa omitido arbitrariamente.

| Forma | Campos exactos |
|---|---|
| Company | `id, code, name, timeZone` |
| User | `id, name, email, role, active` |
| Session | `company: Company, user: User, csrfToken, demoMode` |
| Warehouse | `id, code, name, dimensions: {width,height,depth}, layoutRevision` |
| Product | `id, sku, name, unit: {kind,label}` |
| Element | `id, type, parentId?, code, name, position: {x,y,z}, dimensions: {width,height,depth}, blocked` |
| Layout | `warehouseId, revision, elements: Element[]` |
| Stock | `warehouseId, locationId, locationCode, blocked, product: Product, physical, reserved, available, physicalRevision` |
| ProductTotal | `warehouseId, product: Product, physical, reserved, available` |
| Order | `id, code, warehouseId, status, assignedOperator: User?, lines: OrderLine[]` |
| OrderLine | `id, product: Product, requested, reserved, preparedPending, dispatched, pending, pendingReserve, allocations: Allocation[]` |
| Allocation | `id, locationId, locationCode, blocked, reserved, preparedPending, pendingPrepare` |
| Transfer | `id, code, sourceWarehouseId, targetWarehouseId, status, departureReference?, lines: TransferLine[]` |
| TransferLine | `id, product: Product, sourceLocationId, declared, departed, received, inTransit` |
| Count | `id, warehouseId, locationId, product: Product, observed, referencePhysical, referenceRevision, difference, recordedAt, actor: User, adjusted` |
| History | `id, reference, type, actor: {id,name}, occurredAt, reason?, warehouseIds: [], entries: [{productId,locationId?,transferId?,physicalDelta,reservedDelta,transitDelta}]` |
| Audit | `id, reference, type, actor: {id,name}, occurredAt, entityId, details` |
| Dashboard | `warehouseId, from, to, timeZone, productsWithStock, occupiedLocations, pendingOrders, movementsInInterval` |
| Threshold | `warehouseId, productId, quantity` |
| Alert | `warehouseId, product: Product, available, threshold` |
| ImportJob | `id, kind, state, fileName, bytes, rowCount, contentHash?, processingMs, errors: [], resultReference?` |
| ImportRow | `row, action: "create"/"update"/"initial_stock", values, errors: [{field,reason}]` |

`unit.kind` pertenece a `piece, box, pallet, weight, volume, length`; `label` es
la unidad base declarada (p. ej. pieza, kg, litro, metro), no una conversión.
`available` es reservable ahora, cero en ubicación bloqueada. `physical` y
`reserved` siguen mostrando sus valores registrados. Totales suman por producto
y unidad base; no mezclan tránsito con físico.

Element.type = `zone, aisle, rack, level, location`; `blocked` solo es operativo
en ubicaciones, falso en los demás. `parentId = null` solo para zonas del almacén.
Los cambios de bloqueo usan su endpoint específico, no el payload geométrico.

Order.status = `pending, partially_dispatched, dispatched, cancelled`, derivado
como en §2 del plan; sus cantidades de reserva/preparación aclaran el avance.
Transfer.status = `registered, in_transit, received`; una recepción parcial
conserva `in_transit`. ImportJob.state = `parsing, preview, invalid, validated,
applying, confirmed, failed`. Estado visual «resultado no confirmado» pertenece
al cliente cuando falta respuesta y no equivale a `failed` en servidor.

## Acceso, empresa y equipo — P-ACC

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| GET `/public/config` | P | Ninguna | 200 `{data:{mode,demoMode,localSetupRequired}}` | 503 sin configuración válida; no credenciales de instalación. |
| POST `/registrations` | P en SaaS | `{company:{code,name,timeZone?}, administrator:{name,email,password}}` | 201 `{data:{company:Company, administrator:User, loginCompanyCode}}` | 404 `MODE_UNAVAILABLE`; 409 `COMPANY_CODE_EXISTS`; 422 `INVALID_NAME/CODE/EMAIL/TIME_ZONE`, `REQUIRED_FIELD`; rollback conjunto. |
| POST `/local-setup` | P en local no configurado | Misma entrada de registration | 201 misma salida | 404 `MODE_UNAVAILABLE`; 409 `ALREADY_CONFIGURED`; validación igual y rollback conjunto. |
| POST `/sessions` | P | `{companyCode,email,password}` | 200 `{data:Session}` y cookie opaca | 400 `REQUIRED_FIELD`; 401 `INVALID_CREDENTIALS` uniforme, incluyendo empresa/cuenta inactiva o desconocida. |
| GET `/sessions/current` | A/S/O | Cookie | 200 `{data:Session}` | 401 `SESSION_INVALID`. |
| DELETE `/sessions/current` | A/S/O | Cookie + CSRF | 204 sin cuerpo, cookie retirada y sesión revocada | 401/403 según sesión/CSRF. Repetir cierre no recupera sesión. |
| GET `/company` | A/S/O | Ninguna | 200 `{data:Company}` | Ámbito de sesión. |
| PATCH `/company` | A | `{name?,timeZone?}` + referencia | 200 comando, result Company | 422 validación; código de acceso no se modifica por este formulario. |
| GET `/users` | A | `q,cursor,limit` | Lista User | Sin cuentas de otras empresas. |
| POST `/users` | A | `{name,email,password,role}` + referencia | 201 comando, result User | 409 `EMAIL_EXISTS`; 422 `INVALID_EMAIL/ROLE/NAME`, `REQUIRED_FIELD`. |
| PATCH `/users/:id` | A | `{name?,role?,active?}` + referencia | 200 comando, result User | 409 `LAST_ACTIVE_ADMIN`; 422 `INVALID_ROLE/NAME`; 404 ajeno. |
| GET `/public/demo-access` | P solo demo | Ninguna | 200 `{data:{synthetic:true,accounts:[{companyCode,email,password,role}]}}` | 404 `DEMO_UNAVAILABLE` si no es entorno demo; solo manifiesto ficticio. |

No se incorpora recuperación por email, invitaciones, SSO ni un rol global. La
prueba de alta inicial incluye campos vacíos, normalización, carreras y fallo
entre creación de empresa y admin. Una respuesta perdida del alta lleva al acceso
por código conocido; reenvío nunca sustituye empresa existente.

## Almacenes, geometría y mapa — P-GEO/P-MAP/P-BLK

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| GET `/warehouses` | A/S/O | `q,cursor,limit` | Lista Warehouse | Ámbito. |
| POST `/warehouses` | A | `{code,name,dimensions:{width,height,depth}}` + referencia | 201 comando, result Warehouse con revisión inicial | 409 `CODE_EXISTS`; 422 `INVALID_CODE/NAME/DIMENSIONS`. |
| GET `/warehouses/:id/layout` | A/S/O | Ninguna | 200 `{data:Layout}`; distribución vacía válida | 404 ajeno/inexistente. |
| PUT `/warehouses/:id/layout` | A | `{baseRevision,elements:Element[]}` + referencia | 200 comando, result Layout con nueva revisión | 409 `LAYOUT_STALE/ELEMENT_OCCUPIED/OPEN_WORK`; 422 `INVALID_HIERARCHY/DIMENSIONS/CODE/NAME/CONTAINMENT/OVERLAP`; ID/campo/motivo. |
| GET `/warehouses/:id/locations` | A/S/O | `q,blocked,cursor,limit` | Lista Element de tipo location | Filtros válidos. |
| GET `/warehouses/:id/spatial-search` | A/S/O | `{kind:"sku"/"location",code}` en query | 200 `{data:{locationIds:[]}}` | 400 `INVALID_SEARCH`; sin coincidencias no es error. |
| GET `/locations/:id/inventory` | A/S/O | `cursor,limit` | Lista Stock | 404 ajena/inexistente. |
| POST `/locations/:id/block` | A | `{}` + referencia | 200 comando, result `{locationId,blocked:true}` | Permiso y pertenencia; no cancela reservas/trabajo. |
| POST `/locations/:id/unblock` | A | `{reason}` + referencia | 200 comando, result `{locationId,blocked:false,auditId}` | 422 `REASON_REQUIRED`; 403 rol no A. No ejecuta pendientes. |

Elementos nuevos usan UUID generado para el borrador y se validan antes de aceptar;
IDs previamente existentes no cambian de identidad/tipo/almacén mediante PUT.
Elementos omitidos se tratan como eliminación y pasan comprobaciones completas.
La UI de edición no ofrece alterar `blocked` con el guardado geométrico.
GET layout devuelve la distribución completa, con transporte comprimido y sin
detalles de cada producto; el detalle de stock se consulta al seleccionar.

La banda «no guardado» pertenece al borrador, no al layout persistido. 409
`LAYOUT_STALE` incluye `currentRevision` sin sustituir el borrador. Puede recargar
la última distribución previa confirmación de descarte; no hay automezcla.

## Catálogo, inventario y operaciones — P-CAT/P-INV

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| GET `/products` | A/S/O | `q,cursor,limit` | Lista Product | Ámbito. |
| POST `/products` | A/S | `{sku,name,unit:{kind,label}}` + referencia | 201 comando, result Product | 409 `SKU_EXISTS`; 422 `INVALID_CODE/NAME/UNIT`. |
| PATCH `/products/:id` | A/S | `{name}` + referencia | 200 comando, result Product | 422 nombre; conserva ID, SKU, unidad. |
| DELETE `/products/:id` | A/S | Referencia + CSRF | 200 comando, result `{id,removed:true}` | 409 `PRODUCT_IN_USE`; sin borrado de historia. |
| GET `/inventory` | A/S/O | `warehouseId,productId?,locationId?,q?,cursor,limit` | Lista Stock | Almacén obligatorio y propio. |
| GET `/inventory/totals` | A/S/O | `warehouseId,productId?,q?,cursor,limit` | Lista ProductTotal | Tránsito no incluido. |
| POST `/receipts` | A/S/O | `{warehouseId,lines:[{productId,targetLocationId,quantity}]}` + referencia | 201 comando, result `{historyId,balances:Stock[]}` | 422 cantidad/unidad/referencia; 409 `LOCATION_BLOCKED`; 404 producto/ubicación ajenos. |
| POST `/internal-moves` | A/S/O | `{warehouseId,lines:[{productId,sourceLocationId,targetLocationId,quantity}]}` + referencia | 201 comando, result `{historyId,balances:Stock[]}` | 422 `SAME_LOCATION/INVALID_QUANTITY`; 409 `INSUFFICIENT_AVAILABLE/LOCATION_BLOCKED`; 404 ámbito. |

Líneas repetidas por misma posición no sortean validaciones: se agrega su efecto
antes de comprobar saldos. Movimiento interno exige ambos extremos del mismo
almacén. La lista y mapa son lecturas; no exponen endpoints de «cambiar cantidad»
directamente. Correcciones de stock pasan por conteo/ajuste autorizado.

## Salidas, asignación y parciales — P-OUT

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| POST `/orders` | A/S | `{code,warehouseId,lines:[{productId,quantity}]}` + referencia | 201 comando, result Order | 422 `INVALID_QUANTITY/CODE`; 409 `CODE_EXISTS`; 404 ámbito. |
| GET `/orders` | A/S/O | `warehouseId,status?,assignedToMe?,q?,cursor,limit` | Lista de resumen `{id,code,warehouseId,status,assignedOperator}` | O puede consultar tareas; filtro no da permiso de preparación. |
| GET `/orders/:id` | A/S/O | Ninguna | 200 `{data:Order}` | Ámbito. |
| POST `/orders/:id/reservations` | A/S | `{lines:[{orderLineId,sourceLocationId,quantity}]}` + referencia | 200 comando, result Order | 409 `INSUFFICIENT_AVAILABLE/ORDER_BALANCE_EXCEEDED/LOCATION_BLOCKED/ORDER_CLOSED`; 422 cantidad; 404 referencias. |
| PUT `/orders/:id/assignment` | A/S | `{operatorId}` + referencia | 200 comando, result `{order:Order,auditId}` | 422 `INVALID_ASSIGNEE` por inactivo/rol; 404 ajeno; bloquea fila de pedido. |
| POST `/orders/:id/preparations` | A/S/O asignado actual | `{lines:[{allocationId,quantity}]}` + referencia | 200 comando, result Order | 403 `NOT_ASSIGNED`; 409 `PREPARATION_BALANCE_EXCEEDED/LOCATION_BLOCKED/ORDER_CLOSED`; 422 cantidad. |
| POST `/orders/:id/dispatches` | A/S | `{lines:[{allocationId,quantity}]}` + referencia | 200 comando, result `{order:Order,historyId}` | 409 `RESERVATION_BALANCE_EXCEEDED/PREPARED_BALANCE_EXCEEDED/LOCATION_BLOCKED/ORDER_CLOSED`; 422 cantidad. |
| POST `/orders/:id/cancellation` | A/S | `{}` + referencia | 200 comando, result Order | 409 `ORDER_ALREADY_PREPARED/ORDER_ALREADY_DISPATCHED/ORDER_CLOSED`; si válido libera reservas. |

El operario ve preparación autorizada solo para asignación actual; abrir una
pantalla no concede permiso persistente. Admin/supervisor conservan permiso de
preparación aunque no estén asignados como operario. Reserva/preparación/despacho
parcial indica la cantidad exacta de cada avance, sin reajuste automático.

## Traslados — P-TRA

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| POST `/transfers` | A/S | `{code,sourceWarehouseId,targetWarehouseId,lines:[{productId,sourceLocationId,quantity}]}` + referencia | 201 comando, result Transfer | 422 `SAME_WAREHOUSE/INVALID_QUANTITY/CODE`; 409 `CODE_EXISTS`; 404 otra empresa/origen inválido. |
| GET `/transfers` | A/S/O | `warehouseId?,status?,cursor,limit` | Lista Transfer | Siempre misma empresa, origen/destino según filtro. |
| GET `/transfers/:id` | A/S/O | Ninguna | 200 `{data:Transfer}` | Tránsito separado. |
| POST `/transfers/:id/departure` | A/S | `{lines:[{transferLineId,quantity}]}` + referencia | 200 comando, result `{transfer:Transfer,historyId}` | Exige confirmar las cantidades declaradas completas de la salida; 409 `ALREADY_DEPARTED/INSUFFICIENT_AVAILABLE/LOCATION_BLOCKED`; 422 cantidad/datos distintos de declaración. |
| POST `/transfers/:id/receipts` | A/S/O | `{lines:[{transferLineId,targetLocationId,quantity}]}` + referencia | 200 comando, result `{transfer:Transfer,historyId}` | 409 `NOT_DEPARTED/TRANSIT_BALANCE_EXCEEDED/LOCATION_BLOCKED`; 422 cantidad; 404 destino incorrecto/ajeno. |

Registro no consume físico ni crea reserva de pedido. La recepción puede dividir
una línea en ubicaciones del destino, sumando antes de validar saldo. Tránsito
por línea/producto; recibido por completo solo si todas las líneas no tienen saldo.
Confirmar salida ya confirmada con referencia nueva rechaza; replay idéntico
devuelve el resultado original aunque la transferencia tenga recepciones posteriores.

## Conteos, ajustes, reportes y cambios — P-CNT/P-AUD/P-REP/P-CON

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| POST `/counts` | A/S/O | `{warehouseId,locationId,productId,observed}` + referencia | 201 comando, result Count | 422 `INVALID_COUNT/UNIT_PRECISION`; 404 producto/ubicación. Cero válido. |
| GET `/counts` | A/S/O | `warehouseId,productId?,locationId?,cursor,limit` | Lista Count | Filtros de empresa. |
| GET `/counts/:id` | A/S/O | Ninguna | 200 `{data:Count}` | Lectura también si ubicación bloqueada. |
| POST `/counts/:id/adjustment` | A/S | `{reason}` + referencia | 200 comando, result `{count:Count,balance:Stock,historyId}` | 422 `REASON_REQUIRED`; 409 `COUNT_STALE/RESERVED_STOCK_PROTECTED/COUNT_ALREADY_ADJUSTED`; permitido en bloqueada con validaciones. |
| GET `/history` | A/S | `warehouseId?,productId?,from?,to?,cursor,limit` | Lista History | 400 `INVALID_DATE_RANGE`; zona de empresa. |
| GET `/audit` | A/S | `entityId?,from?,to?,cursor,limit` | Lista Audit | Igual zona/ámbito; sin rutas de borrar. |
| GET `/dashboard` | A/S | `warehouseId,from,to` | 200 `{data:Dashboard}` | 400 rango inválido. |
| PUT `/thresholds` | A/S | `{warehouseId,productId,quantity}` + referencia | 200 comando, result Threshold | 422 cantidad negativa/precisión; 404 ámbito. |
| GET `/alerts` | A/S | `warehouseId,cursor,limit` | Lista Alert activas | Igualdad con umbral no es alerta; ausencia de umbral no la crea. |
| GET `/operations/:reference` | Rol autorizado para tipo original | Referencia | 200 comando confirmado; o 202 `{data:{reference,status:"pending",jobId}}` si importación pendiente | 404 `RESULT_NOT_RECORDED` no acredita que una solicitud en vuelo haya fallado; 403 si ya no autorizado. |
| GET `/changes` | A/S/O | Cookie; EventSource mismo origen | 200 `text/event-stream`, eventos definidos abajo | 401 inicial; cerrar stream revocado, sin enviar datos nuevos. |

SSE `change` lleva `{eventId,scopes:[{kind,id?}],occurredAt}`. `kind` de
inventario, layout, pedidos, traslados, reportes o sesión; solo ámbitos de empresa
de la conexión. Conectar/reconectar invalida consultas activas para recuperar
posibles avisos perdidos; los eventos son pistas, no un registro contable.
El cliente no deduce éxito de una referencia a partir de un evento de cambio.

## Intercambio de datos — P-EXC

| Método/ruta | Rol | Entrada | Éxito | Rechazos de dominio |
|---|---|---|---|---|
| POST `/imports` | A | multipart `file`, `kind=catalogue/initial_stock`, `warehouseId` solo para initial_stock | 202 `{data:ImportJob}` en parsing; luego preview consultable | 413 `FILE_TOO_LARGE`; 422 `INVALID_FILE/FORMAT/ROW_LIMIT`; no cambios de negocio. |
| GET `/imports/:id` | A | Ninguna | 200 `{data:ImportJob}` | 404 ajena. |
| GET `/imports/:id/rows` | A | `cursor,limit` | Lista ImportRow | Preview de create/update diferenciada. |
| POST `/imports/:id/validation` | A | `{}` | 200 `{data:ImportJob}` en validated o invalid con errores | 409 `IMPORT_STATE_CONFLICT`; no aplica catálogo/stock. Repetir validación no duplica negocio. |
| POST `/imports/:id/application` | A | `{contentHash}` + referencia | 202 `{data:{reference,status:"pending",jobId}}`; al terminar, operación confirmada con result `{jobId,created,updated,stockEntries}` | 409 `IMPORT_NOT_VALIDATED/CONTENT_CHANGED`; 422 filas/unidad/duplicados; conflicto de stock/bloqueo mantiene negocio intacto. |
| GET `/exports/inventory` | A/S | filtros inventory + `format=csv/xlsx` | 200 bytes y Content-Disposition; snapshot y filtros de empresa | 400 filtros/formato; 403 rol. |
| GET `/exports/history` | A/S | filtros history + `format=csv/xlsx` | 200 archivo coherente con consulta | Igual. |

### Formatos de importación

CSV UTF-8, BOM opcional, coma como delimitador y reglas de comillas RFC 4180.
XLSX, una hoja de datos llamada `Datos` y encabezados en primera fila. No XLS ni
CSV con delimitador supuesto a ciegas. Se ofrecen plantillas descargables para
ambos formatos con estas columnas y valores de ejemplo claramente ficticios.

| Clase | Encabezados exactos, todos requeridos | Ejemplo de valores |
|---|---|---|
| Catálogo | `sku,nombre,tipo_unidad,unidad_base` | `MOTOR-24V,Motor de demostración,piece,pieza` |
| Existencias iniciales | `sku,codigo_ubicacion,cantidad` | `MOTOR-24V,A/R1/N1/U1,100` |

La unidad base es etiqueta del producto y no factor de conversión. Para SKU
existente, tanto categoría como etiqueta deben coincidir con su unidad vigente;
solo se actualiza nombre conservando SKU/ID/unidad/cantidades. Archivo de
existencias se liga a un almacén seleccionado y exige producto/ubicación válidos;
duplicado por producto+ubicación dentro del archivo rechaza. Existencia previa
no nula para esa combinación rechaza RF-86, sin sobrescribirla. No se crea
automáticamente un producto o ubicación desconocidos mediante importación stock.

Cantidades en texto decimal con punto, sin separador de millares ni notación
infinita/NaN. En XLSX se acepta celda numérica solo si su representación decimal
cumple unidad/precisión; plantilla recomienda texto para exactitud. Nombres y
códigos se validan con reglas comunes. Encabezados incorrectos, archivo vacío,
filas vacías intermedias o datos incompletos se explican por fila, no se descartan
silenciosamente para aplicar parte del archivo. Filas puramente de formato sin
valores al final de XLSX no son registros de datos. Duplicados se comparan con
claves normalizadas, incluyendo mayúsculas y espacios exteriores.

Preview muestra número de fila, campos interpretados, create/update/initial_stock
y errores; la validación no autoriza por sí sola aplicar sin comprobación final.
Los límites de la spec se comprueban inclusive: el valor exacto por sí solo no
rechaza. Se contabilizan bytes del archivo y registros de datos, no encabezados.

### Formatos de exportación

CSV con los mismos ajustes UTF-8/coma/comillas y XLSX con hoja `Datos`. Una hoja
adicional `Consulta` en XLSX guarda filtros y zona; CSV lleva esos filtros en el
nombre descriptivo y en la respuesta HTTP `X-Export-Filters` con JSON codificado,
y la UI conserva la consulta que originó la descarga. No insertar metadatos como
filas falsas de inventario.

Inventario: `almacen,ubicacion,sku,nombre,unidad_base,fisico,reservado,disponible,bloqueada`.
Historial: una fila por asiento con `referencia,tipo,fecha_utc,zona_empresa,autor,
almacen,ubicacion,sku,delta_fisico,delta_reservado,delta_transito,motivo`.
Cantidades exactas, fecha estable y valores de texto explícitos. CSV neutraliza
prefijos de fórmula en textos y aplica escape; XLSX usa celdas string sin
fórmulas/hipervínculos activos. Archivo sin coincidencias conserva encabezados,
cero filas de datos y nombre de consulta. El saldo en tránsito se consulta en
traslados; no se inventa una ubicación física para exportarlo como inventario.

## Landing y simulación — P-COM

La información comercial y las dos modalidades son contenido local de Next.
CTA primario «Probar demo» → `/demo`; «Crear empresa» → `/registro` en SaaS.
En local el acceso principal lleva a `/acceso` o al asistente si falta configurar.
La comparación explica infraestructura alojada con mensualidad frente a
instalación/servicios pagados en infraestructura del cliente. No promete licencia,
precio final ni mantenimiento no acordados.

La selección de plan es estado de interfaz sin endpoint de cobro: recibe modalidad
`saas`/`local`, muestra «Simulación de selección» y «No se realizará ningún cargo»;
confirmar muestra `{simulated:true,modality}` en el estado de la página. No crea
suscripción real, pedido comercial ni acceso con más permisos. Si se muestran
importes de ejemplo, llevan «Precio demostrativo» junto al valor; no se decide
una tarifa comercial mediante este contrato.

La landing final usa la escena real sintética o captura de la aplicación local,
no un dashboard ficticio que aparente funciones ausentes. Se retira cualquier
afirmación de capacidad o función que no cuente con evidencia al validar RF-98.
