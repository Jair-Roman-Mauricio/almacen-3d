# Entrevista de requisitos — WMS Almacén 3D

Estado: alcance, base de la especificación y enmiendas 01 a 08 aprobados por el
usuario. DA-1 a DA-7 cerradas mediante propuestas aceptadas explícitamente;
continúa la elaboración del plan técnico.

## Base aprobada

La constitución está en `docs/constitution.md`: Next.js con TypeScript,
NestJS sobre Node.js con TypeScript y PostgreSQL; núcleo compartido para SaaS
y ejecución local, con aislamiento de empresas y trazabilidad de inventario.

## Respuestas confirmadas

### 1. Responsabilidad del producto

El usuario eligió un **WMS propio**. Gestionará el inventario y las operaciones
directamente, además de representarlos en 3D.

### 2. Público objetivo

El público es **cualquier empresa que cuente con almacenes de tamaño medio a
grande**, sin limitar el producto a un sector.

Las menciones a robótica, almacenamiento de partes, fabricación y venta en línea
son ejemplos del público posible. No constituyen una elección de sector ni
confirman funciones de fabricación, ensamblaje o integración con tiendas.

El usuario aceptó posteriormente el perfil concreto de volumen, rendimiento
y pantallas registrado en «Perfil de validación aprobado».

### 3. Conectividad de la primera versión

El usuario eligió que la primera versión **requiera conexión con el servidor**
para registrar y confirmar operaciones. En la modalidad local, la conexión
puede ser a través de la red de la empresa, sin acceso a internet.

El trabajo sin conexión y la sincronización posterior no forman parte de esta
primera versión. Una ampliación futura requerirá su propia definición de alcance.

### 4. Configuración física del almacén

El usuario eligió un **editor visual configurable** que permita crear zonas,
pasillos, racks, niveles y ubicaciones con sus dimensiones, y visualizar el
resultado en 3D. La primera versión no se limita a modelos predefinidos.

## Decisiones previas del usuario que se conservarán en la spec

- Modalidad SaaS con pago mensual e infraestructura mantenida por el proveedor.
- Modalidad de instalación en infraestructura del cliente con servicios pagados.
- Landing e interfaz operativa, ambas con Awwwards Inspiration MCP.
- Desarrollo local y futura demostración del proyecto en LinkedIn.
- Despliegue en Railway cuando el usuario lo indique.

## Cierre de la entrevista inicial

La pregunta sobre ensamblaje no fue respondida: el usuario precisó que el
público es general. El ensamblaje no se incorpora como requisito.

La conectividad y el editor visual están acordados para la primera versión.
El usuario confirmó el alcance funcional con «esta bien ese alcance».

El alcance confirmado incluye empresas y almacenes; usuarios y roles;
catálogo y existencias; editor visual con vista 3D; recepción, movimientos,
reservas, preparación y despacho; conteos y ajustes con historial; indicadores
y alertas de stock bajo; importación y exportación CSV/Excel; y landing con las
dos modalidades y planes demostrativos sin cobros reales.

## Decisiones todavía pendientes

Los cobros de esta primera versión serán simulados, como parte del alcance
confirmado. Los términos comerciales definitivos de licencia y mantenimiento
local siguen fuera de esa confirmación.

La escala, los objetivos de validación y las reglas de datos ya están acordados.
El alta inicial, el acceso por empresa y el trabajo de salida también están
acordados. Los traslados entre almacenes y las reglas físicas del editor también
están aceptados, incluida la política de ubicaciones bloqueadas. Las decisiones
DA-1 a DA-7 de la revisión inicial están cerradas. Las oportunidades de la investigación no se consideran
funcionalidades aprobadas por defecto.

## Correcciones autorizadas tras la revisión

El usuario aprobó la base de la especificación y pidió corregir lo que podía
resolverse con el contexto existente. La enmienda 01 corrige los hallazgos 13 a
19 del informe: conteos, reintentos, alta de usuarios adicionales, rechazo
completo de movimientos, guardados concurrentes, despachos repetidos y
cantidades inválidas. No se cambió la constitución.

## Perfil de validación aprobado

El 29 de octubre de 2026 el usuario aceptó estos objetivos para comprobar la
primera versión, diferenciándolos de capacidades ya demostradas y de límites
comerciales:

