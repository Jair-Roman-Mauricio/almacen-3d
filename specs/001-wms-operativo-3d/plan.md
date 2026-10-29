# Plan 001 — WMS operativo con editor visual y almacén 3D

Estado: **aprobado**, con enmienda técnica solicitada por el usuario el 29/10/2026: pnpm sustituye a npm. [Actualizado 2026-10-29 · C1, RNF-9] Implementa
[spec.md](spec.md), RF-1 a RF-207 y RNF-1 a RNF-18, respetando los doce principios
de [la constitución](../../docs/constitution.md). Incorpora las decisiones
DA-1 a DA-7 aceptadas. No acredita capacidades medidas ni autoriza despliegues.

El plan incluye dos anexos normativos: [contratos](contratos.md) y
[trazabilidad y casos](trazabilidad-plan.md). Las referencias visuales y su
procedencia están en [referencias UI](referencias-ui.md). Todavía no existen
aplicación ni comandos ejecutables al redactar la base inicial: los comandos de §7 son el contrato que
deberá proporcionar la implementación. Después de aprobar este plan corresponde
`tasks-sdd`; esta entrega no genera tareas ni código de la aplicación.

## 1. Estructura de módulos

_(RF-1–207; RNF-1–18; constitución 1–11)_

### 1.1 Arquitectura y dependencias

[Actualizado 2026-10-29 · C1, RNF-9] Monorepo con pnpm workspaces, dos aplicaciones y un **monolito modular de negocio
en NestJS**. Next.js sirve la landing y el cliente operativo. Toda autorización,
validación final y modificación de negocio ocurre en NestJS, tanto en SaaS como
en instalación local. PostgreSQL es la fuente de verdad; el navegador nunca
escribe directamente en la base de datos.

Árbol propuesto, todavía sin crear sus archivos:

```text
apps/
  web/                 Next.js App Router: landing, acceso, aplicación
  api/                 NestJS: transporte HTTP, aplicación, adaptadores
    identity/          sesión, empresa, usuarios, permisos, alta inicial
    warehouses/        almacenes, jerarquía física, revisiones, bloqueos
    catalogue/         productos, códigos, unidades, umbrales
    inventory/         saldos, recepciones, movimientos, libro de inventario
    outbound/          pedidos, reservas, asignación, preparación, despacho
    transfers/         salida, tránsito, recepción entre almacenes
    counts/            referencias de conteo y ajustes
    reporting/         consultas, indicadores, alertas, historial
    exchange/          archivos, previsualización, validación, aplicación
    platform/          transacciones, idempotencia, auditoría, avisos de cambio
packages/
  contracts/           esquemas Zod y tipos de solicitudes/respuestas
  domain/              cantidades, geometría, saldos y reglas puras
  database/            esquema Drizzle, repositorios y migraciones SQL
  ui/                  controles accesibles, tokens y composición visual
tests/                 integración PostgreSQL, concurrencia, flujos, carga
infra/                 contenedores y configuración local
docs/                  instalación, operación, respaldo y evidencias
output/                informes, mediciones y capturas generados
```

Dependencias permitidas: web → contracts/ui; api → contracts/domain/database;
database implementa los puertos de persistencia de la aplicación; domain no
importa Next, Nest, SQL, red, reloj ni disco. ui no importa database ni servicios
de negocio. Los módulos coordinan operaciones mediante servicios de aplicación
y una transacción compartida, sin llamadas HTTP entre módulos ni repositorios
alternativos con reglas divergentes. Los contratos compartidos validan la forma;
la API siempre vuelve a comprobar permisos y estado real.

### 1.2 Responsabilidades y partes identificables

Estos identificadores se usan en la trazabilidad y en las futuras pruebas.

| Parte | Responsabilidad | Requisitos principales |
|---|---|---|
| P-ACC | Registro SaaS, asistente local, sesión por empresa, equipo y permisos actuales | RF-1–9, RF-113–115, RF-139–155 |
| P-GEO | Almacenes, árbol físico, edición, versión y restricciones de ocupación | RF-10–23, RF-116–117, RF-126, RF-189–199 |
| P-MAP | Visor 3D, búsqueda, selección, leyenda y alternativa de lista | RF-24–33, RF-105 |
| P-CAT | Catálogo, unidad base, códigos y validaciones comunes | RF-34–41, RF-123–128 |
| P-INV | Saldos, recepciones, movimientos internos, atomicidad | RF-37–49, RF-103, RF-107 |
| P-OUT | Pedidos y saldos por línea, reservas, picking, despacho y asignación | RF-50–63, RF-118–121, RF-156–170 |
| P-TRA | Traslados: registro, salida única, tránsito y recepción | RF-171–188 |
| P-CNT | Conteos por producto/ubicación, revisión física y ajustes | RF-64–70, RF-108–109 |
| P-BLK | Inmovilización, conservación de compromisos y desbloqueo auditado | RF-31, RF-200–207 |
| P-AUD | Historial inmutable, fechas de empresa y filtros | RF-49, RF-71–73, RF-129–133, RF-168, RF-187, RF-206 |
| P-REP | Indicadores, umbrales y alertas | RF-74–79 |
| P-EXC | Importación atómica CSV/XLSX y exportación segura | RF-80–90, RF-122, RF-134–138 |
| P-COM | Landing, modalidades y selección comercial simulada | RF-91–98 |
| P-CON | Referencia estable, respuesta perdida, conexión y cambios entre sesiones | RF-99–112, RNF-14 |
| P-OPS | Mismas imágenes/núcleo, persistencia, migraciones, recuperación y demo | RF-104, RF-106, RNF-3, RNF-8–11 |
| P-UI | Navegación, accesibilidad, estados, móvil y referencias MCP | RNF-1, RNF-4–7, RNF-12, RNF-17–18 |
| P-PERF | Entorno, datos y mediciones de los objetivos aprobados | RNF-11, RNF-13–16 |

## 2. Modelo de datos

_(RF-1–90, RF-99–207; RNF-2–3, RNF-8–9)_

### 2.1 Identidad, aislamiento y esquema

Identificadores internos UUID; fechas persistidas como `timestamptz` en UTC.
Toda entidad de empresa lleva `tenant_id`. Las relaciones operativas usan claves
foráneas compuestas que incluyen empresa y, cuando corresponde, almacén. No basta
con que dos entidades tengan UUID válidos: deben pertenecer al mismo ámbito.

| Entidad | Datos e invariantes relevantes |
|---|---|
| installation | Modalidad `saas`/`local`, configuración inicial completada y versión de esquema. Una única fila de control por instalación. |
| companies | Código original y normalizado único en instalación, nombre, zona IANA; America/Lima por defecto. |
| users | Empresa, nombre, correo normalizado único por empresa, hash de contraseña, rol de la matriz y activo. Sin cuenta global compartida entre empresas. |
| sessions | Hash del token opaco, empresa, usuario y revocación. La contraseña y el token en claro no se registran en logs ni respuestas operativas. |
| warehouses | Empresa, código normalizado único por empresa, nombre, dimensiones del volumen contenedor, revisión de distribución. |
| layout_elements | Empresa, almacén, ID estable, tipo, padre, código, nombre, posición relativa y dimensiones en metros; ubicación con estado bloqueado. Jerarquía tipada y sin ciclos. |
| products | Empresa, SKU original/normalizado único, nombre, categoría de unidad y etiqueta de unidad base, estado de eliminación lógica. |
| stock_balances | Una fila por empresa/almacén/ubicación/producto, físico, reservado, revisión física monotónica. Conserva fila a cero para detectar referencias antiguas. |
| orders / order_lines | Empresa, almacén, referencia, líneas con producto y solicitado; asignado actual en pedido. Despachado acumulado por línea. |
| allocations | Línea, producto, ubicación de origen; reserva vigente y preparación pendiente de despacho. No se representa preparación como salida física. |
| transfers / transfer_lines | Origen/destino de la empresa, referencia, producto, cantidad declarada y origen por línea, salida confirmada, recibido acumulado. Tránsito = salido − recibido. |
| transfer_receipts | Etapa confirmada y desglose por línea/ubicación destino; historial de recepciones parciales. |
| counts | Producto, ubicación, observado, físico de referencia, revisión física de referencia, actor y fecha. Un conteo no escribe stock. |
| adjustments | Conteo, valor físico autorizado, motivo, actor y operación confirmada. Una referencia obsoleta nunca se aplica. |
| stock_thresholds | Producto/almacén/empresa y umbral no negativo; ausencia de fila significa sin alerta configurada. |
| commands | Empresa y referencia únicas, tipo, hash canónico de datos, actor, resultado y estado. Sirve para consulta y deduplicación. |
| inventory_entries | Asientos inmutables de deltas físicos/reservados/en tránsito, producto, ubicación o traslado, operación, actor y fecha. |
| audit_events | Hechos de gestión: asignación, reasignación, bloqueo/desbloqueo y cambios administrativos; motivo cuando la spec lo exige. |
| import_jobs / import_rows | Empresa, actor, clase de importación, huella de contenido, filas normalizadas, validaciones y estado; no son stock ni catálogo aplicado. |
| change_outbox | Aviso persistido en la misma transacción: empresa, ámbitos afectados, fecha, publicado. No contiene credenciales. |

