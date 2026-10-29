# Ramas, revisión y releases

Política solicitada por el usuario el 29/10/2026. Afecta al flujo Git; no cambia
la especificación, el orden SDD ni las reglas de despliegue.

## Flujo de cambios

1. Partir de main actualizada y crear una rama antes de editar archivos.
2. Implementar el bloque autorizado y registrar su evidencia.
3. Crear commits cohesivos con Conventional Commits.
4. Publicar únicamente la rama de trabajo y abrir un pull request hacia main.
5. Revisar el alcance y las comprobaciones. Fusionar solo cuando el usuario lo
   indique; no efectuar un push directo de trabajo a main.

Ejemplos de nombres: `feat/t032-t037-transactions`, `fix/tenant-context`,
`docs/branch-and-release-policy`. Son ejemplos; no se crean ramas de tareas
funcionales antes de recibir autorización para implementarlas.

main contiene lo integrado. Las ramas contienen cambios en revisión. Esta norma
no equivale a afirmar que se haya configurado protección de ramas en GitHub.
Los commits ya publicados se conservan; no se altera el historial para simular
pull requests que no existieron.

## Commits, tags y releases

| Elemento | Propósito |
|---|---|
| Commit | Registrar un cambio concreto y revisable |
| Rama y PR | Aislar el trabajo y revisar su incorporación a main |
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
