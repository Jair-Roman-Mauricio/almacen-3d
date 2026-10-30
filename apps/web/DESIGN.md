---
name: "Almacén 3D"
description: "Operación clara, contexto explícito y cantidades exactas."
colors:
  surface: "#ffffff"
  canvas: "#f5f7fb"
  rail: "#f8fafc"
  ink: "#172b4d"
  muted: "#526078"
  placeholder: "#667085"
  line: "#dbe2ec"
  accent: "#2563eb"
  accent-hover: "#1d4ed8"
  accent-soft: "#edf3ff"
  danger: "#b42318"
  danger-soft: "#fff0ed"
  warning: "#8a4b08"
  warning-soft: "#fff7ed"
  success: "#106b46"
  control-line: "#aab6c8"
typography:
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.55
  table-label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.55
  control-mobile:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  control: "8px"
  panel: "12px"
  list: "10px"
  tag: "5px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "36": "36px"
  "48": "48px"
  "56": "56px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.surface}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  navigation-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-hover}"
    rounded: "{rounded.control}"
    padding: "12px"
  context-tag:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.muted}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  create-panel:
    backgroundColor: "{colors.rail}"
    rounded: "{rounded.panel}"
    padding: "24px"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
    width: "min(480px, calc(100vw - 32px))"
---

# Design System: Almacén 3D

## Overview

**Creative North Star: "SaaS familiar, contexto siempre visible"**

Almacén 3D combina área de trabajo blanca, rail neutro frío y azul para acciones y selección. El canon de acabado acordado toma la jerarquía compacta de Linear y los formularios y ajustes de GitHub; los tokens y componentes son propios, sobre Radix y Tailwind. El usuario eligió la familiaridad y autorizó código directo, sin una composición de imagen aprobada.

La densidad permite encontrar productos, reconocer empresa y almacén y leer cantidades confirmadas. Este sistema registra acceso, registro SaaS, configuración inicial local, empresa, equipo, almacenes, catálogo e inventario en lista (T119–T140). No documenta un editor/visor 3D ni una landing implementados: comienzan en T141 y T177, respectivamente.

**Key Characteristics:**

- Contexto de empresa y almacén explícito.
- Manrope local, etiquetas persistentes y cantidades tabulares.
- Superficies planas y sombra reservada al diálogo.
- Tablas semánticas con filas etiquetadas en móvil.

Fuentes: `packages/ui/styles/tokens.css`, `packages/ui/styles/index.css`, `apps/web/src/app/globals.css`, controles de `packages/ui/src/` y componentes de `apps/web/src/components/`. El frontmatter registra valores del código terminado. `.impeccable/review/finish-review.md` declara SHIP, 18 capturas verificadas y ningún material fix; el detector guardado es `[]`. Este documento no vuelve a ejecutar esas pruebas ni afirma comprobación en teléfono físico.

## Colors

Una base fría y clara concentra el azul en acción y selección. Rojo, ámbar y verde acompañan texto de estado.

### Primary

- **Azul de acción** (`accent`): acción principal, marca, caret y foco.
- **Azul de interacción** (`accent-hover`): enlaces y selección actual; hover primario.
- **Azul suave** (`accent-soft`): selección de navegación y vista.

### Neutral

- **Blanco de trabajo** (`surface`): contenido, campos y diálogos.
- **Lienzo frío** (`canvas`) y **rail pálido** (`rail`): raíz y agrupación lateral/contextual.
- **Tinta azul oscura** (`ink`): contenido principal y títulos.
- **Pizarra secundaria** (`muted`) y **placeholder**: metadatos y ayudas; el placeholder no reemplaza etiqueta.
- **Línea suave** (`line`) y **línea de control** (`control-line`): divisores y campos.

`danger`/`danger-soft`, `warning`/`warning-soft` y `success` identifican error, incertidumbre/bloqueo y confirmación. Son estados semánticos, no acentos de marca. `success-soft` está declarado pero no se consume en la muestra y se omite. Las rampas del sidecar son muestras sintetizadas para visualizar tokens, no colores de producción añadidos.

