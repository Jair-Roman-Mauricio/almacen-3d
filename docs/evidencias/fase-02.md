# Ejecución de T020–T031 — Persistencia y aislamiento

Fecha: 29/10/2026. Alcance autorizado: «T020–T031 continua con esto de forma seguida». Se aplicó `implementacion-sdd` y se respetó la aclaración del usuario: **PostgreSQL local, sin Supabase**.

## Base y alcance

T001–T019 estaban completadas. Se volvió a ejecutar la suite inicial: **149 unitarias + 16 de integración = 165 pasadas**, 0 fallidas. Todas las dependencias de T020–T031 estaban cumplidas o se cumplieron en el orden del bloque.

Las migraciones se comprobaron primero en bases `phase2_<uuid>_test`, creadas y eliminadas por la fixture. Se usan las migraciones reales de Drizzle, no SQLite ni tablas simuladas. Las conexiones bootstrap se limitan a preparación/fixtures; las pruebas de aislamiento usan la credencial real `alm_app` y la de provisión se prueba por separado.

## Ciclos rojo/verde

Prefijo de comandos: `node scripts/pnpm-local.mjs`. Cada rojo/verde se ejecutó con `run test:integration`, recorriendo toda la suite disponible en ese momento.

| Tarea | Familia / comprobación | Rojo real | Verde posterior |
|---|---|---|---|
| T020 | I-SET/esquema-identidad: correo por empresa, código global, sesión acotada, instalación única | 3 fallidas / 16 pasadas | 19 pasadas |
| T021 | I-GEO/esquema-ambito: padres de otro almacén/empresa rechazados, revisión y códigos de ubicación | 2 fallidas / 19 pasadas | 21 pasadas |
| T022 | I-CAT/esquema-producto: SKU por empresa, identidad/unidad conservadas, umbral opcional/cero | 3 fallidas / 21 pasadas | 24 pasadas |
| T023 | I-INV/restricciones-db: numeric exacto, finitud/signo/precisión, revisión física y libro | 3 fallidas / 24 pasadas | 27 pasadas |
| T024 | I-OUT/esquema-pedido: relaciones de asignación/línea/producto/ubicación y acumulados | 2 fallidas / 27 pasadas | 29 pasadas |
| T025 | I-TRA/esquema-traslado y recepciones-destino: extremos, saldo y desglose | 3 fallidas / 29 pasadas | 32 pasadas |
| T026 | I-CNT/esquema-conteo: referencia por producto/ubicación y ajuste único con motivo | 2 fallidas / 32 pasadas | 34 pasadas |
| T027 | I-CMD/esquema-comando: referencia única por empresa, resultado/auditoría/outbox persistentes | 2 fallidas / 34 pasadas | 36 pasadas |
| T028 | I-EXC/staging-aislado: preview sin efectos en catálogo/stock | 1 fallida / 36 pasadas | 37 pasadas |
| T029 | I-ISO/pool-contexto: alternancia, filtro de repositorio, rollback y contextos inválidos | 2 fallidas / 37 pasadas | 39 pasadas |
| T030 | I-ISO/rls-sin-bypass: RLS, claves cruzadas, privilegios e inmutabilidad | 4 fallidas / 40 pasadas | 45 pasadas tras el control adicional de provisión |
| T031 | I-DB/indices-consultas: índices previstos, planes y continuación estable | 1 fallida / 45 pasadas | 46 pasadas |

Las primeras pruebas fallaron por las tablas, restricciones o comportamientos todavía ausentes. T029 usó firmas explícitas aún sin comportamiento para comprobar los flujos válidos antes de implementar. No se atribuyeron errores de conexión o instalación a la evidencia funcional.

El control adicional de T030 reprodujo un permiso excesivo: `alm_app` podía insertar empresas directamente. Falló 1 prueba / pasaron 44 antes de revocar ese permiso. La conexión real de provisión tampoco puede leer inventario, incluso fijando un contexto de empresa.

Logs locales: `output/tests/t020-red.log` a `t031-red.log` y sus `*-green.log`, además de `t030-privileges-red.log`. Son artefactos ignorados; los conteos quedan documentados aquí.

## Archivos y RF habilitados

Las migraciones están en `packages/database/migrations/` y el diario conserva orden y hashes. Las pruebas nuevas viven en `tests/integration/`.

| Tarea | Implementación principal | RF de la tarea |
|---|---|---|
| T020 | `0001_identity.sql`; identidad y helpers de normalización | RF-1, 9, 113, 114, 139, 140, 144, 145, 146, 149 |
| T021 | `0002_warehouses.sql` | RF-10, 17, 18, 22, 31 |
| T022 | `0003_catalogue.sql` | RF-34, 35, 36, 75, 125 |
| T023 | `0004_inventory.sql`, trigger de revisión | RF-37, 39, 40, 70, 71 |
| T024 | `0005_outbound.sql` | RF-50, 56, 118, 119, 160, 163 |
| T025 | `0006_transfers.sql` | RF-171, 172, 174, 179, 180 |
| T026 | `0007_counts.sql` | RF-64, 66, 69, 70, 109 |
| T027 | `0008_commands.sql` | RF-71, 72, 87, 102, 110, 111; RNF-14 |
| T028 | `0009_imports.sql` | RF-80, 81, 88 |
| T029 | `src/tenant-context.ts`, `src/product-repository.ts` | RF-5; RNF-2 |
| T030 | `0010_row_security.sql`, bootstrap/roles/env locales | RF-5, 72; RNF-2 |
| T031 | `0011_query_indexes.sql`, informe de consultas | RF-11, 27, 28, 38, 73, 89; RNF-11, 13 |

