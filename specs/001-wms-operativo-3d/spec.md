# Spec 001 — WMS operativo con editor visual y almacén 3D

Estado: base, enmienda 01 y decisiones DA-1 a DA-7 aprobadas por el usuario;
sin decisiones abiertas de la revisión inicial; lista para el plan técnico.

## Contexto y objetivo

Las empresas con almacenes medianos o grandes necesitan conocer qué mercancía
tienen, dónde se encuentra y qué movimientos pueden realizar sin perder
trazabilidad. Esta primera entrega será un WMS propio, de público general,
que gestionará las operaciones de inventario y representará la distribución
configurable del almacén en 3D. Se demostrará localmente con datos sintéticos,
con una landing que presente el servicio alojado de pago mensual y la
instalación en infraestructura del cliente con servicios pagados. Esta entrega
incluye simulaciones comerciales, sin cobros reales ni publicación automática.

### Base confirmada y decisiones del borrador

El usuario confirmó: WMS propio; público general con almacenes medianos o
grandes; múltiples almacenes por empresa; administrador, supervisor y operario;
editor de zonas, pasillos, racks, niveles y ubicaciones con dimensiones;
consulta 3D; catálogo y existencias; recepciones, movimientos internos,
reservas, preparación y despacho; conteos, ajustes e historial; indicadores y
alertas de stock bajo; importación y exportación CSV/Excel; landing y planes
demostrativos; y conexión al servidor obligatoria en esta primera versión.

El usuario aprobó la base de esta especificación y la enmienda 01 que corrige
errores detectados en su revisión. Las correcciones se identifican en
«Historial de cambios». Las decisiones DA-1 a DA-7 de la revisión inicial
fueron resueltas mediante propuestas aceptadas explícitamente por el usuario.
DA-1 está resuelta mediante el perfil de validación aceptado por el usuario.
DA-2 está resuelta mediante las reglas de datos e importación aceptadas.
DA-3 está resuelta mediante el registro SaaS, el asistente local y el acceso por
código de empresa, correo y contraseña aceptados por el usuario.
DA-4 está resuelta mediante operaciones de salida parciales y preparación de
pedidos asignada a operarios, con conservación de avances al reasignar.
DA-5 está resuelta mediante traslados entre almacenes de la misma empresa con
salida, stock en tránsito y recepción confirmada en destino.
DA-6 está resuelta mediante límites de contención, rechazo de solapamientos y
bloqueo de cambios geométricos sobre elementos ocupados o con trabajo pendiente.
DA-7 está resuelta mediante inmovilización de la ubicación bloqueada,
conservación de compromisos y desbloqueo exclusivo del administrador con motivo.

### Definiciones funcionales

- **Empresa:** organización a la que pertenecen usuarios, almacenes y datos
  operativos. Un usuario actúa en el contexto de una empresa.
- **Código de empresa:** código que identifica una empresa al iniciar sesión;
  es único dentro de una instalación del servicio, ignorando mayúsculas y
  espacios exteriores.
- **Identificador de acceso del usuario:** correo de su cuenta dentro de una
  empresa. El mismo correo puede corresponder a cuentas distintas en empresas
  diferentes; la validación del acceso siempre incluye el código de empresa.
- **Almacén:** instalación física perteneciente a una empresa.
- **Distribución del almacén:** representación de zonas, pasillos, racks,
  niveles y ubicaciones con sus dimensiones y posición.
- **Contención física:** cada elemento ocupa un espacio que debe quedar dentro
  de su contenedor declarado. Las zonas pertenecen al almacén; los racks y
  pasillos a una zona; los niveles a un rack; las ubicaciones a un nivel o
  directamente a una zona.
- **Solapamiento físico:** intersección de los espacios interiores de dos
  elementos cuya superposición está prohibida. La contención entre un elemento
  y su contenedor no se considera una colisión; compartir únicamente un borde
  sin invadir el interior no constituye solapamiento.
- **Elemento ocupado o con trabajo pendiente:** elemento que contiene,
  directamente o a través de sus elementos descendientes, existencias físicas
  registradas o ubicaciones referenciadas por operaciones abiertas. Una
  cantidad reservada o preparada que todavía no salió sigue siendo existencia
  física registrada.
- **Ubicación:** espacio identificado en el que se registra mercancía. Puede
  pertenecer a una zona directamente o estar dentro de un rack y nivel.
- **SKU:** código que identifica un producto dentro del catálogo de la empresa.
- **Unidad base:** unidad declarada para las cantidades de un producto. Las
  piezas, cajas y pallets se cuentan en enteros; el peso, volumen y longitud
  admiten hasta tres decimales en su unidad base. No se convierten cantidades
  automáticamente entre cajas y piezas ni entre otras presentaciones.
- **Existencia física registrada:** cantidad que el WMS registra en una
  ubicación; su visualización no equivale a una comprobación por sensores.
- **Cantidad reservada:** parte de la existencia comprometida para un pedido y
  todavía no despachada.
- **Cantidad disponible:** existencia física registrada menos cantidad
  reservada. Una cantidad en una ubicación bloqueada no está disponible para
  nuevas asignaciones.
- **Movimiento interno:** cambio de ubicación dentro de un mismo almacén.
- **Traslado entre almacenes:** operación de la misma empresa con almacenes
  distintos de origen y destino, productos y cantidades identificados. La
  salida reduce el stock del origen; la recepción incorpora al destino las
  cantidades cuya llegada se confirma.
- **Stock en tránsito:** cantidad que salió del almacén de origen mediante un
  traslado y todavía no tiene recepción confirmada en destino. Se muestra
  separada del stock físico registrado en ubicaciones y no se puede reservar
  para nuevos pedidos.
- **Pedido de salida:** solicitud registrada en el WMS con productos y
  cantidades para preparar y despachar.
- **Saldo pendiente del pedido:** cantidad solicitada menos cantidad ya
  despachada, calculada por producto o línea del pedido.
- **Saldo pendiente de reservar:** saldo pendiente del pedido menos la reserva
  vigente de esa línea. Una reserva ya consumida por un despacho no se vuelve
  a contar como reserva vigente.
- **Cantidad reservada pendiente de preparar:** reserva vigente menos cantidad
  preparada todavía pendiente de despacho, para el mismo pedido, producto y
  ubicación de origen.
- **Preparación asignada:** pedido de preparación con un operario activo de
  la misma empresa designado por un administrador o supervisor. El operario
  asignado ejecuta los avances pendientes; administrador y supervisor conservan
  los permisos de preparación de la matriz aprobada.
- **Preparación o picking:** comprobación de la mercancía reservada que se
  entregará en un despacho; no reduce por sí sola la existencia física
  registrada en esta primera propuesta.
- **Cantidad preparada pendiente de despacho:** cantidad preparada para un
  producto, pedido y ubicación de origen que todavía no se ha despachado.
  Un despacho confirmado deja de formar parte de esa cantidad pendiente.
- **Despacho:** confirmación de la salida física registrada de la mercancía
  preparada; consume su reserva.
- **Conteo:** observación de la cantidad de un producto identificado en una
  ubicación. La referencia del conteo corresponde a ese mismo producto y
  ubicación; otros productos de la ubicación se cuentan por separado. Su
  registro no equivale a autorizar un ajuste.
- **Operación confirmada:** acción que el servidor aceptó y que el usuario
  puede consultar posteriormente en el historial.
- **Referencia de operación:** identificador estable de una acción dentro de
  una empresa, conservado cuando se reintenta esa acción. Los datos de la acción
  comprenden su tipo y, según corresponda, productos, cantidades, ubicaciones,
  pedido, traslado o contenido de la importación.
- **Misma operación:** acción que conserva su empresa, referencia y datos de
  negocio en un reintento. Una referencia ya utilizada no identifica otra acción
  con datos distintos. Dos acciones iniciadas separadamente tienen referencias
  distintas aunque sus datos de negocio coincidan.
- **Edición desactualizada:** distribución en edición cuya versión de partida
  dejó de ser la última guardada porque otra edición se guardó después.

## Usuarios / actores

- **Visitante:** conoce el producto, compara las dos modalidades, registra una
  empresa en la modalidad SaaS y accede a la demostración.
- **Administrador de empresa:** gestiona la configuración, los usuarios y las
  operaciones de su empresa.
- **Supervisor:** organiza el trabajo y controla el inventario de su empresa.
- **Operario:** ejecuta el trabajo de almacén autorizado y registra conteos.
- **Responsable de instalación:** completa el asistente inicial de una
  instalación local; esta actividad inicial no constituye un rol adicional
  con acceso global a empresas.

### Permisos de la primera entrega

Esta matriz pertenece a la base aprobada. Cada capacidad queda limitada a la
empresa de la sesión. No se incorpora un rol adicional de administración
global de la plataforma.

| Capacidad | Administrador | Supervisor | Operario |
|---|---|---|---|
| Consultar inventario, mapa y tareas | Sí | Sí | Sí |
| Gestionar perfil de la empresa, almacenes y distribución | Sí | No | No |
| Bloquear o desbloquear ubicaciones | Sí | No | No |
| Gestionar usuarios y sus roles | Sí | No | No |
| Gestionar catálogo y umbrales de stock bajo | Sí | Sí | No |
| Crear pedidos y realizar reservas | Sí | Sí | No |
| Confirmar recepciones y movimientos internos | Sí | Sí | Sí |
| Consultar traslados de la empresa | Sí | Sí | Sí |
| Crear traslados y confirmar su salida | Sí | Sí | No |
| Confirmar recepción de un traslado en destino | Sí | Sí | Sí |
| Asignar o reasignar preparación de pedidos | Sí | Sí | No |
| Registrar preparación de pedidos | Sí | Sí | Solo pedidos asignados |
| Confirmar despachos | Sí | Sí | No |
| Registrar conteos | Sí | Sí | Sí |
| Autorizar ajustes de inventario | Sí | Sí | No |
| Consultar indicadores y exportar reportes | Sí | Sí | No |
| Importar catálogo o existencias iniciales | Sí | No | No |

El alta inicial se realiza por el formulario SaaS o el asistente de instalación
local, según la modalidad. Los usuarios adicionales los crea el administrador
de su empresa. El administrador o supervisor asigna la preparación de cada
pedido a un operario activo de la misma empresa.

## Historias de usuario

- H1: Como administrador quiero mantener separados los datos de mi empresa
  para que otras organizaciones no puedan consultarlos ni modificarlos.
- H2: Como administrador quiero configurar mis almacenes visualmente para
  representar sus espacios y ubicaciones.
- H3: Como usuario de almacén quiero localizar productos en una vista 3D para
  identificar su posición y sus existencias registradas.
- H4: Como supervisor quiero gestionar el catálogo y la disponibilidad para
  organizar las operaciones sobre cantidades consistentes.
- H5: Como operario quiero registrar recepciones y movimientos para mantener
  las existencias por ubicación.
- H6: Como supervisor quiero reservar y despachar pedidos para controlar las
  salidas comprometidas.
- H7: Como operario quiero registrar conteos para informar diferencias entre
  lo observado y lo registrado.
- H8: Como supervisor quiero autorizar ajustes con motivo para corregir
  diferencias conservando su historial.
- H9: Como supervisor quiero consultar indicadores y alertas para detectar
  stock bajo y revisar actividad operativa.
- H10: Como administrador quiero importar información validada para comenzar
  sin registrar cada producto y existencia manualmente.
