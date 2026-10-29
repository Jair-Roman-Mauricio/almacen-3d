# Ramas, revisión y releases

Política solicitada por el usuario el 29/10/2026. Afecta al flujo Git; no cambia
la especificación, el orden SDD ni las reglas de despliegue.

## Flujo de cambios

| Rama | Responsabilidad |
|---|---|
| main | Hitos integrados y aprobados; origen de tags/releases autorizados |
| dev | Integración de features revisadas |
| feature/<nombre> | Implementación de un bloque autorizado, revisión y evidencia |

1. Actualizar dev y crear `feature/<nombre>` desde ella antes de editar.
2. Implementar únicamente el bloque autorizado y registrar su evidencia.
3. Crear commits cohesivos con Conventional Commits.
4. Publicar la feature y abrir un PR con base dev.
5. Fusionar feature → dev solo cuando el usuario lo indique.
6. Para promover un hito revisado, abrir otro PR de dev hacia main y esperar la
   indicación de fusión. No integrar directamente mediante push.

Ejemplos: `feature/t032-t037-transactions`, `feature/tenant-context-fix` y
`feature/github-workflow`. También documentación y mantenimiento usan este
flujo. No se inicia un bloque funcional por crear una rama de proceso.

No se permiten commits de trabajo ni push directo a dev/main. La creación inicial
de dev toma el mismo commit publicado en main; se publica su referencia para
establecer la rama de integración. No mueve main ni reescribe los commits ya
publicados. Las ramas anteriores del agente se retiran solo tras conservar sus
cambios en la feature correspondiente.

Esta norma no afirma que se haya configurado protección de ramas en GitHub.
Los cambios a la política también se revisan mediante feature y PR.

## Commits, tags y releases

| Elemento | Propósito |
|---|---|
| Commit | Registrar un cambio concreto y revisable |
| Rama y PR | Revisar feature → dev y después dev → main |
| Tag | Identificar un commit exacto con una versión |
| Release | Presentar ese punto del código con notas y posibles archivos descargables |

Las releases son válidas para hitos comprobados, no son necesarias después de
cada tarea. Tampoco sustituyen el uso de ramas y PR.

En el estado T001–T031, una versión autorizada podría denominarse
`v0.1.0-alpha.1`, marcada como **pre-release**, y describirse como base técnica,
dominio y persistencia. No anunciaría una demo completa: login, operaciones,
UI, editor 3D y landing siguen pendientes. Ese nombre es una propuesta; esta
política no crea el tag ni publica una release.

Las notas de una futura release deben indicar commit/tag, alcance implementado,
validación real, limitaciones y preparación local. Se publica solo cuando el
usuario lo solicite. Publicar código o una release no autoriza desplegar la
aplicación en Railway.

Fuentes: [Releases en GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
y [gestión de releases y prereleases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