Los RF están habilitados en persistencia/contexto; no se declara que sus endpoints o flujos completos estén terminados. Las reglas de negocio, estados y permisos siguen requiriendo los servicios de las fases siguientes.

## Revisión Unicode y regresiones

Se encontraron diferencias concretas antes de migrar las bases habituales:

1. POSIX `alnum` rechazaba números Unicode admitidos en dominio (`²`, `Ⅳ`, `½`). Una prueba nueva falló con 46 pasadas. Se sustituyó por rangos L/N derivados del Node fijado; la prueba pasó.
2. Node reporta Unicode 17.0 y `unicode_version()` de PostgreSQL 18.6 reporta 16.0. La conversión de claves difería en 28 pares de casing nuevos. Una prueba comparando todos los puntos de código con cambio de mayúsculas/minúsculas falló con 47 pasadas. Se añadieron los pares de compatibilidad a las funciones de clave y correo; la suite pasó con 48 pruebas.

Logs: `t020-unicode-red.log`, `t020-casing-red.log` y `fase-02-integration-final.log`. No se cambió la regla aprobada de nombres/códigos ni el dominio de T011–T019. Las migraciones se terminaron de revisar antes de aplicarlas a desarrollo/pruebas habituales.

Se añadió además una regresión positiva de permisos: `alm_app` puede actualizar su físico y el trigger conserva la revisión sin darle permiso de editar esa columna. Pasó sin cambios de implementación; no se presenta como otro ciclo rojo. La suite termina con 49 pruebas de integración.

## Verificación final

| Comando / ensayo | Resultado ejecutado |
|---|---|
| `install --frozen-lockfile` | Salida 0; lockfile vigente |
| `run lint` | Salida 0; 11/11 comprobaciones de capas |
| `run typecheck` | Salida 0 en paquetes, apps, fixtures y pruebas |
| `run test:unit` | 149 pasadas, 11 archivos |
| `run test:integration` | 49 pasadas, 7 archivos; PostgreSQL real |
| `run build` | Salida 0: paquetes, Nest ESM y Next producción |
| `run db:roles` repetido | Roles preparados en DEV/TEST, sin publicar credenciales |
| `run db:migrate` | Desarrollo: 11 nuevas, 12 totales; repetición 0 nuevas |
| `run db:migrate --test` | Pruebas: 11 nuevas, 12 totales; repetición 0 nuevas |
| Compose `config --quiet` | Salida 0 |
| Generación `.env` repetida | Contenido idéntico; credenciales existentes conservadas |
| Bootstrap real vacío | Contenedor efímero sin red publicada; tres roles sin superusuario, bypass o creación de roles; contenedor eliminado |

**198 pruebas pasadas, 0 fallidas**, más 11 comprobaciones de arquitectura. Se añadieron 33 pruebas de integración respecto al inicio del bloque. Los subconjuntos repetidos no se suman de nuevo.

RLS forzada en las 23 tablas de empresa; sin contexto no se ven datos; se comprobaron escritura ajena, FK cruzada, `row_security=off`, cambio de rol, UPDATE/DELETE del libro/auditoría y TRUNCATE denegados. La política de mantenimiento del migrador es deliberadamente amplia; ese rol no es la conexión operativa.

El [informe de consultas](../reportes/consultas-fase-02.md) registra índices reales y el límite del diagnóstico con `enable_seqscan=off`. No se ejecutaron mediciones de carga ni se acredita RNF-13 por esos planes.

## Cierre

T020–T031 completadas. Spec, plan, contratos y constitución se conservan. Solo se cambian las casillas correspondientes de tasks.md. Los detalles auxiliares —tabla de desglose de recepción, helpers de normalización/contexto, fixture de bases temporales y preparación idempotente de rol— implementan el modelo del plan sin ampliar producto.

No se borraron datos o volúmenes habituales ni se configuraron servicios externos. Las bases temporales y el contenedor de bootstrap se eliminaron. No hubo commits, push, despliegue ni UI en este bloque.

Siguiente: **T032 — Centraliza transacciones y orden de bloqueos**, no iniciada. El contexto transaccional de T029 no sustituye todavía ese protocolo central de bloqueos.

## Fuentes técnicas consultadas

- [Políticas RLS de PostgreSQL 18](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).
- [Funciones y configuración de seguridad](https://www.postgresql.org/docs/18/sql-createfunction.html).
- [Numeric y precisión](https://www.postgresql.org/docs/18/datatype-numeric.html).