- H11: Como supervisor quiero exportar información para analizarla fuera del
  WMS.
- H12: Como visitante quiero conocer las modalidades y probar una demostración
  identificada como tal para evaluar el producto.
- H13: Como usuario quiero conocer el resultado de una operación cuando falla
  la conexión para evitar confirmar o repetir trabajo incorrectamente.
- H14: Como responsable de una instalación quiero recuperar los datos guardados
  para continuar utilizando el WMS después de un reinicio o restauración.
- H15: Como administrador quiero crear usuarios de mi empresa con un rol
  permitido para que el equipo pueda utilizar el WMS con los permisos acordados.
- H16: Como visitante quiero registrar una empresa con su primer administrador
  para comenzar a utilizar la modalidad SaaS de demostración.
- H17: Como responsable de instalación quiero configurar la empresa y su primer
  administrador para iniciar el uso de una instalación local.
- H18: Como supervisor quiero asignar y reasignar la preparación de pedidos
  conservando sus avances para organizar el trabajo del equipo.
- H19: Como supervisor quiero trasladar mercancía entre almacenes de mi empresa
  conservando su trazabilidad y disponibilidad durante el recorrido.

## Requisitos funcionales (criterios de aceptación en EARS)

### Acceso, empresa y permisos — H1

- RF-1: CUANDO una persona presente un código de empresa, correo y contraseña
  que correspondan a un usuario activo de esa empresa, EL SISTEMA iniciará una
  sesión en el contexto de esa empresa.
- RF-2: SI las credenciales no permiten iniciar sesión, ENTONCES EL SISTEMA
  informará del rechazo sin conceder acceso al área operativa.
- RF-3: CUANDO un usuario cierre su sesión, EL SISTEMA impedirá continuar
  utilizando esa sesión para acceder al área operativa.
- RF-4: MIENTRAS una persona no tenga una sesión válida, EL SISTEMA rechazará
  su acceso a datos operativos de empresas.
- RF-5: SI una petición intenta consultar o modificar datos de una empresa
  distinta de la empresa de la sesión, ENTONCES EL SISTEMA rechazará el acceso.
- RF-6: SI el rol de la sesión no permite una acción según la matriz de
  permisos, ENTONCES EL SISTEMA rechazará la acción.
- RF-7: CUANDO un administrador cambie el rol de un usuario de su empresa,
  EL SISTEMA aplicará el nuevo permiso en su siguiente acción protegida.
- RF-8: CUANDO un administrador desactive un usuario de su empresa, EL SISTEMA
  rechazará sus siguientes acciones protegidas.
- RF-9: SI una acción dejaría a la empresa sin ningún administrador activo,
  ENTONCES EL SISTEMA rechazará esa acción.

### Almacenes y editor visual — H2

- RF-10: CUANDO un administrador registre un almacén válido, EL SISTEMA lo
  incorporará a los almacenes de su empresa.
- RF-11: CUANDO un usuario seleccione un almacén de su empresa, EL SISTEMA
  mostrará el inventario y la distribución correspondientes a ese almacén.
- RF-12: CUANDO un administrador agregue una zona, un pasillo, un rack, un
  nivel o una ubicación en el editor, EL SISTEMA incorporará el elemento a la
  distribución en edición.
- RF-13: CUANDO un administrador modifique la posición de un elemento en el
  editor, EL SISTEMA mostrará la posición propuesta antes de guardarla.
- RF-14: CUANDO un administrador modifique las dimensiones de un elemento en
  el editor, EL SISTEMA mostrará las dimensiones propuestas antes de guardarlas.
- RF-15: SI un elemento tiene una dimensión nula, negativa o no numérica,
  ENTONCES EL SISTEMA rechazará el guardado de ese elemento.
- RF-16: SI una ubicación contenida en un rack o nivel queda fuera de sus
  límites físicos declarados, ENTONCES EL SISTEMA rechazará el guardado de esa
  distribución.
- RF-17: SI dos ubicaciones del mismo almacén tienen el mismo código ignorando
  mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará el duplicado.
- RF-18: CUANDO un administrador guarde una distribución válida, EL SISTEMA
  conservará esa distribución al volver a abrir el almacén.
- RF-19: CUANDO un administrador descarte los cambios del editor, EL SISTEMA
  conservará la última distribución guardada.
- RF-20: MIENTRAS existan cambios del editor sin guardar, EL SISTEMA solicitará
  confirmación antes de abandonar esa edición.
- RF-21: SI al confirmar una eliminación el elemento contiene existencias o
  ubicaciones referenciadas por operaciones abiertas, ENTONCES EL SISTEMA
  rechazará su eliminación.
- RF-22: CUANDO se guarde un cambio geométrico permitido, EL SISTEMA conservará
  la identidad de las ubicaciones existentes afectadas.
- RF-23: CUANDO se guarde un cambio geométrico permitido, EL SISTEMA mantendrá
  las cantidades de inventario anteriores a ese cambio.

Las reglas aprobadas de contención y solapamiento se comprueban al guardar.
Mover, redimensionar o eliminar elementos ocupados o con operaciones abiertas
está bloqueado; primero se deben retirar sus existencias y cerrar sus
operaciones, conservando la trazabilidad de esos pasos.

### Consulta 3D e inventario espacial — H3

- RF-24: CUANDO un usuario abra la vista 3D de un almacén, EL SISTEMA representará
  su distribución guardada.
- RF-25: CUANDO un usuario utilice los controles de navegación 3D, EL SISTEMA
  permitirá rotar, acercar, alejar y desplazar la vista.
- RF-26: CUANDO un usuario seleccione una ubicación en 3D, EL SISTEMA mostrará
  sus productos y cantidades física registrada, reservada y disponible.
- RF-27: CUANDO un usuario busque un SKU existente en el almacén seleccionado,
  EL SISTEMA identificará las ubicaciones que registran existencias de ese SKU.
- RF-28: CUANDO un usuario busque un código de ubicación existente en el almacén
  seleccionado, EL SISTEMA destacará esa ubicación.
- RF-29: SI una búsqueda no encuentra coincidencias, ENTONCES EL SISTEMA
  mostrará un estado sin resultados.
- RF-30: EL SISTEMA distinguirá visualmente las ubicaciones vacías, con
  existencias y bloqueadas mediante una leyenda que no dependa solo del color.
- RF-31: CUANDO un administrador bloquee una ubicación, EL SISTEMA la excluirá
  de nuevas recepciones, reservas y destinos de movimientos internos.
- RF-32: CUANDO el servidor confirme una operación realizada por el usuario,
  EL SISTEMA actualizará los datos afectados de su consulta 3D al volver a
  consultarlos.
- RF-33: EL SISTEMA permitirá consultar inventario y ubicaciones mediante una
  lista aunque la representación 3D no esté disponible.

La actualización de otras sesiones sin recarga se verificará conforme a
RNF-14. El bloqueo de una ubicación no cancela reservas que ya existían; el
trabajo físico de esas reservas queda suspendido hasta que el administrador
desbloquee la ubicación conforme a la política aprobada de DA-7.

### Catálogo y cantidades — H4

- RF-34: CUANDO un administrador o supervisor registre un producto válido,
  EL SISTEMA lo incorporará al catálogo de su empresa con SKU, nombre y unidad.
- RF-35: SI un SKU ya existe en la empresa ignorando mayúsculas y espacios
  exteriores, ENTONCES EL SISTEMA rechazará su creación duplicada.
- RF-36: EL SISTEMA conservará la misma identidad de producto cuando cambie su
  nombre.
- RF-37: EL SISTEMA mostrará las cantidades física registrada, reservada y
  disponible por producto y ubicación.
- RF-38: EL SISTEMA mostrará el total de existencias de un producto por almacén.
- RF-39: SI una operación confirmada produciría existencia física registrada
  negativa, ENTONCES EL SISTEMA rechazará la operación.
- RF-40: SI una operación confirmada produciría una cantidad total reservada
  superior a la existencia física registrada, ENTONCES EL SISTEMA rechazará la
  operación.
- RF-41: SI un producto tiene existencias, reservas u operaciones abiertas,
  ENTONCES EL SISTEMA rechazará su eliminación.

Las cantidades se registran en la unidad base del producto conforme a las
reglas de datos aprobadas. La importación de catálogo no cambia esa unidad.

### Recepciones y movimientos internos — H5

- RF-42: CUANDO un usuario autorizado confirme una recepción válida, EL SISTEMA
  incrementará la existencia del producto en su ubicación de destino.
- RF-43: SI una recepción indica una cantidad no positiva, ENTONCES EL SISTEMA
  rechazará su confirmación.
- RF-44: SI una recepción refiere un producto o una ubicación inexistente en
  la empresa y el almacén correspondientes, ENTONCES EL SISTEMA rechazará su
  confirmación.
- RF-45: CUANDO un usuario autorizado confirme un movimiento interno válido,
  EL SISTEMA trasladará la cantidad indicada entre sus ubicaciones de origen
  y destino.
- RF-46: SI un movimiento interno tiene la misma ubicación de origen y
  destino, ENTONCES EL SISTEMA rechazará su confirmación.
- RF-47: SI un movimiento interno intenta trasladar más cantidad que la
  disponible no reservada en el origen, ENTONCES EL SISTEMA rechazará su
  confirmación.
- RF-48: SI una recepción o un movimiento no puede confirmarse por completo,
  ENTONCES EL SISTEMA mantendrá las cantidades previas a esa operación.
- RF-49: CUANDO el usuario consulte una recepción o un movimiento confirmado,
  EL SISTEMA mostrará su referencia y su resultado.

### Pedidos, reservas, preparación y despachos — H6

- RF-50: CUANDO un administrador o supervisor cree un pedido de salida válido,
  EL SISTEMA lo registrará con sus productos y cantidades solicitadas.
- RF-51: SI una línea de pedido indica una cantidad no positiva, ENTONCES
  EL SISTEMA rechazará el guardado del pedido.
- RF-52: CUANDO un administrador o supervisor solicite una reserva válida,
  EL SISTEMA comprometerá la cantidad indicada en sus ubicaciones de origen.
- RF-53: SI una solicitud de reserva supera la cantidad disponible, ENTONCES
  EL SISTEMA rechazará esa solicitud sin incrementar la reserva.
- RF-54: CUANDO se confirme una reserva, EL SISTEMA reducirá la cantidad
  disponible sin reducir la existencia física registrada.
- RF-55: CUANDO un usuario autorizado consulte un pedido reservado, EL SISTEMA
  mostrará los productos y ubicaciones que debe preparar.
- RF-56: CUANDO un usuario autorizado registre una preparación válida,
  EL SISTEMA conservará la cantidad preparada por producto y ubicación de
  origen para el pedido correspondiente.
- RF-57: SI se intenta preparar una cantidad mayor que la reservada pendiente
  de preparar, ENTONCES EL SISTEMA rechazará ese registro.
- RF-58: CUANDO un administrador o supervisor confirme un despacho válido,
  EL SISTEMA descontará la cantidad despachada de la existencia física
  registrada en las ubicaciones reservadas.
- RF-59: CUANDO se confirme un despacho válido, EL SISTEMA consumirá la reserva
  correspondiente a la cantidad despachada.
- RF-60: SI un despacho supera la cantidad preparada pendiente de despacho
  del mismo pedido, producto y ubicación de origen, ENTONCES EL SISTEMA
  rechazará su confirmación.
