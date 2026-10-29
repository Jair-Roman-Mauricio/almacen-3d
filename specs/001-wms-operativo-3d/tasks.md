# Tareas 001 — WMS operativo con editor visual y almacén 3D

Estado: **aprobado; T001–T010 completadas**, 29/10/2026. Deriva de [spec.md](spec.md) y [plan.md](plan.md), con [contratos](contratos.md), [trazabilidad del plan](trazabilidad-plan.md) y [referencias UI](referencias-ui.md). El usuario aprobó el plan mediante «si»; la ejecución autorizada cubrió T001–T010; las demás tareas siguen pendientes. La aprobación se registra en [el estado del flujo](../../docs/flujo-sdd.md) sin reescribir los documentos acordados.

[Actualizado 2026-10-29 · C1/D23/RNF-9] Migración técnica a pnpm solicitada y autorizada por el usuario; no se renumeran tareas ni se desmarcan las completadas. T011 continúa pendiente.

## Reglas de trabajo y notación

- Orden estricto de dependencia: cada tarea requiere las casillas de todas sus dependencias cumplidas; un número menor no sustituye esa comprobación.
- **Estimaciones de esfuerzo activo**, no fechas ni promesas: cada tarea está dimensionada a 25 o 30 minutos. Descargas, respuestas del usuario y correcciones imprevistas no se consideran trabajo ya resuelto; si una tarea resulta mayor, se propone dividirla antes de continuar, sin marcarla cumplida.
- Notación: **RF** incluye requisitos funcionales y no funcionales; **Dep.** son tareas anteriores; **Hecho cuando** es la comprobación exigida, no una descripción de estado deseado. Las tareas de base/cierre pueden usar «—» con motivo.
- En toda tarea de comportamiento, incluida UI: escribir primero la prueba del criterio y de los casos CL asignados, ejecutarla en rojo por el motivo correcto, implementar y verificarla en verde. Infraestructura se verifica con su comprobación concreta; no añadir pruebas que solo repitan la configuración.
- Solo marcar `- [x]` con evidencia ejecutada del criterio y regresión pertinente. Registrar comando, resultado real, artefacto y requisitos cubiertos; no marcar una fase porque existan sus archivos.
- Los comandos vigentes usan **pnpm**, conforme a la enmienda técnica de C1/D23; la fase 0 habilitó su base. Los criterios técnicos de T001–T010 se adaptan a pnpm por petición expresa; sus resultados iniciales se distinguen de la revalidación posterior. Un comando se usa cuando la tarea que lo introduce está terminada; antes de eso se comprueba la configuración/artefacto específico. No atribuir resultados a una suite ausente.
- Usar PostgreSQL real en aislamiento, RLS, atomicidad y carreras; conexiones separadas con sincronización explícita. Un mock o dos peticiones secuenciales no acreditan concurrencia.
- En UI, leer las skills obligatorias antes del código: impeccable, design-taste-frontend para landing, emil-design-eng y web-design-orchestrator; animate para movimiento, mobile-native para móvil, 3d-web-experience para el visor y break-ui al revisar datos extremos. Completar el contexto/dirección de Impeccable con el producto ya aprobado antes de sus primeras superficies.
- **Condición transversal de cada tarea UI:** usar el MCP Awwwards Inspiration (nombre técnico `awwwards-inspiration`, mediante el cliente local documentado), registrar análisis/decisión por módulo y verificar por Playwright CLI la porción cambiada: screenshots desktop/móvil cuando aplique, consola, estados e interacción. Corregir defectos antes de marcar; el editor se exige en desktop 1280×720 y las operaciones móviles en 360×800. No esperar al cierre para hacer QA de una pantalla.
- La fuente de UI es el producto real: sin copiar templates, fabricar testimonios/métricas, añadir servicios cloud o exigir NotebookLM. No crear una variante Figma/Stitch no solicitada. Las fixtures visuales de revisión no agregan nuevas funciones públicas al WMS.
- Spec, plan, contratos y constitución se conservan. Un hueco o contradicción real se informa antes de alterar el acuerdo; los pequeños nombres auxiliares se registran como detalle de implementación. Referencias y trazabilidad se completan de manera aditiva con evidencia, sin redefinir decisiones aprobadas.
- Cada fila de casos límite/CF al final forma parte de las comprobaciones de sus tareas asignadas aunque su criterio principal sea más breve. Una familia de test prevista no cuenta como ejecución.
- Desarrollo y demostración locales; sin cobros ni despliegue Railway en estas tareas. El usuario autorizó por separado el commit/push inicial a GitHub y el cambio a pnpm; no se extiende esa autorización a despliegues. No modificar credenciales de herramientas globales ni volúmenes de datos ajenos.

## Resumen por fase

| Fase | Tareas | Cantidad | Esfuerzo base estimado |
|---|---|---:|---:|
| 0 — Base técnica y herramientas | T001–T010 | 10 | 265 min |
| 1 — Valores y reglas puras | T011–T019 | 9 | 240 min |
| 2 — Persistencia y aislamiento | T020–T031 | 12 | 315 min |
| 3 — Transacciones y referencias de operación | T032–T037 | 6 | 160 min |
| 4 — Alta, sesiones y equipo | T038–T052 | 15 | 395 min |
| 5 — Almacenes, geometría y catálogo | T053–T062 | 10 | 270 min |
| 6 — Inventario, bloqueos e historial | T063–T072 | 10 | 265 min |
| 7 — Pedidos, reservas, picking y despacho | T073–T084 | 12 | 315 min |
| 8 — Traslados, conteos y ajustes | T085–T095 | 11 | 290 min |
| 9 — Reportes e intercambio de archivos | T096–T113 | 18 | 485 min |
| 10 — Avisos entre sesiones y datos de demostración | T114–T118 | 5 | 135 min |
| 11 — Fundamentos de interfaz | T119–T130 | 12 | 330 min |
| 12 — Acceso, administración y catálogo en pantalla | T131–T140 | 10 | 260 min |
| 13 — Editor visual y visor 3D | T141–T153 | 13 | 345 min |
| 14 — Operaciones y reportes en pantalla | T154–T176 | 23 | 585 min |
| 15 — Landing, modalidades y demostración | T177–T182 | 6 | 155 min |
| 16 — Instalación, recuperación y equivalencia de modalidades | T183–T193 | 11 | 290 min |
| 17 — Perfil y mediciones de rendimiento | T194–T204 | 11 | 295 min |
| 18 — QA transversal y cierre | T205–T214 | 10 | 295 min |

Total: **214 tareas**. Suma orientativa: 5690 minutos de esfuerzo base; no es una fecha de entrega ni contempla iteraciones desconocidas. Los objetivos de volumen/latencia solo se acreditan al ejecutar la fase 17.

Riesgos principales: barreras y orden de locks (fase 3), revalidación/recuperación de archivos (fase 9), editor con stock concurrente (fases 5/13), aislamiento del stream (fase 10) y medición real bajo carga (fase 17). No se han detectado decisiones de producto pendientes; las versiones propuestas se comprobarán tempranamente en la fase 0.

## Bloque inicial propuesto

Tras la aprobación de estas tareas, se propone comenzar **T001–T010 (fase 0)** de forma continua, sin pedir confirmación entre ellas, deteniéndose ante un fallo persistente o contradicción que impida seguir. Este alcance solo se ejecutará si el usuario lo acepta; las demás tareas quedan ordenadas para los siguientes bloques acordados.

## Fase 0 — Base técnica y herramientas

- [x] **T001 Prepara el workspace y los límites de capas.** Crea los manifiestos raíz, paquetes vacíos y reglas automáticas de imports permitidos del plan.
  RF: — (andamiaje técnico habilitante del stack y las verificaciones del plan) · Dep.: — · Est.: 30 min.
  Hecho cuando: El manifiesto raíz declara los workspaces del plan y la configuración de lint contiene las prohibiciones automáticas domain→framework/SQL/red y ui→database; su ejecución se conecta en T005.

- [x] **T002 Fija el runtime y las dependencias base.** Prepara Node/pnpm locales al proyecto, versiones del plan y lockfile sin cambiar el Node global.
  RF: RNF-9 · Dep.: T001 · Est.: 25 min.
  Hecho cuando: `pnpm install --frozen-lockfile` termina con las versiones base registradas en el informe de compatibilidad, sin resolver a latest.

- [x] **T003 Inicializa Nest y su compilación ESM.** Crea el arranque de la API con TypeScript y compilación de decoradores según el plan.
  RF: — (andamiaje técnico habilitante del stack y las verificaciones del plan) · Dep.: T002 · Est.: 30 min.
  Hecho cuando: El build de apps/api produce el arranque ESM ejecutable con Node 24 y no presenta errores de decoradores.

- [x] **T004 Inicializa la aplicación Next.** Prepara App Router, configuración y un Route Handler técnico de comprobación del servidor; las pantallas y layouts de producto se construyen en la fase UI.
  RF: — (andamiaje técnico habilitante del stack y las verificaciones del plan) · Dep.: T002 · Est.: 25 min.
  Hecho cuando: El build de apps/web arranca con las versiones Next/React aprobadas sin errores de peers.

- [x] **T005 Conecta los comandos de verificación.** Define lint, typecheck y build de todos los workspaces con el orden de compilación compartido.
  RF: — (andamiaje técnico habilitante del stack y las verificaciones del plan) · Dep.: T003, T004 · Est.: 25 min.
  Hecho cuando: `pnpm run lint`, `pnpm run typecheck` y `pnpm run build` verifican el workspace inicial completo.

- [x] **T006 Inicia Vitest con validación de entrada de cantidad.** Primero escribe y ejecuta su prueba en rojo. Introduce el primer test rojo de cantidad ausente/no finita y el borde de validación mínimo que permite ejecutarlo.
  RF: RF-107, RF-108 · Dep.: T005 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-VAL/cantidad-presente-finita después de haber registrado su fallo inicial.

- [x] **T007 Prepara PostgreSQL de desarrollo y de pruebas.** Configura volúmenes separados, credenciales locales y guardas contra ejecutar tests en la base habitual.
  RF: RNF-8, RNF-9 · Dep.: T005 · Est.: 25 min.
  Hecho cuando: La comprobación del entorno identifica PostgreSQL 18.6 y rechaza usar la URL habitual como destino de pruebas.

- [x] **T008 Crea el ejecutor de migraciones versionadas.** Prepara Drizzle/pg, diario de migraciones y exclusión de ejecuciones simultáneas con rol separado.
  RF: RNF-9 · Dep.: T007 · Est.: 25 min.
  Hecho cuando: `pnpm run db:migrate` aplica el diario sobre una base vacía y su segunda ejecución no repite cambios.

- [x] **T009 Conecta Supertest con PostgreSQL real.** Primero escribe y ejecuta su prueba en rojo. Prepara API compilada, fixtures aisladas y un ensayo de rollback de una transacción interrumpida.
  RF: RF-48, RNF-2 · Dep.: T008, T003, T006 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/rollback-inyectado usando una conexión PostgreSQL real.

- [x] **T010 Uniforma la validación y los errores HTTP.** Primero escribe y ejecuta su prueba en rojo. Conecta contratos Zod y serialización de error, rechazando campos desconocidos y datos mal formados.
  RF: RF-107, RF-108, RNF-1, RNF-2 · Dep.: T009 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/error-contract con code, message en español, details y requestId sin devolver éxito a una entrada inválida.

## Fase 1 — Valores y reglas puras

- [x] **T011 Implementa cantidades exactas y unidades.** Primero escribe y ejecuta su prueba en rojo. Amplía validación por unidad y la representación BigInt sin convertir a Number ni redondear.
  RF: RF-43, RF-51, RF-107, RF-108, RF-123, RF-124, RF-125, RF-182 · Dep.: T006 · Est.: 30 min.
  Hecho cuando: `pnpm run test:unit` pasa U-VAL/precision-unidades con enteros, cero de conteo, tres decimales y exceso de precisión.

- [x] **T012 Normaliza nombres y códigos.** Primero escribe y ejecuta su prueba en rojo. Implementa Unicode, recorte exterior, gramática y longitudes de la especificación.
  RF: RF-17, RF-35, RF-114, RF-127, RF-128, RF-142 · Dep.: T006 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-VAL/nombres-codigos con 160/64 caracteres, longitudes excedidas y claves equivalentes por mayúsculas.

- [x] **T013 Calcula filtros en la zona de empresa.** Primero escribe y ejecuta su prueba en rojo. Implementa zona por defecto, validación IANA e intervalo de días completos sin asumir días de 24 horas.
  RF: RF-129, RF-130, RF-131, RF-132, RF-133 · Dep.: T006 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-VAL/fechas-empresa en America/Lima y una zona con cambio horario, incluyendo ambos extremos.

- [x] **T014 Calcula saldos por línea y asignación.** Primero escribe y ejecuta su prueba en rojo. Define pendientes de reservar/preparar/despachar conservando unidad y saldos parciales.
  RF: RF-54, RF-57, RF-59, RF-60, RF-118, RF-119, RF-156, RF-157, RF-158, RF-159, RF-160 · Dep.: T011 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-BAL/saldos-linea con solicitado 100 y un avance de 40 sin mantener reservas consumidas.

- [x] **T015 Deriva el estado completo del pedido.** Primero escribe y ejecuta su prueba en rojo. Evalúa todas las líneas, sin mezclar unidades ni cancelar saldos por cuenta propia.
  RF: RF-62, RF-63, RF-120, RF-161, RF-162 · Dep.: T014 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-BAL/estado-pedido con líneas de unidades diferentes y estados parcial, completo y cancelable.

- [x] **T016 Modela el saldo en tránsito.** Primero escribe y ejecuta su prueba en rojo. Define salida, recibido y tránsito por línea con conservación por producto.
  RF: RF-174, RF-177, RF-178, RF-180, RF-181, RF-184, RF-186 · Dep.: T011 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-BAL/traslado-100-20 con total constante y tránsito no reservable.

- [x] **T017 Valida jerarquía y dimensiones exactas.** Primero escribe y ejecuta su prueba en rojo. Define cajas relativas en metros con precisión de cálculo derivada de sus valores.
  RF: RF-15, RF-16, RF-126, RF-189, RF-194 · Dep.: T006, T012 · Est.: 30 min.
  Hecho cuando: `pnpm run test:unit` pasa U-GEO/jerarquia-contencion con valores inválidos, contenedores anidados y coordenadas de muchos dígitos.

- [x] **T018 Detecta solo los solapamientos prohibidos.** Primero escribe y ejecuta su prueba en rojo. Comprueba interiores por tipo/contenedor y permite compartir únicamente bordes.
  RF: RF-190, RF-191, RF-192, RF-193, RF-198 · Dep.: T017 · Est.: 30 min.
  Hecho cuando: `pnpm run test:unit` pasa U-GEO/colisiones con zonas, racks, pasillos y ubicaciones, sin tratar padre-hijo ni bordes como colisión.

- [x] **T019 Deriva disponibilidad y alertas.** Primero escribe y ejecuta su prueba en rojo. Define disponible operativo con bloqueo y umbral opcional por producto/almacén.
  RF: RF-37, RF-40, RF-75, RF-76, RF-77, RF-78, RF-79, RF-178, RF-201 · Dep.: T011 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa U-BAL/disponibilidad-alerta en valores bajo/igual/sobre umbral, ausencia de umbral y ubicación bloqueada.

## Fase 2 — Persistencia y aislamiento

- [x] **T020 Migra empresa, instalación, equipo y sesiones.** Primero escribe y ejecuta su prueba en rojo. Añade tablas y unicidades del ámbito de acceso sin introducir cuentas globales.
  RF: RF-1, RF-9, RF-113, RF-114, RF-139, RF-140, RF-144, RF-145, RF-146, RF-149 · Dep.: T008, T012 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SET/esquema-identidad incluyendo correo repetido en empresas distintas y código global de empresa único.

- [x] **T021 Migra almacenes y elementos físicos.** Primero escribe y ejecuta su prueba en rojo. Añade jerarquía, versión de layout, claves de ámbito y códigos de ubicación.
  RF: RF-10, RF-17, RF-18, RF-22, RF-31 · Dep.: T020, T017 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/esquema-ambito al impedir padres o ubicaciones de otro almacén/empresa.

- [x] **T022 Migra productos y umbrales.** Primero escribe y ejecuta su prueba en rojo. Define unidad base, clave normalizada de SKU y umbral opcional por almacén.
  RF: RF-34, RF-35, RF-36, RF-75, RF-125 · Dep.: T021, T011 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CAT/esquema-producto con unicidad por empresa y conservación de identidad.

- [x] **T023 Migra posiciones y libro de inventario.** Primero escribe y ejecuta su prueba en rojo. Crea saldos exactos, revisión física, asientos y restricciones no negativas.
  RF: RF-37, RF-39, RF-40, RF-70, RF-71 · Dep.: T022 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/restricciones-db al rechazar físico negativo o reservado superior al físico sin redondear.

