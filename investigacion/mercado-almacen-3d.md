# Almacén 3D: mercado, límites y oportunidades de producto

Fecha de consulta: 28 de octubre de 2026, hora de Lima.

## Conclusión de la investigación

Ya existe una oferta amplia de gestión de almacenes con representación espacial, gemelos digitales, simulación y verificación física del inventario. El 3D, por sí solo, ofrece poca diferenciación. Una hipótesis razonable para un proyecto nuevo es combinar operación sencilla, datos verificables y mejoras medibles para un sector concreto.

Para priorizar se supone un primer cliente de distribución o repuestos en Latinoamérica que utiliza Excel, un ERP o un WMS y dispone de teléfonos Android. Es una hipótesis de segmento; esta investigación no incluye entrevistas ni confirma disposición de pago.

## Alcance y criterio de evidencia

- Se revisaron páginas de producto, documentación, preguntas frecuentes, novedades y fichas de módulos publicadas por los proveedores.
- Una función publicada es una capacidad **declarada o documentada**, no una capacidad probada mediante un piloto independiente.
- Una ausencia en una página no demuestra que el producto entero carezca de esa función. Las oportunidades señaladas como **no documentadas** requieren demostración comercial o pruebas.
- Una restricción explícita —por ejemplo, que un producto no sustituye al WMS— tiene más fuerza que una ausencia documental.
- No se obtuvo una comparación homogénea de costes de implantación, hardware, servicios, licencias y soporte. No se asignan precios supuestos a productos empresariales.
- Los estados «en tiempo real» dependen del método de captura. Un cambio del WMS, una importación periódica y una comprobación física son eventos distintos.

## 1. Sistemas existentes

### Gestión y visualización operativa