El estado de negocio de pedidos se deriva de **todas sus líneas**; nunca se suman
cantidades de unidades distintas para decidir si está completo. Antes de cualquier
despacho es `pendiente`; con algún despacho y saldo en alguna línea es
`parcialmente_despachado`; con todas completas es `despachado`. `cancelado` solo
se asigna si no hubo cantidades preparadas ni despachadas. El detalle muestra
además preparación/reservas pendientes, sin inventar un cierre de saldos.

### 2.2 Cantidades, códigos, geometría y fechas

- Cantidades HTTP como cadenas decimales, nunca números binarios del cliente.
  Dominio: entero `BigInt` de milésimas con escala validada **antes** de convertir.
  Base de datos: `numeric` sin escala que redondee, restricciones de finitud,
  no negatividad y escala máxima tres; la API aplica además la regla de enteros
  según unidad. No se impone un máximo comercial de cantidad.
- Piezas/cajas/pallets enteros; peso/volumen/longitud hasta tres decimales. Un
  valor con precisión excesiva se rechaza incluso si podría redondearse. No hay
  conversiones de unidades. El formato canónico de salida conserva valor exacto,
  sin ceros fraccionarios innecesarios. Conteos admiten cero; operaciones físicas,
  reservas, preparación, pedidos y etapas de traslado exigen cantidad positiva.
- Nombres: recortar extremos y contar caracteres Unicode, hasta 160, no vacíos.
  Códigos: normalización Unicode NFC, recorte exterior, comparación sin distinguir
  mayúsculas mediante una función común de normalización; hasta 64 caracteres,
  letras/números Unicode y `- _ . /`, sin espacios internos. Se conservan forma
  original y clave normalizada. La unicidad se protege también en PostgreSQL.
  Correo normalizado por empresa; no aplicar la gramática de códigos a correos
  ni contraseñas. No recortar ni transformar la contraseña.
- Geometría: volúmenes rectangulares alineados con ejes, coordenadas relativas
  al padre. X/ancho, Y/alto, Z/profundidad en metros; posiciones no negativas,
  dimensiones finitas positivas. `decimal.js` para comparaciones exactas sin
  fijar una precisión nueva al editor; límites inferiores inclusivos y contacto
  de bordes permitido. La precisión de cálculo se deriva de los dígitos/escala
  de los valores y de las sumas de contenedores implicadas, con margen suficiente
  para que no haya redondeo; no se usa la precisión por defecto de la librería
  para decidir una colisión. Se prueban coordenadas largas y árboles anidados.
  El visor convierte a flotantes solo para dibujar.
  La rotación de cámara no altera geometría. No se deduce capacidad de carga,
  seguridad estructural ni capacidad por volumen de la mercancía.
- Fechas: entradas de filtro `YYYY-MM-DD`; convertir el comienzo del primer día
  y el comienzo del día siguiente al final **en la zona de la empresa**, luego
  consultar intervalo UTC semiabierto. No sumar 24 horas para calcular días de
  zonas con cambios horarios. Fecha final anterior: rechazo.

### 2.3 Invariantes, índices y eliminaciones

En cada posición: `0 ≤ reservado ≤ físico`. Por asignación: `0 ≤ preparado ≤
reservado vigente`. Por línea: `0 ≤ despachado ≤ solicitado`, `reserva vigente ≤
solicitado − despachado`. Tránsito no negativo y excluido de inventario físico y
reservable. Con ubicación bloqueada la disponibilidad operativa es cero; la UI
expone también físico, reservado y estado para explicar las cantidades.

Índices con empresa al comienzo para códigos, saldos por almacén/producto,
ubicaciones, pedidos/asignado/estado, historial por fecha/producto/almacén,
referencia de comando e importación. Búsquedas de código/SKU normalizados y
paginas por cursor estable; no cargar 50.000 productos en un selector. Índices
adicionales solo a partir de planes de consulta medidos. Claves de ubicación
únicas por almacén; otros códigos de elementos, por tipo y almacén.

Productos sin existencias, reservas ni trabajo abierto pueden retirarse del
catálogo activo mediante eliminación lógica, conservando referencias históricas.
Elementos físicos solo se eliminan si ni ellos ni sus descendientes tienen stock
o referencias abiertas. Trabajo abierto incluye asignaciones/reservas y orígenes
de traslados registrados todavía pendientes; no se anticipan destinos sin
ubicación asignada. Crear una referencia abierta y guardar geometría comparten
el protocolo de bloqueo de §3. No hay borrado de operaciones confirmadas; el rol
SQL de aplicación no tiene permiso de actualizar/borrar asientos ni auditoría.

### 2.4 Ejemplo coherente de datos

Empresa ficticia `DEMO-INDUSTRIAL`, zona America/Lima; producto `MOTOR-24V`,
unidad `piece`; almacenes `CENTRAL` y `DESPACHO`. Posición `A/R1/N1/U1`:
físico `100`, reservado `40`, preparado pendiente `10`, disponible operativo
`60` si está habilitada. Pedido solicitado `100`, despachado `0`, pendiente
`100`, pendiente de reservar `60`, reservado por preparar `30`.

Despachar las `10` preparadas deja físico `90`, reservado `30`, preparado
pendiente `0`, despachado `10`, pendiente del pedido `90`, pendiente de
reservar `60` y disponible `60`. Una salida de traslado de `20` no reservadas
deja físico `70`, reservado `30`, disponible `40`, tránsito `20`; recibirlas
en destino deja `70` en origen, `20` en destino, tránsito `0`. El efecto del
traslado conserva las `90` físicas más tránsito previas a su salida.

### 2.5 Defensa de ámbito

Repositorios exigen un contexto autenticado y filtros de empresa. Segunda
barrera: RLS en tablas de empresa con política de lectura y escritura basada
en contexto de transacción establecido por el servidor, nunca por un campo del
cliente. Conexiones con rol sin `BYPASSRLS`, sin ser propietario del esquema;
migraciones con otro rol. Cada petición, lectura, trabajador de importación y
exportación abre su propio contexto mediante `SET LOCAL` y lo libera al terminar.
Probar el pool alternando empresas, incluyendo rollback y ausencia de contexto.

El acceso inicial es la excepción acotada: directorio de código de empresa,
comprobación de credenciales y resolución del hash de sesión mediante funciones
SQL específicas con permisos mínimos y `search_path` fijo. Devuelven únicamente
lo necesario para autenticación, nunca inventario. Las altas conjuntas usan un
adaptador de provisión con privilegios limitados. No se reutiliza la conexión de
migraciones como conexión general de la API. RLS no sustituye la matriz de roles.

## 3. Algoritmos

_(RF-9, RF-15–23, RF-39–70, RF-80–90, RF-99–112, RF-116–207)_

### 3.1 Protocolo de confirmación e idempotencia — P-CON/P-INV

Pseudocódigo, no implementación:

```text
validar forma y cantidad exacta; resolver sesión y empresa desde el servidor
abrir transacción y fijar contexto de empresa
adquirir barrera compartida de permisos de la empresa; releer usuario activo/rol
comprobar permiso actual para el tipo de acción
serializar la referencia de comando dentro de esa empresa
si existe resultado confirmado:
  comparar tipo y datos canónicos
  si difieren: rechazar referencia reutilizada
  si coinciden: devolver resultado anterior sin revalidar bloqueo/stock histórico
si es nueva:
  adquirir bloqueos de dominio en orden establecido
  releer estado, pertenencia, bloqueo, asignación y saldos
  validar todas las líneas de la solicitud
  escribir efectos, asientos, auditoría, resultado y aviso de cambio
confirmar todo conjuntamente y devolver resultado persistido
ante cualquier rechazo/fallo: rollback de todos los efectos
```