## Typography

**Display Font:** no hay familia display separada en estas superficies.
**Body Font:** Manrope variable local, fallback `ui-sans-serif, system-ui, sans-serif`.
**Label/Mono Font:** Manrope para etiquetas y cantidades; `monospace` para referencias de operación.

La fuente local cubre pesos 200–800, carga con `font-display: swap` y conserva procedencia y licencia OFL en `src/fonts/`. Los párrafos tienen máximo de 72ch.

### Hierarchy

- **Headline:** h1 de módulo en escritorio, según frontmatter. En shell móvil usa 27px; acceso usa 26px y 25px a 600px.
- **Title:** h2 general; paneles/estados usan 17px y secciones de configuración 16px.
- **Body:** texto operativo; descripciones de módulo usan 13px.
- **Label:** etiqueta visible con peso superior al cuerpo.
- **Table label:** encabezados y metadatos.
- **Control mobile:** entrada de 16px en pantalla estrecha o puntero grueso.

**The Exact Quantity Rule.** Conservar el orden Físico → Reservado → Disponible, la unidad junto a cada cantidad y la precisión del texto recibido.

`formatExact` mantiene texto decimal, usa BigInt para agrupar el entero, conserva la fracción recibida y muestra coma decimal. Cantidades/SKU usan números tabulares; Disponible tiene peso 750 frente al 600 de las otras cantidades. La unidad acompaña cada valor también en móvil.

## Layout

Shell con rail de 224px, área flexible `minmax(0, 1fr)` y altura mínima `100dvh`. Rail sticky de `100dvh`; contenido con máximo 1600px y padding 36px 32px 56px. La barra de contexto construida tiene **mínimo 88px**, padding 14px 32px y gap 24px. La revisión acepta esta adaptación frente a los 64px sugeridos en el brief para alojar etiquetas, selector y cuenta; el brief conserva la propuesta original.

A 900px, menú superior sustituye al rail; empresa/cuenta comparten fila y el selector llena el ancho. Contenido con padding 28px 16px y safe area inferior; barra con safe area superior. A 680px, configuración cambia de dos columnas (gap 48px) a una (gap 24px), filtros llenan ancho y tablas se convierten en filas etiquetadas. Inventario mantiene tres columnas de cantidades; producto y ubicación preceden a ellas. A 600px, filas de formulario y dimensiones pasan a una columna.

Formularios con gap 20px, campo con gap 7px, acciones flexibles con gap 12px. Configuración de máximo 960px y formulario 520px; acceso centrado en 440px y registro/setup ancho en 650px. Paneles de alta con padding 24px, reducido a 20px 16px en móvil. Son relaciones extraídas, no una obligación de convertir todo en tarjetas.

**The Context Rule.** Empresa y almacén permanecen visibles; el inventario usa el mismo ámbito que el selector.

## Elevation & Depth

Trabajo diario plano, separado por tono y línea. Diálogo con cobertura de tinta al 32%, overlay en capa 30 y contenido/menús en 40. Enlace para saltar al contenido en 60. El token sticky vale 10, aunque el rail actual no lo asigna como z-index.

### Shadow Vocabulary

- **Diálogo:** `0 16px 48px rgb(23 43 77 / 18%)`, única sombra compartida.

**The Flat Surface Rule.** Las superficies de trabajo no llevan sombra; el diálogo usa la única sombra de elevación compartida.

## Shapes

Controles y selección usan radio 8px; paneles/diálogos 12px. Listas usan 10px en escritorio y 8px en móvil; etiquetas contextuales 5px. Bordes de 1px. Etiquetas de bloqueo pueden usar 4px y el indicador habilitado es circular: esos detalles no sustituyen al radio general.

## Components

### Buttons

