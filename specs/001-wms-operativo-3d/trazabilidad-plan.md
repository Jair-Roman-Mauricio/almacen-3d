# Anexo del plan 001 — Trazabilidad y casos

Estado: **escenarios de prueba previstos**, 29/10/2026. No son tests implementados ni resultados ejecutados. Anexo normativo de [plan.md](plan.md). Las partes P-* y las familias de prueba se definen en sus §§1 y 7; [contratos.md](contratos.md) concreta rutas, datos y rechazos. Cada fila será vinculada a evidencia ejecutada durante implementación/validator-sdd.

## Requisitos funcionales

| Req. | Comportamiento que se verificará | Partes del plan | Pruebas previstas |
|---|---|---|---|
| RF-1 | CUANDO una persona presente un código de empresa, correo y contraseña que correspondan a un usuario activo de esa empresa, EL SISTEMA iniciará una sesión en el contexto de esa empresa. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-1. |
| RF-2 | SI las credenciales no permiten iniciar sesión, ENTONCES EL SISTEMA informará del rechazo sin conceder acceso al área operativa. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-2. |
| RF-3 | CUANDO un usuario cierre su sesión, EL SISTEMA impedirá continuar utilizando esa sesión para acceder al área operativa. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-3. |
| RF-4 | MIENTRAS una persona no tenga una sesión válida, EL SISTEMA rechazará su acceso a datos operativos de empresas. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-4. |
| RF-5 | SI una petición intenta consultar o modificar datos de una empresa distinta de la empresa de la sesión, ENTONCES EL SISTEMA rechazará el acceso. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-5. |
| RF-6 | SI el rol de la sesión no permite una acción según la matriz de permisos, ENTONCES EL SISTEMA rechazará la acción. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-6. |
| RF-7 | CUANDO un administrador cambie el rol de un usuario de su empresa, EL SISTEMA aplicará el nuevo permiso en su siguiente acción protegida. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-7. |
| RF-8 | CUANDO un administrador desactive un usuario de su empresa, EL SISTEMA rechazará sus siguientes acciones protegidas. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-8. |
| RF-9 | SI una acción dejaría a la empresa sin ningún administrador activo, ENTONCES EL SISTEMA rechazará esa acción. | P-ACC; §2.1/2.5, §3.2, §4.1 | I-ACC, I-ISO; escenario RF-9. |
| RF-10 | CUANDO un administrador registre un almacén válido, EL SISTEMA lo incorporará a los almacenes de su empresa. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-10. |
| RF-11 | CUANDO un usuario seleccione un almacén de su empresa, EL SISTEMA mostrará el inventario y la distribución correspondientes a ese almacén. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-11. |
| RF-12 | CUANDO un administrador agregue una zona, un pasillo, un rack, un nivel o una ubicación en el editor, EL SISTEMA incorporará el elemento a la distribución en edición. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-12. |
| RF-13 | CUANDO un administrador modifique la posición de un elemento en el editor, EL SISTEMA mostrará la posición propuesta antes de guardarla. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-13. |
| RF-14 | CUANDO un administrador modifique las dimensiones de un elemento en el editor, EL SISTEMA mostrará las dimensiones propuestas antes de guardarlas. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-14. |
| RF-15 | SI un elemento tiene una dimensión nula, negativa o no numérica, ENTONCES EL SISTEMA rechazará el guardado de ese elemento. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-15. |
| RF-16 | SI una ubicación contenida en un rack o nivel queda fuera de sus límites físicos declarados, ENTONCES EL SISTEMA rechazará el guardado de esa distribución. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-16. |
| RF-17 | SI dos ubicaciones del mismo almacén tienen el mismo código ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará el duplicado. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-17. |
| RF-18 | CUANDO un administrador guarde una distribución válida, EL SISTEMA conservará esa distribución al volver a abrir el almacén. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-18. |
| RF-19 | CUANDO un administrador descarte los cambios del editor, EL SISTEMA conservará la última distribución guardada. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-19. |
| RF-20 | MIENTRAS existan cambios del editor sin guardar, EL SISTEMA solicitará confirmación antes de abandonar esa edición. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-20. |
| RF-21 | SI al confirmar una eliminación el elemento contiene existencias o ubicaciones referenciadas por operaciones abiertas, ENTONCES EL SISTEMA rechazará su eliminación. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-21. |
| RF-22 | CUANDO se guarde un cambio geométrico permitido, EL SISTEMA conservará la identidad de las ubicaciones existentes afectadas. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-22. |
| RF-23 | CUANDO se guarde un cambio geométrico permitido, EL SISTEMA mantendrá las cantidades de inventario anteriores a ese cambio. | P-GEO; §2.2/2.3, §3.6, §4.2 | U-GEO, I-GEO, E-UI; escenario RF-23. |
| RF-24 | CUANDO un usuario abra la vista 3D de un almacén, EL SISTEMA representará su distribución guardada. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-24. |
| RF-25 | CUANDO un usuario utilice los controles de navegación 3D, EL SISTEMA permitirá rotar, acercar, alejar y desplazar la vista. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-25. |
| RF-26 | CUANDO un usuario seleccione una ubicación en 3D, EL SISTEMA mostrará sus productos y cantidades física registrada, reservada y disponible. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-26. |
| RF-27 | CUANDO un usuario busque un SKU existente en el almacén seleccionado, EL SISTEMA identificará las ubicaciones que registran existencias de ese SKU. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-27. |
| RF-28 | CUANDO un usuario busque un código de ubicación existente en el almacén seleccionado, EL SISTEMA destacará esa ubicación. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-28. |
| RF-29 | SI una búsqueda no encuentra coincidencias, ENTONCES EL SISTEMA mostrará un estado sin resultados. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-29. |
| RF-30 | EL SISTEMA distinguirá visualmente las ubicaciones vacías, con existencias y bloqueadas mediante una leyenda que no dependa solo del color. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-30. |
| RF-31 | CUANDO un administrador bloquee una ubicación, EL SISTEMA la excluirá de nuevas recepciones, reservas y destinos de movimientos internos. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-31. |
| RF-32 | CUANDO el servidor confirme una operación realizada por el usuario, EL SISTEMA actualizará los datos afectados de su consulta 3D al volver a consultarlos. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-32. |
| RF-33 | EL SISTEMA permitirá consultar inventario y ubicaciones mediante una lista aunque la representación 3D no esté disponible. | P-MAP/P-BLK; §3.8, §4.2/4.3 | E-FLOW, E-UI, I-BLK; escenario RF-33. |
| RF-34 | CUANDO un administrador o supervisor registre un producto válido, EL SISTEMA lo incorporará al catálogo de su empresa con SKU, nombre y unidad. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-34. |
| RF-35 | SI un SKU ya existe en la empresa ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará su creación duplicada. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-35. |
| RF-36 | EL SISTEMA conservará la misma identidad de producto cuando cambie su nombre. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-36. |
| RF-37 | EL SISTEMA mostrará las cantidades física registrada, reservada y disponible por producto y ubicación. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-37. |
| RF-38 | EL SISTEMA mostrará el total de existencias de un producto por almacén. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-38. |
| RF-39 | SI una operación confirmada produciría existencia física registrada negativa, ENTONCES EL SISTEMA rechazará la operación. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-39. |
| RF-40 | SI una operación confirmada produciría una cantidad total reservada superior a la existencia física registrada, ENTONCES EL SISTEMA rechazará la operación. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-40. |
| RF-41 | SI un producto tiene existencias, reservas u operaciones abiertas, ENTONCES EL SISTEMA rechazará su eliminación. | P-CAT/P-INV; §2.2/2.3, §3.1/3.2 | I-CAT, I-INV; escenario RF-41. |
| RF-42 | CUANDO un usuario autorizado confirme una recepción válida, EL SISTEMA incrementará la existencia del producto en su ubicación de destino. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-42. |
| RF-43 | SI una recepción indica una cantidad no positiva, ENTONCES EL SISTEMA rechazará su confirmación. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-43. |
| RF-44 | SI una recepción refiere un producto o una ubicación inexistente en la empresa y el almacén correspondientes, ENTONCES EL SISTEMA rechazará su confirmación. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-44. |
| RF-45 | CUANDO un usuario autorizado confirme un movimiento interno válido, EL SISTEMA trasladará la cantidad indicada entre sus ubicaciones de origen y destino. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-45. |
| RF-46 | SI un movimiento interno tiene la misma ubicación de origen y destino, ENTONCES EL SISTEMA rechazará su confirmación. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-46. |
| RF-47 | SI un movimiento interno intenta trasladar más cantidad que la disponible no reservada en el origen, ENTONCES EL SISTEMA rechazará su confirmación. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-47. |
| RF-48 | SI una recepción o un movimiento no puede confirmarse por completo, ENTONCES EL SISTEMA mantendrá las cantidades previas a esa operación. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-48. |
| RF-49 | CUANDO el usuario consulte una recepción o un movimiento confirmado, EL SISTEMA mostrará su referencia y su resultado. | P-INV/P-AUD; §3.1/3.2, §5 | I-INV, I-AUD; escenario RF-49. |
| RF-50 | CUANDO un administrador o supervisor cree un pedido de salida válido, EL SISTEMA lo registrará con sus productos y cantidades solicitadas. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-50. |
| RF-51 | SI una línea de pedido indica una cantidad no positiva, ENTONCES EL SISTEMA rechazará el guardado del pedido. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-51. |
| RF-52 | CUANDO un administrador o supervisor solicite una reserva válida, EL SISTEMA comprometerá la cantidad indicada en sus ubicaciones de origen. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-52. |
| RF-53 | SI una solicitud de reserva supera la cantidad disponible, ENTONCES EL SISTEMA rechazará esa solicitud sin incrementar la reserva. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-53. |
| RF-54 | CUANDO se confirme una reserva, EL SISTEMA reducirá la cantidad disponible sin reducir la existencia física registrada. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-54. |
| RF-55 | CUANDO un usuario autorizado consulte un pedido reservado, EL SISTEMA mostrará los productos y ubicaciones que debe preparar. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-55. |
| RF-56 | CUANDO un usuario autorizado registre una preparación válida, EL SISTEMA conservará la cantidad preparada por producto y ubicación de origen para el pedido correspondiente. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-56. |
| RF-57 | SI se intenta preparar una cantidad mayor que la reservada pendiente de preparar, ENTONCES EL SISTEMA rechazará ese registro. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-57. |
| RF-58 | CUANDO un administrador o supervisor confirme un despacho válido, EL SISTEMA descontará la cantidad despachada de la existencia física registrada en las ubicaciones reservadas. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-58. |
| RF-59 | CUANDO se confirme un despacho válido, EL SISTEMA consumirá la reserva correspondiente a la cantidad despachada. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-59. |
| RF-60 | SI un despacho supera la cantidad preparada pendiente de despacho del mismo pedido, producto y ubicación de origen, ENTONCES EL SISTEMA rechazará su confirmación. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-60. |
| RF-61 | SI un despacho no puede confirmarse por completo, ENTONCES EL SISTEMA mantendrá las cantidades y reservas previas a ese despacho. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-61. |
| RF-62 | CUANDO se cancele un pedido sin cantidades preparadas ni despachadas, EL SISTEMA liberará sus reservas. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-62. |
| RF-63 | SI se intenta cancelar un pedido con cantidades preparadas o despachadas, ENTONCES EL SISTEMA rechazará esa cancelación. | P-OUT; §2.3, §3.3, §5 | U-BAL, I-OUT; escenario RF-63. |
| RF-64 | CUANDO un usuario autorizado registre un conteo válido, EL SISTEMA conservará el producto, la cantidad observada y la ubicación contada. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-64. |
| RF-65 | CUANDO se registre un conteo, EL SISTEMA mantendrá la existencia física registrada hasta que se autorice un ajuste. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-65. |
| RF-66 | CUANDO se consulte un conteo, EL SISTEMA mostrará su diferencia frente a la existencia del mismo producto y ubicación que se tomó como referencia. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-66. |
| RF-67 | CUANDO un administrador o supervisor confirme un ajuste válido con motivo, EL SISTEMA aplicará la corrección autorizada al inventario. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-67. |
| RF-68 | SI un ajuste no tiene motivo, ENTONCES EL SISTEMA rechazará su confirmación. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-68. |
| RF-69 | SI un ajuste dejaría la existencia por debajo de una cantidad reservada, ENTONCES EL SISTEMA rechazará su confirmación. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-69. |
| RF-70 | SI las existencias del producto y ubicación contados cambiaron después de tomar la referencia del conteo y antes de autorizar su ajuste, ENTONCES EL SISTEMA rechazará el ajuste basado en esa referencia desactualizada. | P-CNT; §2.1, §3.5 | I-CNT, I-INV; escenario RF-70. |
| RF-71 | CUANDO se confirme una modificación de inventario, EL SISTEMA conservará autor, fecha, referencia, motivo o tipo, producto, cantidad y ubicaciones afectadas en su historial. | P-AUD; §2.1/2.3, §3.5/3.7 | I-AUD, I-ISO; escenario RF-71. |
| RF-72 | EL SISTEMA impedirá que los usuarios eliminen operaciones confirmadas desde las funciones de gestión de inventario. | P-AUD; §2.1/2.3, §3.5/3.7 | I-AUD, I-ISO; escenario RF-72. |
| RF-73 | CUANDO un usuario autorizado filtre el historial por almacén, producto o intervalo de fechas, EL SISTEMA mostrará las operaciones coincidentes de su empresa. | P-AUD; §2.1/2.3, §3.5/3.7 | I-AUD, I-ISO; escenario RF-73. |
| RF-74 | CUANDO un administrador o supervisor abra los indicadores de un almacén, EL SISTEMA mostrará productos con existencias, ubicaciones ocupadas, pedidos pendientes y movimientos del intervalo seleccionado. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-74. |
| RF-75 | CUANDO un administrador o supervisor configure un umbral no negativo de stock bajo para un producto en un almacén, EL SISTEMA conservará ese umbral. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-75. |
| RF-76 | MIENTRAS la cantidad disponible de un producto esté por debajo de su umbral configurado, EL SISTEMA mostrará una alerta de stock bajo para ese producto y almacén. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-76. |
| RF-77 | MIENTRAS un producto no tenga umbral de stock bajo configurado, EL SISTEMA no generará una alerta de stock bajo para ese producto. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-77. |
| RF-78 | CUANDO la cantidad disponible deje de estar por debajo del umbral, EL SISTEMA dejará de presentar esa alerta como activa. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-78. |
| RF-79 | CUANDO un administrador o supervisor abra una alerta de stock bajo, EL SISTEMA mostrará el producto, el almacén, la cantidad disponible y el umbral. | P-REP; §2.1/2.3, §3.7 | U-BAL, I-REP; escenario RF-79. |
| RF-80 | CUANDO un administrador cargue un archivo CSV o XLSX admitido, EL SISTEMA mostrará una previsualización de los registros interpretados. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-80. |
| RF-81 | CUANDO un administrador solicite validar una importación, EL SISTEMA identificará los registros inválidos antes de permitir aplicarla. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-81. |
| RF-82 | SI una importación contiene registros inválidos o duplicados dentro del mismo archivo, ENTONCES EL SISTEMA impedirá aplicarla hasta corregir esos registros. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-82. |
| RF-83 | SI una importación no corresponde al formato admitido, ENTONCES EL SISTEMA rechazará el archivo con una explicación del motivo. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-83. |
| RF-84 | CUANDO un administrador confirme una importación válida de catálogo, EL SISTEMA incorporará los productos nuevos a la empresa de su sesión. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-84. |
| RF-85 | CUANDO un administrador confirme una importación válida de existencias iniciales en ubicaciones sin existencias previas, EL SISTEMA registrará esas cantidades como entradas identificadas en el historial. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-85. |
| RF-86 | SI una importación de existencias iniciales afecta un producto y ubicación que ya registran existencias, ENTONCES EL SISTEMA rechazará esa importación. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-86. |
| RF-87 | SI una importación confirmada se vuelve a enviar con la misma empresa, referencia y datos de negocio, ENTONCES EL SISTEMA no volverá a aplicar sus efectos. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-87. |
| RF-88 | SI falla la aplicación de una importación, ENTONCES EL SISTEMA mantendrá los datos anteriores a esa importación. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-88. |
| RF-89 | CUANDO un administrador o supervisor solicite exportar inventario o historial a CSV o XLSX, EL SISTEMA generará el archivo con los filtros y la empresa de la consulta activa. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-89. |
| RF-90 | EL SISTEMA tratará como texto los valores de catálogo que podrían interpretarse como fórmulas al abrir una exportación en una hoja de cálculo. | P-EXC; §3.7, contratos: Intercambio de datos | I-EXC, I-CMD, E-FLOW; escenario RF-90. |
| RF-91 | CUANDO un visitante abra la landing, EL SISTEMA presentará el WMS, la visualización 3D y las operaciones incluidas en esta primera versión. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-91. |
| RF-92 | CUANDO un visitante consulte las modalidades, EL SISTEMA distinguirá la suscripción mensual alojada de la instalación en infraestructura del cliente con servicios pagados. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-92. |
| RF-93 | CUANDO un visitante consulte un precio o plan de la demostración, EL SISTEMA lo identificará como demostrativo. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-93. |
| RF-94 | CUANDO un visitante seleccione un plan demostrativo, EL SISTEMA mostrará una confirmación identificada como simulación. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-94. |
| RF-95 | EL SISTEMA impedirá que la selección de un plan demostrativo genere un cargo o compromiso de pago real. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-95. |
| RF-96 | CUANDO un visitante solicite acceder a la demostración, EL SISTEMA mostrará las instrucciones de acceso al entorno de datos sintéticos. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-96. |
| RF-97 | EL SISTEMA identificará el entorno operativo de demostración como una demostración con datos sintéticos. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-97. |
| RF-98 | EL SISTEMA presentará únicamente funciones implementadas como disponibles en la landing de esta entrega. | P-COM; §4.2/4.3, §5, contratos: Landing | E-COM, D-REF; escenario RF-98. |
| RF-99 | MIENTRAS el dispositivo no tenga conexión con el servidor, EL SISTEMA impedirá confirmar operaciones que modifiquen datos. | P-CON; §3.1/3.8, §4.3, §5 | I-CMD, I-SYNC, E-UI; escenario RF-99. |
| RF-100 | SI no se recibe confirmación de una operación enviada, ENTONCES EL SISTEMA informará que su resultado no está confirmado. | P-CON; §3.1/3.8, §4.3, §5 | I-CMD, I-SYNC, E-UI; escenario RF-100. |
| RF-101 | CUANDO se restablezca la conexión después de una respuesta perdida, EL SISTEMA permitirá consultar el resultado de la operación antes de repetir sus efectos. | P-CON; §3.1/3.8, §4.3, §5 | I-CMD, I-SYNC, E-UI; escenario RF-101. |
| RF-102 | SI se reenvía una operación de inventario con la misma empresa, referencia y datos de negocio después de una respuesta perdida, ENTONCES EL SISTEMA no duplicará sus efectos. | P-CON; §3.1/3.8, §4.3, §5 | I-CMD, I-SYNC, E-UI; escenario RF-102. |
| RF-103 | SI dos operaciones concurrentes compiten por una cantidad que no permite satisfacer ambas, ENTONCES EL SISTEMA rechazará la operación que produciría una existencia negativa o una reserva excesiva. | P-INV/P-OUT; §2.3, §3.1/3.2 | I-INV, I-OUT; escenario RF-103. |
| RF-104 | CUANDO el servidor se reinicie después de confirmar una operación, EL SISTEMA conservará el resultado confirmado al volver a consultarlo. | P-OPS; §3.1, §5.1 | I-CMD, O-OPS; escenario RF-104. |
| RF-105 | EL SISTEMA impedirá modificar inventario mediante consultas, búsquedas o navegación de la vista 3D. | P-MAP; §3.8, §4.1 | I-INV, E-FLOW; escenario RF-105. |
| RF-106 | CUANDO un usuario tenga conexión al servidor de la instalación local, EL SISTEMA permitirá completar el flujo operativo sin acceso a internet. | P-OPS; §5.1 | O-OPS, E-FLOW; escenario RF-106. |
| RF-107 | SI un movimiento interno, una reserva, una preparación o un despacho indica una cantidad ausente, no numérica, infinita o menor o igual a cero, ENTONCES EL SISTEMA rechazará su confirmación. | P-CAT/P-INV/P-OUT; §2.2, §3.3 | U-VAL, I-INV, I-OUT; escenario RF-107. |
| RF-108 | SI un conteo indica una cantidad ausente, no numérica, infinita o negativa, ENTONCES EL SISTEMA rechazará su registro. | P-CNT; §2.2, §3.5 | U-VAL, I-CNT, I-ISO; escenario RF-108. |
| RF-109 | SI un conteo refiere un producto o una ubicación inexistente en la empresa y el almacén correspondientes, ENTONCES EL SISTEMA rechazará su registro. | P-CNT; §2.2, §3.5 | U-VAL, I-CNT, I-ISO; escenario RF-109. |
| RF-110 | SI se reintenta una operación ya confirmada conservando su empresa, referencia y datos de negocio, ENTONCES EL SISTEMA devolverá el resultado registrado de esa confirmación al usuario autorizado. | P-CON; §3.1, contratos: Convenciones comunes | I-CMD, I-EXC; escenario RF-110. |
| RF-111 | SI se reutiliza una referencia de operación con datos de negocio distintos dentro de la misma empresa, ENTONCES EL SISTEMA rechazará la nueva solicitud sin modificar los datos de negocio existentes. | P-CON; §3.1, contratos: Convenciones comunes | I-CMD, I-EXC; escenario RF-111. |
| RF-112 | CUANDO un usuario inicie otra acción con una referencia nueva y datos de negocio iguales a los de una acción anterior, EL SISTEMA la evaluará como una operación distinta sujeta a sus validaciones de negocio. | P-CON; §3.1, contratos: Convenciones comunes | I-CMD, I-EXC; escenario RF-112. |
| RF-113 | CUANDO un administrador registre un usuario válido con nombre, correo, contraseña y rol permitido, EL SISTEMA lo incorporará a la empresa de la sesión del administrador. | P-ACC; §2.1/2.2, §3.2, contratos: Acceso | I-ACC, I-ISO; escenario RF-113. |
| RF-114 | SI el correo de un nuevo usuario ya existe en esa empresa ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará la creación duplicada. | P-ACC; §2.1/2.2, §3.2, contratos: Acceso | I-ACC, I-ISO; escenario RF-114. |
| RF-115 | SI el rol indicado al crear o modificar un usuario no es administrador, supervisor u operario, ENTONCES EL SISTEMA rechazará la acción. | P-ACC; §2.1/2.2, §3.2, contratos: Acceso | I-ACC, I-ISO; escenario RF-115. |
| RF-116 | SI un administrador intenta guardar una edición desactualizada de la distribución, ENTONCES EL SISTEMA rechazará ese guardado sin reemplazar la última distribución guardada. | P-GEO/P-UI; §3.6, §4.2/4.3 | I-GEO, E-UI; escenario RF-116. |
| RF-117 | SI se rechaza un guardado por edición desactualizada, ENTONCES EL SISTEMA conservará el borrador de esa sesión identificado como no guardado. | P-GEO/P-UI; §3.6, §4.2/4.3 | I-GEO, E-UI; escenario RF-117. |
| RF-118 | SI un despacho supera la reserva vigente del mismo pedido, producto y ubicación de origen, ENTONCES EL SISTEMA rechazará su confirmación. | P-OUT; §2.3, §3.2/3.3 | I-OUT, I-CMD; escenario RF-118. |
| RF-119 | CUANDO un despacho se confirme, EL SISTEMA reducirá la cantidad preparada pendiente de despacho por la cantidad despachada correspondiente. | P-OUT; §2.3, §3.2/3.3 | I-OUT, I-CMD; escenario RF-119. |
| RF-120 | SI un nuevo despacho afecta a un pedido cuyas cantidades ya fueron despachadas por completo, ENTONCES EL SISTEMA rechazará su confirmación. | P-OUT; §2.3, §3.2/3.3 | I-OUT, I-CMD; escenario RF-120. |
| RF-121 | SI varios despachos concurrentes de un mismo pedido intentarían consumir una cantidad mayor que la reservada o preparada pendiente de despacho, ENTONCES EL SISTEMA rechazará los despachos que excedan esos saldos. | P-OUT; §2.3, §3.2/3.3 | I-OUT, I-CMD; escenario RF-121. |
| RF-122 | SI una importación supera 20 MB o 20.000 registros de datos, ENTONCES EL SISTEMA rechazará su aplicación sin modificar datos de negocio. | P-EXC; §3.7, contratos: Formatos de importación | I-EXC, P-LOAD; escenario RF-122. |
| RF-123 | SI una cantidad de un producto contado en piezas, cajas o pallets no es entera, ENTONCES EL SISTEMA rechazará esa cantidad. | P-CAT; §2.2/2.3 | U-VAL, I-INV, I-EXC; escenario RF-123. |
| RF-124 | SI una cantidad de peso, volumen o longitud contiene más de tres decimales, ENTONCES EL SISTEMA la rechazará sin redondearla automáticamente. | P-CAT; §2.2/2.3 | U-VAL, I-INV, I-EXC; escenario RF-124. |
| RF-125 | EL SISTEMA registrará las cantidades de cada producto en su unidad base sin convertirlas automáticamente a otra presentación. | P-CAT; §2.2/2.3 | U-VAL, I-INV, I-EXC; escenario RF-125. |
| RF-126 | EL SISTEMA mostrará y solicitará las dimensiones del editor en metros. | P-GEO; §2.2, §4.2/4.3 | U-GEO, E-UI; escenario RF-126. |
| RF-127 | SI un nombre está vacío después de retirar espacios exteriores o supera 160 caracteres, ENTONCES EL SISTEMA rechazará su guardado. | P-CAT/P-ACC/P-GEO; §2.2, contratos: Convenciones | U-VAL, I-CAT, I-SET, I-GEO; escenario RF-127. |
| RF-128 | SI un código está vacío después de retirar espacios exteriores, supera 64 caracteres o contiene caracteres distintos de letras, números, guion, guion bajo, punto o barra inclinada, ENTONCES EL SISTEMA rechazará su guardado. | P-CAT/P-ACC/P-GEO; §2.2, contratos: Convenciones | U-VAL, I-CAT, I-SET, I-GEO; escenario RF-128. |
| RF-129 | CUANDO se configure una empresa sin una elección distinta de zona horaria, EL SISTEMA utilizará America/Lima para sus fechas. | P-ACC/P-AUD; §2.2, §3.7 | U-VAL, I-AUD, I-ACC; escenario RF-129. |
| RF-130 | CUANDO un administrador configure una zona horaria válida para su empresa, EL SISTEMA la utilizará para las consultas de fechas de esa empresa. | P-ACC/P-AUD; §2.2, §3.7 | U-VAL, I-AUD, I-ACC; escenario RF-130. |
| RF-131 | EL SISTEMA mostrará las fechas operativas en la zona horaria configurada para la empresa de la sesión. | P-ACC/P-AUD; §2.2, §3.7 | U-VAL, I-AUD, I-ACC; escenario RF-131. |
| RF-132 | CUANDO un usuario filtre por fechas inicial y final válidas, EL SISTEMA incluirá ambos días completos según la zona horaria de su empresa. | P-ACC/P-AUD; §2.2, §3.7 | U-VAL, I-AUD, I-ACC; escenario RF-132. |
| RF-133 | SI la fecha final de un filtro precede a su fecha inicial, ENTONCES EL SISTEMA rechazará ese filtro. | P-ACC/P-AUD; §2.2, §3.7 | U-VAL, I-AUD, I-ACC; escenario RF-133. |
| RF-134 | CUANDO un administrador confirme una importación válida de catálogo con un SKU existente en su empresa, EL SISTEMA actualizará el nombre del producto correspondiente. | P-EXC/P-CAT; §2.2, §3.7, contratos: Formatos | I-EXC, I-CAT; escenario RF-134. |
| RF-135 | SI una fila de importación intenta cambiar la unidad base de un producto existente, ENTONCES EL SISTEMA rechazará la importación. | P-EXC/P-CAT; §2.2, §3.7, contratos: Formatos | I-EXC, I-CAT; escenario RF-135. |
| RF-136 | CUANDO se previsualice una importación de catálogo, EL SISTEMA distinguirá las creaciones propuestas de las actualizaciones propuestas. | P-EXC/P-CAT; §2.2, §3.7, contratos: Formatos | I-EXC, I-CAT; escenario RF-136. |
| RF-137 | CUANDO una importación actualice el nombre de un producto, EL SISTEMA conservará su SKU y unidad base anteriores. | P-EXC/P-CAT; §2.2, §3.7, contratos: Formatos | I-EXC, I-CAT; escenario RF-137. |
| RF-138 | CUANDO una importación actualice el nombre de un producto, EL SISTEMA conservará sus cantidades de inventario anteriores. | P-EXC/P-CAT; §2.2, §3.7, contratos: Formatos | I-EXC, I-CAT; escenario RF-138. |
| RF-139 | CUANDO un visitante complete un registro válido de empresa en la modalidad SaaS, EL SISTEMA creará la empresa con el código y nombre registrados. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-139. |
| RF-140 | CUANDO se confirme el registro SaaS de una empresa, EL SISTEMA creará su primer usuario administrador con el nombre, correo y contraseña registrados en ese proceso. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-140. |
| RF-141 | SI no se puede completar el alta conjunta de empresa y primer administrador, ENTONCES EL SISTEMA dejará sin aplicar ese registro. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-141. |
| RF-142 | SI el código de empresa solicitado ya existe en la instalación ignorando mayúsculas y espacios exteriores, ENTONCES EL SISTEMA rechazará el registro sin modificar la empresa existente. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-142. |
| RF-143 | CUANDO se confirme el registro de empresa y primer administrador, EL SISTEMA mostrará el código de empresa necesario para iniciar sesión. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-143. |
| RF-144 | CUANDO se inicie una instalación local que todavía no tenga empresa configurada, EL SISTEMA mostrará el asistente de configuración inicial. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-144. |
| RF-145 | CUANDO se complete válidamente el asistente local, EL SISTEMA creará la empresa con el código y nombre indicados. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-145. |
| RF-146 | CUANDO se confirme la configuración inicial local, EL SISTEMA creará el primer administrador de esa empresa con el nombre, correo y contraseña indicados en el asistente. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-146. |
| RF-147 | SI falla el alta conjunta de empresa y primer administrador local, ENTONCES EL SISTEMA dejará sin aplicar esa configuración inicial. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-147. |
| RF-148 | SI se intenta confirmar de nuevo la configuración inicial de una instalación local que ya tiene empresa configurada, ENTONCES EL SISTEMA rechazará esa nueva configuración sin reemplazar la existente. | P-ACC; §2.1, §3.2, §5/5.1, contratos: Acceso | I-SET, I-ISO, O-OPS; escenario RF-148. |
| RF-149 | EL SISTEMA validará el correo y contraseña exclusivamente contra las cuentas de la empresa identificada por el código de inicio de sesión. | P-ACC; §2.1/2.2/2.5, §4.1, §5.1 | I-ACC, I-SET, O-OPS; escenario RF-149. |
| RF-150 | SI falta el código de empresa, correo o contraseña requeridos en un alta o inicio de sesión, ENTONCES EL SISTEMA rechazará esa acción. | P-ACC; §2.1/2.2/2.5, §4.1, §5.1 | I-ACC, I-SET, O-OPS; escenario RF-150. |
| RF-151 | SI el correo indicado al crear una cuenta no tiene formato de correo electrónico, ENTONCES EL SISTEMA rechazará su creación. | P-ACC; §2.1/2.2/2.5, §4.1, §5.1 | I-ACC, I-SET, O-OPS; escenario RF-151. |
| RF-152 | EL SISTEMA permitirá completar el registro SaaS, la configuración local, el alta de usuarios y el acceso sin depender del envío de correos. | P-ACC; §2.1/2.2/2.5, §4.1, §5.1 | I-ACC, I-SET, O-OPS; escenario RF-152. |
| RF-153 | EL SISTEMA dispondrá de empresas ficticias precargadas en el entorno de demostración. | P-COM/P-OPS; §4.2, §5.1, contratos: Acceso | E-COM, E-FLOW, O-OPS; escenario RF-153. |
| RF-154 | EL SISTEMA dispondrá de cuentas ficticias precargadas para probar los roles administrador, supervisor y operario en la demostración. | P-COM/P-OPS; §4.2, §5.1, contratos: Acceso | E-COM, E-FLOW, O-OPS; escenario RF-154. |
| RF-155 | CUANDO se consulten las instrucciones de acceso a la demostración, EL SISTEMA mostrará código de empresa, correo y contraseña únicamente de las cuentas ficticias precargadas como cuentas demostrativas. | P-COM/P-OPS; §4.2, §5.1, contratos: Acceso | E-COM, E-FLOW, O-OPS; escenario RF-155. |
| RF-156 | CUANDO un administrador o supervisor solicite una reserva parcial válida de un pedido, EL SISTEMA reservará la cantidad solicitada conservando el saldo no reservado de la línea. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-156. |
| RF-157 | CUANDO un usuario autorizado registre una preparación parcial válida, EL SISTEMA conservará la cantidad reservada que todavía falta preparar. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-157. |
| RF-158 | CUANDO un administrador o supervisor confirme un despacho parcial válido, EL SISTEMA conservará el saldo del pedido que todavía no se despachó. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-158. |
| RF-159 | SI una nueva reserva supera el saldo pendiente de reservar de su línea de pedido, ENTONCES EL SISTEMA rechazará esa solicitud. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-159. |
| RF-160 | CUANDO un usuario autorizado consulte un pedido, EL SISTEMA mostrará por línea las cantidades solicitadas, reservadas vigentes, preparadas pendientes de despacho, despachadas y pendientes del pedido. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-160. |
| RF-161 | MIENTRAS un pedido tenga alguna cantidad despachada y alguna línea con saldo pendiente, EL SISTEMA lo identificará como parcialmente despachado. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-161. |
| RF-162 | CUANDO todas las líneas de un pedido alcancen su cantidad solicitada despachada, EL SISTEMA lo identificará como despachado por completo. | P-OUT; §2.1/2.3, §3.3 | U-BAL, I-OUT, E-FLOW; escenario RF-162. |
| RF-163 | CUANDO un administrador o supervisor asigne la preparación de un pedido a un operario activo de su empresa, EL SISTEMA registrará ese operario como responsable de la preparación pendiente. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-163. |
| RF-164 | SI una asignación o reasignación indica un usuario inactivo, de otra empresa o con rol distinto de operario, ENTONCES EL SISTEMA rechazará la acción. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-164. |
| RF-165 | SI un operario intenta confirmar preparación y no es el operario asignado al pedido en ese momento, ENTONCES EL SISTEMA rechazará ese avance. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-165. |
| RF-166 | CUANDO un administrador o supervisor reasigne válidamente un pedido de preparación, EL SISTEMA cambiará el operario responsable del trabajo pendiente. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-166. |
| RF-167 | CUANDO se reasigne la preparación de un pedido, EL SISTEMA conservará las cantidades preparadas y despachadas previamente confirmadas. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-167. |
| RF-168 | CUANDO se confirme una asignación o reasignación de preparación, EL SISTEMA conservará su autor, fecha, pedido y operario asignado en el historial de esa acción. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-168. |
| RF-169 | SI varias reservas concurrentes del mismo pedido superarían el saldo pendiente de reservar, ENTONCES EL SISTEMA rechazará las solicitudes que excedan ese saldo. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-169. |
| RF-170 | SI varias preparaciones concurrentes del mismo pedido, producto y ubicación superarían la cantidad reservada pendiente de preparar, ENTONCES EL SISTEMA rechazará los avances que excedan ese saldo. | P-OUT/P-ACC/P-AUD; §3.2/3.3 | I-OUT, I-ACC, I-AUD; escenario RF-170. |
| RF-171 | CUANDO un administrador o supervisor registre un traslado válido, EL SISTEMA lo conservará con su referencia, almacenes de origen y destino, productos, cantidades y ubicaciones de origen. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-171. |
| RF-172 | SI un traslado indica el mismo almacén como origen y destino o un almacén ajeno a la empresa de la sesión, ENTONCES EL SISTEMA rechazará la acción. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-172. |
| RF-173 | CUANDO se confirme una salida válida de traslado, EL SISTEMA descontará las cantidades declaradas de sus ubicaciones de origen. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-173. |
| RF-174 | CUANDO se confirme una salida válida de traslado, EL SISTEMA incorporará esas cantidades al stock en tránsito del traslado. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-174. |
| RF-175 | SI una salida de traslado supera el stock disponible no reservado en alguna ubicación de origen, ENTONCES EL SISTEMA rechazará su confirmación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-175. |
| RF-176 | SI se intenta confirmar una nueva salida de un traslado cuya salida ya fue confirmada, ENTONCES EL SISTEMA rechazará esa nueva operación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-176. |
| RF-177 | CUANDO un usuario consulte un traslado con mercancía en tránsito, EL SISTEMA mostrará esas cantidades separadas de las existencias registradas en ubicaciones de almacén. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-177. |
| RF-178 | MIENTRAS una cantidad permanezca en tránsito, EL SISTEMA la excluirá del stock disponible para nuevas reservas. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-178. |
| RF-179 | CUANDO un usuario autorizado confirme una recepción válida de traslado, EL SISTEMA incorporará las cantidades recibidas a sus ubicaciones del almacén de destino. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-179. |
| RF-180 | CUANDO se confirme una recepción válida de traslado, EL SISTEMA reducirá las cantidades pendientes en tránsito por las cantidades recibidas. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-180. |
| RF-181 | SI una recepción de traslado supera la cantidad todavía pendiente en tránsito del producto correspondiente, ENTONCES EL SISTEMA rechazará su confirmación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-181. |
| RF-182 | SI una salida o recepción de traslado indica una cantidad ausente, no numérica, infinita o menor o igual a cero, ENTONCES EL SISTEMA rechazará su confirmación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-182. |
| RF-183 | SI una recepción de traslado indica una ubicación inexistente, bloqueada o que no pertenece a su almacén de destino, ENTONCES EL SISTEMA rechazará su confirmación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-183. |
| RF-184 | CUANDO todas las cantidades de un traslado tengan recepción confirmada, EL SISTEMA lo identificará como recibido por completo. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-184. |
| RF-185 | SI falla la confirmación de una salida o recepción de traslado, ENTONCES EL SISTEMA mantendrá las cantidades físicas y en tránsito anteriores a esa operación. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-185. |
| RF-186 | EL SISTEMA conservará la suma de existencias físicas y stock en tránsito por producto de la empresa como efecto exclusivo de cada etapa confirmada de un traslado. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-186. |
| RF-187 | CUANDO se confirme una salida o recepción de traslado, EL SISTEMA conservará su autor, fecha, referencia de traslado, productos, cantidades y almacenes afectados en el historial de esa etapa. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-187. |
| RF-188 | SI varias recepciones concurrentes de un traslado superarían su saldo en tránsito, ENTONCES EL SISTEMA rechazará las recepciones que excedan ese saldo. | P-TRA; §2.1/2.3, §3.1/3.2/3.4, contratos: Traslados | U-BAL, I-TRA, I-CMD; escenario RF-188. |
| RF-189 | SI al guardar una distribución algún elemento queda fuera de los límites de su contenedor declarado, ENTONCES EL SISTEMA rechazará ese guardado. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-189. |
| RF-190 | SI al guardar una distribución dos zonas se solapan entre sí, ENTONCES EL SISTEMA rechazará ese guardado. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-190. |
| RF-191 | SI al guardar una distribución dos racks se solapan entre sí, ENTONCES EL SISTEMA rechazará ese guardado. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-191. |
| RF-192 | SI al guardar una distribución un rack se solapa con un pasillo, ENTONCES EL SISTEMA rechazará ese guardado. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-192. |
| RF-193 | SI al guardar una distribución dos ubicaciones del mismo nivel o directamente de la misma zona se solapan, ENTONCES EL SISTEMA rechazará ese guardado. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-193. |
| RF-194 | EL SISTEMA permitirá que las zonas contengan racks y pasillos y que los racks y niveles contengan sus elementos conforme a la jerarquía declarada. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-194. |
| RF-195 | SI al confirmar un cambio de posición el elemento está ocupado o tiene trabajo pendiente, ENTONCES EL SISTEMA rechazará ese cambio. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-195. |
| RF-196 | SI al confirmar un cambio de dimensiones el elemento está ocupado o tiene trabajo pendiente, ENTONCES EL SISTEMA rechazará ese cambio. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-196. |
| RF-197 | SI una distribución incluye algún cambio que incumple las reglas de geometría o de elementos ocupados, ENTONCES EL SISTEMA conservará la última distribución guardada sin aplicar parcialmente la edición rechazada. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-197. |
| RF-198 | CUANDO dos elementos solo compartan un borde sin invadir sus interiores, EL SISTEMA no tratará ese contacto como solapamiento físico. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-198. |
| RF-199 | SI se rechaza una edición por contención, solapamiento o trabajo pendiente, ENTONCES EL SISTEMA identificará el elemento afectado y el motivo del rechazo. | P-GEO; §2.2/2.3, §3.2/3.6 | U-GEO, I-GEO, E-UI; escenario RF-199. |
| RF-200 | SI una nueva recepción, reserva, movimiento físico, preparación, despacho o etapa física de traslado afecta una ubicación bloqueada, ENTONCES EL SISTEMA rechazará su confirmación. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-200. |
| RF-201 | CUANDO se bloquee una ubicación con reservas o trabajo pendiente, EL SISTEMA conservará esos compromisos sin cancelarlos automáticamente. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-201. |
| RF-202 | MIENTRAS una ubicación esté bloqueada, EL SISTEMA permitirá sus consultas, conteos y ajustes con los permisos y validaciones ya definidos. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-202. |
| RF-203 | SI se intenta confirmar un ajuste en una ubicación bloqueada sin motivo o que deja existencias por debajo de sus reservas, ENTONCES EL SISTEMA rechazará el ajuste. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-203. |
| RF-204 | CUANDO un administrador indique un motivo y confirme el desbloqueo de una ubicación de su empresa, EL SISTEMA la habilitará para nuevas operaciones sujetas a las validaciones vigentes. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-204. |
| RF-205 | SI se intenta desbloquear una ubicación sin motivo o sin rol de administrador de su empresa, ENTONCES EL SISTEMA rechazará la acción. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-205. |
| RF-206 | CUANDO se confirme un desbloqueo, EL SISTEMA conservará su autor, fecha, ubicación y motivo en el historial. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-206. |
| RF-207 | CUANDO se desbloquee una ubicación, EL SISTEMA mantendrá pendientes sus operaciones abiertas hasta que un usuario autorizado las confirme. | P-BLK; §2.3, §3.1/3.2/3.3, §5, contratos: Bloqueo | I-BLK, I-CNT, I-CMD, I-AUD; escenario RF-207. |

