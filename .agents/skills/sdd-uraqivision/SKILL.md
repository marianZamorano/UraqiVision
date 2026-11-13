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
- `feature <nombre>`: arranca las fases 2 a 6 para una feature de la tabla de features.

## Reglas para todas las fases

1. Hasta la fase 6 solo se escriben artefactos de Spec Kit (`.specify/`, `specs/`). No se toca código.
2. La persona aprueba el plan y las tareas antes de implementar (⛔ puntos de control).
3. Entrevista, no dictado: una pregunta a la vez, con opciones y una recomendada.
4. Cada requisito de una spec conserva el identificador del documento maestro (RF-xx, RNF-xx, MC-xx, RN-xx).
   No se inventan identificadores nuevos para lo que ya tiene uno.
5. Las specs no nombran librerías; el plan sí (el stack ya está fijado en §18).
6. Hechos, hipótesis y recomendaciones separados. Nunca se declara que una prueba pasó sin ejecutarla.

## Features recomendadas (una spec cada una)

Descomposición propuesta a partir de §19 y del plan del hackathon (§25). Es una propuesta: confírmala con
el equipo en la fase 2.

| Spec | Módulos | Requisitos principales | Primera meta |
|---|---|---|---|
| `001-pipeline-estacion` | M-INGESTA, M-CIENCIA, M-VALIDACIÓN | MC-01–MC-07, CQ-01–CQ-06, VC-01–VC-05, RF-26 | Antes/después real de San Ignacio (sáb 13:00) |
| `002-publicacion-estacion` | M-PUBLICACIÓN | RF-05–RF-09, RF-22, RF-27, RNF-02, RNF-09 | Carpeta publicada que la web pueda leer |
| `003-mapa-analisis` | M-MAPA | RF-05–RF-08, RF-10, RF-35, RF-36, RF-38 | Mapa 2D con deslizador y el primer par real |
| `004-globo-atlas` | M-GLOBO, M-ATLAS | RF-01–RF-03, RF-25–RF-30, RF-32 | Globo con departamentos y vuelo de cámara |
| `005-insight` | M-INSIGHT | RF-16–RF-18, RN-09, RN-10, RN-14, RNF-06, RNF-07 | `POST /api/insight` con plantillas de respaldo |
| `006-interfaz-bilingue` | M-INTERFAZ | RF-19–RF-24, RF-31, RF-33, RF-34, RF-37, RNF-03, RNF-04, RNF-12 | Cambio de idioma y estados de la vista |

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

En la fase 8 usa el subagente que corresponda al módulo: `revisor-cientifico` (pipeline),
`auditor-publicacion` (carpeta publicada), `revisor-interfaz` (web), `revisor-insight` (Insight) y
`revisor-qa` (pruebas y evidencia de todo el diff).

## Prompts listos

**Fase 1, constitución:**

```text
/speckit-constitution Crea la constitución de UraqiVision a partir de docs/UraqiVisionDocumentoMaestrov1.0.pdf (usa la copia .txt para leerlo), que es la fuente de verdad y prevalece sobre la constitución. Principios: I. Documento maestro primero: nada fuera del alcance de §8 sin consultar; las DP de §29 no se implementan hasta resolverse. II. Ciencia honesta: RN-01 a RN-06 y RN-13 son obligatorias (misma órbita y grilla, sin BETA, sin datos simulados como resultados, causas como hipótesis, hectáreas con rango, ausencia de dato nunca como cero). III. Arquitectura estática primero (§17): procesamiento en Python antes, web que solo lee archivos publicados, Insight como única pieza en servidor; cambiar el stack de §18 requiere enmendar el documento. IV. Reproducibilidad e integridad (RNF-08, RNF-09, CQ-06): manifiesto con gránulos, CRID y sumas de verificación; COG float32 sin pérdida. V. Bilingüe y accesible (RNF-03, RNF-04, RNF-12): 100 % es/en, WCAG 2.2 AA, movimiento reducido. VI. Seguridad y costo (RNF-06, RNF-07, RNF-10): ninguna clave en el navegador ni en el repo; todo en planes gratuitos salvo el proveedor de IA. VII. Trazabilidad: cada spec, tarea, prueba y commit cita sus identificadores (RF, RNF, MC, RN, CQ, VC, PS). Restricciones: TypeScript estricto, pytest y Vitest, licencia MIT para código y CC BY 4.0 para textos y datos derivados. Flujo: una tarea a la vez con su prueba, commits sin Co-Authored-By de IA.
```

**Fase 2, ejemplo para la primera feature:**

```text
/speckit-specify Feature 001-pipeline-estacion de UraqiVision. Procesar la serie NISAR L2 GCOV PROVISIONAL de la estación San Ignacio de Velasco (recorte de unos 50 × 50 km, DP-08) siguiendo MC-01 a MC-07 y el orden de §12 del documento maestro, con los controles CQ-01 a CQ-06 y la validación VC-01 a VC-05. Debe responder la pregunta 1 de §11.1 (cicatrices con fecha de primera detección y hectáreas por fecha con rango). Conserva los identificadores del documento en cada requisito. Fuera de alcance: lo de §8.2, RXD (MC-08) y el clasificador (MC-09), que son Plus.
```

**Fase 5, tareas:**

```text
/speckit-tasks Ordena por historia de usuario. Cada tarea lleva su responsable según §19 del documento maestro, el identificador que resuelve y su prueba (PS-xx de §23.3). Prueba antes que implementación. Marca con [P] las paralelizables.
```

## Ruta rápida (hackathon)

El sábado 14 a las 9:00 empieza el hackathon y la primera meta es un antes/después real a las 13:00
(§25). Con poco tiempo:

1. **Antes del sábado** (si las reglas lo permiten, DP-02): fase 1 (constitución) y fase 2 de
   `001-pipeline-estacion` y `003-mapa-analisis`.
2. **Sábado temprano**: fases 4–6 de esas dos specs en un mismo turno, aceptando las opciones recomendadas.
3. Las demás features entran con `feature <nombre>` a medida que su responsable las empieza.
4. Fase 8 para cada feature antes de integrarla. `speckit-converge` el domingo por la tarde.
