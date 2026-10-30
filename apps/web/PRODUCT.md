# Almacén 3D

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Empresas de cualquier sector con almacenes medianos o grandes, público confirmado
por el usuario. Administradores configuran empresa, equipo y distribución;
supervisores coordinan inventario y salidas; operarios consultan existencias y
ejecutan acciones autorizadas. Tres roles ya aprobados en el acuerdo SDD.

## Product Purpose

Gestionar inventario trazable y relacionarlo con ubicaciones físicas configurables.
Combina zonas, pasillos, racks, niveles y ubicaciones con inventario operativo y
una consulta 3D de la distribución persistida, según el editor aprobado.

## Operating Context

Uso diario en escritorio y consultas/formularios en móvil. Empresa y almacén son
contexto explícito. Cantidades exactas conservan unidad y precisión. Confirmar
requiere conexión al servidor, permisos actuales y resultado persistido. El visor
no sustituye las listas accesibles.

## Capabilities and Constraints

Next.js/TypeScript sirve la web; NestJS/TypeScript contiene el negocio y PostgreSQL
local es fuente de verdad. Solo pnpm. Mismo núcleo para SaaS alojado mensual e
instalación en infraestructura del cliente con servicios pagados. Desarrollo local,
pagos simulados; Railway requiere indicación posterior explícita.

T001–T118 implementaron acceso/equipo, geometría persistida, inventario, pedidos,
traslados, conteos/ajustes, reportes, archivos, avisos y seed demo. T119–T140 cubren
fundamentos UI, acceso/administración, catálogo e inventario en lista. Editor/visor
comienzan en T141 y landing final en T177. No adelantarlos. No hay cola offline,
stock optimista, pasarela de pago ni servicios externos obligatorios.

## Brand Commitments

Nombre Almacén 3D. Español claro y vocabulario operativo. Cada módulo visual y
la landing consultan awwwards-inspiration y registran decisiones originales.
NotebookLM está retirado. No existe diseño Figma aportado ni logotipo previo.

## Evidence on Hand

Seed sintético identificable con empresas y tres roles; evidencia T096–T118 con
341 pruebas aprobadas. Sin clientes, testimonios, resultados comerciales ni
mediciones del perfil grande acreditados: no inventarlos para mostrar en LinkedIn.

## Product Principles

- Datos autoritativos de la empresa actual y contexto estable al filtrar.
- Cantidades exactas y unidades; no sumar productos incompatibles.
- Vacío, error, sin permiso y resultado incierto son estados distintos.
- Operación accesible sin depender del lienzo 3D.

## Accessibility & Inclusion

Teclado, etiquetas visibles, foco y errores legibles. Verificación a 1280×720 y
360×800, inputs móviles de 16 px, zoom y movimiento reducido. Editor móvil fuera
del alcance. Emulación de navegador no equivale a prueba en teléfono físico.

## Confirmed Sources

Respuestas y aprobaciones del usuario: público general, modalidades SaaS/local,
Next.js, pnpm, desarrollo local, editor configurable y alcance SDD. Ver
../../docs/constitution.md y ../../specs/001-wms-operativo-3d/{spec,plan,contratos,tasks}.md.
No se reabre esta entrevista. Decisiones abiertas: licencia, precios reales y despliegue.