## Requisitos no funcionales

| Req. | Comportamiento que se verificará | Partes del plan | Pruebas previstas |
|---|---|---|---|
| RNF-1 | EL SISTEMA presentará los textos de la interfaz y los mensajes de validación en español. | P-UI; §4.1/4.3 | E-UI; escenario RNF-1. |
| RNF-2 | EL SISTEMA exigirá las mismas autorizaciones para acciones realizadas desde cualquier interfaz disponible. | P-ACC/P-INV; §1.1, §2.5, §3.2, §4.1 | I-ACC, I-ISO, E-FLOW; escenario RNF-2. |
| RNF-3 | EL SISTEMA mantendrá los mismos resultados de negocio para operaciones equivalentes en las modalidades alojada y local. | P-OPS; §1.1, §5.1, §7.1 | O-OPS, I-INV, I-OUT, I-TRA; escenario RNF-3. |
| RNF-4 | EL SISTEMA permitirá navegar por teclado en las funciones operativas disponibles fuera del lienzo 3D. | P-UI; §4.3 | E-UI; escenario RNF-4. |
| RNF-5 | EL SISTEMA mostrará nombres accesibles en los controles de formularios y acciones operativas. | P-UI; §4.3 | E-UI; escenario RNF-5. |
| RNF-6 | EL SISTEMA permitirá consultar inventario y realizar operaciones en una presentación alternativa al lienzo 3D. | P-MAP/P-UI; §3.8, §4.2/4.3 | E-UI, E-FLOW; escenario RNF-6. |
| RNF-7 | EL SISTEMA mostrará estados de carga, vacío, error y ausencia de permiso cuando corresponda a una consulta o acción. | P-UI; §4.2/4.3 | E-UI; escenario RNF-7. |
| RNF-8 | EL SISTEMA conservará los datos de negocio al restaurar un respaldo válido de la misma instalación. | P-OPS; §5.1 | O-OPS; escenario RNF-8. |
| RNF-9 | EL SISTEMA mantendrá un procedimiento verificable para actualizar una instalación conservando los datos existentes. | P-OPS; §5.1, §6.1 | O-OPS; escenario RNF-9. |
| RNF-10 | EL SISTEMA permitirá completar las pruebas de la demostración sin utilizar datos reales de terceros ni efectuar cobros reales. | P-COM/P-OPS; §5.1, §7.3 | E-COM, E-FLOW, O-OPS; escenario RNF-10. |
| RNF-11 | EL SISTEMA permitirá completar los flujos de validación con el perfil de volumen y concurrencia aprobado en esta especificación. | P-PERF; §7.3 | P-LOAD; escenario RNF-11. |
| RNF-12 | EL SISTEMA permitirá identificar las referencias utilizadas para el diseño de la landing y los módulos visuales conforme a la constitución. | P-UI; §4.3, referencias-ui.md | D-REF, E-UI; escenario RNF-12. |
| RNF-13 | EL SISTEMA responderá a las consultas y confirmaciones habituales en un máximo de 2 segundos para al menos el 95 % de las solicitudes medidas en el entorno de referencia y con el perfil aprobado. | P-PERF; §2.3, §3.2, §7.3 | P-LOAD; escenario RNF-13. |
| RNF-14 | CUANDO se confirme un cambio de inventario, EL SISTEMA lo mostrará en las consultas activas de otras sesiones conectadas en un máximo de 5 segundos en el entorno de referencia. | P-CON; §3.8, §7.3 | I-SYNC, P-LOAD; escenario RNF-14. |
| RNF-15 | CUANDO se abra la vista 3D de un almacén del perfil aprobado, EL SISTEMA la dejará disponible para navegar en un máximo de 5 segundos en el entorno de referencia. | P-MAP; §3.8, §7.3 | E-UI, P-LOAD; escenario RNF-15. |
| RNF-16 | CUANDO se procese una importación válida de hasta 20 MB y 20.000 registros de datos, EL SISTEMA completará su procesamiento en un máximo de 60 segundos de trabajo acumulado, excluyendo el tiempo que el usuario tarde en revisar y confirmar la previsualización, en el entorno de referencia. | P-EXC; §3.7, §7.3 | I-EXC, P-LOAD; escenario RNF-16. |
| RNF-17 | EL SISTEMA permitirá utilizar el editor visual en escritorio desde una ventana de 1280 × 720 píxeles. | P-GEO/P-UI; §4.2/4.3, §7.2 | E-UI; escenario RNF-17. |
| RNF-18 | EL SISTEMA permitirá consultar inventario y realizar las operaciones autorizadas de almacén en móvil desde una ventana de 360 × 800 píxeles. | P-UI; §4.2/4.3, §7.2 | E-UI, E-FLOW; escenario RNF-18. |