- RF-61: SI un despacho no puede confirmarse por completo, ENTONCES EL SISTEMA
  mantendrá las cantidades y reservas previas a ese despacho.
- RF-62: CUANDO se cancele un pedido sin cantidades preparadas ni despachadas,
  EL SISTEMA liberará sus reservas.
- RF-63: SI se intenta cancelar un pedido con cantidades preparadas o
  despachadas, ENTONCES EL SISTEMA rechazará esa cancelación.

Se permiten reservas, preparaciones y despachos parciales del pedido. Una
solicitud parcial indica expresamente las cantidades que se desean procesar y
debe confirmarse íntegramente o rechazarse sin aplicar efectos parciales. Esto
no habilita aplicar por su cuenta una cantidad menor que la solicitada cuando
falla una validación. RF-53, RF-57, RF-60 y RF-61 siguen aplicándose.

Las reglas de cancelación de RF-62 y RF-63 se conservan: un pedido con
cantidades preparadas o despachadas no puede cancelarse mediante esa acción.
La confirmación de operaciones parciales no introduce una anulación de
despachos anteriores ni una cancelación separada de saldos.

### Conteos, ajustes e historial — H7, H8

- RF-64: CUANDO un usuario autorizado registre un conteo válido, EL SISTEMA
  conservará el producto, la cantidad observada y la ubicación contada.
- RF-65: CUANDO se registre un conteo, EL SISTEMA mantendrá la existencia física
  registrada hasta que se autorice un ajuste.
- RF-66: CUANDO se consulte un conteo, EL SISTEMA mostrará su diferencia frente
  a la existencia del mismo producto y ubicación que se tomó como referencia.
- RF-67: CUANDO un administrador o supervisor confirme un ajuste válido con
  motivo, EL SISTEMA aplicará la corrección autorizada al inventario.
- RF-68: SI un ajuste no tiene motivo, ENTONCES EL SISTEMA rechazará su
  confirmación.
- RF-69: SI un ajuste dejaría la existencia por debajo de una cantidad
  reservada, ENTONCES EL SISTEMA rechazará su confirmación.
- RF-70: SI las existencias del producto y ubicación contados cambiaron después
  de tomar la referencia del conteo y antes de autorizar su ajuste, ENTONCES
  EL SISTEMA rechazará el ajuste basado en esa referencia desactualizada.
- RF-71: CUANDO se confirme una modificación de inventario, EL SISTEMA
  conservará autor, fecha, referencia, motivo o tipo, producto, cantidad y
  ubicaciones afectadas en su historial.
- RF-72: EL SISTEMA impedirá que los usuarios eliminen operaciones confirmadas
  desde las funciones de gestión de inventario.
- RF-73: CUANDO un usuario autorizado filtre el historial por almacén, producto
  o intervalo de fechas, EL SISTEMA mostrará las operaciones coincidentes de
  su empresa.

### Indicadores y alertas — H9

- RF-74: CUANDO un administrador o supervisor abra los indicadores de un
  almacén, EL SISTEMA mostrará productos con existencias, ubicaciones ocupadas,
  pedidos pendientes y movimientos del intervalo seleccionado.
- RF-75: CUANDO un administrador o supervisor configure un umbral no negativo
  de stock bajo para un producto en un almacén, EL SISTEMA conservará ese umbral.
- RF-76: MIENTRAS la cantidad disponible de un producto esté por debajo de su
  umbral configurado, EL SISTEMA mostrará una alerta de stock bajo para ese
  producto y almacén.
- RF-77: MIENTRAS un producto no tenga umbral de stock bajo configurado,
  EL SISTEMA no generará una alerta de stock bajo para ese producto.
- RF-78: CUANDO la cantidad disponible deje de estar por debajo del umbral,
  EL SISTEMA dejará de presentar esa alerta como activa.
- RF-79: CUANDO un administrador o supervisor abra una alerta de stock bajo,
  EL SISTEMA mostrará el producto, el almacén, la cantidad disponible y el umbral.

### Importación y exportación — H10, H11

- RF-80: CUANDO un administrador cargue un archivo CSV o XLSX admitido,
  EL SISTEMA mostrará una previsualización de los registros interpretados.
- RF-81: CUANDO un administrador solicite validar una importación, EL SISTEMA
  identificará los registros inválidos antes de permitir aplicarla.
- RF-82: SI una importación contiene registros inválidos o duplicados dentro
  del mismo archivo, ENTONCES EL SISTEMA impedirá aplicarla hasta corregir
  esos registros.
- RF-83: SI una importación no corresponde al formato admitido, ENTONCES
  EL SISTEMA rechazará el archivo con una explicación del motivo.
- RF-84: CUANDO un administrador confirme una importación válida de catálogo,
  EL SISTEMA incorporará los productos nuevos a la empresa de su sesión.
- RF-85: CUANDO un administrador confirme una importación válida de existencias
  iniciales en ubicaciones sin existencias previas, EL SISTEMA registrará esas
  cantidades como entradas identificadas en el historial.
- RF-86: SI una importación de existencias iniciales afecta un producto y
  ubicación que ya registran existencias, ENTONCES EL SISTEMA rechazará esa
  importación.
- RF-87: SI una importación confirmada se vuelve a enviar con la misma empresa,
  referencia y datos de negocio, ENTONCES EL SISTEMA no volverá a aplicar sus
  efectos.
- RF-88: SI falla la aplicación de una importación, ENTONCES EL SISTEMA
  mantendrá los datos anteriores a esa importación.
- RF-89: CUANDO un administrador o supervisor solicite exportar inventario o
  historial a CSV o XLSX, EL SISTEMA generará el archivo con los filtros y la
  empresa de la consulta activa.
- RF-90: EL SISTEMA tratará como texto los valores de catálogo que podrían
  interpretarse como fórmulas al abrir una exportación en una hoja de cálculo.

Los límites de archivo y volumen son los del perfil de validación aprobado.
Los formatos admitidos son CSV y XLSX. Una importación de catálogo puede crear
productos o actualizar el nombre de productos existentes, identificados por
su SKU dentro de la empresa, sin cambiar su código, unidad ni existencias.
Las existencias iniciales se incorporan por su flujo separado, conforme a
RF-85 y RF-86.

Una repetición del mismo SKU dentro de un archivo de catálogo es un duplicado;
una fila cuyo SKU ya existe en el catálogo es una actualización, no un
duplicado por ese único motivo. En una importación de existencias iniciales,
la repetición de la misma combinación de producto y ubicación es un duplicado.
Las comparaciones de códigos conservan las reglas de mayúsculas y espacios
exteriores de RF-17 y RF-35.

La importación de pedidos, distribuciones físicas o historial antiguo no está
incluida en esta primera propuesta.

### Landing, modalidades y demostración — H12

- RF-91: CUANDO un visitante abra la landing, EL SISTEMA presentará el WMS,
  la visualización 3D y las operaciones incluidas en esta primera versión.
- RF-92: CUANDO un visitante consulte las modalidades, EL SISTEMA distinguirá
  la suscripción mensual alojada de la instalación en infraestructura del
  cliente con servicios pagados.
- RF-93: CUANDO un visitante consulte un precio o plan de la demostración,
  EL SISTEMA lo identificará como demostrativo.
- RF-94: CUANDO un visitante seleccione un plan demostrativo, EL SISTEMA
  mostrará una confirmación identificada como simulación.
- RF-95: EL SISTEMA impedirá que la selección de un plan demostrativo genere
  un cargo o compromiso de pago real.
- RF-96: CUANDO un visitante solicite acceder a la demostración, EL SISTEMA
  mostrará las instrucciones de acceso al entorno de datos sintéticos.
- RF-97: EL SISTEMA identificará el entorno operativo de demostración como
  una demostración con datos sintéticos.
- RF-98: EL SISTEMA presentará únicamente funciones implementadas como
  disponibles en la landing de esta entrega.

Los importes comerciales, los servicios concretos de instalación y los términos
de mantenimiento no se consideran acordados mediante precios ficticios.

### Conectividad, concurrencia y persistencia — H1, H4, H13, H14

- RF-99: MIENTRAS el dispositivo no tenga conexión con el servidor, EL SISTEMA
  impedirá confirmar operaciones que modifiquen datos.
- RF-100: SI no se recibe confirmación de una operación enviada, ENTONCES
  EL SISTEMA informará que su resultado no está confirmado.
- RF-101: CUANDO se restablezca la conexión después de una respuesta perdida,
  EL SISTEMA permitirá consultar el resultado de la operación antes de
  repetir sus efectos.
- RF-102: SI se reenvía una operación de inventario con la misma empresa,
  referencia y datos de negocio después de una respuesta perdida, ENTONCES
  EL SISTEMA no duplicará sus efectos.
- RF-103: SI dos operaciones concurrentes compiten por una cantidad que no
  permite satisfacer ambas, ENTONCES EL SISTEMA rechazará la operación que
  produciría una existencia negativa o una reserva excesiva.
- RF-104: CUANDO el servidor se reinicie después de confirmar una operación,
  EL SISTEMA conservará el resultado confirmado al volver a consultarlo.
- RF-105: EL SISTEMA impedirá modificar inventario mediante consultas,
  búsquedas o navegación de la vista 3D.
- RF-106: CUANDO un usuario tenga conexión al servidor de la instalación local,
  EL SISTEMA permitirá completar el flujo operativo sin acceso a internet.

### Validación de cantidades y conteos — H4, H5, H6, H7

- RF-107: SI un movimiento interno, una reserva, una preparación o un despacho
  indica una cantidad ausente, no numérica, infinita o menor o igual a cero,
  ENTONCES EL SISTEMA rechazará su confirmación.
- RF-108: SI un conteo indica una cantidad ausente, no numérica, infinita o
  negativa, ENTONCES EL SISTEMA rechazará su registro.
- RF-109: SI un conteo refiere un producto o una ubicación inexistente en la
  empresa y el almacén correspondientes, ENTONCES EL SISTEMA rechazará su
  registro.

### Reintentos y acciones distintas — H10, H13

- RF-110: SI se reintenta una operación ya confirmada conservando su empresa,
  referencia y datos de negocio, ENTONCES EL SISTEMA devolverá el resultado
  registrado de esa confirmación al usuario autorizado.
- RF-111: SI se reutiliza una referencia de operación con datos de negocio
  distintos dentro de la misma empresa, ENTONCES EL SISTEMA rechazará la nueva
  solicitud sin modificar los datos de negocio existentes.
- RF-112: CUANDO un usuario inicie otra acción con una referencia nueva y datos
  de negocio iguales a los de una acción anterior, EL SISTEMA la evaluará como
  una operación distinta sujeta a sus validaciones de negocio.

### Alta de usuarios de una empresa existente — H1, H15

- RF-113: CUANDO un administrador registre un usuario válido con nombre,
  correo, contraseña y rol permitido, EL SISTEMA lo incorporará a la
  empresa de la sesión del administrador.
- RF-114: SI el correo de un nuevo usuario ya existe en esa
  empresa ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA
  rechazará la creación duplicada.
- RF-115: SI el rol indicado al crear o modificar un usuario no es
  administrador, supervisor u operario, ENTONCES EL SISTEMA rechazará la acción.

RF-113 a RF-115 describen el alta de usuarios de una empresa existente. El alta
inicial de una empresa y su administrador se define en los requisitos de
registro SaaS y configuración local de esta especificación.

### Ediciones concurrentes de la distribución — H2

