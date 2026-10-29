# Constitución de Almacén 3D

1. **Stack:** frontend en Next.js con TypeScript, backend en NestJS sobre Node.js con TypeScript y persistencia en PostgreSQL; dependencias y comandos exclusivamente con pnpm, verificables mediante packageManager y pnpm-lock.yaml; versiones y comandos definidos en el plan técnico.
2. **Núcleo compartido:** las modalidades SaaS y local usarán las mismas reglas de negocio, comprobadas por la misma suite.
3. **Ejecución local:** el flujo principal funcionará sin credenciales de servicios externos, mediante una prueba completa local.
4. **Publicación:** cualquier despliegue público requerirá tu indicación explícita.
5. **Aislamiento:** el SaaS impedirá acceder a datos de otra empresa, comprobado mediante pruebas de acceso cruzado.
6. **Consistencia:** existencias y reservas se validarán antes de confirmar operaciones, incluyendo pruebas de concurrencia.
7. **Trazabilidad:** cada modificación de inventario conservará autor, fecha y referencia, verificables en el historial.
8. **Recuperación:** los cambios de datos tendrán migraciones versionadas y un procedimiento de respaldo y restauración probado.
9. **Diseño:** la landing y cada módulo visual utilizarán `awwwards-inspiration`, registrando las referencias empleadas.
10. **Demostración:** los datos incluidos para mostrar el proyecto serán sintéticos, verificables en la carga inicial.
11. **SDD:** cada entrega se comprobará contra los requisitos y criterios de finalización de su especificación aprobada.
12. **Enmiendas:** la constitución solo cambiará con tu aprobación explícita.