## Casos límite de la especificación

Cada caso conserva su texto y resultado literal. CL-* identifica el escenario del plan, sin renumerar los requisitos de la spec. La prueba incluye preparación del estado, acción, rechazo/resultado y ausencia de efectos indebidos.

| Escenario | Caso de la spec | Resultado requerido | Pruebas previstas |
|---|---|---|---|
| CL-001 | Empresa sin almacenes | Mostrar estado vacío con acceso a la creación según permisos; RF-6, RF-10, RNF-7. | E-UI, I-ACC, I-GEO, I-ISO, U-GEO. |
| CL-002 | Almacén sin distribución ni inventario | Mostrar el estado vacío correspondiente sin crear existencias; RF-24, RNF-7. | E-FLOW, E-UI, I-BLK. |
| CL-003 | Usuario sin sesión, desactivado o de otra empresa | Rechazar el acceso; RF-4, RF-5, RF-8. | I-ACC, I-ISO. |
| CL-004 | Mismo correo en empresas distintas | Validar cada cuenta dentro de la empresa indicada por su código; RF-1, RF-114, RF-149. | I-ACC, I-ISO, I-SET, O-OPS. |
| CL-005 | Código de empresa, correo o contraseña ausentes | Rechazar el alta o acceso que requiera esos datos; RF-150. | I-ACC, I-SET, O-OPS. |
| CL-006 | Correo de formato inválido al crear una cuenta | Rechazar la creación; RF-151. | I-ACC, I-SET, O-OPS. |
| CL-007 | Registro SaaS con código de empresa existente | Rechazar sin modificar la empresa existente; RF-142. | I-ISO, I-SET, O-OPS. |
| CL-008 | Dos registros SaaS concurrentes con el mismo código | Confirmar como máximo un registro y conservar su empresa y administrador; RF-141, RF-142. | I-ISO, I-SET, O-OPS. |
| CL-009 | Fallo entre el alta de empresa y el primer administrador | No conservar un alta incompleta; RF-141, RF-147. | I-ISO, I-SET, O-OPS. |
| CL-010 | Dos sesiones intentan finalizar el asistente local | No reemplazar la configuración que ya quedó confirmada; RF-147, RF-148. | I-ISO, I-SET, O-OPS. |
| CL-011 | Reinicio de una instalación local ya configurada | Mantener la empresa y su administrador existentes; RF-104, RF-148. | I-CMD, I-ISO, I-SET, O-OPS. |
| CL-012 | Último administrador activo | Impedir su desactivación o pérdida de rol; RF-9. | I-ACC, I-ISO. |
| CL-013 | Código duplicado con mayúsculas o espacios exteriores | Rechazar el duplicado en su ámbito; RF-17, RF-35. | E-UI, I-CAT, I-GEO, I-INV, U-GEO. |
| CL-014 | Nombre vacío o mayor a 160 caracteres | Rechazar el guardado; RF-127. | I-CAT, I-GEO, I-SET, U-VAL. |
| CL-015 | Código vacío, mayor a 64 caracteres o con caracteres no admitidos | Rechazar el guardado; RF-128. | I-CAT, I-GEO, I-SET, U-VAL. |
| CL-016 | Nombre de 160 caracteres o código de 64 caracteres | Aceptar la longitud si cumple las demás validaciones; RF-127, RF-128. | I-CAT, I-GEO, I-SET, U-VAL. |
| CL-017 | Cantidad cero o negativa en una recepción o pedido | Rechazar la confirmación; RF-43, RF-51. | I-AUD, I-INV, I-OUT, U-BAL. |
| CL-018 | Cantidad no positiva en movimiento, reserva, preparación o despacho | Rechazar la confirmación; RF-107. | I-INV, I-OUT, U-VAL. |
| CL-019 | Conteo observado igual a cero | Permitir registrar la observación sin modificar stock; RF-64, RF-65. | I-CNT, I-INV. |
| CL-020 | Conteo negativo, no numérico, infinito o sin cantidad | Rechazar el registro; RF-108. | I-CNT, I-ISO, U-VAL. |
| CL-021 | Ubicación con varios productos al contar | Asociar cada cantidad observada a su producto y ubicación; RF-64, RF-66, RF-109. | I-CNT, I-INV, I-ISO, U-VAL. |
| CL-022 | Cantidad fraccionaria de piezas, cajas o pallets | Rechazar la cantidad; RF-123. | I-EXC, I-INV, U-VAL. |
| CL-023 | Peso, volumen o longitud con hasta tres decimales | Evaluar con las demás reglas sin redondeo automático; RF-124, RF-125. | I-EXC, I-INV, U-VAL. |
| CL-024 | Peso, volumen o longitud con más de tres decimales | Rechazar sin redondear; RF-124. | I-EXC, I-INV, U-VAL. |
| CL-025 | Cambio de unidad por importación de un SKU existente | Rechazar la importación; RF-135. | I-CAT, I-EXC. |
| CL-026 | Dimensiones nulas, negativas o no numéricas | Rechazar el guardado; RF-15. | E-UI, I-GEO, U-GEO. |
| CL-027 | Ubicación fuera del elemento que la contiene | Rechazar el guardado; RF-16. | E-UI, I-GEO, U-GEO. |
| CL-028 | Dos zonas que comparten espacio interior | Rechazar el guardado; RF-190. | E-UI, I-GEO, U-GEO. |
| CL-029 | Rack dentro de su zona, con niveles y ubicaciones dentro de sus contenedores | Permitir la contención si cumple las demás validaciones; RF-189, RF-194. | E-UI, I-GEO, U-GEO. |
| CL-030 | Solapamiento entre racks o entre un rack y un pasillo | Rechazar el guardado; RF-191, RF-192. | E-UI, I-GEO, U-GEO. |
| CL-031 | Solapamiento entre ubicaciones del mismo nivel o de la misma zona directa | Rechazar el guardado; RF-193. | E-UI, I-GEO, U-GEO. |
| CL-032 | Contacto únicamente entre bordes de elementos | No rechazar por solapamiento si no comparten interior; RF-198. | E-UI, I-GEO, U-GEO. |
| CL-033 | Borrar rack con existencias o trabajo pendiente | Rechazar la eliminación; RF-21. | E-UI, I-GEO, U-GEO. |
| CL-034 | Mover o redimensionar un elemento con stock o referencias de operaciones abiertas | Rechazar el cambio e indicar el motivo; RF-195, RF-196, RF-199. | E-UI, I-GEO, U-GEO. |
| CL-035 | Mover un contenedor aparentemente vacío cuyo descendiente tiene stock | Rechazar el cambio; definición de elemento ocupado y RF-195. | E-UI, I-GEO, U-GEO. |
| CL-036 | Un elemento recibe stock o una operación abierta después de abrir el editor | Volver a comprobar su estado al guardar y rechazar el cambio que dejó de estar permitido; RF-21, RF-195, RF-196. | E-UI, I-GEO, U-GEO. |
| CL-037 | Edición con varios cambios y uno inválido | Conservar íntegra la distribución guardada anterior; RF-197. | E-UI, I-GEO, U-GEO. |
| CL-038 | Entrada de existencias después de abrir el editor y antes de eliminar un elemento | Rechazar la eliminación al comprobar su estado en la confirmación; RF-21. | E-UI, I-GEO, U-GEO. |
| CL-039 | Descartar o abandonar cambios de distribución | Conservar lo guardado; RF-19, RF-20. | E-UI, I-GEO, U-GEO. |
| CL-040 | Dos administradores guardan ediciones basadas en la misma distribución anterior | Conservar el primer guardado válido y rechazar el desactualizado manteniendo su borrador; RF-116, RF-117. | E-UI, I-GEO. |
| CL-041 | Buscar un producto inexistente | Mostrar ausencia de resultados; RF-29. | E-FLOW, E-UI, I-BLK. |
| CL-042 | Lienzo 3D no disponible | Permitir la alternativa operativa; RF-33, RNF-6. | E-FLOW, E-UI, I-BLK. |
| CL-043 | Ubicación bloqueada con reservas anteriores | Conservar las reservas y rechazar nuevas confirmaciones de preparación o despacho hasta el desbloqueo; RF-200, RF-201. | I-AUD, I-BLK, I-CMD, I-CNT. |
| CL-044 | Salida o entrada de movimiento interno o traslado con ubicación bloqueada | Rechazar la etapa sin aplicar efectos parciales; RF-48, RF-185, RF-200. | I-AUD, I-BLK, I-CMD, I-CNT, I-INV, I-TRA, U-BAL. |
| CL-045 | Conteo o ajuste de una ubicación bloqueada | Aplicar los permisos y restricciones normales, incluido motivo y protección de reservas; RF-202, RF-203. | I-AUD, I-BLK, I-CMD, I-CNT. |
| CL-046 | Formulario abierto antes de bloquear la ubicación | Rechazar la nueva confirmación mientras el bloqueo siga vigente; RF-200. | I-AUD, I-BLK, I-CMD, I-CNT. |
| CL-047 | Desbloqueo sin motivo o por supervisor u operario | Rechazar la acción; RF-205. | I-AUD, I-BLK, I-CMD, I-CNT. |
| CL-048 | Desbloqueo válido con trabajo pendiente | Registrar el motivo y conservar el trabajo para confirmación posterior, sin ejecutarlo automáticamente; RF-204, RF-206, RF-207. | I-AUD, I-BLK, I-CMD, I-CNT. |
| CL-049 | Reintento de una operación confirmada antes del bloqueo | Devolver el resultado registrado sin aplicar otra vez el movimiento; RF-110. | I-CMD, I-EXC. |
| CL-050 | Dos reservas simultáneas de la última cantidad disponible | No confirmar ambas si exceden el stock; RF-103. | I-INV, I-OUT. |
| CL-051 | Mover una cantidad mayor que la disponible no reservada | Rechazar el movimiento completo sin cambiar las cantidades; RF-47, RF-48. | I-AUD, I-INV. |
| CL-052 | Cancelar pedido ya preparado o despachado | Rechazar la cancelación; RF-63. | I-OUT, U-BAL. |
| CL-053 | Nueva operación de despacho sobre un pedido completamente despachado | Rechazar la operación; RF-120. | I-CMD, I-OUT. |
| CL-054 | Varios despachos concurrentes sobre el mismo saldo reservado y preparado | No consumir ese saldo más de una vez; RF-118, RF-119, RF-121. | I-CMD, I-OUT. |
| CL-055 | Reserva, preparación y despacho de 40 unidades de un pedido de 100 | Conservar 60 pendientes, consumiendo solo los saldos de las 40 despachadas; RF-156 a RF-160. | E-FLOW, I-OUT, U-BAL. |
| CL-056 | Nueva reserva que excede el saldo pendiente aunque exista inventario suficiente | Rechazar la solicitud; RF-159. | E-FLOW, I-OUT, U-BAL. |
| CL-057 | Reservas o preparaciones concurrentes sobre el mismo saldo del pedido | No comprometer ni preparar más que el saldo correspondiente; RF-169, RF-170. | I-ACC, I-AUD, I-OUT. |
| CL-058 | Operario que intenta preparar un pedido sin asignación o asignado a otro | Rechazar la confirmación del avance; RF-165. | I-ACC, I-AUD, I-OUT. |
| CL-059 | Pedido reasignado después de abrirlo el operario anterior | Conservar avances previos y rechazar nuevos avances del operario anterior; RF-165 a RF-167. | I-ACC, I-AUD, I-OUT. |
| CL-060 | Asignación a un usuario de otra empresa, inactivo o sin rol de operario | Rechazar la asignación; RF-164. | I-ACC, I-AUD, I-OUT. |
| CL-061 | Pedido parcialmente despachado con líneas pendientes | Mantener el estado parcialmente despachado hasta completar todas las líneas; RF-161, RF-162. | E-FLOW, I-OUT, U-BAL. |
| CL-062 | Salida de traslado de 20 unidades desde un origen con 100 | Conservar 80 en origen y 20 en tránsito, sin incrementar todavía el destino; RF-173, RF-174. | I-CMD, I-TRA, U-BAL. |
| CL-063 | Recepción del traslado de 20 unidades | Incorporar 20 en destino y descontar esas 20 del tránsito; RF-179, RF-180. | I-CMD, I-TRA, U-BAL. |
| CL-064 | Nueva reserva sobre mercancía en tránsito | Rechazar el uso de esa mercancía como disponible; RF-178. | I-CMD, I-TRA, U-BAL. |
| CL-065 | Salida de traslado que requiere mercancía reservada para otro pedido | Rechazar sin consumir ni liberar la reserva existente; RF-175. | I-CMD, I-TRA, U-BAL. |
| CL-066 | Traslado al mismo almacén o hacia otra empresa | Rechazar la acción; RF-5, RF-172. | I-ACC, I-CMD, I-ISO, I-TRA, U-BAL. |
| CL-067 | Nueva salida de un traslado que ya salió | Rechazar la nueva operación sin volver a descontar del origen; RF-176. | I-CMD, I-TRA, U-BAL. |
| CL-068 | Recepción que excede el saldo pendiente en tránsito | Rechazar sin modificar cantidades; RF-181. | I-CMD, I-TRA, U-BAL. |
| CL-069 | Recepciones concurrentes del mismo saldo en tránsito | No incorporar al destino más mercancía que la pendiente; RF-188. | I-CMD, I-TRA, U-BAL. |
| CL-070 | Recepción de traslado en ubicación bloqueada, inexistente o de otro almacén | Rechazar la recepción; RF-183. | I-CMD, I-TRA, U-BAL. |
| CL-071 | Fallo o pérdida de respuesta al confirmar una etapa de traslado | Conservar la confirmación íntegra o el estado anterior, sin duplicar efectos al reintentar; RF-102, RF-110, RF-185. | E-UI, I-CMD, I-EXC, I-SYNC, I-TRA, U-BAL. |
| CL-072 | Conteo desactualizado por un movimiento posterior | Rechazar el ajuste basado en la referencia anterior; RF-70. | I-CNT, I-INV. |
| CL-073 | Ajuste que afectaría reservas | Rechazar el ajuste; RF-69. | I-CNT, I-INV. |
| CL-074 | Archivo vacío, corrupto o de formato no admitido | Rechazar la importación con motivo; RF-81 a RF-83. | E-FLOW, I-CMD, I-EXC. |
| CL-075 | Importación que supera 20 MB o 20.000 registros de datos | Rechazar la aplicación sin modificar datos de negocio; RF-122. | I-EXC, P-LOAD. |
| CL-076 | Importación de exactamente 20 MB o 20.000 registros de datos | Evaluar el archivo con las demás validaciones; el valor límite por sí solo no lo rechaza; RF-122. | I-EXC, P-LOAD. |
| CL-077 | Archivo con filas inválidas o duplicadas | No aplicar la importación; RF-82. | E-FLOW, I-CMD, I-EXC. |
| CL-078 | SKU existente en la empresa y no repetido en el archivo de catálogo | Previsualizar una actualización de nombre conservando código, unidad y cantidades; RF-134 a RF-138. | I-CAT, I-EXC. |
| CL-079 | Archivo de catálogo que mezcla SKU nuevos y existentes | Previsualizar las creaciones y actualizaciones con aplicación íntegra o sin cambios si falla; RF-84, RF-88, RF-134, RF-136. | E-FLOW, I-CAT, I-CMD, I-EXC. |
| CL-080 | Archivo de formato distinto de CSV o XLSX | Rechazar con explicación; RF-83. | E-FLOW, I-CMD, I-EXC. |
| CL-081 | Importación repetida tras perder la respuesta | No duplicar efectos; RF-87, RF-102. | E-FLOW, E-UI, I-CMD, I-EXC, I-SYNC. |
| CL-082 | Reintentos concurrentes de una operación con igual empresa, referencia y datos | Conservar un único resultado confirmado sin duplicar efectos; RF-87, RF-102, RF-110. | E-FLOW, E-UI, I-CMD, I-EXC, I-SYNC. |
| CL-083 | Referencia repetida con cantidades, ubicaciones u otros datos de negocio distintos | Rechazar la nueva solicitud sin alterar los datos existentes; RF-111. | I-CMD, I-EXC. |
| CL-084 | Dos acciones legítimas con datos iguales y referencias distintas | Evaluar cada acción por separado con sus validaciones de negocio; RF-112. | I-CMD, I-EXC. |
| CL-085 | Fallo durante una importación | Mantener el estado previo; RF-88. | E-FLOW, I-CMD, I-EXC. |
| CL-086 | Texto que una hoja de cálculo interpretaría como fórmula | Exportarlo como texto; RF-90. | E-FLOW, I-CMD, I-EXC. |
| CL-087 | Exportación sin coincidencias | Producir un archivo identificable como resultado vacío; detalles de presentación en revisión. | I-EXC. |
| CL-088 | Respuesta perdida después de confirmar en el servidor | Mostrar resultado no confirmado hasta consultarlo; RF-100 a RF-102. | E-UI, I-CMD, I-SYNC. |
| CL-089 | Internet caído con servidor local accesible | Permitir el flujo operativo; RF-106. | E-FLOW, O-OPS. |
| CL-090 | Desconexión completa del servidor | Impedir confirmaciones; RF-99. | E-UI, I-CMD, I-SYNC. |
| CL-091 | Creación de otro usuario después de configurar la empresa | Incorporarlo a la empresa del administrador autorizado; RF-6, RF-113. | I-ACC, I-ISO. |
| CL-092 | Identificador de acceso duplicado en la empresa o rol no permitido | Rechazar la acción correspondiente; RF-114, RF-115. | I-ACC, I-ISO. |
| CL-093 | Reinicio después de una operación confirmada | Conservar el resultado; RF-104. | I-CMD, O-OPS. |
| CL-094 | Respaldo inválido o incompatible | No sustituir datos válidos; detalle del procedimiento pendiente del plan y su verificación. | O-OPS. |
| CL-095 | Consulta de fechas desde una zona horaria distinta de la empresa | Aplicar la zona de la empresa e incluir ambos días extremos del intervalo; RF-130 a RF-132. | I-ACC, I-AUD, U-VAL. |
| CL-096 | Fecha final anterior a la inicial | Rechazar el filtro; RF-133. | I-ACC, I-AUD, U-VAL. |
| CL-097 | Volumen que exceda el perfil de validación | No considerarlo capacidad demostrada de esta entrega; el perfil no impone un bloqueo comercial por licencia. | P-LOAD. |