- RF-116: SI un administrador intenta guardar una edición desactualizada de la
  distribución, ENTONCES EL SISTEMA rechazará ese guardado sin reemplazar la
  última distribución guardada.
- RF-117: SI se rechaza un guardado por edición desactualizada, ENTONCES
  EL SISTEMA conservará el borrador de esa sesión identificado como no guardado.

Estos requisitos no introducen mezcla automática de ediciones ni una biblioteca
de versiones del layout.

### Consumo de reservas y preparación al despachar — H6

- RF-118: SI un despacho supera la reserva vigente del mismo pedido, producto
  y ubicación de origen, ENTONCES EL SISTEMA rechazará su confirmación.
- RF-119: CUANDO un despacho se confirme, EL SISTEMA reducirá la cantidad
  preparada pendiente de despacho por la cantidad despachada correspondiente.
- RF-120: SI un nuevo despacho afecta a un pedido cuyas cantidades ya fueron
  despachadas por completo, ENTONCES EL SISTEMA rechazará su confirmación.
- RF-121: SI varios despachos concurrentes de un mismo pedido intentarían
  consumir una cantidad mayor que la reservada o preparada pendiente de
  despacho, ENTONCES EL SISTEMA rechazará los despachos que excedan esos saldos.

RF-120 se aplica a una nueva operación de despacho; la repetición de una
operación ya confirmada conserva el comportamiento de RF-110. Las cantidades
parciales consumen únicamente su reserva y preparación correspondientes,
conservando el saldo restante del pedido.

### Límites de importación acordados — H10

- RF-122: SI una importación supera 20 MB o 20.000 registros de datos,
  ENTONCES EL SISTEMA rechazará su aplicación sin modificar datos de negocio.

Para este límite, 20 MB equivalen a 20.000.000 bytes; los registros de datos no
incluyen la fila de encabezados. Un archivo que cumple estos límites sigue
sujeto al resto de validaciones de importación.

### Reglas de datos e importación aprobadas — H2, H4, H9, H10, H11

- RF-123: SI una cantidad de un producto contado en piezas, cajas o pallets
  no es entera, ENTONCES EL SISTEMA rechazará esa cantidad.
- RF-124: SI una cantidad de peso, volumen o longitud contiene más de tres
  decimales, ENTONCES EL SISTEMA la rechazará sin redondearla automáticamente.
- RF-125: EL SISTEMA registrará las cantidades de cada producto en su unidad
  base sin convertirlas automáticamente a otra presentación.
- RF-126: EL SISTEMA mostrará y solicitará las dimensiones del editor en metros.
- RF-127: SI un nombre está vacío después de retirar espacios exteriores o
  supera 160 caracteres, ENTONCES EL SISTEMA rechazará su guardado.
- RF-128: SI un código está vacío después de retirar espacios exteriores,
  supera 64 caracteres o contiene caracteres distintos de letras, números,
  guion, guion bajo, punto o barra inclinada, ENTONCES EL SISTEMA rechazará
  su guardado.
- RF-129: CUANDO se configure una empresa sin una elección distinta de zona
  horaria, EL SISTEMA utilizará America/Lima para sus fechas.
- RF-130: CUANDO un administrador configure una zona horaria válida para su
  empresa, EL SISTEMA la utilizará para las consultas de fechas de esa empresa.
- RF-131: EL SISTEMA mostrará las fechas operativas en la zona horaria
  configurada para la empresa de la sesión.
- RF-132: CUANDO un usuario filtre por fechas inicial y final válidas,
  EL SISTEMA incluirá ambos días completos según la zona horaria de su empresa.
- RF-133: SI la fecha final de un filtro precede a su fecha inicial, ENTONCES
  EL SISTEMA rechazará ese filtro.
- RF-134: CUANDO un administrador confirme una importación válida de catálogo
  con un SKU existente en su empresa, EL SISTEMA actualizará el nombre del
  producto correspondiente.
- RF-135: SI una fila de importación intenta cambiar la unidad base de un
  producto existente, ENTONCES EL SISTEMA rechazará la importación.
- RF-136: CUANDO se previsualice una importación de catálogo, EL SISTEMA
  distinguirá las creaciones propuestas de las actualizaciones propuestas.
- RF-137: CUANDO una importación actualice el nombre de un producto,
  EL SISTEMA conservará su SKU y unidad base anteriores.
- RF-138: CUANDO una importación actualice el nombre de un producto,
  EL SISTEMA conservará sus cantidades de inventario anteriores.

### Reglas de datos aprobadas — DA-2 resuelta

| Tema | Regla acordada |
|---|---|
| Cantidades | Piezas, cajas y pallets enteros; peso, volumen y longitud hasta tres decimales. |
| Unidades | Una unidad base por producto; sin conversiones automáticas de presentaciones. |
| Dimensiones del editor | Metros. |
| Nombres | Obligatorios, hasta 160 caracteres. |
| Códigos de negocio | Obligatorios, hasta 64 caracteres; letras, números y los símbolos `-`, `_`, `.` y `/`. |
| Fechas | Zona configurable por empresa, inicialmente America/Lima; días inicial y final incluidos en los filtros. |
| Archivos | CSV y XLSX, previsualizados y validados antes de aplicar. |
| Productos existentes | Actualización del nombre por SKU conservando código, unidad y existencias. |

Los nombres comprenden los de empresa, almacenes, elementos de su distribución,
productos y personas. Los códigos de negocio comprenden los códigos de empresa,
SKU, almacenes y elementos de su distribución. El correo y la contraseña no son
códigos de negocio y no están limitados por RF-128. Los espacios exteriores se
retiran antes de comprobar nombres y códigos; no se aceptan espacios internos
en los códigos.

El registro de cero en un conteo continúa permitido. Las reglas de enteros y
precisión se aplican también a los conteos e importaciones. La actualización
del nombre por importación no permite cambiar la unidad base ni convertir las
existencias de un producto existente. Los detalles del formato de intercambio
se documentarán en el contrato del plan sin cambiar estas reglas.

### Registro SaaS y primer administrador — H1, H16

- RF-139: CUANDO un visitante complete un registro válido de empresa en la
  modalidad SaaS, EL SISTEMA creará la empresa con el código y nombre
  registrados.
- RF-140: CUANDO se confirme el registro SaaS de una empresa, EL SISTEMA creará
  su primer usuario administrador con el nombre, correo y contraseña
  registrados en ese proceso.
- RF-141: SI no se puede completar el alta conjunta de empresa y primer
  administrador, ENTONCES EL SISTEMA dejará sin aplicar ese registro.
- RF-142: SI el código de empresa solicitado ya existe en la instalación
  ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará
  el registro sin modificar la empresa existente.
- RF-143: CUANDO se confirme el registro de empresa y primer administrador,
  EL SISTEMA mostrará el código de empresa necesario para iniciar sesión.

### Configuración inicial de instalación local — H1, H17

- RF-144: CUANDO se inicie una instalación local que todavía no tenga empresa
  configurada, EL SISTEMA mostrará el asistente de configuración inicial.
- RF-145: CUANDO se complete válidamente el asistente local, EL SISTEMA creará
  la empresa con el código y nombre indicados.
- RF-146: CUANDO se confirme la configuración inicial local, EL SISTEMA creará
  el primer administrador de esa empresa con el nombre, correo y contraseña
  indicados en el asistente.
- RF-147: SI falla el alta conjunta de empresa y primer administrador local,
  ENTONCES EL SISTEMA dejará sin aplicar esa configuración inicial.
- RF-148: SI se intenta confirmar de nuevo la configuración inicial de una
  instalación local que ya tiene empresa configurada, ENTONCES EL SISTEMA
  rechazará esa nueva configuración sin reemplazar la existente.

### Acceso por empresa y cuentas de demostración — H1, H12, H15, H16, H17

- RF-149: EL SISTEMA validará el correo y contraseña exclusivamente contra
  las cuentas de la empresa identificada por el código de inicio de sesión.
- RF-150: SI falta el código de empresa, correo o contraseña requeridos en un
  alta o inicio de sesión, ENTONCES EL SISTEMA rechazará esa acción.
- RF-151: SI el correo indicado al crear una cuenta no tiene formato de correo
  electrónico, ENTONCES EL SISTEMA rechazará su creación.
- RF-152: EL SISTEMA permitirá completar el registro SaaS, la configuración
  local, el alta de usuarios y el acceso sin depender del envío de correos.
- RF-153: EL SISTEMA dispondrá de empresas ficticias precargadas en el entorno
  de demostración.
- RF-154: EL SISTEMA dispondrá de cuentas ficticias precargadas para probar
  los roles administrador, supervisor y operario en la demostración.
- RF-155: CUANDO se consulten las instrucciones de acceso a la demostración,
  EL SISTEMA mostrará código de empresa, correo y contraseña únicamente de las
  cuentas ficticias precargadas como cuentas demostrativas.

### Alta y acceso aprobados — DA-3 resuelta

| Modalidad o actor | Funcionamiento acordado |
|---|---|
| SaaS | Formulario para registrar la empresa y su primer administrador, sin cobro real durante la demostración. |
| Instalación local | Asistente inicial para crear la empresa y su primer administrador. |
| Equipo | El administrador de la empresa crea los usuarios con sus roles y credenciales de acceso. |
| Inicio de sesión | Código de empresa, correo y contraseña. |
| Demostración | Empresas y cuentas ficticias precargadas para probar los tres roles, sin dependencia del envío de correos. |

El formulario SaaS y el asistente local usan las mismas reglas de empresa,
identidad y permisos; su disponibilidad depende de la modalidad configurada.
El alta SaaS no autoriza modificar empresas existentes ni asignarse acceso a
ellas. Los datos utilizados en las pruebas de esta primera entrega serán
sintéticos conforme a la constitución.

### Operaciones parciales y asignación de preparación — H6, H18

- RF-156: CUANDO un administrador o supervisor solicite una reserva parcial
  válida de un pedido, EL SISTEMA reservará la cantidad solicitada conservando
  el saldo no reservado de la línea.
- RF-157: CUANDO un usuario autorizado registre una preparación parcial válida,
  EL SISTEMA conservará la cantidad reservada que todavía falta preparar.
- RF-158: CUANDO un administrador o supervisor confirme un despacho parcial
  válido, EL SISTEMA conservará el saldo del pedido que todavía no se despachó.
- RF-159: SI una nueva reserva supera el saldo pendiente de reservar de su
  línea de pedido, ENTONCES EL SISTEMA rechazará esa solicitud.
- RF-160: CUANDO un usuario autorizado consulte un pedido, EL SISTEMA mostrará
  por línea las cantidades solicitadas, reservadas vigentes, preparadas
  pendientes de despacho, despachadas y pendientes del pedido.
- RF-161: MIENTRAS un pedido tenga alguna cantidad despachada y alguna línea
  con saldo pendiente, EL SISTEMA lo identificará como parcialmente despachado.
- RF-162: CUANDO todas las líneas de un pedido alcancen su cantidad solicitada
  despachada, EL SISTEMA lo identificará como despachado por completo.
- RF-163: CUANDO un administrador o supervisor asigne la preparación de un
  pedido a un operario activo de su empresa, EL SISTEMA registrará ese operario
  como responsable de la preparación pendiente.
- RF-164: SI una asignación o reasignación indica un usuario inactivo, de otra
  empresa o con rol distinto de operario, ENTONCES EL SISTEMA rechazará la acción.