La referencia UUID la crea el cliente al iniciar una acción y se conserva al
reenviar esa acción; `Idempotency-Key` es obligatoria en comandos operativos.
Datos canónicos = tipo, entidad, líneas y valores exactos normalizados; excluye
CSRF, metadatos de transporte y orden irrelevante de propiedades. En importación
incluye clase y huella del contenido normalizado validado, no solo nombre de
archivo. Una acción nueva usa referencia nueva aunque tenga datos iguales.

El resultado confirmado y sus efectos viven en la **misma transacción**. Si
falla antes de commit, no queda una confirmación que deduplique trabajo no hecho.
Solicitudes concurrentes de la misma referencia esperan esa exclusión; tras el
commit leen el único resultado. La consulta de referencia nunca ejecuta efectos.
Reintentos conservan autorización actual; un usuario desactivado no recupera
datos usando una referencia antigua. Las respuestas de dominio rechazadas no
constituyen una operación confirmada.

### 3.2 Bloqueos, permisos y concurrencia — P-ACC/P-INV/P-OUT/P-GEO

PostgreSQL `READ COMMITTED` con bloqueos explícitos y restricciones. Orden único:
barrera de permisos de empresa → referencia de comando → barreras de geometría
de almacenes ordenados → pedido/traslado/conteo ordenados → ubicaciones ordenadas
→ productos ordenados → posiciones de stock ordenadas. Los servicios no pueden
alterar este orden ni abrir una transacción independiente dentro de otra.

- Barreras con advisory locks de transacción en espacios de claves separados.
  Acciones protegidas toman barrera compartida de permisos; cambios de rol,
  actividad y último administrador toman exclusiva. Esos cambios cuentan los
  administradores dentro del bloqueo, evitando dos desactivaciones simultáneas.
  Cerrar sesión serializa la revocación y se verifica al entrar en la acción.
- Operaciones y creación de trabajo abierto toman barrera compartida del almacén;
  guardar distribución toma exclusiva. Las operaciones entre almacenes adquieren
  ambas en orden. El editor vuelve a leer stock/trabajo tras adquirirla.
- Operaciones sobre ubicación y cambios de bloqueo toman los mismos bloqueos de
  sus filas, antes de revisar estado. Con ello un formulario antiguo no elude
  bloqueo. No se aplica bloqueo global de escritura a toda la empresa.
- Bloquear fila de pedido serializa reserva/preparación/despacho y reasignación;
  fila de traslado serializa salida y saldo de recepción. Bloquear producto
  coordina su eliminación con referencias nuevas. Crear filas de saldo vacías
  bajo el bloqueo de ubicación, después `FOR UPDATE`; nunca confiar en bloquear
  una fila que todavía no existe.
- Si PostgreSQL detecta deadlock, rollback y respuesta transitoria sin éxito
  ficticio; el cliente consulta referencia y permite reintentar. No repetir
  automáticamente solicitudes con resultado incierto usando otra referencia.

Las verificaciones usan conexiones distintas y barreras de sincronización de
prueba, no una secuencia de peticiones disfrazada de concurrencia. Se prueban
ambos órdenes de commit para permisos, bloqueos y ocupación del editor.

### 3.3 Saldos de salida — P-OUT

```text
pendiente de línea = solicitado − despachado
pendiente de reservar = pendiente de línea − suma de reservas vigentes
por asignación: pendiente de preparar = reserva vigente − preparado pendiente
reservar q: exigir q ≤ disponible de origen y q ≤ pendiente de reservar
preparar q: exigir asignación actual si es operario y q ≤ pendiente de preparar
despachar q: exigir q ≤ preparado pendiente y q ≤ reserva vigente
  disminuir físico, reserva vigente y preparado pendiente en q
  incrementar despachado de línea en q
cancelar: exigir preparado acumulado = 0 y despachado acumulado = 0
  liberar reservas vigentes y marcar cancelado
```

Validar el total solicitado si una petición repite una misma línea/ubicación;
no permitir superar límites fragmentando filas. Todas las líneas se validan
antes de aplicar. Asignar/reasignar solo a operario activo de la empresa; no
escribir ni reiniciar acumulados confirmados. El estado de las líneas sigue
siendo válido aunque se bloquee la ubicación: queda suspendida la confirmación
física, no se libera stock reservado. Desbloquear solo cambia estado y audita.

### 3.4 Traslados y conservación — P-TRA

Registro sin salida: conserva mercancía declarada y orígenes como trabajo abierto,
sin reducir físico ni reservar para pedidos. Salida nueva: comprobar no salió,
validar disponible no reservado en cada origen y restarlo; registrar en tránsito
esas mismas cantidades dentro de la misma transacción. Recepción: comprobar que
hubo salida, destino válido/habilitado y cantidad ≤ saldo pendiente de su línea;
restar tránsito y sumar físico destino. Varias ubicaciones destino se validan
conjuntamente. No admitir una recepción antes de la salida ni una segunda salida
nueva. Cada etapa conserva por producto `físico total empresa + tránsito total`.

### 3.5 Conteo, ajuste y auditoría — P-CNT/P-AUD

Leer atómicamente físico y revisión de la posición al registrar el conteo;
guardar ambos con observado y diferencia exacta. Un ajuste basado en conteo
requiere revisión física idéntica, motivo y rol autorizado. Comprobar el reservado
**actual**, incluso si no cambió el físico. Cambiar físico al observado autorizado,
incrementar revisión y crear asiento. Una secuencia físico A→B→A invalida el conteo
por revisión aunque la cantidad final coincida. Cambios de otro producto no lo
invalidan. Consultas y reservas no incrementan revisión física.

### 3.6 Guardado de distribución — P-GEO

```text
tomar barrera exclusiva del almacén y comprobar revisión de partida
validar jerarquía, identificadores existentes, nombres/códigos y dimensiones
obtener cajas exactas y contención por cada padre
comparar propuesta con distribución guardada
para mover/redimensionar/eliminar: comprobar stock/trabajo de descendientes
buscar intersecciones de interiores solo en las parejas prohibidas
si hay error: rollback total con ID de elemento, campo y motivo
si es válido: persistir conservando IDs y sin modificar saldos; aumentar revisión
```

Contención y recorrido del árbol lineales. Intersecciones por grupos de hermanos
y tipos relevantes: índice espacial temporal/sweep con cajas delimitadoras y
comparación exacta de candidatos, evitando comparar todos los pares de 20.000
ubicaciones en condiciones habituales. Peor caso denso puede ser cuadrático;
se mide y se corta al encontrar un conflicto explicable. Racks/pasillos y zonas
se comparan en su ámbito; ubicaciones de un mismo nivel o de una misma zona
directa se comparan entre sí. No añadir prohibiciones de solapamiento ajenas a
la spec. Un contenedor y su hijo no colisionan entre sí.

El cliente conserva borrador en memoria separado de la caché del layout guardado.
Ante conflicto 409 no lo reemplaza por el layout remoto; permite inspeccionar el
borrador y recargar con confirmación, sin mezcla automática. Antes de abandonar
cambios se pide confirmación, también al navegar a otro almacén.

### 3.7 Archivos y consultas — P-EXC/P-REP

Upload → contar bytes → reconocer CSV/XLSX → interpretar en trabajador de Node
separado del hilo HTTP → normalizar filas → previsualización con creaciones y
actualizaciones → validar → confirmar aplicación. El trabajo y filas se guardan
en PostgreSQL; no se confía en una previsualización enviada por el navegador.
Máximo 20.000.000 bytes del archivo y 20.000 filas de datos, encabezado excluido.
Leer de forma incremental y detenerse al exceder el límite. XLSX sin macros,
fórmulas ni referencias externas como datos; no ejecutar contenido de celdas.

Al confirmar se vuelven a comprobar unidades, duplicados, permisos, bloqueos y
saldos contra estado actual. Catálogo usa unicidad de SKU y bloqueos de productos;
existencias iniciales usa el mismo protocolo de P-INV. Si cualquier fila falla,
ninguna fila modifica negocio. Staging no es una importación aplicada. Los
trabajadores reclaman trabajos con bloqueo PostgreSQL; tras reinicio recuperan
trabajos interrumpidos y consultan comando antes de reaplicar. La finalización,
efectos y resultado confirmado se escriben juntos. Se conservan causas por fila.

