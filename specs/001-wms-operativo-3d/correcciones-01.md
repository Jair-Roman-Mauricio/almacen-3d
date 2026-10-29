# Enmienda 01 — Correcciones de la revisión de spec 001

Tipo: enmienda de la especificación existente, solicitada por el usuario.
Estado: aprobada explícitamente por el usuario después de revisar los cambios.

## Resumen del cambio

- Añadido: H15, RF-107 a RF-121, CF-14 a CF-16 y doce casos límite.
- Modificado: RF-21, RF-56, RF-60, RF-64, RF-66, RF-70, RF-87 y RF-102;
  definiciones relacionadas y CF-3.
- Sale de «Fuera de alcance»: nada. La sección permanece idéntica.
- Constitución: sin cambios.
- Requisitos existentes: conservan todos sus identificadores; los doce RNF
  permanecen idénticos.
- Decisión pendiente formalizada: DA-7 recoge la política sobre ubicaciones
  bloqueadas que ya aparecía sin cerrar en el texto anterior.

## Hallazgos corregidos

La numeración corresponde al informe de revisión entregado en el chat.

| Hallazgo | Corrección | Requisitos y comprobaciones |
|---|---|---|
| 13. Conteo sin identificación del producto | Cada conteo y su referencia corresponden a un producto y una ubicación. | RF-64, RF-66, RF-70, RF-108 y RF-109. |
| 14. Reintento ambiguo | Se distinguen referencia, datos de negocio, repetición y acción nueva; reutilizar la referencia con otros datos se rechaza. | RF-87, RF-102, RF-110 a RF-112; CF-14. |
| 15. Alta de usuarios adicionales sin RF | El administrador puede crear usuarios dentro de su empresa con uno de los tres roles aprobados. | H15; RF-113 a RF-115. |
| 16. Movimiento completo frente a parcial | Se exige rechazar el movimiento completo cuando excede la cantidad no reservada, conservando el estado anterior. | Caso límite alineado con RF-47 y RF-48. |
| 17. Guardados concurrentes del editor | Se rechaza el guardado desactualizado sin reemplazar la distribución vigente ni perder el borrador de esa sesión. | RF-116 y RF-117; CF-15. |
| 18. Despachos repetidos o concurrentes | Se consume la preparación pendiente y se verifica la reserva del pedido; un nuevo despacho de un pedido completado se rechaza. | RF-56, RF-60, RF-118 a RF-121; CF-16. |
| 19. Cantidades inválidas | Se rechazan cantidades no positivas en las operaciones indicadas; los conteos permiten cero, pero rechazan negativos y valores no numéricos o infinitos. | RF-107 y RF-108. |

También se precisa RF-21 para comprobar el estado que impide una eliminación
en el momento de confirmarla, incluyendo existencias que llegaron después de
abrir el editor.

## Hallazgos que permanecen abiertos

Los hallazgos 1 a 12 requieren decisiones que el usuario no ha delegado como
una elección de alcance. No se fijan valores ni políticas por suposición:

- DA-1: escala, rendimiento, frecuencia de actualización y dispositivos.
- DA-2: cantidades y unidades, archivos, límites de entrada y zona horaria.
- DA-3: alta inicial de empresas y acceso de sus usuarios.
- DA-4: operaciones parciales y asignación del trabajo.
- DA-5: traslados entre almacenes.
- DA-6: superposiciones y modificaciones físicas de elementos ocupados.
- DA-7: preparación, despachos y salidas desde ubicaciones bloqueadas.

## Impacto aguas abajo

No existen todavía plan, tareas ni implementación del WMS. El plan posterior
deberá cubrir los requisitos añadidos y sus pruebas de validación, permisos,
reintentos y concurrencia. Esta enmienda no elige arquitectura ni introduce
código de la aplicación.

## Verificación realizada

- Numeración continua de los 121 RF, sin renumerar los 106 originales.
- Comparación de los RF existentes: solo cambian los ocho indicados.
- Doce RNF y sección «Fuera de alcance» idénticos a la base.
- Constitución comprobada sin modificaciones respecto a la copia de revisión.
- Comprobación estructural de patrones EARS y referencias a RF/RNF existentes.
- Siete marcadores explícitos de decisiones pendientes.

Estas comprobaciones verifican el documento; no son pruebas de una aplicación
implementada ni resuelven las dudas abiertas.

## Comparación revisable

Los cambios exactos respecto a la base aprobada están en `revision-01.diff`,
junto a este documento. La especificación actual está en `spec.md`.
