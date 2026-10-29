# Contribuir

Este proyecto sigue SDD. Antes de cambiar comportamiento, leer [constitución](docs/constitution.md), [spec](specs/001-wms-operativo-3d/spec.md), [plan](specs/001-wms-operativo-3d/plan.md), [contratos](specs/001-wms-operativo-3d/contratos.md) y [tareas](specs/001-wms-operativo-3d/tasks.md).

1. Identificar la tarea y sus dependencias. No ampliar alcance ni adelantar pantallas.
2. Usar Node y pnpm fijados. Instalar con `pnpm install --frozen-lockfile`.
3. Para comportamiento, registrar una prueba que falle por el motivo esperado antes de implementar. No eliminar pruebas para obtener verde.
4. Ejecutar lint, tipos, pruebas pertinentes y build; usar PostgreSQL real cuando se afirme atomicidad, aislamiento o concurrencia.
5. Registrar resultados reales y marcar una tarea solo si satisface su criterio. Una suite futura del plan no cuenta como ejecución.
6. Explicar en la revisión el problema, cambio, evidencia y limitaciones. Las modificaciones de requisitos vuelven al flujo de especificación y aprobación.

Para UI son obligatorios las skills de diseño, referencias Awwwards por módulo y QA con Playwright en escritorio/móvil indicados en [AGENTS.md](AGENTS.md). No se exige ni se permite la integración NotebookLM retirada.

No incluir credenciales, `.env`, datos reales, builds, dependencias o capturas ajenas. La publicación del código no autoriza desplegar la aplicación ni efectuar cobros. Consultar [desarrollo local](docs/desarrollo.md) para los comandos vigentes. La licencia de reutilización está pendiente de definición.