- 10 almacenes, 50.000 SKU y 50 usuarios concurrentes por empresa.
- 20.000 ubicaciones por almacén y 100.000 movimientos de historial por empresa.
- Importaciones de hasta 20 MB y 20.000 filas de datos.
- Consultas y confirmaciones habituales: máximo 2 segundos en el 95 % de
  solicitudes; actualización entre usuarios: máximo 5 segundos.
- Carga inicial 3D: máximo 5 segundos; importación: máximo 60 segundos.
- Editor en escritorio desde 1280 × 720; consulta y operaciones en móvil desde
  360 × 800.
- Entorno de referencia para las mediciones documentado en el plan posterior.

## Reglas de datos aprobadas

El usuario aceptó las reglas propuestas para DA-2:

- Piezas, cajas y pallets enteros; peso, volumen y longitud hasta tres decimales
  sin redondeos silenciosos.
- Una unidad base por producto, sin conversiones automáticas de presentaciones.
- Dimensiones del editor en metros.
- Nombres y códigos obligatorios, hasta 160 y 64 caracteres respectivamente.
  Los códigos admiten letras, números y los símbolos `-`, `_`, `.` y `/`.
- Zona horaria configurable por empresa, inicialmente America/Lima; filtros
  de fechas que incluyen ambos días extremos.
- CSV y XLSX con previsualización y validación antes de aplicar.
- La importación actualiza el nombre de un producto existente conservando SKU,
  unidad y existencias; las cantidades iniciales mantienen su flujo separado.

## Alta y acceso inicial aprobados

El usuario aceptó el funcionamiento propuesto para DA-3:

- SaaS: formulario de registro de empresa y primer administrador, sin cobro real
  durante la demostración.
- Instalación local: asistente inicial de empresa y primer administrador.
- El administrador crea los usuarios del equipo y asigna sus roles.
- Inicio de sesión mediante código de empresa, correo y contraseña.
- Empresas y cuentas ficticias precargadas para probar los tres roles, sin
  depender del envío de correos.

## Trabajo de salida aprobado

El usuario aceptó las reglas propuestas para DA-4:

- Reservas, preparación y despachos parciales con conservación del saldo
  pendiente del pedido.
- Administrador o supervisor asigna cada pedido de preparación a un operario.
- Los operarios registran avances únicamente en sus pedidos asignados;
  administrador y supervisor mantienen sus permisos.
- Reasignar conserva los avances registrados.
- Ejemplo aceptado: despachar 40 unidades de un pedido de 100 conserva 60
  pendientes sin duplicar reservas ni descontar dos veces el inventario.

## Traslados entre almacenes aprobados

El usuario aceptó el flujo propuesto para DA-5, dentro de la misma empresa:

- Salida: descontar la mercancía del almacén de origen.
- En tránsito: mostrarla separada, sin disponibilidad para nuevos pedidos.
- Recepción: incorporarla al destino al confirmar la llegada.
- Conservar el historial del traslado y no utilizar mercancía reservada para
  otros pedidos.

## Reglas físicas del editor aprobadas

El usuario aceptó las reglas propuestas para DA-6:

- Cada elemento queda dentro de los límites de su espacio contenedor.
- Las zonas no se superponen entre sí y contienen racks y pasillos.
- Se rechazan solapamientos entre racks, entre ubicaciones del mismo nivel
  y entre racks y pasillos.
- Se bloquea mover, redimensionar o eliminar elementos con existencias o
  trabajo pendiente; primero se vacían y se cierran sus operaciones.
- Los cambios válidos conservan los identificadores y cantidades registrados.

## Política de ubicaciones bloqueadas aprobada

El usuario aceptó la propuesta de DA-7:

- Bloquear entradas, nuevas reservas, movimientos físicos, preparación y
  despachos, incluidos los de reservas anteriores.
- Conservar las reservas y trabajo pendiente, sin cancelación automática.
- Permitir consultas, conteos y ajustes autorizados con motivo y protección
  de las reservas.
- Desbloqueo exclusivo del administrador, con motivo e historial.

Las siete decisiones iniciales están cerradas y se continúa con el plan técnico.
