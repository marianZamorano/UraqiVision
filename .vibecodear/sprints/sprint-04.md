# Sprint 04

- **Fecha:** 2026-11-14
- **Sprint anterior:** sprint-03.md
- **Responsable:** Angie (M-ATLAS, §19) · **Issue:** #63 · **Rama:** `feat/63-plan-portada-atlas`
- **Objetivo:** P-ATLAS-03 a 05: plan, data-model, tasks y análisis de specs/003-portada-atlas (RF-01, RF-03)
  sobre 001-base-web, detenido en el «apruebo» (#63)
- **Criterio de aceptación:** plan.md, research.md, data-model.md, contracts/, quickstart.md y tasks.md creados;
  análisis con hallazgos por severidad y «apruebo» de Angie; `npm run sdd:estado` con P-ATLAS-03 a 05 hechos.
- **Estado final:** ✅ Cumplido

## 1. Diagnóstico

- Joaco terminó P-PROY-03 (plan de 001) y luego P-PROY-04 (tareas); P-ATLAS-03 quedó desbloqueado.
- Documento maestro v1.1: solo cambia Cesium ion (§18, §28, DP-07 cerrada); no afecta a M-ATLAS.
- En 001 hay una diferencia de nombres de campo de `atlas/departments.geojson` (data-model frente a contrato).
- Programar (P-ATLAS-06) sigue esperando P-PROY-07.

## 2. Roles utilizados

| Rol | Responsable (§19) | Por qué se activó | Skills y subagentes | Fuente consultada |
| --- | --- | --- | --- | --- |
| Arquitecto/a | Equipo | Planificar sobre los contratos de 001 sin inventar arquitectura | `speckit-plan`, `guardian-alcance` | §17, §17.3, §18; specs/001-base-web |
| Product Owner | Angie | Decidir dónde viven las fichas y aprobar el análisis | `sdd-prompts`, `speckit-analyze` | §8, §13 |
| Contenidos y rigor | Angie y Marian | Fuentes, método y atribuciones | `rigor-y-fuentes`, `referencias-documento` | §4.2, §10.4, §31 |

## 3. Decisiones

| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| Fichas en un archivo de contenido de la web | Publicarlas desde el backend; dejarlo pendiente | Propuesta de Angie, acordada por el equipo el 2026-11-14; falta registrarla en el documento |
| Textos de interfaz en es/en.json; contenido con fuente en el archivo de fichas | Todo en i18n; todo en el archivo | Una sola fuente por texto (RNF-03) |
| No elegir nombres de campo de departments.geojson | Elegir uno | Es de 001 con M-PUBLICACIÓN (R3) |
| Fuentes que faltan: se trabajan en `UraqiVisionBack` | Buscarlas aquí | Acuerdo del equipo |
| «Apruebo y corrige» en P-ATLAS-05 | Aprobar sin cambios | Corregir método (RN-03), atribuciones, citas y enlaces de tareas |

## 4. Tareas

| # | Tarea | Identificadores | Rol / responsable | Verificación | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Issue #63 y rama desde `dev` actualizada | — | EM / Angie | Issue y rama | ✅ |
| 2 | P-ATLAS-03: plan, research, data-model, contrato, quickstart | RF-01, RF-03, RNF-01, RNF-04 | Arquitecto / Angie | Constitution Check PASS | ✅ |
| 3 | P-ATLAS-04: tasks.md (31 tareas) | PS-03, PS-04, PS-07, PS-09 | PO / Angie | Formato validado | ✅ |
| 4 | P-ATLAS-05: análisis + guardian-alcance + correcciones | §8, §16, §28 | PO / Angie | 0 críticos; «apruebo y corrige» | ✅ |
| 5 | Historial, ai:sync y commits (push y PR: Angie) | — | EM / Angie | `npm run sdd:estado` | 🔄 |

## 5. Cambios realizados

| Archivo | Cambio |
| --- | --- |
| `specs/003-portada-atlas/plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/` | Nuevos (P-ATLAS-03) y corregidos tras el análisis |
| `specs/003-portada-atlas/tasks.md` | Nuevo (P-ATLAS-04), corregido tras el análisis (T031 añadida) |
| `specs/003-portada-atlas/spec.md` | Método en FR-004 y SC-007; §8.2 en lugar de RN-10; supuesto de 001 actualizado |
| `sdd/historial/…P-ATLAS-03…05…` | Confirmaciones y resultados |

## 6. Pruebas y resultados

Sin código (documentos). Validaciones: formato de tasks.md (31 tareas), análisis cruzado con 96 % de cobertura
de requisitos (100 % de los implementables; FR-023 pendiente a propósito), revisión de guardian-alcance.

## 7. Problemas encontrados

- La automatización issue → rama sigue sin correr (`issue-a-pr.yml` no está en `main`).
- 4 fichas sin fuente: trabajo derivado a `UraqiVisionBack` con un prompt para Angie.

## 8. Feedback del usuario

El equipo aceptó que las fichas vivan en la web y pidió que el trabajo de fuentes se haga en el backend. Angie
aprobó el análisis con correcciones.

## 9. Próximos pasos

- Registrar en el documento maestro el acuerdo sobre el archivo de fichas (equipo).
- Sprint 05: borrador de los textos es/en de portada y fichas en `specs/003-portada-atlas/contenido/`.
- P-ATLAS-06 cuando Joaco termine P-PROY-07.
