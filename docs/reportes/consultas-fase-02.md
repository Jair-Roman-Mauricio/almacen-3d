# Informe de consultas e índices — T031

Fecha: 29/10/2026. PostgreSQL 18.6 local. Fuente ejecutada: `I-DB/indices-consultas` en `tests/integration/indexes.test.ts`.

Se aplicó el diario completo a una base temporal y se ejecutó `EXPLAIN (FORMAT JSON, COSTS OFF)` con parámetros sintéticos. Para diagnosticar elegibilidad se desactivó temporalmente `enable_seqscan` y se restauró al terminar. **No es un benchmark ni una afirmación de selección óptima con carga real.**

## Consultas comprobadas

| Consulta acotada | Índice observado en el plan ejecutado | Cobertura / límite |
|---|---|---|
| Producto por `tenant_id, sku_key` | `products_tenant_id_sku_key_key` | Unicidad de SKU y búsqueda exacta por empresa |
| Ubicación por `tenant_id, warehouse_id, type='location', code_key` | `layout_parent_lookup` | El plan diminuto usó el prefijo empresa/almacén y filtró tipo/código; existe además el índice único completo de tipo/código indicado abajo |
| Stock por `tenant_id, warehouse_id, product_id`, ordenado por ubicación | `stock_tenant_product` | Coinciden las igualdades iniciales y el orden del cursor |
| Historial por empresa y cursor `(occurred_at,id)` | `history_tenant_time` | Desempate estable para eventos con la misma fecha |

El índice único `layout_elements_tenant_id_warehouse_id_type_code_key_key` cubre la búsqueda completa de código de ubicación. No se añade otro índice duplicado para forzar una preferencia del optimizador sobre dos elementos de prueba. La elección con 20.000 ubicaciones y estadísticas representativas se medirá en su fase de carga.

Consulta representativa de stock:

```sql
SELECT location_id, physical, reserved
FROM app.stock_balances
WHERE tenant_id = $1 AND warehouse_id = $2 AND product_id = $3
ORDER BY location_id
LIMIT 50;
```

Continuación estable de historial:

```sql
SELECT id, occurred_at
FROM app.inventory_entries
WHERE tenant_id = $1
  AND (occurred_at, id) > ($2::timestamptz, $3::uuid)
ORDER BY occurred_at, id
LIMIT 50;
```

La prueba guarda tres eventos con la misma fecha, consulta dos y continúa desde el último par: obtiene el tercero sin duplicados ni omisiones. Esto verifica la ordenación SQL; no implementa todavía el cursor opaco de un endpoint.

## Índices nuevos versionados

[0011_query_indexes.sql](../../packages/database/migrations/0011_query_indexes.sql) añade 13 índices, todos con empresa al comienzo:

| Índice | Predicado / recorrido previsto |
|---|---|
| `stock_tenant_product` | Inventario y búsqueda espacial por almacén/producto/ubicación |
| `history_tenant_time` | Historial de empresa por fecha/ID |
| `history_tenant_warehouse_time` | Historial de almacén por fecha/ID |
| `history_tenant_product_time` | Historial de producto por fecha/ID |
| `layout_parent_lookup` | Descendientes dentro del almacén |
| `orders_assignee_cursor` | Cola por almacén/operario y fecha/ID |
| `counts_tenant_time` | Conteos por almacén y fecha/ID |
| `counts_tenant_position` | Conteos por producto/ubicación y fecha/ID |
| `audit_tenant_time` | Auditoría por fecha/ID |
| `audit_tenant_entity` | Historial administrativo de una entidad |
| `transfers_source_work` | Referencias abiertas a ubicaciones de origen |
| `imports_state_cursor` | Trabajos por empresa/estado/fecha/ID |
| `outbox_unpublished_cursor` | Avisos de la empresa todavía no publicados; índice parcial |

Se reutilizan PK e índices únicos existentes para empresa, código, SKU, ubicación, referencia de comando, filas de importación y relaciones de cabecera/líneas. Las excepciones globales son el código de empresa y el hash opaco de sesión, previstos para el adaptador limitado de acceso.

El artefacto completo se regenera al ejecutar integración en `output/queries/fase-02-indexes.json` y está excluido de Git. Los planes anteriores verifican cuatro rutas representativas; los demás índices corresponden a consultas previstas y no se presentan como mediciones ejecutadas de sus futuros endpoints.

## Criterio de la tarea

«El informe de consultas identifica índices utilizables para SKU, ubicación, stock e historial dentro de cada empresa» → cumplido con catálogo de índices, planes reales y prueba de continuación estable. RNF-11/RNF-13 siguen pendientes de las mediciones de carga previstas; esta tarea no acredita latencias.
