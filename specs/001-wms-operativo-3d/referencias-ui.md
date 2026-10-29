# Anexo del plan 001 — Referencias UI mediante Awwwards MCP

29/10/2026. Evidencia de consulta para planificar RF-91–98, RNF-12 y constitución
9; no es evidencia de una interfaz implementada. Cada tarea UI completará este
registro con decisiones de composición, tokens y capturas de su resultado.

## Herramienta y observación directa

Servidor real `awwwards-inspiration`, mediante el cliente stdio ya probado
[scripts/awwwards-mcp.mjs](../../scripts/awwwards-mcp.mjs) y el procedimiento de
[integración](../../docs/integraciones/awwwards-mcp.md). No se usó una lectura
directa de la base SQLite como sustituto del MCP.

Consultas realizadas: `list`, `search_designs` con `saas`, `industrial`,
`dashboard` e `interface`; `get_analysis` para IDs 48, 45 y 29;
`get_user_preferences`; contraste posterior `get_topic_profile` con `saas`.
Las búsquedas dashboard/interface no devolvieron referencias. Por ello las
referencias aportan lenguaje visual, no validación de patrones WMS ni un supuesto
dashboard ya diseñado. El perfil `saas` del motor resuelve a **fintech**: se
descartan sus pagos, calculadoras y contenido financiero; solo sirve de contraste
para producto real visible, lectura de datos y comparativa de modalidades.

Se inspeccionaron visualmente las tres capturas de sitios externos retornadas por
el MCP, no las capturas de la ficha Awwwards. Los títulos de la base parecen ser
nombres de autores/agencias: aquí se identifica cada sitio por URL real.