- RF-165: SI un operario intenta confirmar preparación y no es el operario
  asignado al pedido en ese momento, ENTONCES EL SISTEMA rechazará ese avance.
- RF-166: CUANDO un administrador o supervisor reasigne válidamente un pedido
  de preparación, EL SISTEMA cambiará el operario responsable del trabajo
  pendiente.
- RF-167: CUANDO se reasigne la preparación de un pedido, EL SISTEMA conservará
  las cantidades preparadas y despachadas previamente confirmadas.
- RF-168: CUANDO se confirme una asignación o reasignación de preparación,
  EL SISTEMA conservará su autor, fecha, pedido y operario asignado en el
  historial de esa acción.
- RF-169: SI varias reservas concurrentes del mismo pedido superarían el saldo
  pendiente de reservar, ENTONCES EL SISTEMA rechazará las solicitudes que
  excedan ese saldo.
- RF-170: SI varias preparaciones concurrentes del mismo pedido, producto y
  ubicación superarían la cantidad reservada pendiente de preparar,
  ENTONCES EL SISTEMA rechazará los avances que excedan ese saldo.

### Trabajo de salida aprobado — DA-4 resuelta

| Tema | Regla acordada |
|---|---|
| Operaciones parciales | Se puede reservar, preparar y despachar parte de un pedido, conservando sus saldos pendientes. |
| Asignación | Administrador o supervisor asigna cada pedido de preparación a un operario activo de la empresa. |
| Ejecución | Un operario confirma avances solo en sus pedidos asignados; administrador y supervisor mantienen sus permisos. |
| Reasignación | Cambia el responsable del trabajo pendiente, sin borrar avances confirmados. |

La comprobación de quién está asignado se aplica al confirmar el avance, aunque
el operario hubiese abierto el pedido antes de una reasignación. Si el usuario
asignado se desactiva o deja de tener rol de operario, sus permisos se revocan
conforme a RF-7 y RF-8; la supervisión conserva la posibilidad de reasignar el
trabajo pendiente sin borrar avances.

Ejemplo de validación: un pedido de 100 unidades puede reservar, preparar y
despachar 40, dejando 60 pendientes de despacho. Al completar esas 40, no
quedan sus cantidades como reservas ni preparación pendientes. Una nueva
reserva para el mismo pedido se limita a su saldo todavía no comprometido.

### Traslados entre almacenes de la misma empresa — H4, H5, H19

- RF-171: CUANDO un administrador o supervisor registre un traslado válido,
  EL SISTEMA lo conservará con su referencia, almacenes de origen y destino,
  productos, cantidades y ubicaciones de origen.
- RF-172: SI un traslado indica el mismo almacén como origen y destino o un
  almacén ajeno a la empresa de la sesión, ENTONCES EL SISTEMA rechazará la
  acción.
- RF-173: CUANDO se confirme una salida válida de traslado, EL SISTEMA
  descontará las cantidades declaradas de sus ubicaciones de origen.
- RF-174: CUANDO se confirme una salida válida de traslado, EL SISTEMA
  incorporará esas cantidades al stock en tránsito del traslado.
- RF-175: SI una salida de traslado supera el stock disponible no reservado
  en alguna ubicación de origen, ENTONCES EL SISTEMA rechazará su confirmación.
- RF-176: SI se intenta confirmar una nueva salida de un traslado cuya salida
  ya fue confirmada, ENTONCES EL SISTEMA rechazará esa nueva operación.
- RF-177: CUANDO un usuario consulte un traslado con mercancía en tránsito,
  EL SISTEMA mostrará esas cantidades separadas de las existencias registradas
  en ubicaciones de almacén.
- RF-178: MIENTRAS una cantidad permanezca en tránsito, EL SISTEMA la excluirá
  del stock disponible para nuevas reservas.
- RF-179: CUANDO un usuario autorizado confirme una recepción válida de
  traslado, EL SISTEMA incorporará las cantidades recibidas a sus ubicaciones
  del almacén de destino.
- RF-180: CUANDO se confirme una recepción válida de traslado, EL SISTEMA
  reducirá las cantidades pendientes en tránsito por las cantidades recibidas.
- RF-181: SI una recepción de traslado supera la cantidad todavía pendiente
  en tránsito del producto correspondiente, ENTONCES EL SISTEMA rechazará su
  confirmación.
- RF-182: SI una salida o recepción de traslado indica una cantidad ausente,
  no numérica, infinita o menor o igual a cero, ENTONCES EL SISTEMA rechazará su
  confirmación.
- RF-183: SI una recepción de traslado indica una ubicación inexistente,
  bloqueada o que no pertenece a su almacén de destino, ENTONCES EL SISTEMA
  rechazará su confirmación.
- RF-184: CUANDO todas las cantidades de un traslado tengan recepción
  confirmada, EL SISTEMA lo identificará como recibido por completo.
- RF-185: SI falla la confirmación de una salida o recepción de traslado,
  ENTONCES EL SISTEMA mantendrá las cantidades físicas y en tránsito anteriores
  a esa operación.
- RF-186: EL SISTEMA conservará la suma de existencias físicas y stock en
  tránsito por producto de la empresa como efecto exclusivo de cada etapa
  confirmada de un traslado.
- RF-187: CUANDO se confirme una salida o recepción de traslado, EL SISTEMA
  conservará su autor, fecha, referencia de traslado, productos, cantidades y
  almacenes afectados en el historial de esa etapa.
- RF-188: SI varias recepciones concurrentes de un traslado superarían su saldo
  en tránsito, ENTONCES EL SISTEMA rechazará las recepciones que excedan ese
  saldo.

### Traslados aprobados — DA-5 resuelta

| Etapa | Efecto sobre inventario |
|---|---|
| Registro | Identifica la mercancía y la ruta; no confirma por sí solo una salida física. |
| Salida confirmada | Descuenta del origen e incorpora al stock en tránsito en la misma operación. |
| En tránsito | Conserva el saldo por recibir separado del stock de ubicaciones y sin disponibilidad para pedidos. |
| Recepción confirmada | Descuenta del tránsito e incorpora lo recibido a las ubicaciones del destino en la misma operación. |

La salida solo utiliza cantidades no reservadas en el origen; no libera ni
consume reservas de otros pedidos. Las confirmaciones de cada etapa están
sujetas a las reglas de empresa, cantidades, unidades y reintentos ya
definidas. Repetir la misma referencia con los mismos datos devuelve el
resultado confirmado conforme a RF-110, mientras que una salida nueva después
de una salida ya confirmada se rechaza conforme a RF-176.

El stock en tránsito no aparece como si ya estuviera físicamente en el origen
o destino. Las recepciones reducen su saldo pendiente; mientras exista saldo
por recibir, el traslado no se considera recibido por completo. El tratamiento
de salidas desde ubicaciones bloqueadas aplica la inmovilización de DA-7. Este flujo no
incluye transportistas, seguimiento por GPS ni reversión de etapas confirmadas.

Ejemplo de validación: con 100 unidades en origen y ninguna en destino,
una salida de 20 deja 80 en origen y 20 en tránsito; confirmar la recepción de
esas 20 deja 80 en origen, 20 en destino y cero en tránsito. El total de la
empresa permanece en 100 y la mercancía en tránsito nunca está disponible
para nuevos pedidos.

### Contención, solapamientos y edición de elementos ocupados — H2

- RF-189: SI al guardar una distribución algún elemento queda fuera de los
  límites de su contenedor declarado, ENTONCES EL SISTEMA rechazará ese guardado.
- RF-190: SI al guardar una distribución dos zonas se solapan entre sí,
  ENTONCES EL SISTEMA rechazará ese guardado.
- RF-191: SI al guardar una distribución dos racks se solapan entre sí,
  ENTONCES EL SISTEMA rechazará ese guardado.
- RF-192: SI al guardar una distribución un rack se solapa con un pasillo,
  ENTONCES EL SISTEMA rechazará ese guardado.
- RF-193: SI al guardar una distribución dos ubicaciones del mismo nivel o
  directamente de la misma zona se solapan, ENTONCES EL SISTEMA rechazará
  ese guardado.
- RF-194: EL SISTEMA permitirá que las zonas contengan racks y pasillos y que
  los racks y niveles contengan sus elementos conforme a la jerarquía declarada.
- RF-195: SI al confirmar un cambio de posición el elemento está ocupado o
  tiene trabajo pendiente, ENTONCES EL SISTEMA rechazará ese cambio.
- RF-196: SI al confirmar un cambio de dimensiones el elemento está ocupado o
  tiene trabajo pendiente, ENTONCES EL SISTEMA rechazará ese cambio.
- RF-197: SI una distribución incluye algún cambio que incumple las reglas de
  geometría o de elementos ocupados, ENTONCES EL SISTEMA conservará la última
  distribución guardada sin aplicar parcialmente la edición rechazada.
- RF-198: CUANDO dos elementos solo compartan un borde sin invadir sus
  interiores, EL SISTEMA no tratará ese contacto como solapamiento físico.
- RF-199: SI se rechaza una edición por contención, solapamiento o trabajo
  pendiente, ENTONCES EL SISTEMA identificará el elemento afectado y el motivo
  del rechazo.

### Reglas del editor aprobadas — DA-6 resuelta

| Regla | Comportamiento acordado |
|---|---|
| Contención | Cada elemento queda dentro de los límites de su contenedor. |
| Zonas | No se solapan entre sí y contienen los racks y pasillos correspondientes. |
| Solapamientos | Se rechazan entre racks, entre ubicaciones del mismo nivel y entre racks y pasillos. Las ubicaciones directamente en una zona tampoco invaden el espacio de otras ubicaciones de esa zona. |
| Elementos ocupados | No se permite mover, redimensionar ni eliminar elementos con existencias o trabajo pendiente; primero se vacían y cierran sus operaciones. |
| Identidad e inventario | Un cambio válido conserva los identificadores y cantidades registradas. |

La comprobación de existencias y trabajo pendiente se realiza al confirmar el
guardado, aunque el elemento estuviera vacío cuando se abrió el editor. Al
afectar un contenedor, se comprueba también el estado de sus elementos
descendientes. No se eliminan existencias ni operaciones para permitir un
cambio geométrico. Las reglas de edición desactualizada de RF-116 y RF-117
continúan aplicándose.

### Ubicaciones bloqueadas y desbloqueo — H2, H4, H5, H6, H7, H8, H19

- RF-200: SI una nueva recepción, reserva, movimiento físico, preparación,
  despacho o etapa física de traslado afecta una ubicación bloqueada,
  ENTONCES EL SISTEMA rechazará su confirmación.
- RF-201: CUANDO se bloquee una ubicación con reservas o trabajo pendiente,
  EL SISTEMA conservará esos compromisos sin cancelarlos automáticamente.
- RF-202: MIENTRAS una ubicación esté bloqueada, EL SISTEMA permitirá sus
  consultas, conteos y ajustes con los permisos y validaciones ya definidos.
- RF-203: SI se intenta confirmar un ajuste en una ubicación bloqueada sin
  motivo o que deja existencias por debajo de sus reservas, ENTONCES EL SISTEMA
  rechazará el ajuste.
- RF-204: CUANDO un administrador indique un motivo y confirme el desbloqueo
  de una ubicación de su empresa, EL SISTEMA la habilitará para nuevas
  operaciones sujetas a las validaciones vigentes.
- RF-205: SI se intenta desbloquear una ubicación sin motivo o sin rol de
  administrador de su empresa, ENTONCES EL SISTEMA rechazará la acción.