- [x] **T024 Migra pedidos y asignaciones de stock.** Primero escribe y ejecuta su prueba en rojo. Crea líneas y allocations con claves compuestas y acumulados del plan.
  RF: RF-50, RF-56, RF-118, RF-119, RF-160, RF-163 · Dep.: T023 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/esquema-pedido con relaciones de línea/producto/ubicación limitadas a su empresa y almacén.

- [x] **T025 Migra traslados y sus recepciones.** Primero escribe y ejecuta su prueba en rojo. Persiste líneas y etapas con origen/destino y cantidades exactas.
  RF: RF-171, RF-172, RF-174, RF-179, RF-180 · Dep.: T024 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/esquema-traslado al impedir extremos ajenos y saldo recibido mayor que salido.

- [x] **T026 Migra conteos y ajustes.** Primero escribe y ejecuta su prueba en rojo. Guarda observado, físico y revisión de referencia por producto/ubicación.
  RF: RF-64, RF-66, RF-69, RF-70, RF-109 · Dep.: T025 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CNT/esquema-conteo sin permitir referencias cruzadas de producto/ubicación.

- [x] **T027 Migra comandos, auditoría y outbox.** Primero escribe y ejecuta su prueba en rojo. Define referencia única por empresa, resultado persistente y registros de cambio.
  RF: RF-71, RF-72, RF-87, RF-102, RF-110, RF-111, RNF-14 · Dep.: T026 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/esquema-comando con referencia repetible entre empresas pero única dentro de una empresa.

- [x] **T028 Migra trabajos y filas de importación.** Primero escribe y ejecuta su prueba en rojo. Persiste staging, huellas, validaciones y estado sin tocar tablas operativas.
  RF: RF-80, RF-81, RF-88 · Dep.: T027 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/staging-aislado al guardar preview sin alterar catálogo ni stock.

- [x] **T029 Aísla el contexto de conexión y repositorios.** Primero escribe y ejecuta su prueba en rojo. Introduce contexto de empresa obligatorio por transacción y claves de repositorio acotadas.
  RF: RF-5, RNF-2 · Dep.: T028 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/pool-contexto alternando dos empresas, rollback y petición sin contexto.

- [x] **T030 Aplica RLS y privilegios mínimos.** Primero escribe y ejecuta su prueba en rojo. Activa políticas y separa rol de aplicación, provisión y migraciones.
  RF: RF-5, RF-72, RNF-2 · Dep.: T029 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/rls-sin-bypass incluyendo claves foráneas cruzadas y denegación de UPDATE/DELETE de asientos.

- [x] **T031 Añade índices de las consultas previstas.** Versiona índices por empresa y cursores estables de las entidades del plan.
  RF: RF-11, RF-27, RF-28, RF-38, RF-73, RF-89, RNF-11, RNF-13 · Dep.: T030 · Est.: 25 min.
  Hecho cuando: El informe de consultas identifica índices utilizables para SKU, ubicación, stock e historial dentro de cada empresa.

## Fase 3 — Transacciones y referencias de operación

- [ ] **T032 Centraliza transacciones y orden de bloqueos.** Primero escribe y ejecuta su prueba en rojo. Implementa la unidad de trabajo y las barreras compartidas/exclusivas descritas en §3.2.
  RF: RF-48, RF-61, RF-103, RF-121, RF-169, RF-170, RF-188, RF-197, RNF-2 · Dep.: T030, T009 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/orden-bloqueos en conexiones distintas sin transacciones anidadas independientes.

- [ ] **T033 Canoniza los datos de negocio.** Primero escribe y ejecuta su prueba en rojo. Define la huella por empresa, tipo, entidades y valores exactos, excluyendo metadatos de transporte.
  RF: RF-87, RF-102, RF-110, RF-111, RF-112 · Dep.: T011, T012, T027 · Est.: 25 min.
  Hecho cuando: `pnpm run test:unit` pasa I-CMD/huella-canonica con reordenación irrelevante y cambios reales de cantidad, ubicación o tipo.

- [ ] **T034 Persiste resultado y efectos conjuntamente.** Primero escribe y ejecuta su prueba en rojo. Implementa el ejecutor de comando síncrono con resultado inmutable y rollback total.
  RF: RF-48, RF-61, RF-87, RF-102, RF-104, RF-110, RF-111 · Dep.: T032, T033 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/commit-resultado al inyectar fallo antes y después de commit sin separar efecto de confirmación.

- [ ] **T035 Prueba los tres tipos de repetición.** Primero escribe y ejecuta su prueba en rojo. Distingue replay idéntico, referencia reutilizada con otros datos y acción nueva de contenido igual.
  RF: RF-87, RF-102, RF-110, RF-111, RF-112 · Dep.: T034 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/repeticion-tres-casos con resultado original, conflicto sin efecto y dos acciones independientes.

- [ ] **T036 Serializa reintentos simultáneos.** Primero escribe y ejecuta su prueba en rojo. Comprueba exclusión por referencia en conexiones distintas y retorno del único resultado.
  RF: RF-87, RF-102, RF-110 · Dep.: T035 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/replay-concurrente con un solo conjunto de efectos persistidos.

- [ ] **T037 Centraliza los asientos y su auditoría.** Primero escribe y ejecuta su prueba en rojo. Introduce el borde de reloj/actor/referencia y el registro inmutable vinculado al comando.
  RF: RF-49, RF-71, RF-72, RF-168, RF-187, RF-206 · Dep.: T034, T013 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-AUD/registro-inmutable con actor, fecha, referencia y deltas exactos; no existe borrado de confirmaciones.

## Fase 4 — Alta, sesiones y equipo

- [ ] **T038 Acota el acceso SQL de autenticación.** Primero escribe y ejecuta su prueba en rojo. Implementa directorio de empresa y funciones limitadas de credencial/sesión sin privilegios operativos globales.
  RF: RF-1, RF-4, RF-5, RF-149, RNF-2 · Dep.: T030, T020 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/adaptador-acceso al resolver solo cuentas de la empresa indicada sin permitir consultar inventario.

- [ ] **T039 Protege las contraseñas de las cuentas.** Primero escribe y ejecuta su prueba en rojo. Implementa hash Argon2id y validación de credenciales presentes sin transformar contraseñas.
  RF: RF-1, RF-2, RF-150, RF-151, RF-152 · Dep.: T038, T010 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/credenciales con hash verificable, correo inválido rechazado y contraseña preservada como entrada.

- [ ] **T040 Crea empresa y administrador SaaS de forma atómica.** Primero escribe y ejecuta su prueba en rojo. Conecta POST registrations y validación conjunta según modalidad.
  RF: RF-139, RF-140, RF-141, RF-142, RF-143, RF-150, RF-151, RF-152 · Dep.: T039, T012, T013 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SET/registro-saas con código de acceso devuelto y fallo entre empresa/admin sin alta incompleta.

- [ ] **T041 Resuelve registros SaaS concurrentes.** Primero escribe y ejecuta su prueba en rojo. Prueba unicidad de código normalizado sin modificar empresa existente.
  RF: RF-141, RF-142 · Dep.: T040 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SET/codigo-concurrente confirmando una sola pareja empresa-administrador.

- [ ] **T042 Implementa el asistente inicial del servidor local.** Primero escribe y ejecuta su prueba en rojo. Conecta estado público y alta conjunta bajo bloqueo de instalación.
  RF: RF-144, RF-145, RF-146, RF-147, RF-148, RF-150, RF-151, RF-152, RNF-3 · Dep.: T040 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SET/alta-local con modo correcto, creación conjunta y rechazo del segundo setup.

- [ ] **T043 Protege setup frente a carreras y reinicios.** Primero escribe y ejecuta su prueba en rojo. Verifica dos finalizaciones simultáneas y lectura de la instalación ya configurada.
  RF: RF-104, RF-147, RF-148 · Dep.: T042 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SET/setup-concurrente-reinicio conservando la primera configuración confirmada.

- [ ] **T044 Inicia sesión dentro de la empresa elegida.** Primero escribe y ejecuta su prueba en rojo. Conecta POST sessions y token opaco/cookie con errores de credencial uniformes.
  RF: RF-1, RF-2, RF-149, RF-150 · Dep.: T039, T040, T042 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/login-empresa con mismo correo en dos empresas y credenciales correctas solo en la empresa elegida.

- [ ] **T045 Exige sesión y permiso actuales.** Primero escribe y ejecuta su prueba en rojo. Conecta sesión actual y guard de roles al contexto de transacción; rechaza sesión ausente/inactiva.
  RF: RF-4, RF-5, RF-6, RF-7, RF-8, RNF-2 · Dep.: T044, T032 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/accion-protegida con 401/403 y usuario/rol leídos al confirmar.

- [ ] **T046 Revoca la sesión y protege mutaciones.** Primero escribe y ejecuta su prueba en rojo. Implementa cierre, cookie y controles CSRF/Origin del mismo origen.
  RF: RF-3, RF-4, RNF-2 · Dep.: T045 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/logout-csrf al rechazar el token revocado y una mutación de origen no autorizado.

- [ ] **T047 Crea cuentas del equipo en su empresa.** Primero escribe y ejecuta su prueba en rojo. Conecta usuarios con rol permitido, correo único por empresa y credenciales locales.
  RF: RF-6, RF-113, RF-114, RF-115, RF-150, RF-151, RF-152 · Dep.: T045, T034, T039 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/alta-equipo para admin y rechaza rol inválido, correo duplicado y creación por no administrador.

- [ ] **T048 Aplica roles y desactivación al siguiente acceso.** Primero escribe y ejecuta su prueba en rojo. Conecta PATCH users bajo barrera exclusiva de permisos.
  RF: RF-7, RF-8, RF-115, RNF-2 · Dep.: T047, T032 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/cambio-permisos con sesión ya abierta que pierde capacidad en la acción siguiente.

- [ ] **T049 Impide perder el último administrador activo.** Primero escribe y ejecuta su prueba en rojo. Comprueba el recuento bajo exclusión incluso con dos cambios simultáneos.
  RF: RF-9 · Dep.: T048 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/ultimo-admin-concurrente conservando al menos un administrador activo.

- [ ] **T050 Permite editar nombre y zona de empresa.** Primero escribe y ejecuta su prueba en rojo. Conecta GET/PATCH company y persiste America/Lima si no se elige otra zona.
  RF: RF-6, RF-127, RF-129, RF-130, RF-131 · Dep.: T045, T034, T013 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/perfil-empresa con zona válida aplicada y datos inválidos rechazados.

- [ ] **T051 Expone la consulta segura de resultado.** Primero escribe y ejecuta su prueba en rojo. Conecta GET operations/reference para resultado confirmado y referencias todavía sin resultado.
  RF: RF-49, RF-100, RF-101, RF-104, RF-110, RF-111 · Dep.: T045, T034 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/consultar-resultado sin ejecutar efectos ni mostrar datos a otra empresa/usuario desactivado.

- [ ] **T052 Audita el aislamiento de acceso y equipo.** Primero escribe y ejecuta su prueba en rojo. Cubre intentos cruzados por ruta, cuerpo y cambio de IDs con sesiones reales.
  RF: RF-5, RF-6, RF-7, RF-8, RF-113, RF-114, RF-149, RNF-2 · Dep.: T048, T049, T050, T051 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/identidad-rutas para empresas A/B y conexiones reutilizadas.

## Fase 5 — Almacenes, geometría y catálogo

- [ ] **T053 Registra y consulta almacenes.** Primero escribe y ejecuta su prueba en rojo. Conecta las rutas de almacén con códigos/dimensiones válidos y ámbito de empresa.
  RF: RF-10, RF-11, RF-127, RF-128 · Dep.: T045, T034, T021 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/alta-consulta-almacen con código duplicado y dimensiones inválidas rechazados.

- [ ] **T054 Conecta el catálogo y sus actualizaciones.** Primero escribe y ejecuta su prueba en rojo. Implementa alta/lista/cambio de nombre conservando SKU, unidad e identidad.
  RF: RF-34, RF-35, RF-36, RF-125, RF-127, RF-128 · Dep.: T045, T034, T022, T012 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CAT/catalogo-rutas con SKU duplicado normalizado y nombre editado sin cambiar identidad.

- [ ] **T055 Protege la eliminación del producto.** Primero escribe y ejecuta su prueba en rojo. Retira producto activo solo sin stock, reservas ni trabajo pendiente; mantiene historia.
  RF: RF-41, RF-72 · Dep.: T054, T032 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CAT/eliminacion-protegida para cada referencia persistente y no destruye asientos históricos.

- [ ] **T056 Recupera la distribución guardada.** Primero escribe y ejecuta su prueba en rojo. Conecta layout/locations con jerarquía e IDs persistidos y estado vacío.
  RF: RF-11, RF-18, RF-24, RF-33 · Dep.: T053 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/lectura-layout para almacén vacío, distribución guardada y acceso ajeno rechazado.

- [ ] **T057 Guarda distribuciones válidas sin alterar identidad.** Primero escribe y ejecuta su prueba en rojo. Implementa PUT layout con revisión y validación exacta de jerarquía/contención.
  RF: RF-15, RF-16, RF-17, RF-18, RF-22, RF-23, RF-126, RF-189, RF-194 · Dep.: T056, T017, T034 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/guardar-reabrir conservando IDs y cantidades anteriores.

- [ ] **T058 Rechaza colisiones con explicación por elemento.** Primero escribe y ejecuta su prueba en rojo. Integra detección por grupos e índice temporal de candidatos.
  RF: RF-190, RF-191, RF-192, RF-193, RF-197, RF-198, RF-199 · Dep.: T057, T018 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/solapamientos-api con ID/motivo y rollback completo frente a un único cambio inválido.

- [ ] **T059 Protege guardados concurrentes del editor.** Primero escribe y ejecuta su prueba en rojo. Serializa revisión de layout y retorna currentRevision en conflicto.
  RF: RF-116, RF-117 · Dep.: T058, T032 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/revision-concurrente conservando exclusivamente el primer layout válido.

- [ ] **T060 Rechaza cambios de elementos ocupados y descendientes.** Primero escribe y ejecuta su prueba en rojo. Comprueba posición/dimensiones/eliminación frente a stock o trabajo abierto al guardar.
  RF: RF-21, RF-195, RF-196, RF-197, RF-199 · Dep.: T059, T024, T025 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/ocupacion-descendientes con contenedor aparentemente vacío y referencias abiertas de sus hijos.

- [ ] **T061 Coordina edición y entrada de existencias.** Primero escribe y ejecuta su prueba en rojo. Prueba ambos órdenes de commit de guardar layout y crear stock/trabajo abierto.
  RF: RF-21, RF-22, RF-23, RF-195, RF-196, RF-197 · Dep.: T060, T032 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/ocupacion-carrera sin borrar ni mover ubicaciones que recibieron stock antes del guardado.

- [ ] **T062 Busca SKU y códigos de ubicación.** Primero escribe y ejecuta su prueba en rojo. Conecta búsqueda normalizada y lista de IDs de ubicaciones sin escribir inventario.
  RF: RF-27, RF-28, RF-29, RF-105 · Dep.: T056, T054, T031 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-GEO/busqueda-espacial con coincidencias, vacío y ausencia de efectos de stock.

## Fase 6 — Inventario, bloqueos e historial

- [ ] **T063 Consulta saldos por producto y ubicación.** Primero escribe y ejecuta su prueba en rojo. Conecta inventory/totals y detalle de ubicación con cursores y disponibilidad derivada.
  RF: RF-26, RF-37, RF-38 · Dep.: T056, T054, T019, T031 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/consultas-saldos con varios productos por ubicación y totales por almacén sin mezclar unidades.

- [ ] **T064 Confirma recepciones atómicas.** Primero escribe y ejecuta su prueba en rojo. Conecta entradas con saldos, revisión física, asientos y resultado persistido.
  RF: RF-42, RF-43, RF-44, RF-48, RF-49, RF-71 · Dep.: T063, T037, T034, T011 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/recepcion con incremento exacto o estado previo intacto ante fallo en cualquier línea.

- [ ] **T065 Prueba reintentos de una recepción real.** Primero escribe y ejecuta su prueba en rojo. Repite recepción con respuesta perdida, envío simultáneo y referencia de datos distintos.
  RF: RF-49, RF-102, RF-104, RF-110, RF-111, RF-112 · Dep.: T064, T036, T051 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/recepcion-real sin duplicar stock/asientos y conservando su resultado después de reiniciar la API.

- [ ] **T066 Confirma movimientos internos íntegros.** Primero escribe y ejecuta su prueba en rojo. Conecta origen/destino del mismo almacén y protección de stock no reservado.
  RF: RF-45, RF-46, RF-47, RF-48, RF-49, RF-103, RF-107 · Dep.: T064, T011, T032 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/movimiento con mismo origen, saldo insuficiente y fallo intermedio sin efectos parciales.

- [ ] **T067 Prueba competencia real por la última existencia.** Primero escribe y ejecuta su prueba en rojo. Ejecuta movimientos simultáneos sobre una posición y creación concurrente de saldo destino inexistente.
  RF: RF-39, RF-40, RF-48, RF-103 · Dep.: T066 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/ultima-existencia con conexiones distintas sin físico negativo ni escritura perdida.