| ID | Sitio y captura local inspeccionada | Qué aporta | Qué se descarta |
|---|---|---|---|
| 48 | [Butter](https://www.butter.video/) · [captura](/Users/jair-roman-mauricio/awwwards-inspiration-engine-data/site-screenshots/048_ToyFight_PRO_viewport.png) | Objeto tridimensional protagonista, sans neutra y alto contraste. Aplicarlo a la distribución real del almacén, no a un objeto decorativo. | Llavero, física constante, composición copiada y banner de cookies que ocupa gran parte de la captura. |
| 45 | [Mailerbot](https://www.mailerbot.com/) · [captura](/Users/jair-roman-mauricio/awwwards-inspiration-engine-data/site-screenshots/045_Griflan_PRO_viewport.png) | Producto tangible en perspectiva y alineación de información. El editor puede mostrar planta/preview conectadas al mismo objeto. | Botones con celda de flecha, texto mayúsculo decorativo, estadísticas sin datos y copia de postales/isometría. |
| 29 | [Cominvi](https://www.cominvi.com.mx/) · [captura](/Users/jair-roman-mauricio/awwwards-inspiration-engine-data/site-screenshots/029_HOLOGRAPHIK_PRO_viewport.png) | Contexto industrial visible y etiquetas técnicas ancladas al objeto. Útil para ubicación seleccionada y datos espaciales. | Escena de mina, video de fondo, menú circular opaco para operar y oscuridad trasladada a todas las tablas. |

## Hipótesis original de diseño y aplicación por módulo

La propuesta del producto es enseñar la misma distribución que se configura y
opera: landing con escena sintética real del WMS; app con contexto persistente de
empresa/almacén, tabla y detalle conectados a ubicaciones; editor de planta con
preview 3D y propiedades exactas. La navegación de cámara nunca confirma stock.
El dato, la ubicación seleccionada y su estado son el foco del producto.

No se declara un mundo visual final ni se escriben componentes en esta fase.
Antes del primer código UI se completarán los artefactos de contexto/dirección
de Impeccable con las respuestas de producto ya aprobadas, sin reabrir la
entrevista SDD ni introducir afirmaciones de marketing nuevas.

| Superficie | Referencia de partida | Decisión de planificación y criterio de revisión |
|---|---|---|
| Landing y modalidades | 48 + 45 | Producto espacial visible; explicación concreta y comparativa de dos modalidades; CTA consistente, sin cifras de clientes inventadas. |
| Instrucciones demo y simulación | 48 | Jerarquía clara y aviso visible de datos/planes demostrativos; no apariencia de checkout real. |
| Acceso, registro y asistente | 48 | Tipografía/contraste comunes; formularios etiquetados, estados de error y código de empresa explícito. |
| Empresa y equipo | 48 | Mismo sistema tipográfico; tabla de equipo y permiso actual legibles, sin elevar visualmente acciones rutinarias. |
| Selector y gestión de almacenes | 45 + 29 | Código/nombre y distribución identificables; contexto industrial mediante el producto, sin fotos genéricas. |
| Editor de distribución | 45 + 29 | Planta, árbol y propiedades ancladas al elemento; preview espacial, errores localizables y borrador conservado. |
| Visor 3D y búsqueda | 48 + 29 | Almacén protagonista y etiqueta del elemento seleccionado; leyenda por texto/patrón, alternativa de lista. |
| Catálogo | 48 | Nombres legibles, SKU distinguible y unidad visible; la referencia aporta tipografía, no estructura de tabla. |
| Inventario por ubicación | 29 + 48 | Cifras exactas asociadas a ubicación y estado, columnas comparables; sin decoración que parezca telemetría de sensores. |
| Recepciones | 45 + 48 | Origen del dato/destino y cantidad jerarquizados; resultado confirmado separado de formulario pendiente. |
| Movimientos internos | 29 + 45 | Origen y destino inequívocos del mismo almacén; resumen del efecto antes de confirmar. |
| Pedidos y reservas | 48 | Lectura de saldos por línea y unidad; cantidades solicitadas, comprometidas y pendientes distinguibles. |
| Asignación y picking | 29 + 48 | Identidad del operario y ubicación vinculadas al trabajo; controles por permiso actual. |
| Despachos | 45 + 48 | Resumen del efecto físico y preparación consumida; parcial/total legible sin sumar unidades distintas. |
| Traslados | 29 + 45 | Tres etapas explícitas con tránsito separado; origen/destino reales y saldo pendiente, sin mapa GPS. |
| Conteos y ajustes | 48 + 29 | Observado frente a referencia con producto/ubicación; motivo y rechazo visible si quedó obsoleto. |
| Historial y auditoría | 48 + 29 | Actor, fecha, referencia y efecto escaneables; enlaces al contexto y filtros por zona de empresa. |
| Indicadores, alertas y reportes | 48 | Números basados en consultas reales, alertas junto a producto/umbral; evitar paneles decorativos. |
| Importaciones y exportaciones | 45 + 48 | Tabla de preview con create/update/error por fila y confirmación íntegra, filtros visibles de descarga. |
| Bloqueo/desbloqueo | 29 + 48 | Estado cerca de la ubicación, motivo e historial; indicar trabajo suspendido sin ocultar cantidades. |
| Estados móviles y alternativa sin 3D | 48 | Identidad compartida con controles nativos y listas legibles; no comprimir el editor de escritorio en 360 px. |

Reutilizar tipografía/tokens entre módulos es coherencia del producto; no equivale
a clonar un template completo. Al implementar cada superficie se vuelve a
consultar el MCP con su problema concreto y se registra si una referencia se
mantiene, se sustituye o no resulta adecuada.

## Preferencias recuperadas y límites

Se respetan las reglas negativas de score -1: sin serif de sistema en titulares,
texto con degradado, números decorativos, etiquetas con destellos, blobs difusos,
features numeradas, grids genéricos de iconos, flechas diagonales decorativas ni
fotos teñidas artificialmente. Evitar el titular corto con punto final y texto
pegado a imágenes sin una relación de contenido. No copiar ningún sitio ni sus
assets para redistribuirlos dentro del WMS.

Preferencias positivas útiles: sans neutra, header legible logo/nav/CTA,
botones con respuesta sutil y sin flecha decorativa. Carruseles, rojo sobre negro
y efectos de scroll son pistas contextuales; no son requisitos de la app. No se
añaden solo porque el motor los enumere. El perfil propone fechas nativas: coincide
con usar controles nativos en filtros, sin desarrollar calendarios especiales.

Skills de UI consultadas para planificación: `impeccable`,
`design-taste-frontend`, `emil-design-eng`, `web-design-orchestrator`,
`3d-web-experience`, `mobile-native`, `animate` y `playwright`. `design-taste-frontend`
declara su foco en landing/marketing; sus pautas comerciales no se aplican a
tablas y trabajo operativo. No se está rediseñando una interfaz existente.

## Evidencia pendiente de implementación

Por cada módulo: consulta MCP y análisis → decisión original vinculada al flujo →
tokens/componentes implementados → captura desktop/móvil cuando aplique →
estados/interacciones/consola → corrección y comprobación. Evidencias propias en
`output/playwright/`; control D-REF de trazabilidad. La presencia de esta tabla
no acredita por sí sola RNF-12 de la aplicación terminada.