- RF-206: CUANDO se confirme un desbloqueo, EL SISTEMA conservará su autor,
  fecha, ubicación y motivo en el historial.
- RF-207: CUANDO se desbloquee una ubicación, EL SISTEMA mantendrá pendientes
  sus operaciones abiertas hasta que un usuario autorizado las confirme.

### Política de bloqueo aprobada — DA-7 resuelta

La ubicación bloqueada queda inmovilizada para entradas, nuevas reservas,
movimientos físicos, preparación, despachos y traslados. Esto incluye trabajo
de reservas creadas antes del bloqueo. Consultas, conteos y ajustes autorizados
siguen disponibles, sin liberar reservas ni omitir sus restricciones.

Solo el administrador de la empresa puede desbloquear, indicando un motivo
registrado en el historial. El desbloqueo no ejecuta operaciones pendientes
automáticamente: cada confirmación vuelve a comprobar permisos, asignación y
existencias actuales. Reintentar una operación ya confirmada antes del bloqueo
devuelve su resultado registrado conforme a RF-110; no constituye un nuevo
movimiento físico ni vuelve a aplicar sus efectos.

La comprobación del bloqueo se realiza al confirmar la operación. Un formulario
abierto antes de bloquear la ubicación no permite eludir la inmovilización.

## Requisitos no funcionales

- RNF-1: EL SISTEMA presentará los textos de la interfaz y los mensajes de
  validación en español.
- RNF-2: EL SISTEMA exigirá las mismas autorizaciones para acciones realizadas
  desde cualquier interfaz disponible.
- RNF-3: EL SISTEMA mantendrá los mismos resultados de negocio para operaciones
  equivalentes en las modalidades alojada y local.
- RNF-4: EL SISTEMA permitirá navegar por teclado en las funciones operativas
  disponibles fuera del lienzo 3D.
- RNF-5: EL SISTEMA mostrará nombres accesibles en los controles de formularios
  y acciones operativas.
- RNF-6: EL SISTEMA permitirá consultar inventario y realizar operaciones en
  una presentación alternativa al lienzo 3D.
- RNF-7: EL SISTEMA mostrará estados de carga, vacío, error y ausencia de
  permiso cuando corresponda a una consulta o acción.
- RNF-8: EL SISTEMA conservará los datos de negocio al restaurar un respaldo
  válido de la misma instalación.
- RNF-9: EL SISTEMA mantendrá un procedimiento verificable para actualizar una
  instalación conservando los datos existentes.
- RNF-10: EL SISTEMA permitirá completar las pruebas de la demostración sin
  utilizar datos reales de terceros ni efectuar cobros reales.
- RNF-11: EL SISTEMA permitirá completar los flujos de validación con el perfil
  de volumen y concurrencia aprobado en esta especificación.
- RNF-12: EL SISTEMA permitirá identificar las referencias utilizadas para el
  diseño de la landing y los módulos visuales conforme a la constitución.
- RNF-13: EL SISTEMA responderá a las consultas y confirmaciones habituales en
  un máximo de 2 segundos para al menos el 95 % de las solicitudes medidas en
  el entorno de referencia y con el perfil aprobado.
- RNF-14: CUANDO se confirme un cambio de inventario, EL SISTEMA lo mostrará en
  las consultas activas de otras sesiones conectadas en un máximo de 5 segundos
  en el entorno de referencia.
- RNF-15: CUANDO se abra la vista 3D de un almacén del perfil aprobado,
  EL SISTEMA la dejará disponible para navegar en un máximo de 5 segundos en
  el entorno de referencia.
- RNF-16: CUANDO se procese una importación válida de hasta 20 MB y 20.000
  registros de datos, EL SISTEMA completará su procesamiento en un máximo de
  60 segundos de trabajo acumulado, excluyendo el tiempo que el usuario tarde
  en revisar y confirmar la previsualización, en el entorno de referencia.
- RNF-17: EL SISTEMA permitirá utilizar el editor visual en escritorio desde
  una ventana de 1280 × 720 píxeles.
- RNF-18: EL SISTEMA permitirá consultar inventario y realizar las operaciones
  autorizadas de almacén en móvil desde una ventana de 360 × 800 píxeles.

### Perfil de validación aprobado — DA-1 resuelta

| Aspecto | Objetivo de la primera entrega |
|---|---:|
| Almacenes por empresa | 10 |
| Productos por empresa | 50.000 SKU |
| Ubicaciones por almacén | 20.000 |
| Usuarios concurrentes por empresa | 50 |
| Historial de movimientos por empresa | 100.000 |
| Archivo de importación | Hasta 20 MB |
| Registros de datos por importación | Hasta 20.000 |

Las consultas y confirmaciones habituales comprenden la consulta de catálogo,
inventario, ubicaciones, pedidos e historial, y la confirmación de recepciones,
movimientos internos, reservas, preparaciones, despachos y ajustes. La carga
inicial 3D y las importaciones tienen los objetivos específicos de RNF-15 y
RNF-16. El tiempo de espera para una acción humana no forma parte de las
mediciones de procesamiento.

El plan documentará el entorno de referencia, los datos y la carga de trabajo
con los que se medirán estos objetivos. Son objetivos de validación aceptados,
no capacidades ya demostradas ni límites comerciales de suscripción. El editor
se validará en escritorio; la consulta y las operaciones se validarán también
en móvil.

RNF-11 y RNF-13 a RNF-18 requerirán resultados de medición antes de declarar
cumplido el perfil de esta entrega.

## Casos límite

