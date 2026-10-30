# Instrucciones para trabajar en Almacén 3D

## Base del proyecto

- Leer docs/constitution.md, la spec, plan y tasks de la funcionalidad antes de
  modificar código. Las reglas específicas de este repositorio prevalecen sobre
  ejemplos de otros proyectos del directorio padre.
- Stack: Next.js/TypeScript, NestJS/Node.js/TypeScript y PostgreSQL. No sustituirlo.
- **Usar exclusivamente pnpm**, fijado en packageManager. Instalar con
  `pnpm install --frozen-lockfile`; usar `pnpm run`, `pnpm exec` y `pnpm dlx`.
  No utilizar npm, npx o Yarn para administrar este proyecto. El único lockfile
  de dependencias admitido es pnpm-lock.yaml.
- El helper `node scripts/pnpm-local.mjs` utiliza el runtime y pnpm del proyecto
  sin modificar instalaciones globales. No versionar .env, .tools, node_modules,
  builds, volúmenes, capturas de referencias de terceros ni credenciales.

## Orden y evidencia SDD

- Constitución → especificación/clarificación → plan → tareas → implementación
  por bloque autorizado → validación. No adelantar pantallas por tener Next listo.
- Estado: T001–T052 completadas; T053 es la siguiente tarea funcional pendiente.
  Consultar tasks.md y docs/estado.md para conocer el estado vigente.
- Pruebas primero para comportamiento. Marcar tareas únicamente al cumplir su
  criterio con evidencia ejecutada; no sustituir PostgreSQL por mocks en carreras.
- Los cambios de herramienta pedidos por el usuario se registran como enmiendas
  técnicas y se verifican sin desmarcar tareas históricas ni inventar RF nuevos.
- Ejecutar lint, tipos, pruebas pertinentes y build antes de entregar cambios.
- Commit/push requieren autorización. La publicación inicial del repositorio fue
  solicitada expresamente; no implica autorización para desplegar en Railway.

## UI/UX

- Antes de escribir UI leer impeccable, design-taste-frontend,
  emil-design-eng y web-design-orchestrator. Añadir animate/review-animations para
  movimiento, mobile-native para móvil, break-ui para datos extremos y
  redesign-existing-projects si se rediseña una interfaz existente.
- La landing y cada módulo visual usan awwwards-inspiration. Registrar análisis,
  referencias y decisiones originales. Si existe un diseño Figma aportado, leerlo
  e implementarlo fielmente.
- Después de cambios UI, verificar con Playwright escritorio/móvil, capturas,
  consola, estados e interacciones; corregir defectos antes de terminar.
- No usar, instalar ni reconfigurar notebooklm-mcp o notebooklm_design, solicitar
  autenticación o buscar un respaldo local de esas integraciones retiradas.

## Alcance de ejecución

Desarrollo local, datos sintéticos y pagos simulados. No publicar la aplicación,
abrir servicios en Internet o crear funciones fuera del acuerdo por iniciativa
propia. La pregunta sobre una vista previa no autoriza adelantar la fase UI.