- [ ] **T068 Bloquea y desbloquea con autorización y motivo.** Primero escribe y ejecuta su prueba en rojo. Conecta endpoints de ubicación y auditoría sin cancelar compromisos existentes.
  RF: RF-31, RF-201, RF-204, RF-205, RF-206, RF-207 · Dep.: T063, T037, T045 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-BLK/bloquear-desbloquear con rechazo por rol/motivo y trabajo pendiente preservado.

- [ ] **T069 Impide entradas y movimientos en ubicaciones bloqueadas.** Primero escribe y ejecuta su prueba en rojo. Integra la validación común en confirmaciones físicas y comprueba bloqueo posterior a abrir formulario.
  RF: RF-31, RF-48, RF-200, RF-201 · Dep.: T068, T064, T066 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-BLK/recepcion-movimiento-bloqueados en ambos extremos y ambos órdenes de commit.

- [ ] **T070 Comprueba acceso cruzado de inventario y geometría.** Primero escribe y ejecuta su prueba en rojo. Prueba todas las rutas disponibles de almacén, catálogo, stock, layout y bloqueos.
  RF: RF-5, RF-6, RF-10, RF-11, RF-24, RF-37, RF-42, RF-45, RF-200, RF-205, RNF-2 · Dep.: T069, T062, T061 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/inventario-geometria sin mutar ni revelar datos ajenos.

- [ ] **T071 Consulta historial y auditoría de la empresa.** Primero escribe y ejecuta su prueba en rojo. Conecta filtros por almacén/producto/fechas y lectura de autor/referencia sin borrado.
  RF: RF-49, RF-71, RF-72, RF-73, RF-131, RF-132, RF-133, RF-206 · Dep.: T064, T066, T013, T037, T045 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-AUD/filtros-historial incluyendo días extremos en zona de empresa desde cliente con otra zona.

- [ ] **T072 Reconcilia libro, saldos y consultas sin efectos.** Primero escribe y ejecuta su prueba en rojo. Verifica balances tras secuencias confirmadas y que búsquedas/GET nunca cambian inventario.
  RF: RF-23, RF-37, RF-39, RF-40, RF-71, RF-105 · Dep.: T071, T067, T062 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-INV/reconciliacion-libro antes y después de navegar consultas y guardar geometría válida.

## Fase 7 — Pedidos, reservas, picking y despacho

- [ ] **T073 Registra y consulta pedidos válidos.** Primero escribe y ejecuta su prueba en rojo. Conecta alta/lista/detalle con solicitado por línea y filtros de almacén.
  RF: RF-50, RF-51, RF-55, RF-107, RF-160 · Dep.: T054, T063, T024, T014, T045 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/alta-consulta-pedido con cantidades inválidas rechazadas y saldos por línea.

- [ ] **T074 Reserva cantidades parciales de un pedido.** Primero escribe y ejecuta su prueba en rojo. Compromete saldos en ubicaciones habilitadas sin reducir físico.
  RF: RF-52, RF-53, RF-54, RF-55, RF-156, RF-159, RF-160, RF-200 · Dep.: T073, T034, T066, T014, T068 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/reserva-parcial con disponible, saldo de pedido y bloqueo comprobados antes de confirmar.

- [ ] **T075 Protege reservas frente a dos competidores.** Primero escribe y ejecuta su prueba en rojo. Prueba competencia por stock y por saldo de línea, incluyendo líneas repetidas en una solicitud.
  RF: RF-40, RF-53, RF-103, RF-159, RF-169 · Dep.: T074 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/reserva-concurrente sin exceder físico ni pendiente de reservar aunque sobre stock en otro origen.

- [ ] **T076 Asigna y reasigna picking a un operario válido.** Primero escribe y ejecuta su prueba en rojo. Conecta responsable actual y auditoría conservando avances confirmados.
  RF: RF-163, RF-164, RF-166, RF-167, RF-168 · Dep.: T073, T048, T037 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/asignacion con inactivo/rol inválido/otra empresa rechazados y autor/fecha registrados.

- [ ] **T077 Registra preparación parcial desde reservas.** Primero escribe y ejecuta su prueba en rojo. Conecta avances por allocation y permiso del operario asignado actual.
  RF: RF-56, RF-57, RF-107, RF-157, RF-160, RF-165, RF-200 · Dep.: T074, T076, T014 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/picking-parcial sin reducir físico ni exceder lo reservado pendiente de preparar.

- [ ] **T078 Protege picking de carreras y reasignación tardía.** Primero escribe y ejecuta su prueba en rojo. Comprueba el responsable al commit y el saldo conjunto de avances simultáneos.
  RF: RF-7, RF-8, RF-164, RF-165, RF-166, RF-167, RF-170 · Dep.: T077, T048 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/picking-carrera al rechazar al operario anterior o inactivo y el avance que excede saldo.

- [ ] **T079 Despacha cantidades preparadas de forma atómica.** Primero escribe y ejecuta su prueba en rojo. Consume físico/reserva/preparación e incrementa despachado por línea.
  RF: RF-58, RF-59, RF-60, RF-61, RF-107, RF-118, RF-119, RF-158, RF-160, RF-200 · Dep.: T077, T037, T014 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/despacho-parcial con descuentos exactos o rollback total si alguna línea falla.

- [ ] **T080 Impide despachos repetidos y consumo concurrente excesivo.** Primero escribe y ejecuta su prueba en rojo. Distingue replay confirmado de nueva salida y protege saldo físico/reservado/preparado.
  RF: RF-60, RF-61, RF-102, RF-110, RF-118, RF-119, RF-120, RF-121 · Dep.: T079, T036 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/despacho-repetido-concurrente sin consumir dos veces la misma preparación.

- [ ] **T081 Completa un pedido en avances de 40 y 60.** Primero escribe y ejecuta su prueba en rojo. Integra estado derivado y saldos tras ambas rondas de reserva/preparación/despacho.
  RF: RF-156, RF-157, RF-158, RF-159, RF-160, RF-161, RF-162 · Dep.: T079, T075, T078, T015 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/ciclo-100-40-60 con estado parcial tras 40 y completo únicamente tras despachar 100.

- [ ] **T082 Cancela pedidos solo antes de preparar o despachar.** Primero escribe y ejecuta su prueba en rojo. Libera reservas del pedido permitido y rechaza cancelación después de avances.
  RF: RF-62, RF-63 · Dep.: T079, T073 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-OUT/cancelacion con reservas liberadas exclusivamente en pedido sin preparado ni despachado.

- [ ] **T083 Suspende el trabajo de reservas anteriores al bloqueo.** Primero escribe y ejecuta su prueba en rojo. Prueba reserva/preparación/despacho y su reanudación manual tras desbloqueo.
  RF: RF-110, RF-200, RF-201, RF-204, RF-207 · Dep.: T068, T081, T082 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-BLK/salida-suspendida conservando compromisos y devolviendo replay anterior sin nuevo movimiento.

- [ ] **T084 Comprueba permisos y empresa en todas las salidas.** Primero escribe y ejecuta su prueba en rojo. Audita pedidos, reservas, asignación, picking, despacho y cancelación con tres roles.
  RF: RF-5, RF-6, RF-7, RF-8, RF-55, RF-164, RF-165, RNF-2 · Dep.: T083, T052 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/salidas-rutas con acciones de supervisor/operario restringidas según matriz.

## Fase 8 — Traslados, conteos y ajustes

- [ ] **T085 Registra y consulta traslados de la empresa.** Primero escribe y ejecuta su prueba en rojo. Conecta origen/destino distintos y orígenes declarados como trabajo pendiente.
  RF: RF-171, RF-172, RF-177, RF-182 · Dep.: T025, T053, T054, T034, T016 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/registro-consulta con mismo almacén y empresa ajena rechazados sin cambiar stock.

- [ ] **T086 Confirma una salida de traslado.** Primero escribe y ejecuta su prueba en rojo. Descuenta mercancía no reservada e incorpora tránsito en la misma transacción.
  RF: RF-173, RF-174, RF-175, RF-176, RF-178, RF-182, RF-185, RF-186, RF-187, RF-200 · Dep.: T085, T066, T037 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/salida-100-20 dejando 80 en origen y 20 en tránsito, sin incrementar destino.

- [ ] **T087 Recibe mercancía en el almacén destino.** Primero escribe y ejecuta su prueba en rojo. Reduce tránsito y suma físico en destinos válidos, admitiendo confirmación parcial explícita.
  RF: RF-179, RF-180, RF-181, RF-182, RF-183, RF-184, RF-185, RF-186, RF-187, RF-200 · Dep.: T086, T064 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/recepcion con saldo pendiente correcto y estado recibido solo cuando todas las líneas quedan a cero.

- [ ] **T088 Protege etapas de traslado contra reintentos y carreras.** Primero escribe y ejecuta su prueba en rojo. Prueba segunda salida nueva, replay idéntico y recepciones simultáneas del mismo tránsito.
  RF: RF-102, RF-110, RF-111, RF-176, RF-181, RF-185, RF-188 · Dep.: T087, T036 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/etapas-concurrentes sin salida duplicada ni cantidad recibida superior a tránsito.

- [ ] **T089 Verifica conservación, reservas y bloqueos del traslado.** Primero escribe y ejecuta su prueba en rojo. Cubre no usar reservas ajenas, no reservar tránsito y rechazar cualquier extremo bloqueado.
  RF: RF-175, RF-177, RF-178, RF-183, RF-185, RF-186, RF-200 · Dep.: T088, T074, T068 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-TRA/conservacion-y-bloqueo por SKU después de cada etapa, incluidas solicitudes fallidas.

- [ ] **T090 Audita las rutas y roles de traslado.** Primero escribe y ejecuta su prueba en rojo. Comprueba destinos ajenos y permisos distintos para creación/salida/recepción.
  RF: RF-5, RF-6, RF-172, RF-183, RNF-2 · Dep.: T089, T084 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/traslados-rutas sin alterar inventario de ninguna empresa ante acceso cruzado.

- [ ] **T091 Registra conteos por producto y ubicación.** Primero escribe y ejecuta su prueba en rojo. Guarda observado, físico/revisión de referencia y diferencia sin cambiar saldo.
  RF: RF-64, RF-65, RF-66, RF-108, RF-109, RF-123, RF-124, RF-202 · Dep.: T026, T063, T011, T034 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CNT/conteo con cero válido y varias referencias de SKU separadas en una ubicación.

- [ ] **T092 Autoriza ajustes con motivo y protección de reservas.** Primero escribe y ejecuta su prueba en rojo. Conecta ajuste de conteo con físico actual, revisión, motivo y asiento.
  RF: RF-67, RF-68, RF-69, RF-70, RF-71, RF-203 · Dep.: T091, T074, T037 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CNT/ajuste-autorizado con motivo obligatorio y rechazo de físico menor que reservado.

- [ ] **T093 Rechaza referencias físicas desactualizadas.** Primero escribe y ejecuta su prueba en rojo. Prueba movimiento posterior, A→B→A, otro SKU y reserva posterior al conteo.
  RF: RF-65, RF-66, RF-69, RF-70 · Dep.: T092, T066 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CNT/revision-fisica sin aceptar ABA ni invalidar por un cambio exclusivamente de otro producto.

- [ ] **T094 Comprueba conteos y ajustes en ubicación bloqueada.** Primero escribe y ejecuta su prueba en rojo. Permite acciones autorizadas sin omitir revisión, motivo o protección de reservas.
  RF: RF-202, RF-203 · Dep.: T093, T068 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-BLK/conteo-ajuste-bloqueado con observación permitida y corrección inválida rechazada.

- [ ] **T095 Audita permisos y referencias de conteos.** Primero escribe y ejecuta su prueba en rojo. Comprueba rol para autorización y ámbito de producto/ubicación/conteo.
  RF: RF-5, RF-6, RF-109, RNF-2 · Dep.: T094, T090 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/conteos-rutas sin ajuste por operario ni por referencia de otra empresa.

## Fase 9 — Reportes e intercambio de archivos

- [ ] **T096 Consulta indicadores reales del almacén.** Primero escribe y ejecuta su prueba en rojo. Conecta agregados de productos, ubicaciones, pedidos y movimientos del intervalo.
  RF: RF-74, RF-131, RF-132, RF-133 · Dep.: T071, T081, T063 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-REP/indicadores con cantidades calculadas desde operaciones y sin sumar unidades de productos distintos.

- [ ] **T097 Configura umbrales de stock bajo.** Primero escribe y ejecuta su prueba en rojo. Conecta umbral opcional por producto/almacén y permisos de la matriz.
  RF: RF-75, RF-77, RF-79, RF-123, RF-124 · Dep.: T096, T019 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-REP/umbral con cero permitido y valor negativo/precisión inválida rechazados.

- [ ] **T098 Consulta el ciclo completo de alertas.** Primero escribe y ejecuta su prueba en rojo. Deriva alerta activa según disponible actual y detalle de producto/almacén.
  RF: RF-76, RF-77, RF-78, RF-79 · Dep.: T097, T074 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-REP/alerta-ciclo al activarse por debajo y desaparecer al igualar/superar el umbral.

- [ ] **T099 Recibe archivos dentro del límite aprobado.** Primero escribe y ejecuta su prueba en rojo. Conecta upload/staging con clase, almacén y comprobación temprana de bytes/formato.
  RF: RF-80, RF-83, RF-122 · Dep.: T028, T045, T010 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/upload-limitado rechazando exceso de 20.000.000 bytes y tipo no admitido sin datos aplicados.

- [ ] **T100 Interpreta CSV según el contrato.** Primero escribe y ejecuta su prueba en rojo. Implementa UTF-8/BOM, comillas, coma y encabezados de las dos plantillas.
  RF: RF-80, RF-81, RF-83 · Dep.: T099, T012, T011 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/parser-csv con caracteres Unicode, celdas entrecomilladas y archivo vacío/corrupto rechazado.

- [ ] **T101 Interpreta XLSX sin ejecutar contenido de celdas.** Primero escribe y ejecuta su prueba en rojo. Implementa hoja Datos, tipos exactos y rechazo de fórmulas/macros/referencias activas como datos.
  RF: RF-80, RF-81, RF-83, RF-123, RF-124 · Dep.: T099, T012, T011 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/parser-xlsx con celdas de texto/número exacto y errores identificados por fila.

- [ ] **T102 Expone previsualización paginada.** Primero escribe y ejecuta su prueba en rojo. Muestra filas normalizadas y acciones create/update/initial_stock sin mutar negocio.
  RF: RF-80, RF-81, RF-136 · Dep.: T100, T101, T054 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/preview-mixto mostrando altas y actualizaciones distintas con stock/catálogo todavía intactos.

- [ ] **T103 Valida duplicados y unidades antes de aplicar.** Primero escribe y ejecuta su prueba en rojo. Conecta validación persistida con filas inválidas, normalización y existencia de referencias.
  RF: RF-81, RF-82, RF-83, RF-86, RF-123, RF-124, RF-127, RF-128, RF-135 · Dep.: T102, T063 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/validacion-filas rechazando SKU repetido o par producto-ubicación duplicado y cambios de unidad.

- [ ] **T104 Registra una aplicación pendiente idempotente.** Primero escribe y ejecuta su prueba en rojo. Implementa la intención async y la consulta 202 del mismo job con referencia/huella inmutable.
  RF: RF-87, RF-100, RF-101, RF-102, RF-110, RF-111, RF-112 · Dep.: T103, T034, T051 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CMD/importacion-pendiente devolviendo el mismo job ante replay y conflicto ante datos distintos.

- [ ] **T105 Aplica catálogo con altas y cambios de nombre.** Primero escribe y ejecuta su prueba en rojo. Escribe el lote íntegro preservando SKU, unidad, identidad y cantidades de productos existentes.
  RF: RF-84, RF-88, RF-134, RF-135, RF-136, RF-137, RF-138 · Dep.: T104, T054, T037 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/aplicar-catalogo-mixto con altas/nombres actualizados y unidad/stock conservados.

- [ ] **T106 Aplica existencias iniciales como entradas auditadas.** Primero escribe y ejecuta su prueba en rojo. Conecta lote de stock al protocolo de saldos, bloqueo e historial sin sobreescribir posición ocupada.
  RF: RF-85, RF-86, RF-88, RF-123, RF-124, RF-200 · Dep.: T104, T064, T068 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/aplicar-stock-inicial con entradas auditadas o rollback de todo el archivo ante una posición no válida.

- [ ] **T107 Procesa trabajos fuera del hilo HTTP.** Primero escribe y ejecuta su prueba en rojo. Conecta trabajador local y reclamación por job con contexto RLS y actor actual.
  RF: RF-80, RF-81, RF-87, RF-88, RNF-2, RNF-16 · Dep.: T105, T106, T030 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/worker-contexto al procesar solo su job autorizado sin bypass de aislamiento.