La aplicación asíncrona registra primero una intención pendiente ligada al job
y a su huella. Reenviar esa referencia mientras está pendiente devuelve el mismo
202 sin crear otro job; datos distintos rechazan. El trabajador adquiere la misma
exclusión de referencia y finaliza esa intención junto a los efectos en una única
transacción. Un job ya aplicado no se vuelve a aplicar con una referencia nueva;
es un conflicto de estado. Un adaptador interno de cola solo enumera IDs de job
y empresa; cada ejecución abre contexto RLS de esa empresa y verifica actor/rol
antes de modificar negocio. No se da bypass RLS al trabajador para operar stock.

Exportación: filtros de la consulta activa, lectura coherente con snapshot y
empresa/rol actuales; CSV escapado y celdas XLSX explícitamente de texto cuando
podrían ser fórmula. Resultado vacío conserva encabezados y metadatos de filtros,
sin una fila ficticia de inventario. Los indicadores cuentan productos,
ubicaciones, pedidos y operaciones; no suman piezas con kilos. Alertas se derivan
de disponible operativo < umbral, no de una notificación externa.

### 3.8 Actualización entre sesiones y renderizado — P-CON/P-MAP

Cada commit escribe aviso de cambio. Un dispatcher de la API lee avisos pendientes
en PostgreSQL y emite SSE del ámbito de empresa; revisión cada segundo como
parámetro técnico para contribuir al objetivo ≤5 s. No se mantiene una conexión
PostgreSQL por navegador ni una transacción abierta durante el stream. Un aviso
solo lleva ámbitos/IDs a invalidar, no mercancía ni permisos. Se comprueba sesión
antes de enviar y se cierra la conexión revocada. En reconexión se refrescan las
consultas activas completas; duplicar un aviso no duplica operaciones. Marcar
publicado después de emitir; un reinicio puede repetir avisos, nunca stock.
Una única instancia dispatcher local posee el bloqueo de publicación; un
adaptador interno enumera metadatos de cola, sin consultar inventario fuera de
un contexto de empresa. No se usa un máximo de secuencia como cursor de commit:
los commits pueden llegar en otro orden y siempre se revisan avisos no publicados.

TanStack Query invalida inventario, selección 3D, pedidos y reportes afectados;
tras confirmación propia usa también resultado autoritativo. Datos protegidos
HTTP y caché del servidor sin caché compartida entre empresas; claves del cliente
incluyen empresa/almacén/filtros y se vacían al salir/cambiar identidad. No se
muestra éxito de inventario por una actualización optimista del navegador.

Geometría 3D carga bajo demanda, separada del bundle de la landing y tablas.
React Three Fiber/Three.js agrupa geometría repetida con `InstancedMesh`, conserva
mapa instanceId→ubicación y reutiliza materiales. Navegación OrbitControls,
renderizado bajo demanda, sin física, sombras costosas ni un texto/DOM por cada
ubicación. Mallas por zona facilitan selección y descarte visual; etiquetas solo
de selección o contexto visible. Búsqueda se resuelve en API y destaca IDs sin
mutar inventario. Error de WebGL/contexto perdido lleva a la lista operativa.

## 4. Contrato de la interfaz

_(RF-1–207; RNF-1–7, RNF-12, RNF-17–18)_

### 4.1 Transporte, sesión y errores

REST JSON bajo `/api/v1`; Next hace proxy del mismo origen a Nest. Sin reglas de
inventario en Route Handlers/Server Actions. Los endpoints, esquemas de entrada,
salidas, estados y errores por flujo están definidos en [contratos.md](contratos.md).
SSE es solo aviso de cambios; toda confirmación usa REST autenticado.

Cookie de sesión opaca HttpOnly, SameSite=Lax y Secure bajo HTTPS; en localhost
HTTP solo para desarrollo. CSRF de sesión y validación Origin para mutaciones,
también en los formularios públicos donde corresponda. Contraseñas con Argon2id,
tokens criptográficos y hash almacenado, consultas parametrizadas. Sesiones
revocables en PostgreSQL, sin claims de rol que sigan válidos tras un cambio.
No se introduce una política comercial de caducidad o complejidad de contraseña
sin definirla; este alcance exige credenciales presentes, no correo obligatorio.

Errores uniformes: `code`, `message` en español, `details` estructurados por
campo/fila/elemento sin datos ajenos, `requestId`. 400 forma/filtro inválido;
401 sesión/credenciales; 403 rol/CSRF; 404 entidad inexistente o ajena sin revelar
su existencia; 409 conflicto de estado, saldo o referencia; 413 archivo excesivo;
422 validación de negocio/archivo; 503 fallo transitorio. No responder 2xx a una
operación rechazada ni mostrar el error de red como éxito.

### 4.2 Pantallas y navegación

| Ruta propuesta | Usuario y contenido | Estados e interacción esenciales |
|---|---|---|
| `/` | Visitante: producto, escena real del demo, capacidades disponibles y comparación SaaS/local | Carga visual con alternativa estática, CTA «Probar demo», «Crear empresa», selección simulada explícita sin checkout. |
| `/demo` | Instrucciones con cuentas ficticias de tres roles | Mostrar solo credenciales del manifiesto de seed demo; enlace a acceso. |
| `/registro` | Alta SaaS de empresa y administrador | Datos requeridos, código duplicado, error íntegro, confirmación del código de acceso. No disponible en modo local. |
| `/configuracion-inicial` | Asistente local de primera empresa | Consultar estado; impedir segunda configuración, incluso con dos pestañas. No disponible en SaaS. |
| `/acceso` | Código de empresa, correo y contraseña | Rechazo genérico, envío pendiente, sesión válida y cierre. |
| `/app` | Resumen según rol y selector persistente de almacén | Indicadores para admin/supervisor; operario accede a sus operaciones y tareas. Vacío si no hay almacenes. |
| `/app/almacenes` | Almacenes; administrador puede crear | Vacío, selección, validación de código/nombre/dimensiones. |
| `/app/almacenes/[id]/editor` | Administrador: árbol, planta 2D y vista 3D de previsualización | Crear elementos, arrastrar y campos exactos en metros, guardar/deshacer borrador, conflicto conservado, elemento/restricción identificados. Escritorio ≥1280×720. |
| `/app/mapa` | Tres roles: visor de distribución guardada | Búsqueda SKU/ubicación, leyenda texto/patrón, selección con cantidades, controles cámara y alternativa de lista. |
| `/app/inventario` y `/app/catalogo` | Lista por almacén y productos; catálogo editable según rol | Filtros y páginas, detalle por ubicación; bloqueado visible, vacío real, no resultados y error de consulta diferenciados. |
| `/app/recepciones` y `/app/movimientos` | Tres roles: registrar y consultar resultado por referencia | Origen/destino, SKU, cantidad exacta, validación al confirmar, estado de resultado incierto. |
| `/app/pedidos` y `/app/pedidos/[id]` | Admin/supervisor gestionan; operario consulta/prepara asignados | Saldos por línea, selección explícita de cantidades parciales, asignación/reasignación, reservar/preparar/despachar según permiso. |
| `/app/traslados` y `/app/traslados/[id]` | Consultar; crear/salir según rol; recepción para los tres | Origen, tránsito separado, destino, recibido parcial/total y referencia de cada etapa. |
| `/app/conteos` | Tres roles registran; admin/supervisor autorizan ajuste | Producto + ubicación, referencia y diferencia, motivo, rechazo por referencia obsoleta o reserva. |
| `/app/historial` y `/app/reportes` | Admin/supervisor | Filtros por almacén/SKU/fecha de empresa, indicadores sin mezclar unidades, alertas y exportación de consulta. Otros roles solo detalles de sus operaciones autorizadas. |
| `/app/importaciones` | Administrador | Selección CSV/XLSX, preview por fila, validar, corregir archivo, aplicar, progreso, error íntegro y resultado consultable. |
| `/app/configuracion` y `/app/equipo` | Administrador | Zona de empresa, equipo/roles/actividad, protección de último administrador; bloqueo/desbloqueo desde detalle de ubicación. |

### 4.3 Dirección visual y accesibilidad