| Sistema | Capacidades publicadas relevantes | Alcance o condición a considerar |
|---|---|---|
| [Infor WMS](https://docs.infor.com/wms/2026.10/en-us/useradminlist/wms_vtw/hcc1641390759661.html) | Visual Work Viewer 3D, progreso de salida, inspección de ubicaciones, olas y reposiciones. | El visor requiere coordenadas y dimensiones de las ubicaciones. |
| [Oracle Fusion Cloud WMS, novedades 26D](https://docs.oracle.com/en/cloud/saas/readiness/logistics/26d/wms26d/26D-wms-wn-f51659.htm) | Vistas 2D, 3D y alámbrica; alertas por caducidad, conteo pendiente y capacidad. | Se construye desde las ubicaciones configuradas. Confirmar disponibilidad de la versión y configuración para cada instalación. |
| [Manhattan Active WM](https://www.manh.com/en-in/our-solutions/supply-chain-management-software/warehouse-management-system) | Representación digital de empleados y recursos, actuación operativa y planificación dinámica. | Es una plataforma de ejecución; la página consultada no basta para precisar cada capacidad de modelado geométrico. |
| [Odoo + Stock 3D View](https://apps.odoo.com/apps/modules/19.0/stock_3d_view) | Vista de ubicaciones, dimensiones y posiciones XYZ, capacidad y existencias. | El 3D de esta ficha corresponde a un módulo de Cybrosys, tercero. Evaluar compatibilidad y mantenimiento según versión. |
| [SGA3D, DDS Software](https://ddsoftware.es/pages/ddssga3d.html) | WMS con vista 3D, trazado de movimientos, aplicación Android, escaneo y API REST. | Competidor directo en español; reunir una demo y condiciones comerciales antes de evaluar profundidad y coste. |
| [Neuro+](https://neuroplus.mx/es/sistema-wms/) | Constructor gráfico, ocupación 3D, simulación de olas y operaciones de almacén. | Su FAQ indica consultoría integral en los dos primeros CEDIS. Es evidencia de oferta en Latinoamérica. |

El visor de inventario de Infor también documenta acciones como retener ubicaciones, programar movimientos y ajustar cantidades: [Visual Inventory Overview](https://docs.infor.com/wms/2022.x/en-us/useradminlib_op/sceinmgtug/inventory_management/facility_viewer_help.html). Por ello, «hacer acciones desde el 3D» tampoco es una novedad por sí sola.

### Capas de análisis, simulación y gemelo digital

| Sistema | Capacidades publicadas relevantes | Alcance o condición a considerar |
|---|---|---|
| [Logivations W2MO](https://www.logivations.com/en/solutions/digital-twin/) | Diseño, simulación, slotting, recorridos, capacidad y seguimiento por cámaras. | La captura física automática se apoya en cámaras; distinguirla de una conexión a datos del WMS. |
| [WareBee](https://warebee.com/faq/) | Importación CSV/XLS o API, gemelo, optimización y simulación. | Explica expresamente que no es un WMS; se apoya en él para ejecutar transacciones. Su prueba es de pago. |
| [Synkrato](https://synkrato.com/product-overview/) | Gemelo 3D, simulación, recomendaciones de ubicación, movilidad y agentes de IA. | Se presenta como una capa de decisión sobre sistemas existentes. |
| [Simcad / Digital Twin Studio](https://www.createasoft.com/our-solutions/digital-twin-studio/digital-twin/cloud-digital-twin) | Datos operativos conectados, reconstrucción histórica, predicción y recomendaciones. | Referencia importante contra la idea de que el replay histórico falta en el mercado. |
| [FlexSim](https://www.flexsim.com/digital-twin/) | Modelos 3D, simulación e integración de datos, incluso en intervalos de tiempo real. | Es software para construir modelos y soluciones; requiere modelar el proceso y configurar la conexión. |
| [Spatial Map](https://spatialmap.io/solutions/inventory) | Racks y celdas coloreados por inventario, informes y conexión a fuentes externas. | Explica que el WMS conserva los registros de pedidos y stock. Anuncia Pro por USD 60/mes para hasta cuatro instalaciones. |

Spatial Map también anuncia una edición alojable por el cliente: [publicación sobre código abierto](https://spatialmap.io/open-source). La existencia de esta oferta impide asumir que alojar el producto por cuenta propia sería una diferenciación suficiente.

### Captura física y confianza del inventario

| Sistema | Capacidades publicadas relevantes | Alcance o condición a considerar |
|---|---|---|
| [Dexory / DexoryView](https://www.dexory.com/solutions) | Robot que escanea el almacén, gemelo digital, discrepancias y análisis de ocupación. | La propuesta de captura física incluye robots y sensores. |
| [Gather AI](https://gather.ai/faqs) | Captura mediante drones y cámaras en vehículos de manutención, contraste con WMS y conteo. | Ya no conviene describirlo como una solución exclusivamente de drones. |
| [Verity](https://www.verity.net/deployment) | Despliegue de drones para datos e inteligencia de inventario; intercambio de archivos o API. | Requiere evaluar el sitio y desplegar la captura física. |
| [RGIS Inventory Integrity Twin](https://www.rgis.com/enterprise/inventory-integrity-twin-iit/) | Verificación física, conciliación, controles y evidencia auditable. | Es un competidor adyacente para confianza y verificación; la fuente consultada no demuestra un visor 3D equivalente. |
| [Datanomous Digital Twin](https://datanomous.co.uk/platform/twin/) | Confianza por dato, historial de decisiones y reconstrucción de momentos anteriores. | La confianza del dato y el registro de decisiones ya se anuncian comercialmente; validar profundidad mediante demo. |

### Referencia adyacente

[SAP Warehouse Insights](https://help.sap.com/docs/SAP_WAREHOUSE_INSIGHTS/0634cffdf5ef4b799503657d1f274dfd/1aae5bf4b18e465c850c43c11e0c934e.html) documenta layout, recorridos, optimización de recursos y posiciones con IoT. No se equipara aquí su layout con un gemelo 3D nativo: la documentación consultada no justifica esa equivalencia.

Mecalux también publicó el uso de Easy S junto con Easy WMS para simulación 3D: [artículo de simulación](https://www.mecalux.com.mx/articulos-de-logistica/simulacion-almacen). Es una referencia histórica; confirmar los nombres y disponibilidad actuales de esas herramientas antes de incluirlas en una compra o integración.

## 2. Funciones que ya existen y conviene tratar como base

| Función | Ejemplos documentados |
|---|---|
| Almacén 3D con inventario por ubicación | Infor, Oracle, Spatial Map, módulos de Odoo. |
| Acciones operativas desde una vista espacial | Infor Visual Inventory. |
| Importación de archivos y conexión a sistemas existentes | WareBee y Spatial Map. |
| Slotting: decidir dónde ubicar cada producto | W2MO, WareBee y Synkrato. |
| Simulación antes de cambiar la operación | FlexSim, Simcad, W2MO y WareBee. |
| Reproducción del pasado | Digital Twin Studio y Datanomous. |
| Verificación del inventario frente al mundo físico | Dexory, Gather AI, Verity y RGIS. |
| Confianza del dato | Datanomous. |
| Conteo y operación apoyados por códigos de barras | Odoo, SGA3D y numerosos WMS. |

El modo sin conexión tampoco puede presentarse como inexistente: [Odoo Inventory](https://www.odoo.com/app/inventory) anuncia operaciones y escaneo offline. Eso no demuestra que todos sus flujos funcionen durante una desconexión prolongada; requiere una prueba de los escenarios concretos.

W2MO anuncia integración con modelos de lenguaje: [página del proveedor](https://logivations.com/en/). Añadir un chat sobre el almacén ofrece valor únicamente si resuelve tareas mejor que las alternativas, con evidencia y control de acciones.

## 3. Límites documentados que sí abren decisiones de producto

| Límite observado | Oportunidad concreta | Qué no se puede concluir |
|---|---|---|
| Infor exige geometría de ubicaciones; Oracle exige configuración de ubicaciones e indicadores. | Alta asistida del almacén y diagnóstico de datos antes de generar el mapa. | Que ningún proveedor pueda automatizar el alta mediante otros módulos o servicios. |
| WareBee y Spatial Map explican que complementan al WMS. | Ofrecer un núcleo operativo para clientes que aún no tienen WMS, o integrarse a uno existente. | Que les falte esa función por error: es una decisión de alcance. |
| La captura física de Dexory, Gather AI y Verity utiliza equipos de observación. | Ruta de verificación manual con teléfono para clientes que no desplegarán esa infraestructura. | Que pueda ofrecerse la misma cobertura automática usando solo software. |
| WareBee declara una prueba de pago. | Demo autoservicio y piloto sencillo con datos del cliente. | Que las pruebas gratuitas sean una novedad: Spatial Map ya anuncia una. |
| Neuro+ describe consultoría para los dos primeros CEDIS. | Paquete de configuración para un sector muy definido, con implantación repetible. | Que todos los clientes o proveedores necesiten proyectos largos. |

Estas son diferencias relativas entre productos. No se ha demostrado una función importante que esté ausente de todo el mercado.

## 4. Listado de funcionalidades para agregar valor

Las prioridades son una valoración de producto para el segmento supuesto, no puntuaciones obtenidas de un estudio de clientes. P0: primera entrega; P1: después de validar el núcleo; P2: especialización posterior.

### 1. Estado del sistema frente a evidencia física — P0

Cada ubicación muestra por separado la cantidad registrada, lo observado, la fecha de cada dato, el origen y las discrepancias abiertas. La vista señala «dato desactualizado» o «sin verificar» en vez de usar el mismo color de una ubicación confiable.

**Valor:** evitar búsquedas inútiles y decisiones sobre existencias que solo aparecen en el sistema.

**Situación competitiva:** verificación y confianza ya existen en RGIS, Datanomous y soluciones de captura. La hipótesis diferenciadora sería hacerlas claras, operativas y accesibles dentro de un producto para el nicho elegido.

**Prueba de aceptación:** importar un archivo antiguo no puede aumentar la frescura de una observación física más reciente. Una puntuación de confianza debe explicar sus factores; no debe mostrarse como probabilidad estadística sin calibración.

### 2. Conciliación guiada mediante teléfono — P0

Escanear la ubicación y el producto, introducir el conteo, adjuntar una foto y contrastar los movimientos ocurridos desde la última verificación. La diferencia genera una tarea; un ajuste requiere el permiso correspondiente.

**Valor:** comprobar existencias con dispositivos disponibles, sin empezar por una flota robótica.

**Situación competitiva:** los escáneres y conteos móviles ya existen. El valor a probar es cerrar el ciclo mapa → evidencia → explicación → resolución.

**Prueba de aceptación:** una foto no modifica cantidades automáticamente; queda asociada a su momento y contexto. Una observación no equivale por sí sola a stock disponible para venta.

### 3. Operación offline con conflictos explícitos — P0

Permitir captura y tareas preparadas sin señal. Al volver la conexión, detectar dobles reservas, tareas canceladas, movimientos repetidos y ubicaciones ocupadas. El operario recibe una instrucción de resolución o un conteo de comprobación.

**Valor:** continuidad en zonas sin cobertura y menos correcciones silenciosas.

**Situación competitiva:** offline ya existe. La combinación exacta de flujos, restricciones y explicación espacial debe contrastarse en demos; no se presume ausente.

**Prueba de aceptación:** dos teléfonos que disputan la última unidad no pueden terminar generando dos confirmaciones válidas. La aplicación debe distinguir trabajo capturado de trabajo aceptado por el sistema central.

### 4. Alta desde Excel con diagnóstico visible — P0

Mapear columnas y unidades; señalar productos duplicados, códigos de ubicación ambiguos, cantidades inválidas y dimensiones ausentes. Generar racks por patrones y etiquetas imprimibles. Marcar cualquier geometría aproximada hasta que sea verificada.

**Valor:** reducir el trabajo necesario antes de usar el producto.

**Situación competitiva:** WareBee y Spatial Map ya importan datos. La hipótesis es resolver mejor los archivos y nomenclaturas del sector elegido, no inventar la importación.

**Prueba de aceptación:** el usuario puede revisar errores y previsualizar el resultado antes de confirmar. Una segunda carga idéntica no duplica el inventario.

### 5. Historia de lo ocurrido y de lo que se sabía — P1

Conservar la fecha real del movimiento y la fecha de recepción en el sistema. Permitir preguntar tanto «¿qué había a las 10:00?» como «¿qué información tenía el supervisor a las 10:00?». Mostrar correcciones y evidencia asociada.

**Valor:** explicar decisiones que parecían correctas y fallaron por datos retrasados.

**Situación competitiva:** replay ya existe. No se encontró en las páginas consultadas una explicación completa de esta experiencia exacta; eso es una hipótesis documental, no prueba de exclusividad.

**Base técnica disponible:** [GS1 EPCIS](https://ref.gs1.org/epcis/ObjectEvent) distingue `eventTime` y `recordTime` y contempla declaraciones de error. Conviene aprovechar conceptos existentes.

**Prueba de aceptación:** un movimiento recibido a las 11:00, pero ocurrido a las 09:00, no borra el registro de lo que el sistema sabía a las 10:00.

### 6. Cambios de layout convertidos en trabajo verificable — P1

Mantener layout actual, propuesta y versión en implantación. Si se modifica un rack ocupado, generar las reubicaciones necesarias y sus dependencias. Activar la nueva configuración cuando termine la comprobación física.

**Valor:** impedir que un cambio de dibujo produzca un almacén digital que deja de representar la operación real.

**Situación competitiva:** diseño y simulación ya existen. Simcad incluso publica planes de implantación de re-slotting: [simulación de almacenes](https://www.createasoft.com/warehouse-Simulation). El ciclo exacto de versiones y confirmaciones exige comparación adicional.

**Prueba de aceptación:** mover un rack en un escenario de planificación no desplaza las existencias del entorno operativo.

### 7. Conteos priorizados por riesgo y coste — P1

Recomendar qué verificar combinando valor de la mercancía, discrepancias anteriores, antigüedad de la evidencia y pedidos próximos. Incorporar un presupuesto de minutos para contar.

**Valor:** gastar tiempo de verificación donde puede evitar más errores operativos.

**Situación competitiva:** no se presenta como una invención; compite con conteo cíclico avanzado y plataformas de integridad. La utilidad se valida comparando con ABC y con la práctica actual del cliente.

**Prueba de aceptación:** medir discrepancias relevantes encontradas por hora de conteo y fallos posteriores en preparación de pedidos.

### 8. Alertas que explican el pedido afectado — P1

Relacionar una discrepancia o ubicación bloqueada con pedidos, vencimientos de despacho y alternativas disponibles. Presentar una causa probable separada de los hechos comprobados y de las recomendaciones.

**Valor:** ayudar a elegir qué resolver primero, en lugar de producir más avisos.

**Situación competitiva:** [Blue Yonder WES](https://blueyonder.com/solutions/warehouse-management/warehouse-execution) ya documenta prioridades dinámicas y dependencias entre reposición y pedidos. La oportunidad sería una implementación adecuada al segmento y sus datos.

**Prueba de aceptación:** cada alerta enlaza los datos que la dispararon y conserva responsable, acción y resultado.

### 9. Reubicación con coste de ejecución y resultado posterior — P1/P2

Antes de recomendar un movimiento, considerar mano de obra, equipo, interrupción y demanda esperada. Tras ejecutarlo, contrastar el beneficio observado con el estimado.

**Valor:** evitar reorganizaciones que ahorran recorridos, pero cuestan más de lo que recuperan.

**Situación competitiva:** la optimización económica ya existe; [Synkrato](https://synkrato.com/guides/warehouse-slotting-optimization/) incluye reubicación y costes operativos en su explicación de slotting. Diferenciarse exige mejores datos del nicho o una ejecución más sencilla.

**Prueba de aceptación:** separar ahorro estimado de ahorro observado y registrar cambios de volumen que puedan explicar el resultado.

### 10. Restricciones físicas y operativas explicables — P1/P2

Explicar por qué una ubicación no sirve: dimensiones, carga declarada, equipo requerido, estado de calidad, temperatura o incompatibilidad definida por el cliente. Ofrecer alternativas viables según esas reglas.

**Valor:** prevenir propuestas imposibles y hacer comprensibles los bloqueos.

**Situación competitiva:** estas reglas ya aparecen en soluciones avanzadas; WareBee documenta auditorías de peso, dimensiones y mercancías peligrosas: [plataforma](https://warebee.com/digital-twin/). La mejora sería precisión y claridad para una operación concreta. La validación de reglas no equivale a una certificación estructural del rack.

**Prueba de aceptación:** cada rechazo identifica la regla y el dato faltante; la ausencia de peso o capacidad no se trata como capacidad infinita.

### 11. Entrega de turno ligada al mapa — P1

Preparar un resumen de discrepancias pendientes, zonas bloqueadas, mercancía en tránsito interno y tareas sin terminar. Permitir notas y evidencias asociadas a una ubicación, con reconocimiento del siguiente turno.

**Valor:** conservar contexto cuando cambia el equipo y evitar problemas que se redescubren cada mañana.

**Situación competitiva:** hay plataformas con tareas, colaboración y trazabilidad. No se verificó la ausencia general de este flujo; es una hipótesis de producto que debe contrastarse con supervisores.

**Prueba de aceptación:** una nota del turno anterior conserva contexto y dueño; las resueltas dejan de aparecer como pendientes sin desaparecer del historial.

### 12. Modelo y eventos portables — P2

Exportar ubicaciones, geometría, jerarquías, movimientos, evidencias referenciadas y reglas en formatos documentados. Permitir migración y conexión con sistemas diferentes sin rehacer todo el modelo.

**Valor:** reducir el coste de cambio y facilitar que integradores adopten el producto.

**Situación competitiva:** ya existen APIs, código abierto y estándares; la portabilidad no es exclusiva. El valor estaría en su cobertura y en demostrar que el modelo se puede reconstruir.

**Prueba de aceptación:** exportar un almacén y reconstruirlo en una instalación vacía conservando identificadores, relaciones e historial permitido.

## 5. Qué construir primero

### Primera entrega utilizable

1. Productos, unidades y presentaciones; almacenes, zonas y ubicaciones.
2. Recepciones, ubicaciones, movimientos, reservas y preparación de pedidos.
3. Conteos, discrepancias y ajustes autorizados.
4. Importación y exportación con validación e identificadores estables.
5. Vistas 2D, tabla y 3D sobre los mismos registros.
6. Escaneo móvil, roles e historial de operaciones.
7. Separación de stock físico, reservado, bloqueado y disponible.

La operación completa depende del segmento: lotes, series, caducidad y devoluciones deben entrar desde el principio cuando el cliente los necesite. Un visor conectado a un WMS puede delegar estas funciones; un WMS nuevo necesita implementarlas.

### Primer conjunto diferenciador a probar

Combinar las funcionalidades 1, 2, 3 y 4: datos verificables, conciliación mediante teléfono, desconexión controlada y alta asistida. Constituyen una propuesta comprobable, aunque sus piezas ya existan en el mercado.

### Después de un piloto

Añadir historia temporal, entrega de turno, alertas por pedidos y layout versionado. Introducir optimización avanzada cuando existan datos operativos suficientes para medir si mejora el trabajo.

## 6. Validación antes de ampliar el proyecto

Buscar entre tres y cinco almacenes del mismo sector. Es una recomendación de trabajo inicial, no una muestra que permita estimar todo el mercado.

Solicitar un archivo de inventario anonimizado, su esquema de ubicaciones, ejemplos de incidencias y una observación de cómo trabajan. Medir primero el proceso actual y después el piloto.

| Métrica | Qué permite comprobar |
|---|---|
| Tiempo hasta importar un archivo válido y localizar productos | Si el alta es realmente sencilla. |
| Tiempo para encontrar y confirmar mercancía | Si la representación espacial ayuda. |
| Diferencias entre sistema y conteo, y tiempo de resolución | Si la conciliación mejora el inventario. |
| Preparaciones fallidas por ubicación o existencia incorrecta | Si el producto reduce un problema operativo. |
| Tiempo de conteo y discrepancias relevantes detectadas | Si la priorización de verificaciones funciona. |
| Conflictos tras reconectar y correcciones manuales necesarias | Si el modo offline es fiable. |

No prometer porcentajes de mejora sin una línea base y un piloto comparable.

## 7. Guion para comprobar supuestas carencias de competidores

Pedir una demostración con datos y escenarios concretos:

1. Cargar un CSV con duplicados, unidades distintas y ubicaciones incompletas. Ver qué se rechaza, qué se propone y qué se inventaría si no se controla.
2. Desconectar dos dispositivos y hacer que disputen la última unidad o la misma ubicación. Observar el resultado al reconectar.
3. Registrar tarde un movimiento y reconstruir tanto la situación física estimada como la información que tenía el supervisor anteriormente.
4. Contrastar una fotografía o conteo físico con stock registrado, incluyendo movimientos intermedios.
5. Cambiar un rack ocupado dentro de un escenario. Comprobar si conserva separado el almacén operativo y cómo genera trabajo de implantación.
6. Seguir una recomendación hasta la tarea ejecutada y su resultado, con autorización, evidencia y costes.
7. Exportar y reconstruir el modelo, revisando identificadores, geometría e historial.

Estos resultados permitirían reemplazar «no documentado» por «presente», «disponible con personalización», «en desarrollo» o «ausencia confirmada para esa versión y configuración».

## Propuesta de posicionamiento inicial

**Un almacén visual para distribuidores que permite localizar, verificar y corregir existencias con los dispositivos que ya tienen, y explica qué información está desactualizada.**

El siguiente paso útil sería elegir el sector y validar el flujo con almacenes reales. Esta investigación encuentra competencia y funciones aprovechables; no demuestra todavía un hueco comercial exclusivo ni demanda suficiente para un producto generalista.