- [ ] **T108 Revalida el estado después de la preview.** Primero escribe y ejecuta su prueba en rojo. Prueba stock/unidad/bloqueo/permisos cambiados entre validar y confirmar e inyección de fallo a mitad.
  RF: RF-82, RF-86, RF-88, RF-135, RF-138, RF-200 · Dep.: T107, T048 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/preview-obsoleta conservando íntegramente el negocio previo si falla una fila al aplicar.

- [ ] **T109 Recupera jobs sin duplicar negocio.** Primero escribe y ejecuta su prueba en rojo. Verifica reinicio durante procesamiento y después del commit con reintentos simultáneos.
  RF: RF-87, RF-88, RF-102, RF-104, RF-110, RF-111 · Dep.: T107, T108, T036 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/job-reinicio-replay con un solo resultado y efectos aplicados una sola vez.

- [ ] **T110 Prueba los límites exactos de filas y tamaño.** Primero escribe y ejecuta su prueba en rojo. Añade fixtures de 20.000 registros/20 MB y sus excesos, sin contar encabezados o formato vacío final como datos.
  RF: RF-81, RF-82, RF-83, RF-122 · Dep.: T109, T100, T101 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/fronteras-archivo aceptando exactamente los límites válidos y rechazando cada exceso sin aplicar filas.

- [ ] **T111 Exporta inventario e historial en CSV seguro.** Primero escribe y ejecuta su prueba en rojo. Implementa consultas snapshot y texto protegido frente a fórmulas con filtros activos.
  RF: RF-89, RF-90, RF-131, RF-132, RF-133 · Dep.: T071, T063, T045 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/export-csv con filtros correctos, texto neutralizado y solo encabezados si no hay coincidencias.

- [ ] **T112 Exporta XLSX con datos y filtros de consulta.** Primero escribe y ejecuta su prueba en rojo. Define celdas string seguras y hoja Consulta sin inventar filas de inventario.
  RF: RF-89, RF-90 · Dep.: T111, T101 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-EXC/export-xlsx al reabrir el archivo y comprobar datos exactos y ausencia de fórmulas ejecutables.

- [ ] **T113 Audita archivos y reportes entre empresas.** Primero escribe y ejecuta su prueba en rojo. Prueba jobs, filas, descargas, indicadores y alertas con tres roles y empresas A/B.
  RF: RF-5, RF-6, RF-74, RF-79, RF-80, RF-89, RNF-2 · Dep.: T098, T110, T112 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO/archivos-reportes sin datos ajenos ni importaciones por supervisor/operario.

## Fase 10 — Avisos entre sesiones y datos de demostración

- [ ] **T114 Persiste avisos en cada commit operativo.** Primero escribe y ejecuta su prueba en rojo. Integra outbox con operaciones de inventario/layout/pedidos/traslados sin eventos previos al commit.
  RF: RF-32, RF-104, RNF-14 · Dep.: T064, T079, T087, T092, T109, T057 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SYNC/outbox-atomico con aviso solo para cambio confirmado y ningún aviso aplicable tras rollback.

- [ ] **T115 Publica avisos pendientes con un único dispatcher.** Primero escribe y ejecuta su prueba en rojo. Implementa reclamación/publicación con contexto de empresa y recuperación sin depender del orden de secuencia.
  RF: RF-32, RNF-14 · Dep.: T114, T030 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SYNC/dispatcher-reinicio sin perder avisos por commits fuera de orden ni duplicar negocio.

- [ ] **T116 Entrega SSE con sesión y ámbito actuales.** Primero escribe y ejecuta su prueba en rojo. Conecta changes sin reservar una conexión PostgreSQL por navegador ni exponer cantidades.
  RF: RF-5, RF-7, RF-8, RF-32, RNF-2, RNF-14 · Dep.: T115, T045, T048 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-SYNC/stream-empresa cerrando sesión revocada sin emitir avisos de otra empresa.

- [ ] **T117 Carga empresas y usuarios ficticios para los tres roles.** Primero escribe y ejecuta su prueba en rojo. Implementa seed explícito y manifiesto de credenciales demostrativas con operaciones consistentes pequeñas.
  RF: RF-153, RF-154, RF-155, RF-97, RNF-10 · Dep.: T113, T081, T089, T093 · Est.: 30 min.
  Hecho cuando: `pnpm run db:seed:demo` crea empresas ficticias identificables y permite autenticar las tres cuentas de roles con inventario reconciliado.

- [ ] **T118 Expone solo el manifiesto público de acceso demo.** Primero escribe y ejecuta su prueba en rojo. Conecta demo-access y flags de configuración sin consultar contraseñas de cuentas reales.
  RF: RF-96, RF-97, RF-153, RF-154, RF-155, RNF-10 · Dep.: T117, T042 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/demo-manifiesto con 404 fuera de demo y únicamente credenciales ficticias dentro del modo demo.

## Fase 11 — Fundamentos de interfaz

- [ ] **T119 Consolida el contexto de producto para diseño.** Aplica el flujo Impeccable sobre respuestas aprobadas y registra PRODUCT.md sin reabrir público, stack o alcance.
  RF: RF-91, RF-92, RF-97, RNF-12 · Dep.: T118 · Est.: 25 min.
  Hecho cuando: PRODUCT.md contiene plataforma web, usuarios, capacidades, exclusiones y evidencia sintética coherentes con la spec aprobada.

- [ ] **T120 Concreta la dirección de landing y aplicación.** Lee las skills obligatorias, formula dirección original y contrástala con el MCP; registra tokens previstos y superficies persuade/operate.
  RF: RF-91, RF-92, RNF-12 · Dep.: T119 · Est.: 30 min.
  Hecho cuando: El contrato de dirección enlaza referencias MCP inspeccionadas y decisiones de composición, tipografía, estados y responsive para ambas superficies.