| Caso | Resultado requerido o decisión pendiente |
|---|---|
| Empresa sin almacenes | Mostrar estado vacío con acceso a la creación según permisos; RF-6, RF-10, RNF-7. |
| Almacén sin distribución ni inventario | Mostrar el estado vacío correspondiente sin crear existencias; RF-24, RNF-7. |
| Usuario sin sesión, desactivado o de otra empresa | Rechazar el acceso; RF-4, RF-5, RF-8. |
| Mismo correo en empresas distintas | Validar cada cuenta dentro de la empresa indicada por su código; RF-1, RF-114, RF-149. |
| Código de empresa, correo o contraseña ausentes | Rechazar el alta o acceso que requiera esos datos; RF-150. |
| Correo de formato inválido al crear una cuenta | Rechazar la creación; RF-151. |
| Registro SaaS con código de empresa existente | Rechazar sin modificar la empresa existente; RF-142. |
| Dos registros SaaS concurrentes con el mismo código | Confirmar como máximo un registro y conservar su empresa y administrador; RF-141, RF-142. |
| Fallo entre el alta de empresa y el primer administrador | No conservar un alta incompleta; RF-141, RF-147. |
| Dos sesiones intentan finalizar el asistente local | No reemplazar la configuración que ya quedó confirmada; RF-147, RF-148. |
| Reinicio de una instalación local ya configurada | Mantener la empresa y su administrador existentes; RF-104, RF-148. |
| Último administrador activo | Impedir su desactivación o pérdida de rol; RF-9. |
| Código duplicado con mayúsculas o espacios exteriores | Rechazar el duplicado en su ámbito; RF-17, RF-35. |
| Nombre vacío o mayor a 160 caracteres | Rechazar el guardado; RF-127. |
| Código vacío, mayor a 64 caracteres o con caracteres no admitidos | Rechazar el guardado; RF-128. |
| Nombre de 160 caracteres o código de 64 caracteres | Aceptar la longitud si cumple las demás validaciones; RF-127, RF-128. |
| Cantidad cero o negativa en una recepción o pedido | Rechazar la confirmación; RF-43, RF-51. |
| Cantidad no positiva en movimiento, reserva, preparación o despacho | Rechazar la confirmación; RF-107. |
| Conteo observado igual a cero | Permitir registrar la observación sin modificar stock; RF-64, RF-65. |
| Conteo negativo, no numérico, infinito o sin cantidad | Rechazar el registro; RF-108. |
| Ubicación con varios productos al contar | Asociar cada cantidad observada a su producto y ubicación; RF-64, RF-66, RF-109. |
| Cantidad fraccionaria de piezas, cajas o pallets | Rechazar la cantidad; RF-123. |
| Peso, volumen o longitud con hasta tres decimales | Evaluar con las demás reglas sin redondeo automático; RF-124, RF-125. |
| Peso, volumen o longitud con más de tres decimales | Rechazar sin redondear; RF-124. |
| Cambio de unidad por importación de un SKU existente | Rechazar la importación; RF-135. |
| Dimensiones nulas, negativas o no numéricas | Rechazar el guardado; RF-15. |
| Ubicación fuera del elemento que la contiene | Rechazar el guardado; RF-16. |
| Dos zonas que comparten espacio interior | Rechazar el guardado; RF-190. |
| Rack dentro de su zona, con niveles y ubicaciones dentro de sus contenedores | Permitir la contención si cumple las demás validaciones; RF-189, RF-194. |
| Solapamiento entre racks o entre un rack y un pasillo | Rechazar el guardado; RF-191, RF-192. |
| Solapamiento entre ubicaciones del mismo nivel o de la misma zona directa | Rechazar el guardado; RF-193. |
| Contacto únicamente entre bordes de elementos | No rechazar por solapamiento si no comparten interior; RF-198. |
| Borrar rack con existencias o trabajo pendiente | Rechazar la eliminación; RF-21. |
| Mover o redimensionar un elemento con stock o referencias de operaciones abiertas | Rechazar el cambio e indicar el motivo; RF-195, RF-196, RF-199. |
| Mover un contenedor aparentemente vacío cuyo descendiente tiene stock | Rechazar el cambio; definición de elemento ocupado y RF-195. |
| Un elemento recibe stock o una operación abierta después de abrir el editor | Volver a comprobar su estado al guardar y rechazar el cambio que dejó de estar permitido; RF-21, RF-195, RF-196. |
| Edición con varios cambios y uno inválido | Conservar íntegra la distribución guardada anterior; RF-197. |
| Entrada de existencias después de abrir el editor y antes de eliminar un elemento | Rechazar la eliminación al comprobar su estado en la confirmación; RF-21. |
| Descartar o abandonar cambios de distribución | Conservar lo guardado; RF-19, RF-20. |
| Dos administradores guardan ediciones basadas en la misma distribución anterior | Conservar el primer guardado válido y rechazar el desactualizado manteniendo su borrador; RF-116, RF-117. |
| Buscar un producto inexistente | Mostrar ausencia de resultados; RF-29. |
| Lienzo 3D no disponible | Permitir la alternativa operativa; RF-33, RNF-6. |
| Ubicación bloqueada con reservas anteriores | Conservar las reservas y rechazar nuevas confirmaciones de preparación o despacho hasta el desbloqueo; RF-200, RF-201. |
| Salida o entrada de movimiento interno o traslado con ubicación bloqueada | Rechazar la etapa sin aplicar efectos parciales; RF-48, RF-185, RF-200. |
| Conteo o ajuste de una ubicación bloqueada | Aplicar los permisos y restricciones normales, incluido motivo y protección de reservas; RF-202, RF-203. |
| Formulario abierto antes de bloquear la ubicación | Rechazar la nueva confirmación mientras el bloqueo siga vigente; RF-200. |
| Desbloqueo sin motivo o por supervisor u operario | Rechazar la acción; RF-205. |
| Desbloqueo válido con trabajo pendiente | Registrar el motivo y conservar el trabajo para confirmación posterior, sin ejecutarlo automáticamente; RF-204, RF-206, RF-207. |
| Reintento de una operación confirmada antes del bloqueo | Devolver el resultado registrado sin aplicar otra vez el movimiento; RF-110. |
| Dos reservas simultáneas de la última cantidad disponible | No confirmar ambas si exceden el stock; RF-103. |
| Mover una cantidad mayor que la disponible no reservada | Rechazar el movimiento completo sin cambiar las cantidades; RF-47, RF-48. |
| Cancelar pedido ya preparado o despachado | Rechazar la cancelación; RF-63. |
| Nueva operación de despacho sobre un pedido completamente despachado | Rechazar la operación; RF-120. |
| Varios despachos concurrentes sobre el mismo saldo reservado y preparado | No consumir ese saldo más de una vez; RF-118, RF-119, RF-121. |
| Reserva, preparación y despacho de 40 unidades de un pedido de 100 | Conservar 60 pendientes, consumiendo solo los saldos de las 40 despachadas; RF-156 a RF-160. |
| Nueva reserva que excede el saldo pendiente aunque exista inventario suficiente | Rechazar la solicitud; RF-159. |
| Reservas o preparaciones concurrentes sobre el mismo saldo del pedido | No comprometer ni preparar más que el saldo correspondiente; RF-169, RF-170. |
| Operario que intenta preparar un pedido sin asignación o asignado a otro | Rechazar la confirmación del avance; RF-165. |
| Pedido reasignado después de abrirlo el operario anterior | Conservar avances previos y rechazar nuevos avances del operario anterior; RF-165 a RF-167. |
| Asignación a un usuario de otra empresa, inactivo o sin rol de operario | Rechazar la asignación; RF-164. |
| Pedido parcialmente despachado con líneas pendientes | Mantener el estado parcialmente despachado hasta completar todas las líneas; RF-161, RF-162. |
| Salida de traslado de 20 unidades desde un origen con 100 | Conservar 80 en origen y 20 en tránsito, sin incrementar todavía el destino; RF-173, RF-174. |
| Recepción del traslado de 20 unidades | Incorporar 20 en destino y descontar esas 20 del tránsito; RF-179, RF-180. |
| Nueva reserva sobre mercancía en tránsito | Rechazar el uso de esa mercancía como disponible; RF-178. |
| Salida de traslado que requiere mercancía reservada para otro pedido | Rechazar sin consumir ni liberar la reserva existente; RF-175. |
| Traslado al mismo almacén o hacia otra empresa | Rechazar la acción; RF-5, RF-172. |
| Nueva salida de un traslado que ya salió | Rechazar la nueva operación sin volver a descontar del origen; RF-176. |
| Recepción que excede el saldo pendiente en tránsito | Rechazar sin modificar cantidades; RF-181. |
| Recepciones concurrentes del mismo saldo en tránsito | No incorporar al destino más mercancía que la pendiente; RF-188. |
| Recepción de traslado en ubicación bloqueada, inexistente o de otro almacén | Rechazar la recepción; RF-183. |
| Fallo o pérdida de respuesta al confirmar una etapa de traslado | Conservar la confirmación íntegra o el estado anterior, sin duplicar efectos al reintentar; RF-102, RF-110, RF-185. |
| Conteo desactualizado por un movimiento posterior | Rechazar el ajuste basado en la referencia anterior; RF-70. |
| Ajuste que afectaría reservas | Rechazar el ajuste; RF-69. |
| Archivo vacío, corrupto o de formato no admitido | Rechazar la importación con motivo; RF-81 a RF-83. |
| Importación que supera 20 MB o 20.000 registros de datos | Rechazar la aplicación sin modificar datos de negocio; RF-122. |
| Importación de exactamente 20 MB o 20.000 registros de datos | Evaluar el archivo con las demás validaciones; el valor límite por sí solo no lo rechaza; RF-122. |
| Archivo con filas inválidas o duplicadas | No aplicar la importación; RF-82. |
| SKU existente en la empresa y no repetido en el archivo de catálogo | Previsualizar una actualización de nombre conservando código, unidad y cantidades; RF-134 a RF-138. |
| Archivo de catálogo que mezcla SKU nuevos y existentes | Previsualizar las creaciones y actualizaciones con aplicación íntegra o sin cambios si falla; RF-84, RF-88, RF-134, RF-136. |
| Archivo de formato distinto de CSV o XLSX | Rechazar con explicación; RF-83. |
| Importación repetida tras perder la respuesta | No duplicar efectos; RF-87, RF-102. |
| Reintentos concurrentes de una operación con igual empresa, referencia y datos | Conservar un único resultado confirmado sin duplicar efectos; RF-87, RF-102, RF-110. |
| Referencia repetida con cantidades, ubicaciones u otros datos de negocio distintos | Rechazar la nueva solicitud sin alterar los datos existentes; RF-111. |
| Dos acciones legítimas con datos iguales y referencias distintas | Evaluar cada acción por separado con sus validaciones de negocio; RF-112. |
| Fallo durante una importación | Mantener el estado previo; RF-88. |
| Texto que una hoja de cálculo interpretaría como fórmula | Exportarlo como texto; RF-90. |
| Exportación sin coincidencias | Producir un archivo identificable como resultado vacío; detalles de presentación en revisión. |
| Respuesta perdida después de confirmar en el servidor | Mostrar resultado no confirmado hasta consultarlo; RF-100 a RF-102. |
| Internet caído con servidor local accesible | Permitir el flujo operativo; RF-106. |
| Desconexión completa del servidor | Impedir confirmaciones; RF-99. |
| Creación de otro usuario después de configurar la empresa | Incorporarlo a la empresa del administrador autorizado; RF-6, RF-113. |
| Identificador de acceso duplicado en la empresa o rol no permitido | Rechazar la acción correspondiente; RF-114, RF-115. |
| Reinicio después de una operación confirmada | Conservar el resultado; RF-104. |
| Respaldo inválido o incompatible | No sustituir datos válidos; detalle del procedimiento pendiente del plan y su verificación. |
| Consulta de fechas desde una zona horaria distinta de la empresa | Aplicar la zona de la empresa e incluir ambos días extremos del intervalo; RF-130 a RF-132. |
| Fecha final anterior a la inicial | Rechazar el filtro; RF-133. |
| Volumen que exceda el perfil de validación | No considerarlo capacidad demostrada de esta entrega; el perfil no impone un bloqueo comercial por licencia. |

## Fuera de alcance

- Cobros reales, emisión de comprobantes, contratación vinculante y suspensión
  automática del servicio por pagos.
- Despliegue público, publicación en Railway o publicación en LinkedIn durante
  esta etapa sin una indicación posterior del usuario.
- Trabajo sin conexión al servidor y sincronización diferida de operaciones.
- Control de fabricación, ensamblaje, listas de materiales y planificación de
  producción.
- Integraciones con tiendas, marketplaces, ERP, transportistas o sistemas
  externos de inventario.
- Captura automática mediante robots, drones, RFID, sensores o cámaras.
- Aplicaciones móviles nativas y operación con lectores físicos de códigos no
  definidos en este alcance.
- Simulación predictiva, optimización automática de ubicaciones o recorridos y
  asistentes de inteligencia artificial.
- Importación de planos técnicos, distribuciones de almacén o historial
  operativo previo.
- Cálculo o certificación de seguridad estructural de racks y compatibilidad
  regulatoria de mercancías.
- Gestión especializada de lotes, números de serie, caducidad, mercancía
  peligrosa o cadena de frío en esta entrega del núcleo general.
- Tarifas de instalación, condiciones de licencia local y compromisos de
  mantenimiento definitivos.

Las exclusiones concretan esta primera entrega; el público general no implica
que el núcleo inicial cubra todas las exigencias de cada sector. Una ampliación
posterior seguirá el proceso de cambio de requisitos.

## Criterios de finalización

- CF-1: Cada RF tiene una comprobación ejecutada de su comportamiento esperado,
  incluyendo los casos de rechazo aplicables.
- CF-2: Cada RNF tiene evidencia automática o manual identificada; los que no
  puedan verificarse se declaran expresamente en la validación.
- CF-3: Las dudas DA-1 a DA-7 están resueltas antes de aprobar el plan técnico.
- CF-4: Una demostración local permite iniciar sesión, configurar un almacén,
  registrar productos, recibir mercancía, moverla, reservarla, prepararla y
  despacharla, conservando un historial coherente.
- CF-5: Una demostración local permite registrar un conteo y aplicar un ajuste
  autorizado sin violar reservas.
- CF-6: La demostración permite previsualizar una importación y exportar una
  consulta de inventario o historial.
- CF-7: La separación de empresas se verifica intentando acceder a datos de una
  empresa distinta desde una sesión activa.
- CF-8: La concurrencia se verifica con operaciones que compitan por las mismas
  existencias.
- CF-9: La landing permite identificar las dos modalidades y probar la selección
  de un plan demostrativo sin un cargo real.
- CF-10: El flujo principal se verifica después de reiniciar el servidor.
- CF-11: Se ejecuta una restauración de respaldo comprobando la conservación
  de los datos de negocio incluidos en la prueba.
- CF-12: La revisión de interfaz incluye capturas en escritorio y móvil,
  comprobación de consola y verificación de estados e interacciones.
- CF-13: Se ejecutan las verificaciones acordadas para todos los principios
  aplicables de la constitución.
- CF-14: Las pruebas de reintentos distinguen una operación repetida, una
  referencia reutilizada con otros datos y dos acciones nuevas con datos iguales.
- CF-15: Una prueba de guardados concurrentes conserva la distribución aceptada
  sin perder el borrador de la sesión cuyo guardado se rechazó.
- CF-16: Las pruebas de despacho repetido y concurrente impiden consumir más
  existencias, reservas o preparación que las correspondientes al pedido.
- CF-17: Las mediciones identifican el entorno y los datos utilizados para
  verificar los objetivos de volumen, concurrencia, latencia, actualización,
  importación y carga inicial 3D aprobados.
- CF-18: La revisión de interfaz incluye el editor a 1280 × 720 y la consulta
  y las operaciones móviles a 360 × 800.
- CF-19: Las comprobaciones de cantidades distinguen enteros, hasta tres
  decimales y exceso de precisión sin redondeos silenciosos.
- CF-20: Las comprobaciones de importación distinguen creaciones,
  actualizaciones de nombre, duplicados y cambios de unidad rechazados.
- CF-21: Las comprobaciones de fechas incluyen ambos días extremos del rango
  según la zona de la empresa, aunque el dispositivo use otra zona horaria.
- CF-22: El registro SaaS se verifica con empresa y administrador creados
  conjuntamente, rechazo de códigos duplicados y separación entre empresas.
- CF-23: El asistente local se verifica sin conexión a internet, conservando la
  configuración ante reinicios o intentos de alta inicial repetidos.
- CF-24: La demostración permite acceder con los tres roles usando las cuentas
  ficticias precargadas sin envío obligatorio de correos.
- CF-25: Se verifica un pedido de 100 unidades despachado primero en 40 y luego
  en 60, conservando los saldos correctos en ambos pasos y cerrándolo solo al
  completar las 100.
- CF-26: Se verifica que reasignar un pedido conserva sus avances y revoca la
  confirmación de nuevos avances por el operario anterior.
- CF-27: Las comprobaciones de concurrencia impiden reservar o preparar por
  encima de los saldos pendientes del pedido, aunque haya más stock físico.
