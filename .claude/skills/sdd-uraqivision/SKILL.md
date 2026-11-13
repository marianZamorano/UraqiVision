---
name: sdd-uraqivision
description: Guía el Spec-Driven Development de UraqiVision con Spec Kit, del documento maestro a la constitución, las specs por módulo, el plan, las tareas, la implementación y la verificación, con una ruta rápida para el hackathon (14 y 15 de noviembre de 2026). Usar con "fase N", "ruta rápida" o "estado" para saber qué sigue, o cuando se vaya a empezar una feature nueva.
argument-hint: "estado | fase N (0-8) | ruta rápida | feature <nombre>"
disable-model-invocation: true
---

# SDD de UraqiVision

> Primero la especificación, después el código. El documento maestro ya es una especificación aprobada:
> el SDD **no la reescribe**, la **descompone** en specs pequeñas que se pueden implementar y verificar.

Nivel: **spec-anchored**. Las specs quedan en `specs/` y se corrigen cuando cambia la función. Si una spec
contradice el documento maestro, se corrige la spec.

## Entrada

```text
$ARGUMENTS
```

- `estado` (o vacío): mira qué artefactos existen (`.specify/memory/constitution.md` rellenada,
  `specs/NNN-*/spec.md`, `plan.md`, `tasks.md` y tareas marcadas `[X]`) y di qué fase sigue. No modifica nada.
- `fase N`: ejecuta solo esa fase y se detiene.
- `ruta rápida`: el recorrido mínimo para el hackathon (abajo).
- `feature <nombre>`: arranca las fases 2 a 6 de un área con los prompts de su SDD (`sdd/m-<área>.md`), uno a uno con la skill `sdd-prompts`.

## Reglas para todas las fases

1. Hasta la fase 6 solo se escriben artefactos de Spec Kit (`.specify/`, `specs/`). No se toca código.
2. La persona aprueba el plan y las tareas antes de implementar (⛔ puntos de control).
3. Entrevista, no dictado: una pregunta a la vez, con opciones y una recomendada.
4. Cada requisito de una spec conserva el identificador del documento maestro (RF-xx, RNF-xx, MC-xx, RN-xx).
   No se inventan identificadores nuevos para lo que ya tiene uno.
5. Las specs no nombran librerías; el plan sí (el stack ya está fijado en §18).
6. Hechos, hipótesis y recomendaciones separados. Nunca se declara que una prueba pasó sin ejecutarla.

## SDD por área (fuente de los prompts)

La descomposición en specs y **todos los prompts listos, en orden**, están en **`sdd/`**: un SDD por área de §19
(más proyecto e integración), con la misma estructura (`sdd/00-estructura.md`) y el orden global en
`sdd/README.md`. Esta skill explica las fases; para ejecutar un prompt usa la skill `sdd-prompts`
(`npm run sdd:siguiente -- --yo`). En **este repositorio (frontend)** van las specs de la web; las del pipeline, la
publicación e Insight tienen su propio SDD en `UraqiVisionBack`.

| Spec | SDD | Módulo (§19) | Requisitos principales |
|---|---|---|---|
| `001-base-web` | `sdd/01-proyecto.md` | — (§25: Joaco) | Base de §17, §18 y §20.1; RNF transversales |
| `002-mapa-analisis` | `sdd/m-mapa.md` | M-MAPA | RF-05–RF-08, RF-10, RF-35, RF-36, RF-38 |
| `003-portada-atlas` | `sdd/m-atlas.md` | M-ATLAS | RF-01, RF-03, RF-04 |
| `004-interfaz-bilingue` | `sdd/m-interfaz.md` | M-INTERFAZ | RF-15, RF-19–RF-24, RF-31, RF-33, RF-34, RF-37 |
| `005-globo` | `sdd/m-globo.md` | M-GLOBO | RF-02, RF-25–RF-30, RF-32 |
| `006-integracion` | `sdd/90-integracion.md` | — (equipo) | RF-16–RF-18 en la web, RF-29, RF-36, PS-09 |

La web y el backend se coordinan por dos contratos del documento maestro: los archivos publicados de cada
estación (§17.3) y `POST /api/insight` (§21.1). Un cambio de contrato se acuerda entre ambos repositorios.

## Fases

| Fase | Qué se hace | Comando | Artefacto |
|---|---|---|---|
| 0 Contexto | Leer §1–§8, §13, §16–§19, §28–§29 (skill `documento-maestro`) | — | Resumen sin efectos |
| 1 Constitución | Principios derivados del documento (prompt abajo) | `speckit-constitution` | `.specify/memory/constitution.md` |
| 2 Spec | Una feature de la tabla, con sus RF/RNF/RN | `speckit-specify` | `specs/NNN-*/spec.md` |
| 3 Aclaraciones | Máximo 5 preguntas; las DP abiertas se marcan, no se deciden | `speckit-clarify` | sección *Clarifications* |
| 4 Plan | Stack de §18, estructura de §17.3, contrato de §21.1 | `speckit-plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| 5 Tareas | Por historia, con responsable de §19 y prueba de §23 | `speckit-tasks` | `tasks.md` |
| 6 Análisis | Coherencia + subagente `guardian-alcance` | `speckit-analyze` | informe ⛔ esperar «apruebo» |
| 7 Implementar | Una tarea a la vez, prueba primero, un commit por tarea | `speckit-implement` | código + `[X]` en `tasks.md` |
| 8 Verificar | Cada criterio de aceptación con evidencia; subagentes revisores | `speckit-converge` si falta algo | informe y spec actualizada |

En la fase 8 usa `revisor-interfaz` (pantallas), `uiux-design-auditor` y `react-ui-reviewer` (componentes) y
`revisor-qa` (pruebas y evidencia de todo el diff).

## Prompts listos

Los prompts de cada fase, ya redactados a partir del documento maestro y en orden, están en los SDD de `sdd/`
(sección «8. Secuencia de prompts» de cada área). No los copies desde aquí: así hay una sola fuente y su historial
(`sdd/historial/`) registra quién los ejecutó, cuándo, con qué cambios y con qué resultado.

- `npm run sdd:estado`: progreso por área, conflictos y siguiente prompt.
- `npm run sdd:siguiente -- --yo`: tu siguiente prompt, listo para copiar.
- Al pegarlo (empieza con `[SDD P-…]`), el asistente confirma contigo antes de ejecutarlo y, al terminar, lo
  registra y te entrega el siguiente (skill `sdd-prompts`).

## Ruta rápida (hackathon)

El sábado 14 a las 9:00 empieza el hackathon y la primera meta es un antes/después real a las 13:00 (§25). El orden
de `sdd/README.md` ya sigue esa ruta:

1. **Antes del sábado** (si las reglas lo permiten, DP-02): constitución y proyecto web base (`sdd/01-proyecto.md`)
   y la especificación de cada área (P-*-01). En `UraqiVisionBack`, lo mismo para el pipeline, para que el mapa
   tenga datos reales.
2. **Sábado temprano**: aclarar, planificar, tareas y análisis de M-MAPA, M-ATLAS y M-INTERFAZ, y la implementación
   del mapa con el primer par real.
3. Cada área sigue su secuencia con su responsable; las dependencias marcan cuándo puede empezar cada prompt.
4. Verificación de cada área antes de integrarla; recorrido completo y entrega el domingo (`sdd/90-integracion.md`).
