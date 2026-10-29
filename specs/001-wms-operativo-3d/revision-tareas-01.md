# Revisión documental de tareas 001

> Nota de mantenimiento, 29/10/2026: los nombres de comandos se normalizaron a pnpm por petición del usuario; esta revisión documental no acredita su ejecución. La revalidación se registra en docs/cambios/001-pnpm-github.md.

29/10/2026. Resultado: **descomposición lista para revisión**, pendiente de aprobación. Deriva del plan aprobado por el usuario mediante «si»; no modifica ese plan ni inicia código.

## Comprobaciones ejecutadas

- 214 tareas correlativas T001–T214; 19 fases; ninguna casilla marcada.
- Cada tarea tiene requisitos o motivo habilitante, dependencias y una comprobación «Hecho cuando».
- Estimaciones individuales entre 20 y 30 minutos; suma base orientativa de 5.690 minutos, sin promesa de plazo.
- 795 relaciones de dependencia verificadas; ninguna hacia delante, ningún identificador desconocido. La revisión final depende de todas las anteriores.
- 207 RF y 18 RNF presentes en la trazabilidad individual y en tareas de cobertura directa.
- 97 casos límite comparados literalmente contra la spec, con tareas de prueba asignadas.
- 37 CF con tareas de evidencia identificadas.
- Enlaces locales de tasks.md comprobados y última tarea dedicada a revisión final.
- Todo comportamiento/UI exige prueba roja antes de implementar; las tareas de infraestructura usan su salida comprobable.
- Cada entrega UI exige consulta/análisis MCP y QA Playwright de la porción cambiada; no se difiere toda la revisión visual al final.

## Revisión de alcance y dependencias

Se conserva la base funcional completa y no se añaden pagos reales, publicación, hardware, IA o integraciones externas. El cliente MCP ya existente no se vuelve a implementar. Los comandos pnpm son un contrato futuro habilitado en andamiaje, no comandos ejecutados en esta revisión.

Se revisaron separadamente las carreras de stock, pedido, layout, permisos y referencia; el estado pendiente de importación; recuperación; actualización SSE; casos de archivo exacto/excedido y ausencia de límites comerciales derivados del perfil. Se añadió la dependencia explícita de revisión visual sobre todas las tareas UI y la revisión final sobre todas las anteriores.

Las piezas con mayor incertidumbre de esfuerzo son locks, jobs de importación, editor concurrente y rendimiento bajo carga. Si la ejecución demuestra que una tarea excede el tamaño, se plantea subdivisión antes de marcarla, según implementacion-sdd. No quedan decisiones de producto conocidas pendientes.

## Base conservada

| Archivo | SHA256 antes y después |
|---|---|
| docs/constitution.md | 2b3e6c1e143c0727442129725da57234b9f9c92cd596d615a90346b9239e2f96 |
| specs/001-wms-operativo-3d/spec.md | a2012e80d3b24ff235f8f77d85a29a3d2998217e7efce2791be92158325ae436 |
| specs/001-wms-operativo-3d/plan.md | 942da78e5076c941b0a250279c74c479266c433d638fc04149ca44454ebd862c |
| specs/001-wms-operativo-3d/contratos.md | 06f26ea509fdd3f419839153cf49617cc01f6dd70c4fceea189a89cc25f33f7a |
| specs/001-wms-operativo-3d/trazabilidad-plan.md | d8dc4ee02e4cbc50294abbec3079bfb2d5b04168456b4ee923db7d97244c7e3b |
| specs/001-wms-operativo-3d/referencias-ui.md | c2d4b2e6481b83e86657cb43dabfa3d5a9aa83ae27b8372a4649d10aef4687bb |

## Alcance de la evidencia

Solo se ejecutaron comprobaciones documentales de estructura, cobertura, dependencias, enlaces e integridad de la base. No se ejecutaron tests/build de la aplicación, no se instalaron dependencias, no se creó la aplicación y no se realizó ningún despliegue.

Propuesta de siguiente bloque: T001–T010 de forma continua, sin confirmación entre tareas, parando ante un fallo persistente o una contradicción que impida continuar. Requiere que el usuario acepte las tareas y ese alcance.
