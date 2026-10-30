# Persistencia y aislamiento local

Estado: T020–T031 implementadas. Se usa **PostgreSQL local** con la imagen y digest de Compose; no se incorpora un servicio de base de datos externo.

## Esquema versionado

El diario contiene 12 migraciones: la base técnica `0000` y 11 migraciones nuevas. Los archivos aplicados se verifican por hash y no se reescriben. Las tablas viven en `app`.

| Área | Tablas |
|---|---|
| Identidad | `companies`, `users`, `sessions` |
| Configuración de instalación | `installation`, una única fila de control |
| Almacenes | `warehouses`, `layout_elements` |
| Catálogo | `products`, `stock_thresholds` |
| Inventario | `stock_balances`, `inventory_entries` |
| Salidas | `orders`, `order_lines`, `allocations` |
| Traslados | `transfers`, `transfer_lines`, `transfer_receipts`, `transfer_receipt_lines` |
| Conteos | `counts`, `adjustments` |
| Confirmaciones y avisos | `commands`, `audit_events`, `change_outbox` |
| Importación | `import_jobs`, `import_rows` |

Hay **23 tablas de empresa**, más el control de instalación y el diario de Drizzle. El desglose de recepciones usa una tabla hija para representar varias líneas/ubicaciones dentro de una etapa confirmada.

## Restricciones de datos

- UUID para identidad y claves foráneas que incluyen empresa y, cuando corresponde, almacén, producto y ubicación. Un UUID válido de otra empresa no satisface la relación.
- Jerarquía tipada: zona → rack/pasillo/ubicación; rack → nivel; nivel → ubicación. Una columna generada permite referenciar únicamente elementos de tipo ubicación desde stock.
- Cantidades `numeric` sin una escala declarada que redondee. Checks de finitud, precisión máxima tres y signo, además de reservado ≤ físico y preparado pendiente ≤ reserva. La regla de enteros por unidad se valida en dominio; los servicios la conectarán a las operaciones posteriores.
- Revisión física monotónica mediante trigger: cambia al modificar físico, incluso A→B→A; modificar reservas no la incrementa. Se conservan posiciones a cero.
- SKU/códigos normalizados y únicos en su ámbito. ID y unidad de producto se conservan al modificar su nombre. La aplicación no tiene permiso SQL para modificar SKU o unidad.
- Salida de traslado completa respecto de la declaración; recibido acumulado ≤ salido; tránsito generado como salido − recibido. Conteos y ajustes se vinculan al mismo producto/ubicación.
- Comandos únicos por empresa/referencia, resultado confirmado persistente y vínculos de auditoría/outbox. El staging puede contener errores de importación y no modifica tablas operativas por sí solo.

Estas restricciones no implementan todavía el flujo HTTP ni sustituyen las comprobaciones de estado, permisos y concurrencia de los servicios siguientes.

## Contexto y repositorios

`withTenantTransaction(pool, tenantId, callback)` fija `app.tenant_id` mediante `set_config(..., true)`, equivalente a un valor local de transacción. El objeto de contexto es inmutable, solo se admite mientras está activo y no se puede reconstruir pasando un objeto con el mismo UUID. Se invalida al finalizar, también ante rollback.

`ProductRepository.findById` añade el filtro explícito de empresa y excluye productos retirados. RLS es la segunda barrera. La identidad de empresa debe proceder del servidor; la API ya deriva esa identidad de la sesión en T038–T045. Esta base no autentica a una persona por recibir un UUID.

La prueba reutiliza el mismo backend PostgreSQL para alternar empresas y comprueba que no queda contexto después de commit o rollback. El SQL de `queryTenant` es interno del servidor; no se ofrece una entrada de SQL al cliente.

## Roles y privilegios

| Rol | Uso | Privilegios relevantes |
|---|---|---|
| `alm_app` | Consultas y operaciones del servidor | Sin superusuario, creación de roles/base, propiedad o BYPASSRLS; acceso por empresa y actualizaciones limitadas por columna |
| `alm_provision` | Adaptador limitado de alta SaaS/setup local | Credencial independiente; sin acceso directo a inventario ni permisos generales sobre tablas |
| `alm_migrator` | Migraciones y mantenimiento autorizado | Propietario de objetos, sin superusuario/BYPASSRLS; política de mantenimiento explícita |
| `alm_bootstrap` | Preparación local y fixtures aisladas | Administrador del contenedor; no es credencial de operación del WMS |

RLS está habilitada y forzada en las 23 tablas de empresa. `alm_app` solo ve/escribe filas del contexto; sin contexto no ve datos y no puede insertar filas operativas. El rol de migraciones tiene una política de mantenimiento intencionalmente amplia, por lo que su credencial no se usa como conexión normal de la API.

Libro y auditoría permiten a la aplicación SELECT/INSERT, no UPDATE/DELETE/TRUNCATE. Las posiciones de stock tampoco se borran con ese rol. La creación global de empresas y la instalación quedan fuera del acceso SQL directo de aplicación. Las funciones de acceso/provisión de T038–T044 tienen permisos específicos de ejecución y search_path fijo; no permiten un listado operativo global. La aplicación crea sesiones mediante la función acotada, sin INSERT directo sobre esa tabla.

## Preparación de una instalación existente

```sh
node scripts/setup-env.mjs
node scripts/pnpm-local.mjs run db:roles
node scripts/pnpm-local.mjs run db:migrate
node scripts/pnpm-local.mjs run db:migrate --test
```

El generador conserva credenciales existentes y completa únicamente las de provisión ausentes. `db:roles` usa la credencial bootstrap local para crear/preparar ese rol sin recrear contenedores ni borrar volúmenes. Las instalaciones nuevas lo crean desde `infra/postgres/init-roles.sql`. No registrar `.env` ni copiar bootstrap/migraciones a las credenciales operativas de la API.

## Unicode

Node 24.22.1 reporta Unicode 17.0; PostgreSQL 18 reporta Unicode 16.0. Se detectaron dos diferencias reales: POSIX `alnum` no acepta todas las categorías numéricas de la spec, y había 28 pares de casing nuevos del runtime.

La migración fija los rangos L/N del runtime y los 28 pares de compatibilidad, manteniendo NFC, recorte y claves equivalentes con dominio. `scripts/generate-code-pattern.mjs` reproduce el patrón; solo se usa al redactar una migración nueva. Una prueba compara todos los puntos de código que cambian al convertir mayúsculas/minúsculas. No se debe regenerar ni editar una migración ya aplicada al actualizar herramientas: se añade otra versión.

## Verificación y límites

Ver [evidencia de fase 2](evidencias/fase-02.md) e [informe de consultas](reportes/consultas-fase-02.md). Las pruebas crean bases `phase2_<uuid>_test`, aplican el diario real y eliminan solo esas bases. El bootstrap también se verificó en un contenedor PostgreSQL vacío y sin red publicada.

Hay acceso/equipo por HTTP y funciones limitadas de credencial/provisión; faltan endpoints operativos de inventario, dispatcher SSE, parser CSV/XLSX y UI. RLS SQL y los índices actuales no acreditan esas tareas ni los objetivos de rendimiento del perfil grande.


La fase 3 añade un trigger que rechaza reescribir comandos confirmados y un
protocolo común de bloqueos. La fase 4 añade funciones de acceso, registro,
setup y creación de sesión; no modifica las primeras doce migraciones ya
aplicadas. Hay 17 versiones y se conserva RLS forzada en 23 tablas. Ver
[evidencia de fases 3–4](evidencias/fase-03-04.md).