Lectura de diseño: landing B2B para responsables de almacén y evaluadores del
proyecto, con producto espacial visible; aplicación de uso diario centrada en
decisiones y cantidades legibles. La landing persuade; la aplicación permite
operar. No se trasladan titulares gigantes ni animaciones comerciales a tablas.

Propuesta de partida: escena del almacén configurado como foco de landing,
tipografía sans neutra alojada localmente, superficies claras y acento industrial
contenido. La aplicación mantiene esa familia visual con números tabulares,
barra de contexto de empresa/almacén, tablas y panel de detalle. Colores de estado
son semánticos y siempre llevan texto/icono/patrón; no compiten con el acento.
Los valores finales de tokens y composiciones se concretan en tareas UI, siguiendo
las skills requeridas y las referencias MCP documentadas por módulo.

Radix Primitives para diálogos, menús y foco; HTML nativo para formularios/fechas;
Tailwind y tokens propios compartidos, una familia de iconos Phosphor para acciones
reales. Texto en español. Etiquetas visibles y nombres accesibles, foco visible,
teclado, recuperación de foco al cerrar diálogo, errores junto al campo y resumen
si hay varios. Leyenda accesible y lista alternativa para inventario y operaciones;
no se exige manejar el lienzo con teclado para operar.

Estados: carga sin mostrar ceros ficticios; vacío con acción permitida; sin
coincidencias conservando filtros; error con reintento; sin permiso sin controles
de mutación; conexión perdida con confirmación deshabilitada; respuesta perdida
como «Resultado no confirmado», referencia visible y acción «Consultar resultado».
Se conserva el borrador durante conflictos o fallos; sin cola offline ni envío
automático posterior. La referencia pendiente puede guardarse como metadato local
para consultar resultado, nunca como una orden diferida de inventario.

Escritorio: editor comprobado a 1280×720 con árbol, lienzo y propiedades usables.
Móvil 360×800: listas adaptadas, formularios de una columna, detalle y acciones
sin depender del 3D; navegación compacta que no oculte la confirmación tras teclado.
`dvh` para app, safe areas, inputs legibles y zoom habilitado; hover condicionado
por capacidades. Editor móvil no forma parte del criterio de esta entrega.

Movimiento según `animate`/`emil-design-eng`: feedback breve para botones y
apertura ocasional de paneles, CSS cuando baste; sin animar cantidades ni acciones
repetitivas por teclado. `prefers-reduced-motion`, interrupción y salida coherentes.
No instalar Motion/GSAP para una transición sencilla. No usar marcos flotantes,
blobs, cifras decorativas, texto degradado ni grids genéricos de features.

La evidencia MCP actual es una base de planificación; cada entrega visual tendrá
consulta/análisis pertinente, decisión original, referencia de módulo y capturas
propias. No existe diseño Figma aportado; no se crea un archivo de Figma ni una
exploración cloud de Stitch por esta planificación. Magic UI solo si aporta una
pieza adecuada; no es una dependencia necesaria del WMS.

## 5. Flujo de las operaciones

_(RF-1–207; RNF-2–3, RNF-7–10)_

| Flujo | Entrada → proceso → salida; corte de fallo |
|---|---|
| Registro SaaS | Formulario → validar → bloqueo de código único → transacción empresa + admin → mostrar código y enlace a acceso. Fallo/duplicado revierte el conjunto. |
| Asistente local | Estado installation → formulario → bloqueo exclusivo de installation → exigir no configurado → empresa + admin + marca configurada juntos. Reintento de alta inicial rechaza sin reemplazar empresa. |
| Acceso/equipo | Código+correo+contraseña → resolver solo esa empresa → comprobar hash/activo → cookie. Cambios de equipo toman barrera exclusiva y preservan último admin. Cada acción siguiente lee permisos actuales. |
| Configuración física | Elegir almacén → cargar revisión → borrador árbol/planta/preview → guardar según §3.6. Error mantiene persistencia anterior y borrador de sesión identificado. |
| Recepción/movimiento | Formulario y referencia → protocolo §3.1 → ubicación habilitada y saldo disponible → asientos + saldos + resultado. Cualquier línea inválida revierte todo. |
| Salida de pedido | Crear líneas → reservar cantidades explícitas → asignar operario → preparar → despachar según §3.3 → refrescar saldos/historial. Un rechazo nunca reduce automáticamente la cantidad pedida. |
| Traslado | Registrar origen/destino/líneas → confirmar salida → tránsito visible → confirmar recepción parcial/total → saldo y cierre derivado. Validación fallida mantiene íntegra esa etapa, sin revertir etapas anteriores. |
| Conteo/ajuste | Registrar observado y referencia por posición → revisar diferencia → autorización con motivo → comparar revisión/reservas → ajuste auditado. Si obsoleto, nuevo conteo; no se reescribe el anterior para aceptarlo. |
| Bloqueo | Admin confirma → serializar ubicación → bloquear sin borrar reservas. Nuevas operaciones físicas rechazan. Conteo/ajuste válidos siguen. Desbloqueo admin+motivo → auditoría → operaciones siguen pendientes hasta confirmación manual. |
| Importación | Archivo → staging/preview → validación → confirmación con referencia → trabajador revalida y aplica una transacción → resultado. Error conserva negocio previo, filas inválidas identificadas. |
| Consulta/exportación | Sesión → filtros y zona de empresa → snapshot de lectura → tabla/archivo. Sin efectos de stock; exportar usa filtros activos y rol autorizado. |
| Conexión incierta | Servidor inaccesible → impedir nuevas confirmaciones. Si una petición quedó sin respuesta: conservar referencia, mostrar incertidumbre; al reconectar consultar. Solo reenvío explícito con la misma referencia puede repetir solicitud. |
| Demostración comercial | Landing → modalidades claramente comparadas → seleccionar plan → confirmación simulada, sin pasarela ni cargo. La landing final solo anuncia capacidades que superaron validación. |

### 5.1 Instalación, actualización y recuperación — P-OPS

Docker Compose con web, API y PostgreSQL, almacenamiento persistente. Mismo
artefacto de negocio para ambos modos; `DEPLOYMENT_MODE` cambia alta inicial y
presentación de modalidad, no reglas. `DEMO_MODE` controla seed/banda/cuentas de
demo, no permisos. Configuración por variables documentadas y ejemplo sin secretos;
solo la web publica puerto en localhost por defecto. Acceso LAN será configuración
explícita de instalación; no se abrirá automáticamente el equipo a Internet.

Primera instalación: verificar entorno → levantar PostgreSQL → aplicar migraciones
versionadas con rol separado → iniciar API/web → registro SaaS o asistente local.
Seed demo es opcional e identificable, nunca se ejecuta sobre datos de una empresa
real por defecto. Fuentes, scripts y recursos de ejecución son locales. Tras
obtener dependencias/imágenes inicialmente, el flujo local no necesita Internet
ni credenciales externas. Se prueba con acceso externo bloqueado.

Actualización: detener nuevas confirmaciones y drenar las activas → respaldo
verificado → migraciones bajo bloqueo único → iniciar misma versión web/API →
comprobar versión de esquema y flujo de humo. Desajuste de esquema impide arrancar
para escribir. Se prueban instalación vacía y actualización desde la versión
anterior con operaciones existentes. No usar sincronización destructiva del ORM
ni `push` automático del esquema al arrancar.

Respaldo de la instalación: `pg_dump` en formato custom con metadatos de versión
PostgreSQL, migraciones, modalidad, checksum e identificador de instalación; guardar
configuración necesaria fuera del directorio de datos. No registrar contraseñas en
el informe. Las filas staging están en DB; los temporales de upload no son datos
de negocio y un upload no terminado se vuelve a cargar. Conservar hashes de acceso
y resultados confirmados en respaldo, no únicamente balances.

Restaurar **primero en base separada**, nunca reemplazar la válida al intentar:
comprobar checksum/formato/versión/esquema → `pg_restore` con fallo transaccional →
recrear roles/políticas controlados → verificar empresas, relaciones, saldos,
reservas, tránsito, historial y resultados → ejecutar acceso/flujo de humo → cambiar
conexión durante parada controlada. Si cualquier paso falla, no cambiar instalación
activa. El ensayo de restauración es obligatorio; un dump creado no prueba recuperación.
No diseñar una migración mayor PostgreSQL ni un despliegue Railway en esta entrega.