- CF-28: Se verifica el traslado de 20 unidades desde un origen con 100,
  conservando el total de la empresa durante salida, tránsito y recepción.
- CF-29: Se comprueba que un traslado no consume mercancía reservada para
  otros pedidos ni ofrece su stock en tránsito para nuevas reservas.
- CF-30: Los reintentos y las confirmaciones concurrentes de etapas de traslado
  no duplican salidas ni incorporan al destino más que el saldo en tránsito.
- CF-31: Se rechazan traslados hacia almacenes de otras empresas sin modificar
  el inventario de ninguna de las empresas.
- CF-32: Se verifica la contención válida y el contacto de bordes, y se rechazan
  los solapamientos prohibidos entre zonas, racks, pasillos y ubicaciones.
- CF-33: Se rechazan cambios de posición, dimensiones o eliminación de
  elementos con existencias o trabajo pendiente, incluyendo descendientes y
  cambios de estado posteriores a abrir el editor.
- CF-34: Un cambio geométrico válido conserva identidades y cantidades; una
  edición que contiene un cambio inválido conserva la distribución anterior.
- CF-35: Las pruebas de bloqueo rechazan entradas y salidas físicas, incluso
  con reservas anteriores o formularios abiertos antes del bloqueo.
- CF-36: Se comprueban consultas, conteos y ajustes autorizados en una ubicación
  bloqueada sin omitir la protección de reservas ni los motivos exigidos.
- CF-37: Se verifica que solo el administrador desbloquea con motivo e
  historial y que el desbloqueo no ejecuta automáticamente trabajo pendiente.

## Dudas abiertas

- **DA-1 — Escala y plataformas: resuelta.** El usuario aceptó el perfil de
  validación, sus objetivos temporales y los tamaños de pantalla descritos en
  los requisitos no funcionales.
- **DA-2 — Reglas de datos y archivos: resuelta.** El usuario aceptó las reglas
  de cantidades, unidades, dimensiones, nombres, códigos, fechas, formatos y
  actualizaciones de catálogo descritas en esta especificación.
- **DA-3 — Alta y acceso inicial: resuelta.** El usuario aceptó el formulario
  SaaS, el asistente de instalación local, el alta de equipo por administrador,
  el acceso con código de empresa, correo y contraseña, y las cuentas ficticias
  de demostración sin dependencia del envío de correos.
- **DA-4 — Trabajo de salida: resuelta.** El usuario aceptó reservas,
  preparaciones y despachos parciales, preparación asignada por administrador
  o supervisor a un operario, ejecución limitada a los pedidos asignados para
  los operarios y conservación de avances al reasignar.
- **DA-5 — Traslados entre almacenes: resuelta.** El usuario aceptó traslados
  entre almacenes de la misma empresa con salida, stock en tránsito separado
  y recepción confirmada en destino; no se utilizará mercancía reservada para
  otros pedidos.
- **DA-6 — Cambios físicos del almacén: resuelta.** El usuario aceptó los
  límites de contención, el rechazo de solapamientos, el bloqueo de movimiento,
  redimensionado o eliminación de elementos ocupados o con trabajo pendiente,
  y la conservación de identificadores y cantidades en cambios válidos.
- **DA-7 — Operaciones sobre ubicaciones bloqueadas: resuelta.** El usuario
  aceptó la inmovilización de entradas y salidas físicas, conservación de
  reservas y trabajo pendiente, consultas y controles autorizados, y
  desbloqueo exclusivo del administrador con motivo e historial.

No quedan decisiones abiertas de las DA-1 a DA-7 identificadas en la revisión
inicial. Las capacidades y mediciones exigidas no se consideran implementadas
ni verificadas por el hecho de haber aprobado esta especificación.

## Historial de cambios

### 2026-10-28 — Enmienda 01: correcciones autorizadas de la revisión

La base fue aprobada por el usuario antes de su revisión. Después de recibir el
informe de hallazgos, el usuario autorizó corregir los problemas que podían
resolverse sin decidir por él el alcance pendiente.

- Se conserva la numeración de RF-1 a RF-106 y de los doce RNF existentes.
- Se añaden H15 y RF-107 a RF-121 para completar comportamientos del alcance
  aprobado: validación de cantidades, conteos identificados, reintentos, alta
  de usuarios, guardados concurrentes y consumo de saldos al despachar.
- RF-21 se precisa para comprobar el impedimento de eliminación en el momento
  de confirmar, incluyendo cambios de inventario posteriores a abrir el editor.
- RF-56 y RF-60 se precisan para distinguir la preparación por producto y
  ubicación de la cantidad que todavía está pendiente de despacho.
- RF-64, RF-66 y RF-70 se precisan para vincular conteos y sus referencias al
  mismo producto y ubicación.
- RF-87 y RF-102 se precisan para distinguir referencias, reintentos y datos de
  negocio sin confundir acciones nuevas con datos coincidentes.
- Se corrige el caso límite de movimientos sobre mercancía reservada para
  exigir rechazo completo, conforme a RF-47 y RF-48.
- Se añaden casos límite para las validaciones y conflictos corregidos y
  CF-14 a CF-16 para comprobarlos.
- DA-7 formaliza una política de bloqueo que ya estaba pendiente fuera de la
  lista de dudas; CF-3 exige resolverla también antes de aprobar el plan.
- No se modifica la constitución ni se amplía «Fuera de alcance». No existen
  plan, tareas ni implementación de la aplicación que actualizar por esta
  enmienda.

### 2026-10-29 — Enmienda 02: perfil de validación aceptado

- DA-1 se cierra con las cifras y objetivos aceptados explícitamente por el
  usuario: 10 almacenes, 50.000 SKU y 50 usuarios concurrentes por empresa;
  20.000 ubicaciones por almacén; 100.000 movimientos de historial por empresa;
  importaciones de hasta 20 MB y 20.000 registros de datos.
- RNF-11 pasa a referirse al perfil concreto. Se añaden RNF-13 a RNF-18 para
  expresar por separado los objetivos temporales y tamaños de pantalla.
- Se añade RF-122 para rechazar importaciones que excedan los límites
  acordados, con dos casos límite para el exceso y el valor exacto admitido.
- Se añaden CF-17 y CF-18 para exigir mediciones reproducibles y las
  comprobaciones de pantalla acordadas.
- Se conserva la numeración existente y la constitución permanece intacta.
- DA-2 a DA-7 continúan abiertas. No se generan plan, tareas ni código de la
  aplicación mientras queden estas decisiones por cerrar.

### 2026-10-29 — Enmienda 03: reglas de datos e importación aceptadas

- DA-2 se cierra con las reglas aceptadas explícitamente por el usuario.
- Se añaden RF-123 a RF-138 para expresar cantidades enteras o de hasta tres
  decimales, unidad base sin conversiones, dimensiones en metros, nombres y
  códigos limitados, zona horaria por empresa y actualización del nombre por
  importación sin cambiar SKU, unidad ni inventario.
- RF-80 y RF-89 concretan los formatos CSV y XLSX. RF-82 precisa que el
  duplicado se evalúa dentro del archivo, diferenciándolo de un SKU existente
  que se va a actualizar.
- Se concretan las definiciones, casos límite y CF-19 a CF-21 afectados por
  estas reglas. Se conservan los identificadores y requisitos no afectados.
- El resto de decisiones DA-3 a DA-7 continúa abierto; la constitución
  permanece sin cambios.

### 2026-10-29 — Enmienda 04: alta y acceso inicial aceptados

- DA-3 se cierra con el funcionamiento aceptado explícitamente por el usuario.
- Se añaden H16 y H17 para el registro SaaS y la configuración local, y
  RF-139 a RF-155 para altas conjuntas, duplicados, asistente inicial, acceso
  por empresa y cuentas de demostración sin dependencia de correo.
- RF-1 concreta el acceso con código de empresa, correo y contraseña.
  RF-113 y RF-114 concretan el correo como identificador de cuenta dentro de
  la empresa y la creación de usuarios con credenciales por el administrador.
- Se añaden definiciones, casos límite y CF-22 a CF-24 para comprobar el alta,
  el acceso y la demostración acordados.
- Se conserva la numeración existente y la constitución permanece intacta.
  DA-4 a DA-7 siguen abiertas; no se generan plan ni tareas todavía.

### 2026-10-29 — Enmienda 05: parciales y asignación de preparación aceptados

- DA-4 se cierra con las reglas aceptadas explícitamente por el usuario.
- Se añaden H18 y RF-156 a RF-170 para reservas, preparación y despachos
  parciales con saldos por línea; asignación y reasignación; conservación de
  avances y control de concurrencia sobre los saldos del pedido.
- La matriz precisa que los operarios preparan únicamente pedidos asignados
  y añade la asignación y reasignación para administrador y supervisor.
- Se añaden definiciones, casos límite y CF-25 a CF-27 relacionados.
- Se mantienen los RF existentes, incluida la confirmación íntegra de cada
  solicitud y las reglas de cancelación; una salida parcial no autoriza
  aplicar parcialmente una solicitud inválida ni revertir un despacho anterior.
- La constitución permanece intacta. DA-5 a DA-7 siguen abiertas.

### 2026-10-29 — Enmienda 06: traslados entre almacenes aceptados

- DA-5 se cierra con el flujo de salida, tránsito y recepción aceptado por el
  usuario para almacenes de la misma empresa.
- Se añaden H19 y RF-171 a RF-188 para registro, validación, efectos de cada
  etapa, conservación de cantidades, rechazo de reservas ajenas, reintentos e
  historial del traslado.
- Se incorporan permisos de traslado: administrador y supervisor crean y
  confirman salidas; los tres roles pueden consultar y confirmar recepciones.
  Estos permisos aplican la separación ya acordada entre salidas y recepciones.
- Se añaden definiciones, casos límite y CF-28 a CF-31 para comprobar el flujo.
- Los RF y RNF anteriores conservan sus identificadores y contenidos. La
  constitución permanece intacta. DA-6 y DA-7 continúan abiertas.

### 2026-10-29 — Enmienda 07: reglas físicas del editor aceptadas

- DA-6 se cierra con las reglas aceptadas explícitamente por el usuario.
- Se añaden RF-189 a RF-199 para contención, solapamientos, cambios sobre
  elementos ocupados, guardados sin aplicación parcial y explicación del rechazo.
- Se concretan las definiciones de contención, solapamiento y elemento ocupado
  o con trabajo pendiente, incluyendo sus descendientes.
- Se añaden los casos límite y CF-32 a CF-34 para comprobar las reglas.
- Los RF y RNF anteriores conservan sus identificadores y contenidos. La
  constitución permanece intacta. Solo DA-7 continúa abierta.

### 2026-10-29 — Enmienda 08: política de ubicaciones bloqueadas aceptada

- DA-7 se cierra con la política aceptada explícitamente por el usuario.
- Se añaden RF-200 a RF-207 para inmovilización, conservación de compromisos,
  consultas y controles autorizados, y desbloqueo por administrador con motivo
  e historial, sin ejecución automática del trabajo pendiente.
- Se añade la capacidad de bloqueo y desbloqueo del administrador a la matriz;
  se precisan los textos y casos que todavía remitían a DA-7.
- Se añaden CF-35 a CF-37 para verificar la política. Los RF y RNF anteriores
  mantienen sus identificadores y contenido; la constitución permanece intacta.
- Las decisiones iniciales están cerradas y se continúa con el plan técnico.