Primaria, secundaria, ghost y danger; etiqueta explícita, padding 9px 16px, gap 8px y peso 650. Mínimo 40px, 44px con puntero grueso. Foco global: contorno azul 3px, offset 3px. Hover condicionado por `(hover: hover) and (pointer: fine)`: primaria y danger heredan azul de interacción/texto blanco; secundaria y ghost usan azul suave. Deshabilitado: fondo `#e7edf6` y texto secundario. No hay animación rutinaria.

### Inputs / Fields

Fondo blanco, borde de control, radio compartido, padding 10px 12px y mínimo 42px. `htmlFor` vincula etiqueta; `aria-describedby` enlaza error o ayuda. `aria-invalid` vuelve rojo el borde. Ayudas/errores usan 13px. Resumen de varios errores con `role="alert"`. El borrador permanece tras rechazo; la limpieza depende de confirmación del flujo. Los mínimos de altura, bordes y foco quedan fuera del frontmatter porque su schema no tiene esas propiedades; los snippets los conservan.

### Navigation

Iconos SVG Phosphor de 20px, gap/padding 12px, mínimo 44px y peso 600. Actual con `aria-current="page"`, azul suave y texto azul de interacción. Menú móvil reutiliza navegación en Radix Dialog. Empresa/equipo son de administrador; catálogo habilita acciones para administrador/supervisor. Los permisos actuales del servidor siguen siendo necesarios.

### Chips / States

Código de almacén como etiqueta informativa con borde y fondo rail. Habilitado combina punto verde y texto; Bloqueada usa ámbar y texto. Vista de inventario usa botones con `aria-pressed`, no chips informativos interactivos.

### Cards / Containers

Panel de alta plano con rail, borde, radio panel y padding 24px. Lista con borde y recorte sin sombra. Acceso blanco con borde y padding 36px (28px 22px en móvil). Configuración con divisores y descripción lateral.

### Tables / Quantities

Tabla HTML con caption accesible, encabezados `scope="col"` y `data-label` en celdas. Encabezados con padding 13px 18px; filas 17px 18px. Números a derecha en escritorio y a izquierda en móvil. Encabezados ocultos visualmente siguen disponibles para accesibilidad. Disponible excluye reservas y ubicaciones bloqueadas; la nota visible explica la unidad base de cada producto.

### Dialogs / Menus / Feedback

Radix aporta foco, Escape y retorno al activador. Diálogo con ancho `min(480px, calc(100vw - 32px))`, máximo `calc(100dvh - 48px)` y scroll interno. Apertura ocasional con opacidad/transform durante 180ms y `cubic-bezier(0.23, 1, 0.32, 1)`; teclado y movimiento reducido inmediatos. Páginas, datos y cantidades no se animan. Menú de mínimo 200px, padding 6px e ítems 9px 12px; resaltado azul suave.

Carga, vacío, sin coincidencias, error y sin permiso tienen títulos distintos. Skeleton estático, sin ceros ficticios. Incertidumbre conserva UUID visible y acciones de consulta/reenvío explícito con misma referencia. No se persiste el cuerpo como cola offline. Sin conexión verificada se deshabilitan confirmaciones. Demo identifica datos ficticios.

## Do's and Don'ts

### Do:

- **Do** conservar etiquetas visibles, foco y errores asociados al campo; mostrar resumen cuando hay varios errores.
- **Do** mantener contexto, unidades y cantidades exactas al cambiar entre escritorio y móvil.
- **Do** distinguir carga, vacío, sin coincidencias, error, sin permiso y resultado no confirmado.
- **Do** usar SVG Phosphor para iconos y la fuente local con su licencia OFL.

### Don't:

- **Don't** convertir cantidades a Number ni sumar productos con unidades incompatibles.
- **Don't** confirmar stock antes de una respuesta persistida ni convertir referencias pendientes en una cola offline.
- **Don't** añadir métricas decorativas, gradientes de texto o módulos futuros al sistema operativo actual.
- **Don't** usar color como único mensaje de estado ni placeholder como sustituto de etiqueta.