## 6. Decisiones técnicas

_(Constitución 1–12; requisitos citados en la última columna)_

| # | Decisión | Por qué | Alternativa descartada | Trazabilidad |
|---|---|---|---|---|
| D1 | [Reemplazada por D23 · 2026-10-29] Next.js + NestJS + PostgreSQL, dos apps y paquetes compartidos; gestión de workspaces actualizada en D23 | Stack aprobado y núcleo único fácil de ejecutar localmente | Todo el backend en Next contradice la elección de Nest; microservicios añaden coordinación sin requisito | P-ACC–P-OPS; C1–3 |
| D2 | Node 24 LTS fijado para imágenes y verificación | Runtime común con los paquetes elegidos; no cambiar Node global del usuario | Usar el Node global 26 sin fijar haría depender los resultados del equipo | C1, RNF-9 |
| D3 | TypeScript 6.0.3 con Nest 12 y Next 16 | Compatible con herramientas consultadas; typescript-eslint aún declara <6.1 | TypeScript 7 disponible pero fuera del rango del parser consultado | C1, C11 |
| D4 | Drizzle + pg, migraciones SQL revisadas | Tipado con control explícito de locks, restricciones y RLS | Prisma también viable; aquí añadiría otra traducción para operaciones SQL críticas | RF-39–40, RF-103, RNF-9 |
| D5 | Esquema multiempresa compartido, claves compuestas y RLS | Aislamiento comprobable con una instalación demo y mismo núcleo local | Base por empresa eleva provisión/restauración; solo filtros de aplicación deja una barrera menos | RF-5, C5 |
| D6 | Sesiones opacas y permisos leídos al confirmar | Revocación y cambios inmediatos sin infraestructura externa | JWT con roles en token permite permisos antiguos hasta renovar | RF-1–9, RF-149, RNF-2 |
| D7 | REST de mismo origen, SSE solo para invalidación | Contratos auditables y actualización sin duplicar lógica de comandos | GraphQL/WebSocket para comandos aumenta superficie sin requisito | RF-99–105, RNF-14 |
| D8 | READ COMMITTED + locks ordenados y restricciones | Define conflictos de stock/pedido/editor sin serializar toda la empresa | Lectura y escritura sin lock pierde carreras; serializable general exige más abortos y no sustituye protocolo | RF-103, RF-121, RF-169–170, RF-188, RF-195–197 |
| D9 | Libro de deltas + saldos en la misma transacción | Consultas rápidas e historial reconciliable | Solo eventos obliga reconstruir para cada consulta; solo saldos pierde trazabilidad | RF-37–40, RF-71–72, C6–7 |
| D10 | Registro de comandos con hash y resultado persistido | Reintento distinguible de acción nueva, también después de reiniciar | Deshabilitar botón o comparar cantidades no protege de respuesta perdida/concurrencia | RF-87, RF-100–112 |
| D11 | Cantidades exactas en cadenas/BigInt; numeric sin redondeo de escala | Cumplir enteros/tres decimales sin pérdida | JavaScript Number y numeric(p,3) pueden redondear antes de validar | RF-107–108, RF-123–125 |
| D12 | Editor de planta con propiedades exactas y preview 3D procedural | Configurable sin subir planos ni depender de un servicio/modelo externo | Solo modelos prediseñados incumple editor; Spline alojado introduce dependencia externa | RF-12–25, RF-106, RF-126 |
| D13 | React Three Fiber + Three, instancias y carga diferida | Integración React y geometría repetida del perfil aprobado | Una malla/componente/etiqueta por ubicación eleva coste; motor de juego añade complejidad | RNF-11, RNF-15 |
| D14 | TanStack Query y borrador de editor aislado | Caché por ámbito, invalidación y preservación de edición | Un estado global que sobrescribe borrador con cada refresh pierde cambios | RF-32, RF-117, RNF-14 |
| D15 | Radix Primitives + Tailwind/tokens propios + Phosphor | Foco accesible y apariencia propia compartida | Controles complejos hechos con divs dejan teclado/foco incompletos; mezclar varios sistemas genera incoherencia | RNF-1, RNF-4–7, RNF-12 |
| D16 | csv-parse y ExcelJS en trabajador local; staging en PostgreSQL | CSV/XLSX reales, preview persistida y control de precisión/celdas | Parseo solo navegador no protege API; servicio de archivos cloud rompe ejecución autónoma | RF-80–90, RF-122, RNF-16 |
| D17 | Outbox PostgreSQL y dispatcher sin Redis | Aviso ligado al commit y recuperación local simple | Solo evento en memoria puede perder invalidación; Redis añade servicio no necesario ahora | RF-32, RNF-14, C3 |
| D18 | Docker Compose, mismas imágenes y suite en ambos modos | Instalación, datos persistentes y verificación reproducible | Dos ramas/códigos SaaS/local permiten divergencia de reglas | RF-104, RF-106, RNF-3, RNF-8–9 |
| D19 | Vitest para dominio; API compilada y Supertest con PostgreSQL real | Tests rápidos de reglas más evidencia real de locks/RLS | SQLite/mocks de repositorio no demuestran concurrencia ni políticas PostgreSQL | C5–6, C11 |
| D20 | Playwright para flujos/QA visual y medición separada | Evidencia de estados, teclado, desktop/móvil y límites temporales | Capturas por sí solas no comprueban stock ni latencia | RNF-4–7, RNF-11–18, CF-12 |
| D21 | Awwwards como referencia analizada por módulo, sin copiar plantilla | Cumple petición y conserva UI adecuada al trabajo | Generador que solo intercambia colores repite patrones rechazados | C9, RNF-12 |
| D22 | Demo sintética y simulación comercial sin pasarela | Exhibición local sin pagos ni datos de terceros | Integrar Stripe o publicar ahora excede aprobación | RF-91–98, RNF-10, C3–4, C10 |
| D23 | [Actualizado 2026-10-29 · C1, RNF-9] pnpm 12.16.1, workspace:* y pnpm-lock.yaml | Cambio pedido expresamente; dependencias por paquete y ejecución reproducible sin cambiar Node | Mantener npm perpetúa una herramienta que el usuario ha sustituido; no se mantienen dos lockfiles | C1, RNF-9, §1.1/6.1/7.2 |

### 6.1 Versiones base y fuentes verificadas

Consulta de documentación oficial y metadatos del registro npm el 29/10/2026.
Propuesta de versiones exactas iniciales, no afirmación de instalación compatible
ya ejecutada. La primera tarea técnica fijará lockfile y verificará build/peers;
si una corrección exige cambiar una decisión del plan, se registrará antes de
continuar. Dependencias auxiliares se fijan también en lockfile; nada de `latest`
en instalaciones reproducibles.

| Componente | Base seleccionada |
|---|---|
| Node / pnpm | 24.22.1 / 12.16.1 [Actualizado 2026-10-29 · C1, RNF-9] |
| Next / React / React DOM | 16.4.3 / 19.3.1 / 19.3.1 |
| Nest common/core/platform-express/testing | 12.3.2, misma versión entre esos paquetes |
| TypeScript / ESLint / typescript-eslint | 6.0.3 / 10.13.0 / 8.72.1 |
| PostgreSQL | 18.6, imagen fijada y digest registrado al preparar entorno |
| Drizzle ORM / Kit / pg | 0.45.4 / 0.31.11 / 8.23.1 |
| Zod / TanStack Query | 4.6.7 / 5.105.0 |
| Three / React Three Fiber / Drei | 0.186.1 / 9.8.2 / 10.7.9 |
| Tailwind / Radix Dialog | 4.3.3 / 1.3.1; restantes primitives con versiones verificadas en instalación |
| React Hook Form / resolvers | 7.91.0 / 6.0.2 |
| TanStack Table / Virtual | 9.3.1 / 3.14.24 |
| ExcelJS / csv-parse / decimal.js | 4.4.0 / 7.0.3 / 10.6.0 |
| Argon2 / Phosphor | 0.45.1 / 2.1.10 |
| Vitest / Supertest | 5.0.5 / 7.3.1 |

