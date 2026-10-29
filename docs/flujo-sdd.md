# Flujo SDD del proyecto Almacén 3D

Este documento registra el orden comprobado tras leer las ocho skills SDD
disponibles. Es una guía del proceso; la constitución aprobada se encuentra en
`docs/constitution.md`.

## Contexto confirmado por el usuario

- Frontend en Next.js con TypeScript, backend en NestJS sobre Node.js con
  TypeScript y persistencia en PostgreSQL, aprobados por el usuario.
- Modalidad SaaS con suscripción mensual e infraestructura mantenida por el proveedor.
- Modalidad de instalación en infraestructura del cliente, con servicios pagados;
  los términos de licencia y mantenimiento quedan por definir en la especificación.
- Landing comercial e interfaz operativa del sistema.
- Uso de Awwwards Inspiration MCP en el diseño de toda la interfaz, mediante el
  cliente local documentado en `docs/integraciones/awwwards-mcp.md`.
- Desarrollo y ejecución locales durante esta etapa.
- Despliegue futuro en Railway únicamente cuando lo indique el usuario.
- Proyecto funcional para mostrar en LinkedIn; no hay autorización para publicar
  contenido ni para desplegarlo ahora.
- La investigación de mercado es contexto; sus doce oportunidades no equivalen
  a doce funcionalidades aprobadas.

## Orden de ejecución

| Fase | Skill | Entrada | Resultado y condición de avance |
|---|---|---|---|
| 1 | `constitution-sdd` | Contexto, instrucciones y decisiones confirmadas. | Propuesta en el chat; tras aprobación explícita, `docs/constitution.md`. |
| 2 | `spec-generator` | Constitución y entrevista de requisitos. | `specs/NNN-nombre/spec.md`, con requisitos EARS, alcance y dudas visibles; requiere aprobación antes del plan. |
| 3 | `clarificator-sdd` | Especificación redactada y contexto. | Informe de ambigüedades, contradicciones, casos límite y conflictos; solo lectura. Resolver hallazgos requiere petición del usuario. |
| 4 | `plan-sdd` | Constitución obligatoria y especificación aprobada. | `plan.md` junto a la spec; decisiones técnicas, contratos, datos y pruebas; aprobación antes de tareas. |
| 5 | `tasks-sdd` | Spec y plan aprobados. | `tasks.md` con dependencias, requisitos y criterios verificables; aprobación antes de implementar. |
| 6 | `implementacion-sdd` | Documentos anteriores y alcance de tareas autorizado. | Pruebas primero para comportamiento; implementación y verificación; solo se marcan tareas comprobadas. |
| 7 | `validator-sdd` | Implementación y especificación. | Informe por requisito con resultados ejecutados y veredicto; no modifica archivos. |

## Aspectos que condicionan el proceso

- La constitución se propone antes de escribir su archivo. Next.js y TypeScript
  se incorporan a esa propuesta por petición del usuario.
- La entrevista de requisitos se realiza de una pregunta por vez, hasta seis.
  No se repiten decisiones que ya confirmó el usuario.
- La especificación describe qué se necesita y por qué. El stack y los detalles
  de arquitectura pertenecen a la constitución y al plan, no a los RF.
- El clarificador detecta problemas, no los corrige por iniciativa propia.
- Las tareas tienen una estimación de 20–30 minutos y un «Hecho cuando» verificable.
- La implementación puede abarcar varias tareas si el usuario ya autorizó ese
  alcance y el modo de continuación; no exige volver a preguntar lo confirmado.
- Las verificaciones de UI establecidas en las instrucciones del usuario se
  integrarán en el plan y las tareas de frontend. No sustituyen la validación
  de los requisitos del producto.
- Un despliegue no forma parte automática de la validación.

## Cambios posteriores: new-specs-sdd

Se usa cuando se añaden o modifican requisitos de un proyecto que ya sigue SDD.
Determina si corresponde enmendar una spec o crear otra, muestra el cambio e
impacto y vuelve a iniciar el recorrido desde `spec-generator`.

La constitución se conserva. Si ya hay plan y tareas, se actualizan las partes
afectadas y se mantiene la trazabilidad; no se reinicia el proyecto completo.

## Estado actual del flujo

- Investigación de mercado disponible.
- Cliente local del MCP probado.
- Constitución aprobada explícitamente por el usuario y guardada en
  `docs/constitution.md`.
- Alcance de la primera entrega confirmado por el usuario.
- La base de la especificación fue aprobada por el usuario.
- `clarificator-sdd` produjo 19 hallazgos; el usuario autorizó corregir los
  errores determinables sin decidir el alcance pendiente.
- Enmienda 01 aprobada explícitamente por el usuario.
- DA-1 cerrada con el perfil de validación aceptado por el usuario; enmienda 02
  incorporada a la especificación.
- DA-2 cerrada con las reglas de datos aceptadas; enmienda 03 incorporada a la
  especificación.
- DA-3 cerrada con el alta y acceso aceptados; enmienda 04 incorporada a la
  especificación.
- DA-4 cerrada con parciales y asignación de preparación aceptados; enmienda 05
  incorporada a la especificación.
- DA-5 cerrada con el flujo de traslado aceptado; enmienda 06 incorporada a la
  especificación.
- DA-6 cerrada con las reglas físicas del editor aceptadas; enmienda 07
  incorporada a la especificación.
- DA-7 cerrada con la política de bloqueo aceptada; enmienda 08 incorporada a
  la especificación.
- El usuario aprobó el plan técnico y sus anexos mediante «si», tras recibir
  la propuesta y la petición explícita de aprobación del plan.
- El usuario aprobó las tareas y la ejecución continua de T001–T010 mediante
  «apruebo».
- `implementacion-sdd`: bloque T001–T010 completado con evidencia en
  `docs/evidencias/fase-00.md`; siguiente pendiente T011, todavía no iniciada.
- Se corrigieron los hallazgos 13 a 19 y se cerraron los hallazgos 1 a 12 con
  DA-1 a DA-7. Los 19 hallazgos de la revisión inicial tienen resolución documentada.
- La especificación está en `specs/001-wms-operativo-3d/spec.md`.
- El plan técnico está en `specs/001-wms-operativo-3d/plan.md`, con anexos de
  contratos, trazabilidad y referencias UI; aprobado por el usuario. La enmienda técnica pnpm actualiza los comandos y conserva el alcance aprobado.
- Las tareas están en `specs/001-wms-operativo-3d/tasks.md`: 214 tareas en
  19 fases; únicamente se marca cada casilla tras comprobar su criterio.
- El workspace técnico está inicializado: Next, Nest, PostgreSQL, migraciones,
  validación HTTP y primeras pruebas. Las pantallas de producto siguen pendientes
  de sus tareas UI.

## Mantenimiento solicitado — 29/10/2026

- El usuario solicitó publicar el proyecto en GitHub y confirmó visibilidad pública.
- El usuario ordenó sustituir la gestión de dependencias por pnpm en todo el proyecto y comprobar que siguiera funcionando. Se actualizan C1, D23, manifiestos, herramientas y comandos documentales; no cambia la spec ni los contratos.
- La revalidación de esta enmienda se registra en [cambios/001-pnpm-github.md](cambios/001-pnpm-github.md). La base se documenta para su publicación; no se implementa T011 ni se adelanta UI.

## Skills leídas del catálogo local

- `constitution-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `spec-generator/SKILL.md` (catálogo local; no incluido en este repositorio)
- `clarificator-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `plan-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `tasks-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `implementacion-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `validator-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
- `new-specs-sdd/SKILL.md` (catálogo local; no incluido en este repositorio)