- [ ] **T121 Prepara los flujos de navegador reproducibles.** Conecta Playwright CLI, base demo aislada, snapshots y recogida de capturas/consola mediante test:flows.
  RF: RF-4, RNF-4, RNF-5, RNF-7 · Dep.: T120, T004, T117 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` abre el servidor local con sesión de prueba y guarda un informe de navegador en output/playwright sin depender de servicios externos.

- [ ] **T122 Implementa fuentes locales y tokens compartidos.** Primero escribe y ejecuta su prueba en rojo. Conecta Tailwind, tipografía autoalojada y estados semánticos del contrato visual.
  RF: RF-30, RF-97, RNF-1, RNF-5, RNF-12 · Dep.: T121, T120 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/tokens-locales con fuentes cargadas sin red externa y contraste/foco registrados en capturas desktop/móvil.

- [ ] **T123 Construye campos accesibles y validación visible.** Primero escribe y ejecuta su prueba en rojo. Implementa etiquetas, errores y presentación exacta de cantidades sin Number ni placeholder como etiqueta.
  RF: RF-107, RF-108, RF-123, RF-124, RF-127, RF-128, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T122, T011, T012 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/formulario-accesible por teclado con nombres accesibles y errores de campo legibles.

- [ ] **T124 Integra menús y diálogos con foco.** Primero escribe y ejecuta su prueba en rojo. Configura Radix y feedback mínimo según animate, incluyendo reduced motion y cierre/interrupción.
  RF: RF-20, RNF-4, RNF-5, RNF-7 · Dep.: T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/dialogo-foco con Escape, retorno al activador y movimiento reducido sin errores de consola.

- [ ] **T125 Construye listas y estados de consulta reutilizables.** Primero escribe y ejecuta su prueba en rojo. Define tablas paginadas, vacío, sin coincidencias, carga, error y sin permiso como estados distintos.
  RF: RF-29, RF-33, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T123, T124 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/lista-estados en 1280×720 y 360×800 con filtros y contenido legibles.

- [ ] **T126 Conecta Next con la API del mismo origen.** Primero escribe y ejecuta su prueba en rojo. Implementa proxy HTTP/SSE y propagación segura de cookie sin lógica de inventario en Next.
  RF: RF-1, RF-3, RF-4, RF-5, RF-32, RNF-2, RNF-14 · Dep.: T010, T046, T116, T004 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ACC/proxy-mismo-origen y I-SYNC/proxy-stream sin almacenar datos operativos en caché compartida.

- [ ] **T127 Conecta sesión y navegación por permiso.** Primero escribe y ejecuta su prueba en rojo. Añade proveedor de sesión y entrada protegida con datos actuales de empresa/usuario.
  RF: RF-1, RF-3, RF-4, RF-6, RF-7, RF-8, RNF-2, RNF-7 · Dep.: T126, T124 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/sesion-protegida con sesión ausente/revocada y permiso cambiado sin acceso anterior persistente.

- [ ] **T128 Gestiona referencias y resultados inciertos en el cliente.** Primero escribe y ejecuta su prueba en rojo. Implementa estado de confirmación, consulta de referencia y reenvío explícito sin cola offline.
  RF: RF-99, RF-100, RF-101, RF-102, RF-110, RF-111, RF-112, RNF-7 · Dep.: T127, T051, T123 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/resultado-incierto con respuesta perdida, consulta posterior y misma referencia al reintentar.

- [ ] **T129 Conecta caché por empresa e invalidación SSE.** Primero escribe y ejecuta su prueba en rojo. Introduce QueryClient y ámbitos/filtros, vaciando datos al cerrar sesión o cambiar identidad.
  RF: RF-5, RF-32, RNF-2, RNF-14 · Dep.: T127, T126, T063 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/cache-sesiones mostrando un cambio de otra sesión y ningún dato de la identidad anterior.

- [ ] **T130 Compone navegación operativa y contexto de almacén.** Primero escribe y ejecuta su prueba en rojo. Implementa shell responsive con selector de empresa/almacén y acceso permitido a cada módulo.
  RF: RF-6, RF-11, RF-97, RNF-1, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T129, T125, T128, T053 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/shell-vacio con empresa sin almacenes, roles y navegación usable a 360×800.

## Fase 12 — Acceso, administración y catálogo en pantalla

- [ ] **T131 Construye el acceso por código, correo y contraseña.** Primero escribe y ejecuta su prueba en rojo. Conecta el formulario y el cierre de sesión con mensajes genéricos de credencial.
  RF: RF-1, RF-2, RF-3, RF-149, RF-150, RNF-1, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T130, T123, T044 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/acceso-tres-campos en escritorio/móvil con rechazo y cierre verificables.

- [ ] **T132 Construye el registro SaaS.** Primero escribe y ejecuta su prueba en rojo. Presenta empresa y primer administrador con validación y confirmación del código de acceso.
  RF: RF-139, RF-140, RF-141, RF-142, RF-143, RF-150, RF-151, RF-152, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T131, T041 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/registro-saas con código existente rechazado y alta válida que permite iniciar sesión.

- [ ] **T133 Construye la configuración inicial local.** Primero escribe y ejecuta su prueba en rojo. Conecta estado de instalación y asistente con resultado de alta conjunta.
  RF: RF-144, RF-145, RF-146, RF-147, RF-148, RF-150, RF-151, RF-152, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T132, T043 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/setup-local al conservar instalación configurada después de reabrir y bloquear segundo envío.

- [ ] **T134 Construye el perfil y la zona de empresa.** Primero escribe y ejecuta su prueba en rojo. Conecta nombre/zona con validación y presentación de fechas de la empresa.
  RF: RF-127, RF-129, RF-130, RF-131, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T133, T050, T128 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/perfil-zona con zona válida persistida y error visible ante valor inválido.

- [ ] **T135 Presenta equipo y creación de cuentas.** Primero escribe y ejecuta su prueba en rojo. Conecta lista/formulario de alta con rol y credenciales gestionadas por administrador.
  RF: RF-6, RF-113, RF-114, RF-115, RF-150, RF-151, RF-152, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T134, T047, T125 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/equipo-alta con correo duplicado y rol inválido mostrados junto a sus campos.

- [ ] **T136 Conecta cambios de rol y desactivación.** Primero escribe y ejecuta su prueba en rojo. Presenta acciones de equipo y rechazo de último administrador con permisos actualizados.
  RF: RF-7, RF-8, RF-9, RF-115, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T135, T049 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/equipo-cambio con rechazo de último admin y revocación de acciones en una segunda sesión.

- [ ] **T137 Construye lista y creación de almacenes.** Primero escribe y ejecuta su prueba en rojo. Conecta selector, formulario de dimensiones y vacío según permiso.
  RF: RF-10, RF-11, RF-127, RF-128, RNF-1, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T136, T053, T130 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/almacenes con empresa vacía, creación válida y selección del almacén correspondiente.

- [ ] **T138 Construye consulta y alta de productos.** Primero escribe y ejecuta su prueba en rojo. Conecta búsqueda paginada y formulario SKU/nombre/unidad con roles de catálogo.
  RF: RF-34, RF-35, RF-123, RF-124, RF-125, RF-127, RF-128, RNF-1, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T137, T054, T125 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/catalogo-alta con SKU normalizado duplicado rechazado y unidad base visible.

- [ ] **T139 Conecta edición y retirada de productos.** Primero escribe y ejecuta su prueba en rojo. Permite cambiar nombre y muestra impedimentos de eliminación sin borrar historia.
  RF: RF-36, RF-41, RF-72, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T138, T055 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/catalogo-edicion con identidad conservada y eliminación con stock rechazada.

- [ ] **T140 Construye la lista operativa de inventario.** Primero escribe y ejecuta su prueba en rojo. Conecta cantidades por ubicación/producto y totales con filtros y alternativa accesible al 3D.
  RF: RF-26, RF-33, RF-37, RF-38, RNF-1, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T139, T063, T129 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/inventario-lista con varios SKU por ubicación y filtros usables a 360×800.

## Fase 13 — Editor visual y visor 3D

- [ ] **T141 Separa borrador y distribución persistida.** Primero escribe y ejecuta su prueba en rojo. Crea estado de edición con revisión base, selección y descarte sin tocar caché guardada.
  RF: RF-12, RF-18, RF-19, RF-116, RF-117, RNF-17 · Dep.: T137, T059, T129, T124 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-borrador al editar/descartar sin reemplazar la distribución persistida.

- [ ] **T142 Construye árbol y altas de elementos.** Primero escribe y ejecuta su prueba en rojo. Añade zonas, pasillos, racks, niveles y ubicaciones según jerarquía y códigos.
  RF: RF-12, RF-17, RF-126, RF-127, RF-128, RF-194, RNF-4, RNF-5, RNF-7, RNF-17 · Dep.: T141, T017 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-arbol creando los cinco tipos con sus contenedores y dimensiones en metros.

- [ ] **T143 Conecta propiedades exactas y posición propuesta.** Primero escribe y ejecuta su prueba en rojo. Permite editar coordenadas/dimensiones y mostrar el estado propuesto antes de guardar.
  RF: RF-13, RF-14, RF-15, RF-16, RF-126, RF-189, RNF-4, RNF-5, RNF-7, RNF-17 · Dep.: T142, T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-propiedades con cambio previo al guardado y dimensión nula/negativa identificada.

- [ ] **T144 Implementa el lienzo de planta configurable.** Primero escribe y ejecuta su prueba en rojo. Conecta selección/arrastre a posiciones relativas del mismo borrador y sus límites.
  RF: RF-12, RF-13, RF-14, RF-126, RNF-17 · Dep.: T143, T017 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-planta al mover un elemento vacío y conservar selección/propiedades a 1280×720.

- [ ] **T145 Genera el almacén 3D desde elementos persistidos.** Primero escribe y ejecuta su prueba en rojo. Construye geometría procedural compartida con instancias e IDs estables sin una etiqueta DOM por ubicación.
  RF: RF-24, RF-30, RNF-6, RNF-15 · Dep.: T144, T056, T120 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/escena-layout con correspondencia verificable entre elemento guardado, instanceId y posición dibujada.

- [ ] **T146 Añade navegación de cámara y selección.** Primero escribe y ejecuta su prueba en rojo. Conecta rotar, desplazar, acercar/alejar y reset visual sin mutaciones de inventario.
  RF: RF-24, RF-25, RF-26, RF-105, RNF-5, RNF-6 · Dep.: T145 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/camara-seleccion al usar los controles y comprobar que los balances permanecen iguales.

- [ ] **T147 Conecta preview 3D del borrador.** Primero escribe y ejecuta su prueba en rojo. Muestra posición/dimensiones propuestas mediante el mismo modelo de geometría antes de persistir.
  RF: RF-13, RF-14, RF-18, RF-19, RF-24, RNF-17 · Dep.: T146, T143 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-preview al alternar planta/3D y descartar recuperando la última distribución guardada.

- [ ] **T148 Conecta guardar, conflictos y errores físicos.** Primero escribe y ejecuta su prueba en rojo. Presenta rechazo por revisión, ocupación o colisión con ID/motivo sin perder borrador.
  RF: RF-18, RF-21, RF-22, RF-23, RF-116, RF-117, RF-195, RF-196, RF-197, RF-199, RNF-7, RNF-17 · Dep.: T147, T058, T060, T128 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-guardar-conflicto con dos sesiones y un borrador rechazado todavía visible.

- [ ] **T149 Protege la salida del editor con cambios pendientes.** Primero escribe y ejecuta su prueba en rojo. Conecta confirmación al navegar, cambiar almacén o abandonar edición.
  RF: RF-19, RF-20, RNF-4, RNF-5, RNF-17 · Dep.: T148, T124 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/editor-salida al cancelar la salida preservando cambios y confirmar descarte conservando lo guardado.

- [ ] **T150 Muestra stock y estados de la ubicación seleccionada.** Primero escribe y ejecuta su prueba en rojo. Conecta panel, leyenda por texto/patrón y detalle actual sin interpretar tránsito como físico.
  RF: RF-26, RF-30, RF-32, RF-37, RF-177, RF-178, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T146, T140, T129 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/mapa-detalle con vacía/ocupada/bloqueada distinguibles sin depender solo del color.

- [ ] **T151 Conecta búsquedas y destacado espacial.** Primero escribe y ejecuta su prueba en rojo. Enlaza SKU/código con selección de ubicaciones y estado sin resultados.
  RF: RF-27, RF-28, RF-29, RF-105, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T150, T062 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/mapa-busqueda resaltando IDs correctos sin alterar datos cuando no hay coincidencias.

- [ ] **T152 Recupera la consulta ante falta de WebGL.** Primero escribe y ejecuta su prueba en rojo. Muestra lista operativa equivalente ante contexto 3D perdido/no disponible y carga visual fallida.
  RF: RF-24, RF-33, RNF-6, RNF-7, RNF-18 · Dep.: T151, T140 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/mapa-sin-webgl permitiendo consultar producto/ubicación y continuar por la alternativa de lista.

- [ ] **T153 Conecta bloqueo y desbloqueo desde ubicación.** Primero escribe y ejecuta su prueba en rojo. Presenta acciones exclusivas de administrador, motivo e historial de desbloqueo.
  RF: RF-31, RF-200, RF-201, RF-204, RF-205, RF-206, RF-207, RNF-4, RNF-5, RNF-7 · Dep.: T150, T068, T128 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/ubicacion-bloqueo conservando compromisos y mostrando motivo obligatorio para desbloquear.

## Fase 14 — Operaciones y reportes en pantalla

- [ ] **T154 Construye la recepción operativa.** Primero escribe y ejecuta su prueba en rojo. Conecta SKU, destino y cantidad exacta a una confirmación con historial/referencia.
  RF: RF-42, RF-43, RF-44, RF-48, RF-49, RF-107, RNF-1, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T140, T064, T128, T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/recepcion con entrada válida y rechazo visible por cantidad o destino incorrectos a 360×800.

- [ ] **T155 Construye el movimiento entre ubicaciones.** Primero escribe y ejecuta su prueba en rojo. Conecta origen/destino del mismo almacén y cantidad disponible no reservada.
  RF: RF-45, RF-46, RF-47, RF-48, RF-49, RF-107, RNF-1, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T154, T066 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/movimiento con efecto íntegro o rechazo completo por origen igual/stock insuficiente.

- [ ] **T156 Prueba desconexión y respuesta perdida en recepción real.** Primero escribe y ejecuta su prueba en rojo. Aplica la máquina de resultado incierto al flujo que modifica stock, conservando referencia.
  RF: RF-99, RF-100, RF-101, RF-102, RF-110, RF-111, RF-112, RNF-7, RNF-18 · Dep.: T154, T065, T128 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/recepcion-respuesta-perdida mostrando incertidumbre y recuperando el único resultado confirmado.

- [ ] **T157 Presenta pedidos y saldos por línea.** Primero escribe y ejecuta su prueba en rojo. Conecta listado/detalle y productos/ubicaciones que deben prepararse según rol.
  RF: RF-50, RF-55, RF-160, RF-161, RF-162, RNF-1, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T140, T073, T125 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/pedido-detalle con solicitado, reservado, preparado pendiente, despachado y pendiente diferenciados.

- [ ] **T158 Construye el alta de pedidos.** Primero escribe y ejecuta su prueba en rojo. Conecta líneas de producto/cantidad con validación y códigos del contrato.
  RF: RF-50, RF-51, RF-107, RF-123, RF-124, RNF-1, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T157, T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/pedido-alta rechazando líneas inválidas sin conservar un pedido parcial.

- [ ] **T159 Construye la reserva parcial explícita.** Primero escribe y ejecuta su prueba en rojo. Permite elegir orígenes y cantidades sin autoajustar una solicitud inválida.
  RF: RF-52, RF-53, RF-54, RF-55, RF-156, RF-159, RF-160, RF-200, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T158, T074, T128 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/reserva-parcial con saldo preservado y rechazo visible por exceso o ubicación bloqueada.

- [ ] **T160 Construye asignación y reasignación del picking.** Primero escribe y ejecuta su prueba en rojo. Presenta operario activo actual e historial de asignación con controles de admin/supervisor.
  RF: RF-163, RF-164, RF-166, RF-167, RF-168, RNF-4, RNF-5, RNF-7, RNF-18 · Dep.: T159, T076, T135 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/picking-asignar conservando avances previos al seleccionar otro operario válido.

- [ ] **T161 Construye los avances de preparación del operario.** Primero escribe y ejecuta su prueba en rojo. Muestra trabajo asignado y cantidades reservadas por preparar, con selección de avance parcial.
  RF: RF-56, RF-57, RF-107, RF-157, RF-160, RF-165, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T160, T077 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/picking-avance desde 360×800 con exceso de cantidad o asignación ajena rechazados.

- [ ] **T162 Construye la confirmación de despacho.** Primero escribe y ejecuta su prueba en rojo. Conecta cantidades preparadas y resumen del efecto físico por allocation.
  RF: RF-58, RF-59, RF-60, RF-61, RF-118, RF-119, RF-120, RF-158, RF-160, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T161, T079 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/despacho-parcial con reserva/preparación consumidas únicamente por las cantidades confirmadas.

- [ ] **T163 Presenta cancelación y estados finales del pedido.** Primero escribe y ejecuta su prueba en rojo. Conecta la cancelación permitida y el estado parcial/completo sin cancelar saldos indebidamente.
  RF: RF-62, RF-63, RF-120, RF-161, RF-162, RNF-4, RNF-5, RNF-7 · Dep.: T162, T082, T081 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/pedido-cancelacion con rechazo después de preparar/despachar y reservas liberadas solo cuando corresponde.

- [ ] **T164 Verifica salida con dos sesiones y bloqueo tardío.** Primero escribe y ejecuta su prueba en rojo. Prueba operario anterior tras reasignar y formulario abierto antes de bloquear ubicación.
  RF: RF-7, RF-8, RF-165, RF-166, RF-167, RF-200, RF-201, RF-204, RF-207, RNF-7, RNF-18 · Dep.: T162, T083, T153 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/salida-dos-sesiones conservando trabajo y rechazando una confirmación que perdió autorización.

- [ ] **T165 Construye consulta y registro de traslados.** Primero escribe y ejecuta su prueba en rojo. Presenta origen, destino y mercancía declarada dentro de la empresa.
  RF: RF-171, RF-172, RF-177, RF-182, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T155, T085, T125 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/traslado-alta con origen/destino distintos y error visible de referencia inválida.

- [ ] **T166 Construye la salida y visualización de tránsito.** Primero escribe y ejecuta su prueba en rojo. Conecta salida única y separa cantidades en tránsito de stock físico por ubicación.
  RF: RF-173, RF-174, RF-175, RF-176, RF-177, RF-178, RF-187, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T165, T086 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/traslado-salida dejando 80 en origen y 20 en tránsito sin mostrarlas en destino.

- [ ] **T167 Construye recepción parcial y total del traslado.** Primero escribe y ejecuta su prueba en rojo. Conecta ubicaciones de destino y saldo pendiente con su referencia de etapa.
  RF: RF-179, RF-180, RF-181, RF-182, RF-183, RF-184, RF-185, RF-186, RF-187, RF-188, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T166, T087, T128 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/traslado-recepcion con destino válido, rechazo por exceso y cierre solo al recibir todas las líneas.

- [ ] **T168 Construye registro y consulta de conteos.** Primero escribe y ejecuta su prueba en rojo. Presenta producto/ubicación, observado y diferencia sin que registrar cambie físico.
  RF: RF-64, RF-65, RF-66, RF-108, RF-109, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T140, T091, T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/conteo-cero con varios SKU en ubicación y sin modificación de stock al registrar la observación.

- [ ] **T169 Construye autorización de ajuste con motivo.** Primero escribe y ejecuta su prueba en rojo. Presenta referencia física, reservas y errores de obsolescencia/restricción para admin/supervisor.
  RF: RF-67, RF-68, RF-69, RF-70, RF-202, RF-203, RNF-4, RNF-5, RNF-6, RNF-7, RNF-18 · Dep.: T168, T092, T093, T094 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/ajuste-autorizado mostrando rechazo por motivo vacío, referencia antigua o protección de reserva.

- [ ] **T170 Construye la consulta de historial y auditoría.** Primero escribe y ejecuta su prueba en rojo. Conecta filtros por producto/almacén/días de empresa y detalle de operación.
  RF: RF-49, RF-71, RF-72, RF-73, RF-131, RF-132, RF-133, RF-168, RF-187, RF-206, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T140, T071, T125 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/historial-filtros con ambos días extremos incluidos y ninguna acción de borrar confirmación.

- [ ] **T171 Construye indicadores y alertas del almacén.** Primero escribe y ejecuta su prueba en rojo. Presenta conteos reales y detalle de alerta sin métricas sintéticas anunciadas como capacidad.
  RF: RF-74, RF-76, RF-77, RF-78, RF-79, RNF-1, RNF-4, RNF-5, RNF-7 · Dep.: T170, T096, T098 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/reportes-alertas con indicador reconciliado y navegación al producto/umbral de una alerta activa.

- [ ] **T172 Construye la configuración del umbral.** Primero escribe y ejecuta su prueba en rojo. Conecta cantidad no negativa por producto/almacén y estados de alerta derivados.
  RF: RF-75, RF-76, RF-77, RF-78, RF-79, RNF-4, RNF-5, RNF-7 · Dep.: T171, T097, T123 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/umbral-configurar con cero válido, error de negativo y cambio visible del estado de alerta.

- [ ] **T173 Construye carga y previsualización de archivos.** Primero escribe y ejecuta su prueba en rojo. Presenta CSV/XLSX, plantillas y preview paginada con create/update diferenciadas.
  RF: RF-80, RF-81, RF-83, RF-136, RNF-4, RNF-5, RNF-7 · Dep.: T140, T102, T125 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/importacion-preview distinguiendo altas/actualizaciones sin modificar negocio antes de aplicar.

- [ ] **T174 Conecta validar y aplicar importación.** Primero escribe y ejecuta su prueba en rojo. Presenta errores por fila, confirmación explícita, progreso y consulta del resultado persistido.
  RF: RF-81, RF-82, RF-84, RF-85, RF-87, RF-88, RF-134, RF-135, RF-137, RF-138, RNF-4, RNF-5, RNF-7 · Dep.: T173, T107, T128 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/importacion-aplicar con lote válido confirmado o filas inválidas que impiden aplicar todo el archivo.

- [ ] **T175 Verifica límites, fallos y reintentos en archivos.** Primero escribe y ejecuta su prueba en rojo. Prueba formato inválido, tamaño/filas excesivos y respuesta perdida al aplicar.
  RF: RF-82, RF-83, RF-86, RF-87, RF-88, RF-100, RF-101, RF-102, RF-110, RF-122, RNF-7 · Dep.: T174, T110, T109 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/importacion-rechazos con explicación visible y catálogo/stock sin modificaciones parciales.

- [ ] **T176 Conecta descarga de la consulta activa.** Primero escribe y ejecuta su prueba en rojo. Añade CSV/XLSX desde inventario e historial preservando filtros y resultado vacío.
  RF: RF-89, RF-90, RF-131, RF-132, RF-133, RNF-4, RNF-5, RNF-7 · Dep.: T170, T140, T112 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-UI/exportar-filtros con archivo de la consulta visible y encabezados sin datos cuando no hay coincidencias.

## Fase 15 — Landing, modalidades y demostración

- [ ] **T177 Construye la entrada comercial con el producto real.** Primero escribe y ejecuta su prueba en rojo. Usa dirección y referencias MCP para presentar WMS/3D con CTA y escena/captura sintética de la aplicación.
  RF: RF-91, RF-96, RF-98, RNF-1, RNF-5, RNF-7, RNF-12 · Dep.: T152, T120, T118 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-COM/landing-hero con producto y CTA visibles en escritorio/móvil sin anunciar módulos ausentes.

- [ ] **T178 Construye la comparación de modalidades.** Primero escribe y ejecuta su prueba en rojo. Explica servicio alojado mensual e instalación en infraestructura del cliente con servicios pagados.
  RF: RF-92, RF-93, RF-98, RNF-1, RNF-4, RNF-5, RNF-12 · Dep.: T177 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-COM/modalidades con ambas opciones claramente distinguibles y cualquier precio marcado como demostrativo.

- [ ] **T179 Conecta selección comercial simulada.** Primero escribe y ejecuta su prueba en rojo. Implementa selección/confirmación local de modalidad sin pasarela, cargo ni compromiso contractual.
  RF: RF-93, RF-94, RF-95, RNF-4, RNF-5, RNF-7, RNF-10 · Dep.: T178, T124 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-COM/seleccion-simulada mostrando simulación y ausencia de cargo sin solicitud a un proveedor de pagos.

- [ ] **T180 Construye instrucciones y señalización de la demo.** Primero escribe y ejecuta su prueba en rojo. Muestra solo credenciales ficticias y banda de datos sintéticos en el área operativa.
  RF: RF-96, RF-97, RF-153, RF-154, RF-155, RNF-1, RNF-4, RNF-5, RNF-10 · Dep.: T179, T118, T131 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-COM/acceso-demo con entrada a los tres roles ficticios y ninguna credencial real expuesta.

- [ ] **T181 Conecta acceso, registro y setup según modalidad.** Primero escribe y ejecuta su prueba en rojo. Enlaza navegación comercial con registro SaaS o acceso/configuración local mediante config pública.
  RF: RF-91, RF-92, RF-96, RF-139, RF-144, RF-148, RNF-3, RNF-7 · Dep.: T180, T132, T133 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-COM/cta-por-modalidad con destino válido en SaaS y local, sin ofrecer segundo setup.

- [ ] **T182 Contrasta toda afirmación de disponibilidad.** Revisa copy, imágenes, métricas y referencias de la landing contra módulos realmente verificados.
  RF: RF-91, RF-93, RF-95, RF-97, RF-98, RNF-10, RNF-12 · Dep.: T181, T176, T167, T169, T149 · Est.: 25 min.
  Hecho cuando: El informe E-COM/disponibilidad vincula cada capacidad anunciada a evidencia ejecutada y no contiene clientes, resultados o funciones inventados.

## Fase 16 — Instalación, recuperación y equivalencia de modalidades

- [ ] **T183 Empaqueta web y API para ejecución local.** Crea imágenes de producción fijadas con recursos/fonts locales y versión de esquema verificable.
  RF: RF-104, RF-106, RNF-3, RNF-9 · Dep.: T182, T005, T002 · Est.: 30 min.
  Hecho cuando: `pnpm run build` genera los artefactos que ambas imágenes ejecutan con Node 24 y versiones/digests registrados.

- [ ] **T184 Integra el arranque local completo.** Conecta web/API/PostgreSQL con volumen persistente, flags de modo y ejemplo de configuración sin credenciales externas.
  RF: RF-104, RF-106, RF-144, RNF-3, RNF-9 · Dep.: T183, T007 · Est.: 25 min.
  Hecho cuando: La instalación Compose inicia web/API/PostgreSQL con solo la web publicada en localhost y conserva el volumen al detener/iniciar.

- [ ] **T185 Documenta el arranque reproducible de desarrollo.** Conecta pnpm run dev y documenta instalación, migración, seed explícito y acceso a cada modalidad.
  RF: RF-106, RF-144, RF-153, RF-154, RNF-3, RNF-9, RNF-10 · Dep.: T184, T008, T117 · Est.: 25 min.
  Hecho cuando: Una instalación aislada sigue la guía desde pnpm install --frozen-lockfile hasta acceso demo usando `pnpm run dev`, sin pasos ni credenciales externos ocultos.

- [ ] **T186 Genera respaldo con identidad y checksum.** Primero escribe y ejecuta su prueba en rojo. Define dump custom y metadatos de versión, esquema, modalidad e instalación sin registrar secretos.
  RF: RF-104, RNF-8, RNF-9 · Dep.: T184 · Est.: 25 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/backup-manifiesto con archivo legible y checksum verificable de una instalación de prueba.

- [ ] **T187 Valida el respaldo antes de restaurar.** Primero escribe y ejecuta su prueba en rojo. Comprueba origen de instalación, formato/checksum y versiones compatibles sin tocar la base activa.
  RF: RF-104, RNF-8 · Dep.: T186 · Est.: 25 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/restore-preflight rechazando respaldo inválido/incompatible con la base válida intacta.

- [ ] **T188 Restaura en un destino separado y compara negocio.** Primero escribe y ejecuta su prueba en rojo. Ejecuta pg_restore y verifica compañías, stock, reservas, tránsito, asientos y resultados confirmados.
  RF: RF-104, RNF-8 · Dep.: T187, T089, T081, T109 · Est.: 30 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/restore-equivalencia con acceso y saldos/historial iguales al respaldo en una base nueva.

- [ ] **T189 Prueba fallo durante restauración sin sustitución.** Primero escribe y ejecuta su prueba en rojo. Inyecta corrupción/interrupción y comprueba que no se cambia la conexión de instalación válida.
  RF: RF-104, RNF-8 · Dep.: T188 · Est.: 25 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/restore-fallido conservando el checksum de los datos activos originales.

- [ ] **T190 Verifica actualización desde un esquema previo.** Primero escribe y ejecuta su prueba en rojo. Prepara fixture versionada con datos y prueba bloqueo de migración y rechazo de arranque incompatible.
  RF: RF-104, RNF-9 · Dep.: T188, T008 · Est.: 30 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/migracion-previa conservando operaciones y permitiendo arrancar únicamente con esquema compatible.

- [ ] **T191 Ejecuta el mismo núcleo en SaaS y local.** Primero escribe y ejecuta su prueba en rojo. Conecta test:modes a los escenarios de negocio reales y diferencia solo los flujos de alta.
  RF: RF-106, RF-139, RF-144, RF-148, RNF-2, RNF-3 · Dep.: T190, T113, T095, T084 · Est.: 25 min.
  Hecho cuando: `pnpm run test:modes` compara resultados equivalentes de inventario, salida, traslado, ajuste e importación en ambos modos.

- [ ] **T192 Prueba el flujo local con red externa bloqueada.** Primero escribe y ejecuta su prueba en rojo. Ejecuta acceso/configuración y operaciones contra el servidor local sin servicios de terceros.
  RF: RF-106, RF-144, RF-152, RNF-3, RNF-10 · Dep.: T191, T185, T133, T162 · Est.: 25 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/local-sin-internet con red externa bloqueada y servidor local accesible.

- [ ] **T193 Verifica persistencia tras reiniciar los servicios.** Primero escribe y ejecuta su prueba en rojo. Reabre sesión/consultas y resultados de operaciones tras reinicio local sin resetear volúmenes.
  RF: RF-49, RF-101, RF-104, RF-148, RNF-8 · Dep.: T192, T156 · Est.: 25 min.
  Hecho cuando: `pnpm run test:recovery` pasa O-OPS/reinicio-confirmado conservando referencia, cantidades y configuración inicial.

## Fase 17 — Perfil y mediciones de rendimiento

- [ ] **T194 Genera el catálogo y la distribución del perfil.** Crea seed aislado determinista de 10 almacenes, 50.000 SKU y 20.000 ubicaciones por almacén.
  RF: RF-24, RF-34, RNF-11, RNF-15 · Dep.: T184, T018, T054, T057 · Est.: 30 min.
  Hecho cuando: El manifiesto de carga acredita 50.000 SKU y 200.000 ubicaciones válidas distribuidas en diez almacenes, con seed/checksum registrados.

- [ ] **T195 Completa el historial y los estados del perfil.** Añade 100.000 movimientos reconciliables, reservas, bloqueos y tránsito, más empresa separada para aislamiento.
  RF: RF-37, RF-71, RF-153, RNF-10, RNF-11 · Dep.: T194, T072, T089 · Est.: 30 min.
  Hecho cuando: El manifiesto del perfil conserva por empresa 100.000 movimientos y la reconciliación de saldos, reservas y tránsito termina sin diferencias.

- [ ] **T196 Comprueba que el perfil no sea un límite de licencia.** Primero escribe y ejecuta su prueba en rojo. Verifica que un dato adicional al perfil se evalúa por reglas de negocio, sin prometer rendimiento por encima del perfil.
  RF: RF-10, RF-34, RNF-11 · Dep.: T195, T054, T053 · Est.: 25 min.
  Hecho cuando: `pnpm run test:integration` pasa I-CAT/perfil-no-licencia aceptando un SKU y almacén adicionales válidos sin rechazo comercial por cantidad de entidades.

- [ ] **T197 Fija el entorno efectivo del ensayo.** Registra hardware, SO, navegador/GPU, recursos Docker, digests, lockfile y dataset según §7.3.
  RF: RNF-11, RNF-13, RNF-14, RNF-15, RNF-16 · Dep.: T195, T183 · Est.: 25 min.
  Hecho cuando: El informe de referencia identifica entorno/dataset efectivos y cualquier diferencia frente al plan sin declarar capacidades todavía.

- [ ] **T198 Prepara las cinco clases de consulta de carga.** Configura catálogo, inventario, ubicaciones, pedidos e historial con filtros/cursores representativos.
  RF: RF-11, RF-37, RF-38, RF-55, RF-73, RNF-11, RNF-13 · Dep.: T197, T031, T071, T073 · Est.: 25 min.
  Hecho cuando: El ensayo de preparación registra respuestas válidas de las cinco clases y conserva errores/timeouts como muestras, sin descartarlos.

- [ ] **T199 Prepara las seis clases de confirmación de carga.** Genera acciones válidas de recepción, movimiento, reserva, picking, despacho y ajuste para 50 usuarios.
  RF: RF-42, RF-45, RF-52, RF-56, RF-58, RF-67, RF-103, RNF-11, RNF-13 · Dep.: T198, T081, T093 · Est.: 30 min.
  Hecho cuando: El ensayo de preparación dispone de datos válidos para las seis clases y evita medir rechazos rápidos como sustituto de confirmaciones.

- [ ] **T200 Instrumenta el cambio visible entre sesiones.** Mide commit hasta valor mostrado, incluida entrega SSE e invalidación, con dos navegadores/sesiones.
  RF: RF-32, RNF-14 · Dep.: T199, T129, T116, T154 · Est.: 25 min.
  Hecho cuando: El registro I-SYNC/medicion-visible contiene marcas de commit y render del nuevo valor, no solo llegada del aviso.

- [ ] **T201 Instrumenta la apertura 3D completa.** Mide caché fría hasta primer frame navegable, selección y búsqueda listas sobre las 20.000 ubicaciones.
  RF: RF-24, RF-25, RF-26, RF-27, RNF-11, RNF-15 · Dep.: T200, T152, T145 · Est.: 25 min.
  Hecho cuando: El registro de apertura 3D identifica descarga, parseo y navegación lista sin usar la lista alternativa como aprobación del visor.

- [ ] **T202 Instrumenta el procesamiento acumulado de archivos.** Registra recepción, parseo, validación, espera del worker y commit excluyendo únicamente pausas humanas.
  RF: RF-80, RF-81, RF-84, RF-85, RF-122, RNF-16 · Dep.: T201, T110, T107 · Est.: 25 min.
  Hecho cuando: El registro de importación suma todas las etapas de archivos válidos de 20.000 filas y hasta 20.000.000 bytes sin excluir esperas de procesamiento.

- [ ] **T203 Ejecuta los objetivos de carga acordados.** Ejecuta test:load con 50 sesiones, calentamiento/carga del plan y observaciones UI/importación bajo carga.
  RF: RF-32, RF-103, RNF-11, RNF-13, RNF-14, RNF-15, RNF-16 · Dep.: T202 · Est.: 30 min.
  Hecho cuando: `pnpm run test:load` deja evidencia de p95 por clase ≤2 s, cambio visible ≤5 s, apertura 3D ≤5 s e importación acumulada ≤60 s en el perfil aprobado.

- [ ] **T204 Emite el veredicto reproducible de rendimiento.** Contrasta métricas brutas, errores y entorno con cada objetivo sin ocultar clases fallidas.
  RF: RNF-11, RNF-13, RNF-14, RNF-15, RNF-16 · Dep.: T203 · Est.: 25 min.
  Hecho cuando: El informe en output/performance enlaza datos brutos y emite resultado individual de RNF-11 y RNF-13 a RNF-16 sin atribuir capacidad comercial nueva.

## Fase 18 — QA transversal y cierre

- [ ] **T205 Ejecuta el flujo local principal completo.** Prueba empresa/almacén/producto/recepción/movimiento/reserva/picking/despacho con historial por UI.
  RF: RF-1, RF-10, RF-12, RF-18, RF-34, RF-42, RF-45, RF-52, RF-56, RF-58, RF-71, RNF-3, RNF-10 · Dep.: T193, T204, T149, T163, T180 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/principal-local con datos sintéticos y el historial reconciliado al final.

- [ ] **T206 Ejecuta parciales, reasignación y traslado por UI.** Verifica 100→40+60 y traslado 20 de 100, preservando saldos ante reintentos.
  RF: RF-156, RF-157, RF-158, RF-160, RF-161, RF-162, RF-165, RF-167, RF-173, RF-174, RF-179, RF-180, RF-186, RNF-3 · Dep.: T205, T164, T167 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/parciales-traslado con saldos y conservación por producto comprobados en pantalla y API.

- [ ] **T207 Ejecuta conteo, ajuste e intercambio completos.** Prueba la alternativa de lista, conteo/ajuste autorizado e importación/exportación con filtros.
  RF: RF-33, RF-64, RF-65, RF-67, RF-68, RF-69, RF-70, RF-80, RF-81, RF-84, RF-85, RF-89, RF-90, RNF-6 · Dep.: T206, T169, T175, T176 · Est.: 30 min.
  Hecho cuando: `pnpm run test:flows` pasa E-FLOW/conteo-archivos sin depender del lienzo 3D ni aplicar parcialmente una importación fallida.

- [ ] **T208 Revisa teclado, estados y nombres accesibles.** Comprueba navegación, español, carga/vacío/error/sin permiso y ausencia de zoom deshabilitado.
  RF: RF-29, RF-30, RF-33, RNF-1, RNF-4, RNF-5, RNF-6, RNF-7 · Dep.: T207, T124 · Est.: 30 min.
  Hecho cuando: El informe E-UI/accesibilidad adjunta recorrido por teclado y capturas de estados de las superficies operativas sin controles sin nombre.

- [ ] **T209 Revisa desktop y móvil con datos extremos.** Aplica break-ui a fixtures de revisión, incluyendo nombres largos, Unicode, ceros y listas vacías; revisa editor y operaciones.
  RF: RF-20, RF-29, RF-33, RF-127, RF-128, RNF-7, RNF-17, RNF-18 · Dep.: T208, T148 · Est.: 30 min.
  Hecho cuando: El informe E-UI/responsive contiene editor a 1280×720 y operaciones a 360×800 sin desbordamientos que impidan actuar; distingue hardware real de emulación.

- [ ] **T210 Comprueba referencias MCP y calidad visual por módulo.** Revisa registros, capturas, consola y detector Impeccable de todas las superficies implementadas.
  RF: RF-91, RF-98, RNF-12 · Dep.: T209, T182, T122, T123, T124, T125, T127, T128, T129, T130, T131, T132, T133, T134, T135, T136, T137, T138, T139, T140, T141, T142, T143, T144, T145, T146, T147, T148, T149, T150, T151, T152, T153, T154, T155, T156, T157, T158, T159, T160, T161, T162, T163, T164, T165, T166, T167, T168, T169, T170, T171, T172, T173, T174, T175, T176, T177, T178, T179, T180, T181 · Est.: 30 min.
  Hecho cuando: La revisión D-REF enlaza cada módulo visual a consulta/análisis MCP y captura propia con defectos detectados corregidos.

- [ ] **T211 Ejecuta acceso cruzado y concurrencia de forma transversal.** Recorre todos los endpoints y carreras sensibles de la matriz, incluyendo archivos, stream y última existencia.
  RF: RF-5, RF-6, RF-9, RF-39, RF-40, RF-87, RF-102, RF-103, RF-116, RF-121, RF-169, RF-170, RF-188, RF-195, RF-200, RF-205, RNF-2 · Dep.: T210, T070, T113, T095, T116 · Est.: 30 min.
  Hecho cuando: `pnpm run test:integration` pasa I-ISO y las familias de concurrencia I-INV/I-OUT/I-TRA/I-GEO/I-BLK sin accesos ajenos ni efectos duplicados.

- [ ] **T212 Cierra las evidencias de los doce principios.** Comprueba stack, mismo núcleo, offline de Internet, aislamiento, auditoría, recuperación, MCP, seed y aprobaciones.
  RF: RF-5, RF-71, RF-104, RF-106, RNF-3, RNF-8, RNF-9, RNF-10, RNF-12 · Dep.: T211, T191, T189 · Est.: 25 min.
  Hecho cuando: La tabla de cumplimiento C1–C12 enlaza resultados reales y conserva los hashes de spec/plan/constitución sin cambios no aprobados.

- [ ] **T213 Vincula cada requisito y caso con evidencia ejecutada.** Completa un registro de ejecución que relaciona tests/artefactos reales con las filas RF/RNF/casos/CF, sin reescribir acuerdos.
  RF: — (cierre documental contra todos los requisitos y criterios aprobados) · Dep.: T212, T204 · Est.: 30 min.
  Hecho cuando: El registro D-SDD contiene evidencia y resultado de 207 RF, 18 RNF, 97 casos límite y 37 CF, sin usar familias previstas como sustituto de tests ejecutados.

- [ ] **T214 Revisa el resultado final contra spec, plan y reglas del proyecto.** Aplica validator-sdd y ejecuta el cierre de verificación sin despliegue; una falta real mantiene abierta la tarea.
  RF: — (cierre documental contra todos los requisitos y criterios aprobados) · Dep.: todas las anteriores (T001–T213) · Est.: 30 min.
  Hecho cuando: El informe validator-sdd acredita suite/build/lint/tipos verdes, trazabilidad completa y CF-1–CF-37 cumplidos con resultados reales, sin pendientes ocultos.

## Trazabilidad RF/RNF → tareas

Se enumeran coberturas directas; sus dependencias también son necesarias. Las pruebas transversales de cierre no sustituyen las pruebas específicas.

| Req. | Tareas de cobertura directa |
|---|---|
| RF-1 | T020, T038, T039, T044, T126, T127, T131, T205 |
| RF-2 | T039, T044, T131 |
| RF-3 | T046, T126, T127, T131 |
| RF-4 | T038, T045, T046, T121, T126, T127 |
| RF-5 | T029, T030, T038, T045, T052, T070, T084, T090, T095, T113, T116, T126, T129, T211, T212 |
| RF-6 | T045, T047, T050, T052, T070, T084, T090, T095, T113, T127, T130, T135, T211 |
| RF-7 | T045, T048, T052, T078, T084, T116, T127, T136, T164 |
| RF-8 | T045, T048, T052, T078, T084, T116, T127, T136, T164 |
| RF-9 | T020, T049, T136, T211 |
| RF-10 | T021, T053, T070, T137, T196, T205 |
| RF-11 | T031, T053, T056, T070, T130, T137, T198 |
| RF-12 | T141, T142, T144, T205 |
| RF-13 | T143, T144, T147 |
| RF-14 | T143, T144, T147 |
| RF-15 | T017, T057, T143 |
| RF-16 | T017, T057, T143 |
| RF-17 | T012, T021, T057, T142 |
| RF-18 | T021, T056, T057, T141, T147, T148, T205 |
| RF-19 | T141, T147, T149 |
| RF-20 | T124, T149, T209 |
| RF-21 | T060, T061, T148 |
| RF-22 | T021, T057, T061, T148 |
| RF-23 | T057, T061, T072, T148 |
| RF-24 | T056, T070, T145, T146, T147, T152, T194, T201 |
| RF-25 | T146, T201 |
| RF-26 | T063, T140, T146, T150, T201 |
| RF-27 | T031, T062, T151, T201 |
| RF-28 | T031, T062, T151 |
| RF-29 | T062, T125, T151, T208, T209 |
| RF-30 | T122, T145, T150, T208 |
| RF-31 | T021, T068, T069, T153 |
| RF-32 | T114, T115, T116, T126, T129, T150, T200, T203 |
| RF-33 | T056, T125, T140, T152, T207, T208, T209 |
| RF-34 | T022, T054, T138, T194, T196, T205 |
| RF-35 | T012, T022, T054, T138 |
| RF-36 | T022, T054, T139 |
| RF-37 | T019, T023, T063, T070, T072, T140, T150, T195, T198 |
| RF-38 | T031, T063, T140, T198 |
| RF-39 | T023, T067, T072, T211 |
| RF-40 | T019, T023, T067, T072, T075, T211 |
| RF-41 | T055, T139 |
| RF-42 | T064, T070, T154, T199, T205 |
| RF-43 | T011, T064, T154 |
| RF-44 | T064, T154 |
| RF-45 | T066, T070, T155, T199, T205 |
| RF-46 | T066, T155 |
| RF-47 | T066, T155 |
| RF-48 | T009, T032, T034, T064, T066, T067, T069, T154, T155 |
| RF-49 | T037, T051, T064, T065, T066, T071, T154, T155, T170, T193 |
| RF-50 | T024, T073, T157, T158 |
| RF-51 | T011, T073, T158 |
| RF-52 | T074, T159, T199, T205 |
| RF-53 | T074, T075, T159 |
| RF-54 | T014, T074, T159 |
| RF-55 | T073, T074, T084, T157, T159, T198 |
| RF-56 | T024, T077, T161, T199, T205 |
| RF-57 | T014, T077, T161 |
| RF-58 | T079, T162, T199, T205 |
| RF-59 | T014, T079, T162 |
| RF-60 | T014, T079, T080, T162 |
| RF-61 | T032, T034, T079, T080, T162 |
| RF-62 | T015, T082, T163 |
| RF-63 | T015, T082, T163 |
| RF-64 | T026, T091, T168, T207 |
| RF-65 | T091, T093, T168, T207 |
| RF-66 | T026, T091, T093, T168 |
| RF-67 | T092, T169, T199, T207 |
| RF-68 | T092, T169, T207 |
| RF-69 | T026, T092, T093, T169, T207 |
| RF-70 | T023, T026, T092, T093, T169, T207 |
| RF-71 | T023, T027, T037, T064, T071, T072, T092, T170, T195, T205, T212 |
| RF-72 | T027, T030, T037, T055, T071, T139, T170 |
| RF-73 | T031, T071, T170, T198 |
| RF-74 | T096, T113, T171 |
| RF-75 | T019, T022, T097, T172 |
| RF-76 | T019, T098, T171, T172 |
| RF-77 | T019, T097, T098, T171, T172 |
| RF-78 | T019, T098, T171, T172 |
| RF-79 | T019, T097, T098, T113, T171, T172 |
| RF-80 | T028, T099, T100, T101, T102, T107, T113, T173, T202, T207 |
| RF-81 | T028, T100, T101, T102, T103, T107, T110, T173, T174, T202, T207 |
| RF-82 | T103, T108, T110, T174, T175 |
| RF-83 | T099, T100, T101, T103, T110, T173, T175 |
| RF-84 | T105, T174, T202, T207 |
| RF-85 | T106, T174, T202, T207 |
| RF-86 | T103, T106, T108, T175 |
| RF-87 | T027, T033, T034, T035, T036, T104, T107, T109, T174, T175, T211 |
| RF-88 | T028, T105, T106, T107, T108, T109, T174, T175 |
| RF-89 | T031, T111, T112, T113, T176, T207 |
| RF-90 | T111, T112, T176, T207 |
| RF-91 | T119, T120, T177, T181, T182, T210 |
| RF-92 | T119, T120, T178, T181 |
| RF-93 | T178, T179, T182 |
| RF-94 | T179 |
| RF-95 | T179, T182 |
| RF-96 | T118, T177, T180, T181 |
| RF-97 | T117, T118, T119, T122, T130, T180, T182 |
| RF-98 | T177, T178, T182, T210 |
| RF-99 | T128, T156 |
| RF-100 | T051, T104, T128, T156, T175 |
| RF-101 | T051, T104, T128, T156, T175, T193 |
| RF-102 | T027, T033, T034, T035, T036, T065, T080, T088, T104, T109, T128, T156, T175, T211 |
| RF-103 | T032, T066, T067, T075, T199, T203, T211 |
| RF-104 | T034, T043, T051, T065, T109, T114, T183, T184, T186, T187, T188, T189, T190, T193, T212 |
| RF-105 | T062, T072, T146, T151 |
| RF-106 | T183, T184, T185, T191, T192, T212 |
| RF-107 | T006, T010, T011, T066, T073, T077, T079, T123, T154, T155, T158, T161 |
| RF-108 | T006, T010, T011, T091, T123, T168 |
| RF-109 | T026, T091, T095, T168 |
| RF-110 | T027, T033, T034, T035, T036, T051, T065, T080, T083, T088, T104, T109, T128, T156, T175 |
| RF-111 | T027, T033, T034, T035, T051, T065, T088, T104, T109, T128, T156 |
| RF-112 | T033, T035, T065, T104, T128, T156 |
| RF-113 | T020, T047, T052, T135 |
| RF-114 | T012, T020, T047, T052, T135 |
| RF-115 | T047, T048, T135, T136 |
| RF-116 | T059, T141, T148, T211 |
| RF-117 | T059, T141, T148 |
| RF-118 | T014, T024, T079, T080, T162 |
| RF-119 | T014, T024, T079, T080, T162 |
| RF-120 | T015, T080, T162, T163 |
| RF-121 | T032, T080, T211 |
| RF-122 | T099, T110, T175, T202 |
| RF-123 | T011, T091, T097, T101, T103, T106, T123, T138, T158 |
| RF-124 | T011, T091, T097, T101, T103, T106, T123, T138, T158 |
| RF-125 | T011, T022, T054, T138 |
| RF-126 | T017, T057, T142, T143, T144 |
| RF-127 | T012, T050, T053, T054, T103, T123, T134, T137, T138, T142, T209 |
| RF-128 | T012, T053, T054, T103, T123, T137, T138, T142, T209 |
| RF-129 | T013, T050, T134 |
| RF-130 | T013, T050, T134 |
| RF-131 | T013, T050, T071, T096, T111, T134, T170, T176 |
| RF-132 | T013, T071, T096, T111, T170, T176 |
| RF-133 | T013, T071, T096, T111, T170, T176 |
| RF-134 | T105, T174 |
| RF-135 | T103, T105, T108, T174 |
| RF-136 | T102, T105, T173 |
| RF-137 | T105, T174 |
| RF-138 | T105, T108, T174 |
| RF-139 | T020, T040, T132, T181, T191 |
| RF-140 | T020, T040, T132 |
| RF-141 | T040, T041, T132 |
| RF-142 | T012, T040, T041, T132 |
| RF-143 | T040, T132 |
| RF-144 | T020, T042, T133, T181, T184, T185, T191, T192 |
| RF-145 | T020, T042, T133 |
| RF-146 | T020, T042, T133 |
| RF-147 | T042, T043, T133 |
| RF-148 | T042, T043, T133, T181, T191, T193 |
| RF-149 | T020, T038, T044, T052, T131 |
| RF-150 | T039, T040, T042, T044, T047, T131, T132, T133, T135 |
| RF-151 | T039, T040, T042, T047, T132, T133, T135 |
| RF-152 | T039, T040, T042, T047, T132, T133, T135, T192 |
| RF-153 | T117, T118, T180, T185, T195 |
| RF-154 | T117, T118, T180, T185 |
| RF-155 | T117, T118, T180 |
| RF-156 | T014, T074, T081, T159, T206 |
| RF-157 | T014, T077, T081, T161, T206 |
| RF-158 | T014, T079, T081, T162, T206 |
| RF-159 | T014, T074, T075, T081, T159 |
| RF-160 | T014, T024, T073, T074, T077, T079, T081, T157, T159, T161, T162, T206 |
| RF-161 | T015, T081, T157, T163, T206 |
| RF-162 | T015, T081, T157, T163, T206 |
| RF-163 | T024, T076, T160 |
| RF-164 | T076, T078, T084, T160 |
| RF-165 | T077, T078, T084, T161, T164, T206 |
| RF-166 | T076, T078, T160, T164 |
| RF-167 | T076, T078, T160, T164, T206 |
| RF-168 | T037, T076, T160, T170 |
| RF-169 | T032, T075, T211 |
| RF-170 | T032, T078, T211 |
| RF-171 | T025, T085, T165 |
| RF-172 | T025, T085, T090, T165 |
| RF-173 | T086, T166, T206 |
| RF-174 | T016, T025, T086, T166, T206 |
| RF-175 | T086, T089, T166 |
| RF-176 | T086, T088, T166 |
| RF-177 | T016, T085, T089, T150, T165, T166 |
| RF-178 | T016, T019, T086, T089, T150, T166 |
| RF-179 | T025, T087, T167, T206 |
| RF-180 | T016, T025, T087, T167, T206 |
| RF-181 | T016, T087, T088, T167 |
| RF-182 | T011, T085, T086, T087, T165, T167 |
| RF-183 | T087, T089, T090, T167 |
| RF-184 | T016, T087, T167 |
| RF-185 | T086, T087, T088, T089, T167 |
| RF-186 | T016, T086, T087, T089, T167, T206 |
| RF-187 | T037, T086, T087, T166, T167, T170 |
| RF-188 | T032, T088, T167, T211 |
| RF-189 | T017, T057, T143 |
| RF-190 | T018, T058 |
| RF-191 | T018, T058 |
| RF-192 | T018, T058 |
| RF-193 | T018, T058 |
| RF-194 | T017, T057, T142 |
| RF-195 | T060, T061, T148, T211 |
| RF-196 | T060, T061, T148 |
| RF-197 | T032, T058, T060, T061, T148 |
| RF-198 | T018, T058 |
| RF-199 | T058, T060, T148 |
| RF-200 | T069, T070, T074, T077, T079, T083, T086, T087, T089, T106, T108, T153, T159, T164, T211 |
| RF-201 | T019, T068, T069, T083, T153, T164 |
| RF-202 | T091, T094, T169 |
| RF-203 | T092, T094, T169 |
| RF-204 | T068, T083, T153, T164 |
| RF-205 | T068, T070, T153, T211 |
| RF-206 | T037, T068, T071, T153, T170 |
| RF-207 | T068, T083, T153, T164 |
| RNF-1 | T010, T122, T123, T130, T131, T132, T133, T134, T135, T136, T137, T138, T139, T140, T154, T155, T157, T158, T170, T171, T177, T178, T180, T208 |
| RNF-2 | T009, T010, T029, T030, T032, T038, T045, T046, T048, T052, T070, T084, T090, T095, T107, T113, T116, T126, T127, T129, T191, T211 |
| RNF-3 | T042, T181, T183, T184, T185, T191, T192, T205, T206, T212 |
| RNF-4 | T121, T123, T124, T125, T130, T131, T132, T133, T134, T135, T136, T137, T138, T139, T140, T142, T143, T149, T150, T151, T153, T154, T155, T157, T158, T159, T160, T161, T162, T163, T165, T166, T167, T168, T169, T170, T171, T172, T173, T174, T176, T178, T179, T180, T208 |
| RNF-5 | T121, T122, T123, T124, T125, T130, T131, T132, T133, T134, T135, T136, T137, T138, T139, T140, T142, T143, T146, T149, T150, T151, T153, T154, T155, T157, T158, T159, T160, T161, T162, T163, T165, T166, T167, T168, T169, T170, T171, T172, T173, T174, T176, T177, T178, T179, T180, T208 |
| RNF-6 | T125, T140, T145, T146, T150, T152, T154, T155, T157, T159, T161, T162, T165, T166, T167, T168, T169, T207, T208 |
| RNF-7 | T121, T123, T124, T125, T127, T128, T130, T131, T132, T133, T134, T135, T136, T137, T138, T139, T140, T142, T143, T148, T150, T151, T152, T153, T154, T155, T156, T157, T158, T159, T160, T161, T162, T163, T164, T165, T166, T167, T168, T169, T170, T171, T172, T173, T174, T175, T176, T177, T179, T181, T208, T209 |
| RNF-8 | T007, T186, T187, T188, T189, T193, T212 |
| RNF-9 | T002, T007, T008, T183, T184, T185, T186, T190, T212 |
| RNF-10 | T117, T118, T179, T180, T182, T185, T192, T195, T205, T212 |
| RNF-11 | T031, T194, T195, T196, T197, T198, T199, T201, T203, T204 |
| RNF-12 | T119, T120, T122, T177, T178, T182, T210, T212 |
| RNF-13 | T031, T197, T198, T199, T203, T204 |
| RNF-14 | T027, T114, T115, T116, T126, T129, T197, T200, T203, T204 |
| RNF-15 | T145, T194, T197, T201, T203, T204 |
| RNF-16 | T107, T197, T202, T203, T204 |
| RNF-17 | T141, T142, T143, T144, T147, T148, T149, T209 |
| RNF-18 | T125, T130, T131, T137, T138, T140, T150, T151, T152, T154, T155, T156, T157, T158, T159, T160, T161, T162, T164, T165, T166, T167, T168, T169, T209 |

## Casos límite de la spec → tareas donde se prueban

CL-* conserva los identificadores y el texto literal del anexo aprobado de trazabilidad. La tarea implementa la observación completa de la fila, incluyendo rechazo sin efectos parciales cuando corresponde.

| Caso | Caso literal | Resultado requerido | Tareas de prueba |
|---|---|---|---|
| CL-001 | Empresa sin almacenes | Mostrar estado vacío con acceso a la creación según permisos; RF-6, RF-10, RNF-7. | T130, T137 |
| CL-002 | Almacén sin distribución ni inventario | Mostrar el estado vacío correspondiente sin crear existencias; RF-24, RNF-7. | T056, T152 |
| CL-003 | Usuario sin sesión, desactivado o de otra empresa | Rechazar el acceso; RF-4, RF-5, RF-8. | T045, T048, T052 |
| CL-004 | Mismo correo en empresas distintas | Validar cada cuenta dentro de la empresa indicada por su código; RF-1, RF-114, RF-149. | T044, T020 |
| CL-005 | Código de empresa, correo o contraseña ausentes | Rechazar el alta o acceso que requiera esos datos; RF-150. | T040, T042, T131 |
| CL-006 | Correo de formato inválido al crear una cuenta | Rechazar la creación; RF-151. | T039, T047 |
| CL-007 | Registro SaaS con código de empresa existente | Rechazar sin modificar la empresa existente; RF-142. | T040, T132 |
| CL-008 | Dos registros SaaS concurrentes con el mismo código | Confirmar como máximo un registro y conservar su empresa y administrador; RF-141, RF-142. | T041 |
| CL-009 | Fallo entre el alta de empresa y el primer administrador | No conservar un alta incompleta; RF-141, RF-147. | T040, T042 |
| CL-010 | Dos sesiones intentan finalizar el asistente local | No reemplazar la configuración que ya quedó confirmada; RF-147, RF-148. | T043, T133 |
| CL-011 | Reinicio de una instalación local ya configurada | Mantener la empresa y su administrador existentes; RF-104, RF-148. | T043, T193 |
| CL-012 | Último administrador activo | Impedir su desactivación o pérdida de rol; RF-9. | T049, T136 |
| CL-013 | Código duplicado con mayúsculas o espacios exteriores | Rechazar el duplicado en su ámbito; RF-17, RF-35. | T012, T053, T054 |
| CL-014 | Nombre vacío o mayor a 160 caracteres | Rechazar el guardado; RF-127. | T012, T050 |
| CL-015 | Código vacío, mayor a 64 caracteres o con caracteres no admitidos | Rechazar el guardado; RF-128. | T012, T053 |
| CL-016 | Nombre de 160 caracteres o código de 64 caracteres | Aceptar la longitud si cumple las demás validaciones; RF-127, RF-128. | T012, T209 |
| CL-017 | Cantidad cero o negativa en una recepción o pedido | Rechazar la confirmación; RF-43, RF-51. | T011, T064, T073 |
| CL-018 | Cantidad no positiva en movimiento, reserva, preparación o despacho | Rechazar la confirmación; RF-107. | T011, T066, T074, T077, T079 |
| CL-019 | Conteo observado igual a cero | Permitir registrar la observación sin modificar stock; RF-64, RF-65. | T091, T168 |
| CL-020 | Conteo negativo, no numérico, infinito o sin cantidad | Rechazar el registro; RF-108. | T006, T011, T091 |
| CL-021 | Ubicación con varios productos al contar | Asociar cada cantidad observada a su producto y ubicación; RF-64, RF-66, RF-109. | T091, T168 |
| CL-022 | Cantidad fraccionaria de piezas, cajas o pallets | Rechazar la cantidad; RF-123. | T011, T064, T103 |
| CL-023 | Peso, volumen o longitud con hasta tres decimales | Evaluar con las demás reglas sin redondeo automático; RF-124, RF-125. | T011, T106 |
| CL-024 | Peso, volumen o longitud con más de tres decimales | Rechazar sin redondear; RF-124. | T011, T103 |
| CL-025 | Cambio de unidad por importación de un SKU existente | Rechazar la importación; RF-135. | T103, T105 |
| CL-026 | Dimensiones nulas, negativas o no numéricas | Rechazar el guardado; RF-15. | T017, T053, T143 |
| CL-027 | Ubicación fuera del elemento que la contiene | Rechazar el guardado; RF-16. | T017, T057 |
| CL-028 | Dos zonas que comparten espacio interior | Rechazar el guardado; RF-190. | T018, T058 |
| CL-029 | Rack dentro de su zona, con niveles y ubicaciones dentro de sus contenedores | Permitir la contención si cumple las demás validaciones; RF-189, RF-194. | T017, T057 |
| CL-030 | Solapamiento entre racks o entre un rack y un pasillo | Rechazar el guardado; RF-191, RF-192. | T018, T058 |
| CL-031 | Solapamiento entre ubicaciones del mismo nivel o de la misma zona directa | Rechazar el guardado; RF-193. | T018, T058 |
| CL-032 | Contacto únicamente entre bordes de elementos | No rechazar por solapamiento si no comparten interior; RF-198. | T018, T058 |
| CL-033 | Borrar rack con existencias o trabajo pendiente | Rechazar la eliminación; RF-21. | T060 |
| CL-034 | Mover o redimensionar un elemento con stock o referencias de operaciones abiertas | Rechazar el cambio e indicar el motivo; RF-195, RF-196, RF-199. | T060 |
| CL-035 | Mover un contenedor aparentemente vacío cuyo descendiente tiene stock | Rechazar el cambio; definición de elemento ocupado y RF-195. | T060 |
| CL-036 | Un elemento recibe stock o una operación abierta después de abrir el editor | Volver a comprobar su estado al guardar y rechazar el cambio que dejó de estar permitido; RF-21, RF-195, RF-196. | T061 |
| CL-037 | Edición con varios cambios y uno inválido | Conservar íntegra la distribución guardada anterior; RF-197. | T058 |
| CL-038 | Entrada de existencias después de abrir el editor y antes de eliminar un elemento | Rechazar la eliminación al comprobar su estado en la confirmación; RF-21. | T061 |
| CL-039 | Descartar o abandonar cambios de distribución | Conservar lo guardado; RF-19, RF-20. | T141, T149 |
| CL-040 | Dos administradores guardan ediciones basadas en la misma distribución anterior | Conservar el primer guardado válido y rechazar el desactualizado manteniendo su borrador; RF-116, RF-117. | T059, T148 |
| CL-041 | Buscar un producto inexistente | Mostrar ausencia de resultados; RF-29. | T062, T151 |
| CL-042 | Lienzo 3D no disponible | Permitir la alternativa operativa; RF-33, RNF-6. | T152, T207 |
| CL-043 | Ubicación bloqueada con reservas anteriores | Conservar las reservas y rechazar nuevas confirmaciones de preparación o despacho hasta el desbloqueo; RF-200, RF-201. | T083 |
| CL-044 | Salida o entrada de movimiento interno o traslado con ubicación bloqueada | Rechazar la etapa sin aplicar efectos parciales; RF-48, RF-185, RF-200. | T069, T089 |
| CL-045 | Conteo o ajuste de una ubicación bloqueada | Aplicar los permisos y restricciones normales, incluido motivo y protección de reservas; RF-202, RF-203. | T094 |
| CL-046 | Formulario abierto antes de bloquear la ubicación | Rechazar la nueva confirmación mientras el bloqueo siga vigente; RF-200. | T069, T164 |
| CL-047 | Desbloqueo sin motivo o por supervisor u operario | Rechazar la acción; RF-205. | T068, T153 |
| CL-048 | Desbloqueo válido con trabajo pendiente | Registrar el motivo y conservar el trabajo para confirmación posterior, sin ejecutarlo automáticamente; RF-204, RF-206, RF-207. | T068, T083 |
| CL-049 | Reintento de una operación confirmada antes del bloqueo | Devolver el resultado registrado sin aplicar otra vez el movimiento; RF-110. | T083, T035 |
| CL-050 | Dos reservas simultáneas de la última cantidad disponible | No confirmar ambas si exceden el stock; RF-103. | T075 |
| CL-051 | Mover una cantidad mayor que la disponible no reservada | Rechazar el movimiento completo sin cambiar las cantidades; RF-47, RF-48. | T066, T155 |
| CL-052 | Cancelar pedido ya preparado o despachado | Rechazar la cancelación; RF-63. | T082, T163 |
| CL-053 | Nueva operación de despacho sobre un pedido completamente despachado | Rechazar la operación; RF-120. | T080 |
| CL-054 | Varios despachos concurrentes sobre el mismo saldo reservado y preparado | No consumir ese saldo más de una vez; RF-118, RF-119, RF-121. | T080 |
| CL-055 | Reserva, preparación y despacho de 40 unidades de un pedido de 100 | Conservar 60 pendientes, consumiendo solo los saldos de las 40 despachadas; RF-156 a RF-160. | T081, T159, T162 |
| CL-056 | Nueva reserva que excede el saldo pendiente aunque exista inventario suficiente | Rechazar la solicitud; RF-159. | T075 |
| CL-057 | Reservas o preparaciones concurrentes sobre el mismo saldo del pedido | No comprometer ni preparar más que el saldo correspondiente; RF-169, RF-170. | T075, T078 |
| CL-058 | Operario que intenta preparar un pedido sin asignación o asignado a otro | Rechazar la confirmación del avance; RF-165. | T077, T161 |
| CL-059 | Pedido reasignado después de abrirlo el operario anterior | Conservar avances previos y rechazar nuevos avances del operario anterior; RF-165 a RF-167. | T078, T164 |
| CL-060 | Asignación a un usuario de otra empresa, inactivo o sin rol de operario | Rechazar la asignación; RF-164. | T076, T160 |
| CL-061 | Pedido parcialmente despachado con líneas pendientes | Mantener el estado parcialmente despachado hasta completar todas las líneas; RF-161, RF-162. | T081, T157 |
| CL-062 | Salida de traslado de 20 unidades desde un origen con 100 | Conservar 80 en origen y 20 en tránsito, sin incrementar todavía el destino; RF-173, RF-174. | T086, T166 |
| CL-063 | Recepción del traslado de 20 unidades | Incorporar 20 en destino y descontar esas 20 del tránsito; RF-179, RF-180. | T087, T167 |
| CL-064 | Nueva reserva sobre mercancía en tránsito | Rechazar el uso de esa mercancía como disponible; RF-178. | T089 |
| CL-065 | Salida de traslado que requiere mercancía reservada para otro pedido | Rechazar sin consumir ni liberar la reserva existente; RF-175. | T089 |
| CL-066 | Traslado al mismo almacén o hacia otra empresa | Rechazar la acción; RF-5, RF-172. | T085, T090 |
| CL-067 | Nueva salida de un traslado que ya salió | Rechazar la nueva operación sin volver a descontar del origen; RF-176. | T088 |
| CL-068 | Recepción que excede el saldo pendiente en tránsito | Rechazar sin modificar cantidades; RF-181. | T087, T088 |
| CL-069 | Recepciones concurrentes del mismo saldo en tránsito | No incorporar al destino más mercancía que la pendiente; RF-188. | T088 |
| CL-070 | Recepción de traslado en ubicación bloqueada, inexistente o de otro almacén | Rechazar la recepción; RF-183. | T089, T090 |
| CL-071 | Fallo o pérdida de respuesta al confirmar una etapa de traslado | Conservar la confirmación íntegra o el estado anterior, sin duplicar efectos al reintentar; RF-102, RF-110, RF-185. | T088, T089 |
| CL-072 | Conteo desactualizado por un movimiento posterior | Rechazar el ajuste basado en la referencia anterior; RF-70. | T093 |
| CL-073 | Ajuste que afectaría reservas | Rechazar el ajuste; RF-69. | T092, T093 |
| CL-074 | Archivo vacío, corrupto o de formato no admitido | Rechazar la importación con motivo; RF-81 a RF-83. | T100, T101 |
| CL-075 | Importación que supera 20 MB o 20.000 registros de datos | Rechazar la aplicación sin modificar datos de negocio; RF-122. | T110, T175 |
| CL-076 | Importación de exactamente 20 MB o 20.000 registros de datos | Evaluar el archivo con las demás validaciones; el valor límite por sí solo no lo rechaza; RF-122. | T110 |
| CL-077 | Archivo con filas inválidas o duplicadas | No aplicar la importación; RF-82. | T103, T174 |
| CL-078 | SKU existente en la empresa y no repetido en el archivo de catálogo | Previsualizar una actualización de nombre conservando código, unidad y cantidades; RF-134 a RF-138. | T102, T105 |
| CL-079 | Archivo de catálogo que mezcla SKU nuevos y existentes | Previsualizar las creaciones y actualizaciones con aplicación íntegra o sin cambios si falla; RF-84, RF-88, RF-134, RF-136. | T105 |
| CL-080 | Archivo de formato distinto de CSV o XLSX | Rechazar con explicación; RF-83. | T099, T175 |
| CL-081 | Importación repetida tras perder la respuesta | No duplicar efectos; RF-87, RF-102. | T109 |
| CL-082 | Reintentos concurrentes de una operación con igual empresa, referencia y datos | Conservar un único resultado confirmado sin duplicar efectos; RF-87, RF-102, RF-110. | T036, T065 |
| CL-083 | Referencia repetida con cantidades, ubicaciones u otros datos de negocio distintos | Rechazar la nueva solicitud sin alterar los datos existentes; RF-111. | T035, T065 |
| CL-084 | Dos acciones legítimas con datos iguales y referencias distintas | Evaluar cada acción por separado con sus validaciones de negocio; RF-112. | T035, T065 |
| CL-085 | Fallo durante una importación | Mantener el estado previo; RF-88. | T108, T109 |
| CL-086 | Texto que una hoja de cálculo interpretaría como fórmula | Exportarlo como texto; RF-90. | T111, T112 |
| CL-087 | Exportación sin coincidencias | Producir un archivo identificable como resultado vacío; detalles de presentación en revisión. | T111, T176 |
| CL-088 | Respuesta perdida después de confirmar en el servidor | Mostrar resultado no confirmado hasta consultarlo; RF-100 a RF-102. | T156, T065 |
| CL-089 | Internet caído con servidor local accesible | Permitir el flujo operativo; RF-106. | T192 |
| CL-090 | Desconexión completa del servidor | Impedir confirmaciones; RF-99. | T128, T156 |
| CL-091 | Creación de otro usuario después de configurar la empresa | Incorporarlo a la empresa del administrador autorizado; RF-6, RF-113. | T047, T135 |
| CL-092 | Identificador de acceso duplicado en la empresa o rol no permitido | Rechazar la acción correspondiente; RF-114, RF-115. | T047, T135 |
| CL-093 | Reinicio después de una operación confirmada | Conservar el resultado; RF-104. | T193, T065 |
| CL-094 | Respaldo inválido o incompatible | No sustituir datos válidos; detalle del procedimiento pendiente del plan y su verificación. | T187, T189 |
| CL-095 | Consulta de fechas desde una zona horaria distinta de la empresa | Aplicar la zona de la empresa e incluir ambos días extremos del intervalo; RF-130 a RF-132. | T013, T071, T170 |
| CL-096 | Fecha final anterior a la inicial | Rechazar el filtro; RF-133. | T013, T071 |
| CL-097 | Volumen que exceda el perfil de validación | No considerarlo capacidad demostrada de esta entrega; el perfil no impone un bloqueo comercial por licencia. | T196, T204 |

## Criterios de finalización → tareas de evidencia

| Criterio | Comprobación de la spec | Tareas |
|---|---|---|
| CF-1 | Cada RF tiene una comprobación ejecutada de su comportamiento esperado, incluyendo los casos de rechazo aplicables. | T213, T214 |
| CF-2 | Cada RNF tiene evidencia automática o manual identificada; los que no puedan verificarse se declaran expresamente en la validación. | T213, T204, T208 |
| CF-3 | Las dudas DA-1 a DA-7 están resueltas antes de aprobar el plan técnico. | T213 |
| CF-4 | Una demostración local permite iniciar sesión, configurar un almacén, registrar productos, recibir mercancía, moverla, reservarla, prepararla y despacharla, conservando un historial coherente. | T205 |
| CF-5 | Una demostración local permite registrar un conteo y aplicar un ajuste autorizado sin violar reservas. | T207 |
| CF-6 | La demostración permite previsualizar una importación y exportar una consulta de inventario o historial. | T207 |
| CF-7 | La separación de empresas se verifica intentando acceder a datos de una empresa distinta desde una sesión activa. | T211 |
| CF-8 | La concurrencia se verifica con operaciones que compitan por las mismas existencias. | T067, T075, T211 |
| CF-9 | La landing permite identificar las dos modalidades y probar la selección de un plan demostrativo sin un cargo real. | T179, T182 |
| CF-10 | El flujo principal se verifica después de reiniciar el servidor. | T193 |
| CF-11 | Se ejecuta una restauración de respaldo comprobando la conservación de los datos de negocio incluidos en la prueba. | T188 |
| CF-12 | La revisión de interfaz incluye capturas en escritorio y móvil, comprobación de consola y verificación de estados e interacciones. | T209, T210 |
| CF-13 | Se ejecutan las verificaciones acordadas para todos los principios aplicables de la constitución. | T212 |
| CF-14 | Las pruebas de reintentos distinguen una operación repetida, una referencia reutilizada con otros datos y dos acciones nuevas con datos iguales. | T035, T036, T065 |
| CF-15 | Una prueba de guardados concurrentes conserva la distribución aceptada sin perder el borrador de la sesión cuyo guardado se rechazó. | T059, T148 |
| CF-16 | Las pruebas de despacho repetido y concurrente impiden consumir más existencias, reservas o preparación que las correspondientes al pedido. | T080 |
| CF-17 | Las mediciones identifican el entorno y los datos utilizados para verificar los objetivos de volumen, concurrencia, latencia, actualización, importación y carga inicial 3D aprobados. | T197, T204 |
| CF-18 | La revisión de interfaz incluye el editor a 1280 × 720 y la consulta y las operaciones móviles a 360 × 800. | T209 |
| CF-19 | Las comprobaciones de cantidades distinguen enteros, hasta tres decimales y exceso de precisión sin redondeos silenciosos. | T011, T103 |
| CF-20 | Las comprobaciones de importación distinguen creaciones, actualizaciones de nombre, duplicados y cambios de unidad rechazados. | T105, T108 |
| CF-21 | Las comprobaciones de fechas incluyen ambos días extremos del rango según la zona de la empresa, aunque el dispositivo use otra zona horaria. | T013, T071 |
| CF-22 | El registro SaaS se verifica con empresa y administrador creados conjuntamente, rechazo de códigos duplicados y separación entre empresas. | T040, T041, T132 |
| CF-23 | El asistente local se verifica sin conexión a internet, conservando la configuración ante reinicios o intentos de alta inicial repetidos. | T043, T192 |
| CF-24 | La demostración permite acceder con los tres roles usando las cuentas ficticias precargadas sin envío obligatorio de correos. | T180, T117 |
| CF-25 | Se verifica un pedido de 100 unidades despachado primero en 40 y luego en 60, conservando los saldos correctos en ambos pasos y cerrándolo solo al completar las 100. | T081, T206 |
| CF-26 | Se verifica que reasignar un pedido conserva sus avances y revoca la confirmación de nuevos avances por el operario anterior. | T078, T164 |
| CF-27 | Las comprobaciones de concurrencia impiden reservar o preparar por encima de los saldos pendientes del pedido, aunque haya más stock físico. | T075, T078 |
| CF-28 | Se verifica el traslado de 20 unidades desde un origen con 100, conservando el total de la empresa durante salida, tránsito y recepción. | T089, T206 |
| CF-29 | Se comprueba que un traslado no consume mercancía reservada para otros pedidos ni ofrece su stock en tránsito para nuevas reservas. | T089 |
| CF-30 | Los reintentos y las confirmaciones concurrentes de etapas de traslado no duplican salidas ni incorporan al destino más que el saldo en tránsito. | T088 |
| CF-31 | Se rechazan traslados hacia almacenes de otras empresas sin modificar el inventario de ninguna de las empresas. | T090 |
| CF-32 | Se verifica la contención válida y el contacto de bordes, y se rechazan los solapamientos prohibidos entre zonas, racks, pasillos y ubicaciones. | T018, T058 |
| CF-33 | Se rechazan cambios de posición, dimensiones o eliminación de elementos con existencias o trabajo pendiente, incluyendo descendientes y cambios de estado posteriores a abrir el editor. | T060, T061 |
| CF-34 | Un cambio geométrico válido conserva identidades y cantidades; una edición que contiene un cambio inválido conserva la distribución anterior. | T057, T058 |
| CF-35 | Las pruebas de bloqueo rechazan entradas y salidas físicas, incluso con reservas anteriores o formularios abiertos antes del bloqueo. | T083, T069, T164 |
| CF-36 | Se comprueban consultas, conteos y ajustes autorizados en una ubicación bloqueada sin omitir la protección de reservas ni los motivos exigidos. | T094 |
| CF-37 | Se verifica que solo el administrador desbloquea con motivo e historial y que el desbloqueo no ejecuta automáticamente trabajo pendiente. | T068, T153 |

## Cierre y manejo de resultados

Al llegar a T214 se necesita evidencia real de todos los CF; un fallo de rendimiento, aislamiento, restauración o UI mantiene abierta la entrega. Los límites de la spec no se rebajan para conseguir un informe verde. Un informe que declare una limitación de medición es honesto, pero no equivale a haber cumplido el requisito afectado.

Esta entrega solo contiene planificación y su comprobación documental. No se ejecutó test:unit, test:integration, test:flows ni test:load porque todavía no existe la aplicación. No hay tareas marcadas como completadas.