Fuentes: [instalación Next](https://nextjs.org/docs/app/getting-started/installation),
[migración/requisitos Nest 12](https://docs.nestjs.com/migration-guide),
[releases Node](https://github.com/nodejs/node/blob/main/CHANGELOG.md),
[versiones PostgreSQL](https://www.postgresql.org/support/versioning/),
[locks PostgreSQL](https://www.postgresql.org/docs/18/explicit-locking.html),
[RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html),
[transacciones Drizzle](https://orm.drizzle.team/docs/transactions),
[rendimiento R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance),
[pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html).
Versiones/peers obtenidos de las entradas oficiales `registry.npmjs.org` de cada
paquete, especialmente [Next](https://registry.npmjs.org/next/16.4.3),
[Nest](https://registry.npmjs.org/@nestjs/core/12.3.2),
[parser TS](https://registry.npmjs.org/@typescript-eslint/parser/8.72.1) y
[R3F](https://registry.npmjs.org/@react-three/fiber/9.8.2).

Nest 12 admite Node de la línea elegida; su scaffolding exige ≥24.15 en esa línea.
R3F consultado admite React ≥19 y <19.4. Se selecciona TS6 aunque exista TS7,
por el rango explícito del parser. ESM coherente en API/paquetes; compilador
TypeScript para decoradores Nest. Tests de integración importan API compilada,
evitando depender de inferencia de metadatos de decoradores de esbuild.

## 7. Estrategia de tests

_(Todos los RF/RNF y CF; constitución 1–12)_

### 7.1 Capas y familias de pruebas

Todos estos IDs designan pruebas **previstas**, ninguna se declara ejecutada en
esta fase. La trazabilidad desglosa el comportamiento de cada requisito y caso.

| ID de familia | Qué comprueba | Aislamiento/evidencia |
|---|---|---|
| U-VAL | Cantidades, unidades, nombres/códigos, normalización, fechas | Vitest puro, casos de precisión/fronteras/Unicode, reloj inyectado. |
| U-GEO | Jerarquía, contención, intersecciones, bordes y cambio de contenedor | Cajas exactas, propiedades y fixtures de distribución; sin WebGL/DB. |
| U-BAL | Fórmulas de salida/tránsito, sumas por producto y alertas | Invariantes con secuencias y ejemplos 100→40+60, traslado 20 de 100. |
| I-ACC | Credenciales por empresa, roles, desactivación, último admin | API real y PostgreSQL real, mismo correo dos empresas, sesiones revocadas. |
| I-ISO | Aislamiento de cada endpoint, RLS y claves compuestas | Dos empresas, IDs/filtros/manipulaciones cruzadas, pool reutilizado sin contexto. |
| I-SET | Registro/asistente atómicos y carreras de configuración | Fallos inyectados entre empresa/admin, dos conexiones y reinicio. |
| I-GEO | Guardar/reabrir, versiones, ocupación y bloqueo frente a editor | Transacciones simultáneas, descendientes ocupados y trabajo abierto. |
| I-CAT | CRUD de catálogo e identidad, validaciones y eliminación | Datos reales de prueba, duplicados, stock/reservas/trabajo pendientes. |
| I-INV | Recepción/movimiento/saldos/historial, rollback y carreras | Dos conexiones compiten por stock; reconciliar libro contra balances. |
| I-OUT | Reservas, parciales, picking, asignación, despacho y cancelación | Pruebas de ambas intercalaciones, concurrencia por saldo de pedido/ubicación. |
| I-TRA | Salida única, tránsito, recepción parcial/total, conservación | Reintentos/carreras, bloqueo y empresas, rollback entre efectos. |
| I-CNT | Conteos y ajustes, referencia por SKU/ubicación y reservas | Cero, otro SKU, A→B→A, reserva posterior y ajustes bloqueados. |
| I-BLK | Política completa de inmovilización y desbloqueo | Parametrizar todas las operaciones; antiguo formulario/reserva/reintento. |
| I-AUD | Autor/fecha/referencia, inmutabilidad y filtros | Reloj controlado, zonas de empresa, permisos de DB y rutas sin borrado. |
| I-REP | Indicadores y ciclo de alerta configurable | Abajo/igual/encima del umbral; sin umbral; no mezclar unidades. |
| I-EXC | CSV/XLSX, preview, errores, actualización y atomicidad | Fixtures reales, 20 MB/20.000 filas y exceso, fórmulas, fallo a mitad y carrera tras preview. |
| I-CMD | Misma referencia/datos distintos/acción nueva/respuesta perdida | Reinicio tras commit, repetición simultánea, operación confirmada antes de bloqueo. |
| I-SYNC | Outbox/SSE/invalidación y reconexión sin efectos | Dos sesiones y reinicio dispatcher; sin caché entre empresas. |
| E-FLOW | Flujo local completo y alternativas de lista | Navegador real con tres roles, cuentas sintéticas, capturas y referencias. |
| E-UI | Responsive, teclado, etiquetas, estados, interacción y consola | Playwright CLI, desktop/móvil, fallo WebGL, errores/rechazos y reduced motion. |
| E-COM | Landing, dos modalidades, simulación y credenciales demo | Sin proveedor de pago; anuncio de disponibilidad solo tras validar módulo. |
| O-OPS | Reinicio, Internet bloqueado, migración y restauración | Instalación aislada, comparación antes/después y reporte de restauración inválida. |
| P-LOAD | Perfil y latencia/propagación/importación/3D | Carga reproducible y métricas descritas abajo; no sustituir por mocks. |
| D-REF | Referencias y decisiones MCP por superficie | Comprobar registro módulo→ID→captura→uso; revisión visual del resultado. |
| D-SDD | Cobertura y aprobaciones documentales | RF/RNF/casos/CF con enlaces a evidencia; no sustituye pruebas funcionales. |

Aplicar la misma suite de negocio en modo SaaS y local; solo cambian las pruebas
de alta inicial y presentación de modalidad. No mockear PostgreSQL en las pruebas
que afirman atomicidad, aislamiento o concurrencia. Puertos de reloj, red/disco y
fallos inyectables en bordes para reproducir rechazo, timeout y caída tras commit.
Una base de datos temporal por ejecución; impedir que tests/reset/seed de carga
apunten a la instalación habitual. No ejecutar borrado del volumen del usuario.

### 7.2 Comandos que deberá ofrecer el repositorio

| Comando futuro | Resultado verificable |
|---|---|
| `pnpm install --frozen-lockfile` | Instalar exactamente pnpm-lock.yaml, Node fijado. [Actualizado 2026-10-29 · C1, RNF-9] |
| `pnpm run dev` | Web + API de desarrollo; PostgreSQL local documentado. |
| `pnpm run lint` / `pnpm run typecheck` / `pnpm run build` | Estilo, tipos y builds web/API/paquetes. Lint independiente de Next build. |
| `pnpm run test:unit` | Familias U-* con Vitest. |
| `pnpm run test:integration` | Compilar API y ejecutar I-* con PostgreSQL de prueba y Supertest. |
| `pnpm run test:flows` | Flujos de navegador reproducibles mediante Playwright y evidencias; nunca meras capturas de HTML estático. |
| `pnpm run test:modes` | Suite de negocio en SaaS y local. |
| `pnpm run test:recovery` | Migración de versión previa, reinicio, dump/restore y corrupción rechazada en instalación aislada. |
| `pnpm run test:load` | Generar/usar perfil aislado y medir objetivos, con JSON e informe legible. |
| `pnpm run db:migrate` / `pnpm run db:seed:demo` | Migraciones versionadas; seed explícito solo demo. |

La QA visual interactiva usa la skill Playwright CLI mediante pnpm exec o pnpm dlx,
con snapshots antes de seleccionar controles; capturas y consola en
`output/playwright/`. No hay UI que abrir todavía. Al implementar: una pasada
conjunta escritorio/móvil, corrección en lote y confirmación; repetir solo ante
fallos funcionales nuevos. Detector Impeccable después de editar UI, no sobre
este plan. Verificar en hardware móvil si está disponible; emulación se informa
como emulación y no acredita teclado/safe areas reales por sí sola.

### 7.3 Entorno y protocolo de medición — P-PERF

Referencia propuesta: el MacBook Pro disponible, Apple M5 de 10 núcleos, 16 GB
RAM y GPU M5 de 10 núcleos; Docker Engine 29.3.1 comprobado. El host tiene Node
26.10.0, pero las mediciones usarán imágenes Node 24.22.1. Registrar macOS,
versión/digest real de imágenes, recursos asignados a Docker, navegador/GPU,
lockfile, hash de migraciones y configuración junto a cada medición. Web/API en
build de producción local, PostgreSQL 18.6, generador de carga independiente;
sin llamadas externas ni modo desarrollo/HMR en medición.

Antes de ejecutar se fijan y registran recursos efectivos del Docker local;
si no son los de la referencia, se informa la diferencia y no se presenta el
resultado como equivalente. No se deduce capacidad del equipo solo por el modelo.

Datos sintéticos deterministas, seed y checksum registrados: empresa A con
10 almacenes, 50.000 SKU, 20.000 ubicaciones **en cada almacén** y 100.000
movimientos históricos **por empresa**. Ubicaciones vacías, ocupadas, bloqueadas,
con varios SKU, reservas/preparación y traslados en tránsito. Empresa B separada
para acceso cruzado. Movimientos históricos y saldos deben reconciliar, no insertar
un historial decorativo. Al menos un archivo válido de 20.000 filas y un fixture
de exactamente 20.000.000 bytes; medir ambos límites y su combinación válida.

Carga propuesta: 50 sesiones autenticadas distintas de empresa A, sostenidas
durante 10 minutos después de un calentamiento identificado de 2 minutos. Una
mezcla reproducible de lecturas de catálogo, inventario, ubicaciones, pedidos e
historial, y confirmaciones de recepción, movimiento, reserva, picking, despacho
y ajuste. Pesos iguales entre esas once clases para evitar esconder una clase
lenta; cada usuario espera respuesta antes de continuar, sin pausa humana. Datos
de operaciones válidas preconstruidos para no convertir la carga en una prueba
de rechazos rápidos. Conflictos intencionales se miden aparte, incluyendo todos
sus errores. Son parámetros de ensayo, no requisitos ni capacidad comercial.

Medición cliente HTTP desde envío hasta cuerpo completo, incluyendo espera de
locks; registrar por clase p50/p95, tasa y errores, sin eliminar timeouts o
rechazos para mejorar p95. La aceptación de RNF-13 exige p95 ≤2 s para **cada
clase habitual**; fallos inesperados impiden declarar el flujo cumplido aunque
la latencia pase. Incluir petición de página por defecto y búsquedas/filtros
representativos y sin coincidencias; registrar cursores y tamaño de página.

RNF-14: medir desde commit confirmado hasta que otra sesión conectada **muestra**
el nuevo valor, no solo hasta recibir SSE; objetivo ≤5 s. RNF-15: navegador desde
solicitar apertura de almacén completo hasta primer frame navegable con búsqueda,
selección y controles listos; incluir descarga/parseo/renderizado inicial, con
caché fría, objetivo ≤5 s. Listado alternativo no cuenta como aprobar carga 3D.
Repetir con 50 sesiones activas de la carga; registrar muestras, navegador,
viewport y renderer. No declarar hardware móvil equivalente a GPU de escritorio.

RNF-16: sumar procesamiento de recepción del archivo, interpretación, validación
y aplicación hasta resultado final; excluir solo pausas humanas de revisión,
no espera del trabajador ni DB. Objetivo ≤60 s para archivos válidos dentro de
ambos límites. Medir con la carga activa e informar cada etapa y tiempo acumulado.
Se guardan datos brutos en `output/performance/` y un informe que separa objetivo,
valor obtenido y veredicto. Un objetivo fallido vuelve a implementación/medición;
no se rebaja sin cambio de requisitos aprobado.

## 8. Trazabilidad

_(RF-1–207, RNF-1–18, CF-1–37)_

[trazabilidad-plan.md](trazabilidad-plan.md) contiene una fila individual por los
225 requisitos, con parte del plan y escenario de prueba previsto; además cada
caso límite literal de la spec y los 37 criterios de finalización. Es parte de
este plan y se actualizará con nombres concretos/resultados durante implementación
y validación. Un escenario previsto nunca equivale a una prueba aprobada.

## 9. Cumplimiento de la constitución

| Principio | Dónde se cumple | Verificación prevista |
|---|---|---|
| C1 Stack | §1, §6.1: Next/TS, Nest/Node/TS, PostgreSQL | Manifiestos/lockfile/imágenes fijados; lint, typecheck, build y registro de versiones. |
| C2 Núcleo compartido | §1.1, §5.1, D18 | I-* y E-FLOW en ambos modos con resultados equivalentes. |
| C3 Ejecución local | §3.7, §5.1, D16–18 | O-OPS: flujo sin red externa ni credenciales de servicios. |
| C4 Publicación | Estado del plan y §5.1 | Revisión de tareas/comandos sin deploy; Railway/LinkedIn solo tras indicación posterior. |
| C5 Aislamiento | §2.1/2.5, §4.1, D5 | I-ISO sobre todas las rutas, archivos, búsquedas, streams y conexiones reutilizadas. |
| C6 Consistencia | §2.3, §3.1–3.5, D8/D11 | I-INV/OUT/TRA/CNT/BLK con carreras y cantidades exactas. |
| C7 Trazabilidad | §2.1, §3.1/3.5 | I-AUD y reconciliación de asientos/saldos; actor, fecha y referencia por mutación. |
| C8 Recuperación | §5.1 y comandos §7.2 | O-OPS: actualizar base previa y restaurar dump en destino separado con comparación. |
| C9 Diseño con MCP | §4.3 y referencias-ui.md | D-REF por landing y cada módulo, más QA visual real. |
| C10 Datos sintéticos | §2.4, §7.3 | Manifiesto seed ficticio, cuentas tres roles y E-COM sin pagos reales. |
| C11 SDD | §7–8 y anexo | Matriz RF/RNF/casos/CF con evidencia real; validator-sdd al cerrar implementación. |
| C12 Enmiendas | Constitución conservada | Hash intacto frente a base aprobada; cambios futuros solo por aprobación explícita. |

## 10. Puntos a decidir y riesgos

No hay decisiones de producto de DA-1 a DA-7 pendientes ni conflicto conocido
con la constitución. Las decisiones técnicas propuestas se aprueban con el plan.
No se pide al usuario seleccionar detalles internos rutinarios.

| Riesgo real | Tratamiento y condición de cierre |
|---|---|
| Perfil de 20.000 ubicaciones por almacén y 50 sesiones aún no medido | Diseño con instancias/índices y protocolo §7.3; declarar capacidad solo con resultados. |
| Locks incorrectos entre editor, permisos y operaciones | Implementar un protocolo compartido y probar intercalaciones de §3.2 antes de UI de confirmación. |
| Paquetes recientes y compatibilidad de decoradores/peers | Primera verificación instala versiones fijadas y compila API/web/test. No se ha ejecutado aún. |
| Importaciones compiten con trabajo operativo y pueden invalidar preview | Trabajador separado, revalidación al confirmar y transacción íntegra; medir simultáneamente con carga. |
| RLS mal aplicado al reutilizar conexiones o ejecutar workers | Contexto local de transacción, rol sin bypass y pruebas cruzadas; migraciones separadas. |
| Apariencia de marketing tomada por funcionalidad disponible | Landing final vinculada al estado validado de módulos; sin testimonios, clientes ni métricas inventadas. |
| Dispositivo móvil físico no disponible durante QA | Capturas de emulación y límites declarados; obtener prueba de hardware antes de afirmar comportamiento de teclado/safe areas real. |

Precios, condiciones de licencia/mantenimiento y despliegue Railway siguen fuera
del alcance aprobado. No bloquean la simulación local ni justifican incorporar
pagos, facturación, IA, ERP, hardware o trabajo offline en esta entrega.


## Historial de cambios

### 2026-10-29 — Enmienda técnica: pnpm y repositorio GitHub

Solicitud expresa: «añade como regla usar pnpm en lugar de npm» y publicar el estado actual en GitHub con documentación profesional. C1 se enmienda únicamente en gestión de dependencias. D23 reemplaza ese aspecto de D1; se actualizan §1.1, §6.1 y §7.2. No cambian requisitos funcionales, modelo de datos ni orden de implementación.

Impacto implementado: manifiestos y dependencias workspace, lockfile, helpers de ejecución y comandos. Las evidencias originales de T001–T010 se conservan como historia; se añade una revalidación con pnpm. La conversión no migra datos PostgreSQL ni desmarca tareas. Publicar el código por petición explícita no autoriza desplegar la aplicación. El detalle y diff están en docs/cambios/001-pnpm-github.md.
