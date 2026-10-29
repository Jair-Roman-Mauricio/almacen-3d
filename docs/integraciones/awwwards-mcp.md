# Acceso local a Awwwards Inspiration MCP

El proyecto puede consultar el servidor MCP existente mediante el cliente
`scripts/awwwards-mcp.mjs`. Usa el SDK MCP instalado con el motor y comunica por
`stdio`: inicializa el servidor, descubre herramientas y ejecuta `tools/call`.
No consulta directamente SQLite ni sustituye las herramientas del servidor.

## Requisitos locales

- Motor en `~/awwwards-inspiration-engine`, con dependencias y servidor compilado.
- Datos del motor en `~/awwwards-inspiration-engine-data`.
- Un Node compatible con las dependencias nativas instaladas. Se comprobó el
  ejecutable `/opt/homebrew/bin/node` de este equipo.

No necesita nuevas dependencias dentro de `almacen-3d`.

## Verificación realizada

El 28 de octubre de 2026 se comprobó desde `almacen-3d`:

- Inicialización MCP y descubrimiento de las seis herramientas.
- `search_designs`: devolvió tres referencias SaaS con captura marcada `ok`.
- `get_analysis`: devolvió el análisis del diseño 48.
- `get_user_preferences`: devolvió 15 patrones positivos y 15 negativos.
- El cliente rechazó argumentos JSON que no fueran un objeto.

No se ejecutaron `generate_page` ni `register_feedback` durante el diagnóstico.

## Consultas

Ejecutar desde la raíz del proyecto:

```sh
/opt/homebrew/bin/node scripts/awwwards-mcp.mjs list
/opt/homebrew/bin/node scripts/awwwards-mcp.mjs call search_designs '{"query":"saas","limit":3}'
/opt/homebrew/bin/node scripts/awwwards-mcp.mjs call get_analysis '{"design_id":48}'
/opt/homebrew/bin/node scripts/awwwards-mcp.mjs call get_user_preferences '{}'
```

`list` devuelve el catálogo real y sus esquemas. Las herramientas detectadas son:

- `search_designs`
- `get_analysis`
- `get_user_preferences`
- `get_topic_profile`
- `generate_page`
- `register_feedback`

Las dos últimas pueden generar o registrar datos; la comprobación de conexión
solo utiliza consultas de lectura. `get_topic_profile` se usa después de una
propuesta original para contrastarla, según las instrucciones del motor. Sin
argumentos permite consultar los tópicos disponibles.

Para otra ubicación del motor o del ejecutable, utilizar `AWWWARDS_MCP_ROOT` y
`AWWWARDS_MCP_NODE` respectivamente. Cada llamada inicia su propio proceso MCP y
lo cierra al terminar.

## Uso en este proyecto

Se utilizará para la landing y todos los módulos visuales del sistema, junto con
las skills de diseño indicadas por el usuario. Sus referencias no se copiarán;
se adaptarán al problema del almacén y se contrastarán con las preferencias
guardadas. Las capturas con calidad no válida no se tomarán como referencia.

## Estado de la conexión nativa de la app

El servidor ya figura en la configuración de Codex. En la sesión del diagnóstico
no aparece en el catálogo nativo, y las consultas de recursos indican servidor
desconocido. Este cliente permite utilizar el MCP desde las herramientas de
terminal de la sesión sin depender de esa recarga.

Para reconectar mediante la app, la documentación oficial describe la sección
de servidores MCP y la acción Restart. No se automatizó: el control de la UI de
Codex está bloqueado por la herramienta de Computer Use.

Referencia: [documentación oficial de MCP en Codex](https://developers.openai.com/codex/mcp/).