## Criterios de finalización

| Criterio | Comprobación requerida | Parte | Evidencia prevista |
|---|---|---|---|
| CF-1 | Cada RF tiene una comprobación ejecutada de su comportamiento esperado, incluyendo los casos de rechazo aplicables. | §7–8 | D-SDD, I-*, E-*. |
| CF-2 | Cada RNF tiene evidencia automática o manual identificada; los que no puedan verificarse se declaran expresamente en la validación. | §7–8 | D-SDD, O-OPS, P-LOAD, E-UI. |
| CF-3 | Las dudas DA-1 a DA-7 están resueltas antes de aprobar el plan técnico. | Estado del plan/spec | D-SDD. |
| CF-4 | Una demostración local permite iniciar sesión, configurar un almacén, registrar productos, recibir mercancía, moverla, reservarla, prepararla y despacharla, conservando un historial coherente. | §3, §4.2, §5 | E-FLOW, I-AUD. |
| CF-5 | Una demostración local permite registrar un conteo y aplicar un ajuste autorizado sin violar reservas. | §3.5, §5 | E-FLOW, I-CNT. |
| CF-6 | La demostración permite previsualizar una importación y exportar una consulta de inventario o historial. | §3.7, contratos: Intercambio | I-EXC, E-FLOW. |
| CF-7 | La separación de empresas se verifica intentando acceder a datos de una empresa distinta desde una sesión activa. | §2.5 | I-ISO. |
| CF-8 | La concurrencia se verifica con operaciones que compitan por las mismas existencias. | §3.2 | I-INV, I-OUT. |
| CF-9 | La landing permite identificar las dos modalidades y probar la selección de un plan demostrativo sin un cargo real. | §4.2, contratos: Landing | E-COM. |
| CF-10 | El flujo principal se verifica después de reiniciar el servidor. | §5.1 | O-OPS. |
| CF-11 | Se ejecuta una restauración de respaldo comprobando la conservación de los datos de negocio incluidos en la prueba. | §5.1 | O-OPS. |
| CF-12 | La revisión de interfaz incluye capturas en escritorio y móvil, comprobación de consola y verificación de estados e interacciones. | §4.3, §7.2 | E-UI. |
| CF-13 | Se ejecutan las verificaciones acordadas para todos los principios aplicables de la constitución. | §9 | D-SDD, O-OPS, I-ISO, I-INV, D-REF. |
| CF-14 | Las pruebas de reintentos distinguen una operación repetida, una referencia reutilizada con otros datos y dos acciones nuevas con datos iguales. | §3.1 | I-CMD. |
| CF-15 | Una prueba de guardados concurrentes conserva la distribución aceptada sin perder el borrador de la sesión cuyo guardado se rechazó. | §3.6 | I-GEO, E-UI. |
| CF-16 | Las pruebas de despacho repetido y concurrente impiden consumir más existencias, reservas o preparación que las correspondientes al pedido. | §3.3 | I-OUT, I-CMD. |
| CF-17 | Las mediciones identifican el entorno y los datos utilizados para verificar los objetivos de volumen, concurrencia, latencia, actualización, importación y carga inicial 3D aprobados. | §7.3 | P-LOAD. |
| CF-18 | La revisión de interfaz incluye el editor a 1280 × 720 y la consulta y las operaciones móviles a 360 × 800. | §4.3, §7.2 | E-UI. |
| CF-19 | Las comprobaciones de cantidades distinguen enteros, hasta tres decimales y exceso de precisión sin redondeos silenciosos. | §2.2 | U-VAL, I-INV, I-EXC. |
| CF-20 | Las comprobaciones de importación distinguen creaciones, actualizaciones de nombre, duplicados y cambios de unidad rechazados. | §3.7, contratos: Formatos | I-EXC. |
| CF-21 | Las comprobaciones de fechas incluyen ambos días extremos del rango según la zona de la empresa, aunque el dispositivo use otra zona horaria. | §2.2 | U-VAL, I-AUD. |
| CF-22 | El registro SaaS se verifica con empresa y administrador creados conjuntamente, rechazo de códigos duplicados y separación entre empresas. | §2.1, §5 | I-SET, I-ISO. |
| CF-23 | El asistente local se verifica sin conexión a internet, conservando la configuración ante reinicios o intentos de alta inicial repetidos. | §5.1 | I-SET, O-OPS. |
| CF-24 | La demostración permite acceder con los tres roles usando las cuentas ficticias precargadas sin envío obligatorio de correos. | §5.1, contratos: Acceso | E-COM, E-FLOW. |
| CF-25 | Se verifica un pedido de 100 unidades despachado primero en 40 y luego en 60, conservando los saldos correctos en ambos pasos y cerrándolo solo al completar las 100. | §3.3 | I-OUT, E-FLOW. |
| CF-26 | Se verifica que reasignar un pedido conserva sus avances y revoca la confirmación de nuevos avances por el operario anterior. | §3.2/3.3 | I-OUT, E-FLOW. |
| CF-27 | Las comprobaciones de concurrencia impiden reservar o preparar por encima de los saldos pendientes del pedido, aunque haya más stock físico. | §3.2/3.3 | I-OUT. |
| CF-28 | Se verifica el traslado de 20 unidades desde un origen con 100, conservando el total de la empresa durante salida, tránsito y recepción. | §3.4 | I-TRA, E-FLOW. |
| CF-29 | Se comprueba que un traslado no consume mercancía reservada para otros pedidos ni ofrece su stock en tránsito para nuevas reservas. | §2.3, §3.4 | I-TRA, I-OUT. |
| CF-30 | Los reintentos y las confirmaciones concurrentes de etapas de traslado no duplican salidas ni incorporan al destino más que el saldo en tránsito. | §3.1/3.2/3.4 | I-CMD, I-TRA. |
| CF-31 | Se rechazan traslados hacia almacenes de otras empresas sin modificar el inventario de ninguna de las empresas. | §2.5, §3.4 | I-ISO, I-TRA. |
| CF-32 | Se verifica la contención válida y el contacto de bordes, y se rechazan los solapamientos prohibidos entre zonas, racks, pasillos y ubicaciones. | §3.6 | U-GEO, I-GEO. |
| CF-33 | Se rechazan cambios de posición, dimensiones o eliminación de elementos con existencias o trabajo pendiente, incluyendo descendientes y cambios de estado posteriores a abrir el editor. | §2.3, §3.2/3.6 | I-GEO, I-INV. |
| CF-34 | Un cambio geométrico válido conserva identidades y cantidades; una edición que contiene un cambio inválido conserva la distribución anterior. | §3.6 | I-GEO. |
| CF-35 | Las pruebas de bloqueo rechazan entradas y salidas físicas, incluso con reservas anteriores o formularios abiertos antes del bloqueo. | §3.2, §5 | I-BLK. |
| CF-36 | Se comprueban consultas, conteos y ajustes autorizados en una ubicación bloqueada sin omitir la protección de reservas ni los motivos exigidos. | §3.5, §5 | I-BLK, I-CNT. |
| CF-37 | Se verifica que solo el administrador desbloquea con motivo e historial y que el desbloqueo no ejecuta automáticamente trabajo pendiente. | §3.2, §5 | I-BLK, I-AUD. |

## Control documental de esta propuesta

- Cobertura prevista: 207 RF, 18 RNF, 97 casos límite literales y 37 CF.
- Los doce principios se revisan en §9 del plan. D-SDD comprueba integridad de referencias, aprobación y correspondencia de evidencias; no reemplaza tests de aplicación.
- Antes de aprobar implementación, cada escenario debe apuntar a un test o evidencia concreta con resultado real. No basta con conservar la familia genérica de esta planificación.
- No se ejecutó la suite de aplicación: todavía no existe código. Este control solo verifica cobertura documental.
