# Sprint 01

- **Fecha:** 2026-11-14
- **Colaboradora:** Marian (§19: responsable de M-ATLAS y M-INTERFAZ, apoyo en M-GLOBO, revisora de M-MAPA)
- **Sprint anterior:** — (primer Sprint)
- **Objetivo:** que exista la constitución del frontend y que la spec `004-interfaz-bilingue` esté
  especificada y aclarada, con cada requisito trazado (RF-15, RF-19 a RF-24, RF-33, RF-34, RF-37,
  RNF-03, RNF-04, RNF-12, RN-03 a RN-08, RN-11 a RN-13).
- **Criterio de aceptación:** `node ai/scripts/sdd.mjs estado` muestra P-PROY-01, P-INTERFAZ-01 y
  P-INTERFAZ-02 como hechos; la spec no tiene marcadores [NEEDS CLARIFICATION] ni librerías, y las
  revisiones de `guardian-alcance` y `revisor-interfaz` quedan aplicadas.
- **Estado final:** ✅ Cumplido. La fusión de las PR #44 y #45 en `dev` depende de Marian y de la
  revisión del equipo.

## 1. Diagnóstico

- El repositorio solo tenía las herramientas de IA (hooks, workflows y skills). No había app web,
  `specs/` ni constitución: la de Spec Kit seguía siendo la plantilla. El SDD estaba en 0/45.
- Ningún requisito MVP de M-INTERFAZ ni de M-ATLAS tenía código ni pruebas.
- **Ruta crítica:** P-INTERFAZ-03 en adelante reutiliza `specs/001-base-web` (Joaco), y la implementación
  depende de P-PROY-07.
- **Atraso frente a §25:** hoy es sábado 14 y las fases de spec estaban previstas para antes del sábado.
- El workflow `Issue a PR` no está en `main`, así que no corre: las ramas se crearon a mano.
- **DP-02** (Marian, vencía el 13 de noviembre) sigue abierta.

## 2. Roles utilizados

| Rol | Responsable (§19) | Por qué se activó | Skills y subagentes | Fuente consultada |
| --- | --- | --- | --- | --- |
| Proyecto y SDD | Equipo / Marian | Faltaban la constitución y la spec | `sdd-prompts`, `speckit-constitution`, `speckit-specify`, `speckit-clarify`, `flujo-issues-y-pr` | §1, §8, §13, §16, §17.3, §18, §28, §29 |
| UX / Interfaz | Angie y Marian (revisa Mimi) | Spec de M-INTERFAZ | `interfaz-bilingue-accesible`, `descargas-y-exportacion`; subagente `revisor-interfaz` | §20, §23.1, §30, RNF-04, RNF-05, RNF-12 |
| Alcance | — | Trazabilidad y pendientes de §29 | Subagente `guardian-alcance` (en el plan y en la spec) | §8, §13, §16, §19, §28, §29 |

## 3. Decisiones

| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| El Sprint solo cubre los módulos de Marian, y se avisa al resto en #42 | Repartir el trabajo de todos | Lo pidió Marian |
| La división entre Angie y Marian es una propuesta (en #42) | Darla por fijada | §19 y §25 asignan M-ATLAS y M-INTERFAZ a «Angie y Marian» sin dividirlos |
| RNF-02 se cita como el peso de los archivos (< 40 MB) | Seguir el prompt, que lo describía como «Cesium diferido» | Prevalece el documento: Cesium diferido es parte de RNF-01 |
| `feat/43` parte de `feat/42` | Fusionar #44 antes o esperar | Marian eligió seguir sin esperar la revisión del equipo |
| CQ-05: la vista y la cifra muestran la marca de `quality.json`, y si falta, «control no reportado» | Marcar solo la cifra, u ocultarla | Aclaración 1 |
| RF-11: marca «validación limitada», alternativa VC-02 y VC-05, y métricas «no reportadas» | Solo la marca | Aclaración 2 |
| El glosario son los términos de §30 (21), y los nuevos se proponen al equipo | Solo §30, o solo los de radar | Aclaración 3, corregida por `guardian-alcance` |
| Créditos completos del PNG y el CSV, con la URL pendiente de DP-06 | Créditos mínimos | Aclaración 4 |
| Formatos por idioma en hora de Bolivia y CSV en ISO UTC (propuesta) | ISO en los dos idiomas | Aclaración 5 |

## 4. Tareas

| # | Tarea | Identificadores | Rol / responsable | Verificación | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | P-PROY-01: constitución v1.0.0 (#42, PR #44) | RN-03 a RN-07, RN-13, RNF-01 a RNF-06, RNF-10 a RNF-12 | Equipo (lanza Marian) | Sin marcadores de plantilla; `sdd registrar` como hecho | ✅ |
| 2 | P-INTERFAZ-01: spec 004 (#43, PR #45) | RF-15, RF-19 a RF-24, RF-31, RF-33, RF-34, RF-37 | Marian (con Angie) | Checklist de calidad en verde | ✅ |
| 3 | P-INTERFAZ-02: 5 aclaraciones | CQ-05, RF-11, RF-19, RF-21, RN-07 | Marian | 5 entradas `- Q:` en la spec | ✅ |
| 4 | Revisión de la spec y correcciones | RF-19, RN-12, RNF-04, RNF-05, RNF-12, PS-07 | `guardian-alcance`, `revisor-interfaz` | Hallazgos aplicados en el commit 3f62ea8 | ✅ |
| 5 | Issues, ramas, PR, historial SDD y este documento | — | Marian | PR #44 y #45 abiertas hacia `dev` | ✅ |

## 5. Cambios realizados

| Archivo | Cambio |
| --- | --- |
| `.specify/memory/constitution.md` | Constitución v1.0.0: principios I a VII, restricciones, flujo y gobernanza |
| `specs/004-interfaz-bilingue/spec.md` | 7 historias, FR-001 a FR-026 (con FR-008a, FR-012a, FR-014a y FR-016a), SC-001 a SC-010 y Clarifications |
| `specs/004-interfaz-bilingue/checklists/requirements.md` | Checklist de calidad de la spec |
| `sdd/historial/*` | Confirmación y resultado de P-PROY-01, P-INTERFAZ-01 y P-INTERFAZ-02 |
| `ai/README.md` | Regenerado automáticamente |

## 6. Pruebas y resultados

No hay código en este Sprint (fase de SDD), así que no se ejecutaron `verify.py` ni `run_local.py`. Las
verificaciones fueron las de la tabla de tareas: contraste de cada identificador con el `.txt` del
documento, `grep` de marcadores, checklist de la spec y las dos revisiones de subagentes.

## 7. Problemas encontrados

- **La etiqueta `tarea` no existe en el repositorio.** Los issues se crearon sin etiqueta.
- **El workflow `Issue a PR` no está en `main`.** Las ramas se crearon a mano desde `dev`.
- **Un commit salió mezclado.** `.specify/feature.json` está en `.gitignore`, eso cortó la cadena de
  comandos y el commit se creó con el mensaje equivocado. Se deshizo con `reset --soft` antes del push y
  se rehízo.
- **El glosario se contó mal** (22 en lugar de 21) y FR-022 estaba invertido. Lo detectó
  `guardian-alcance` y está corregido.
- **No se pudo ver el PDF como imagen** porque falta `pdftoppm`. Se usó la copia `.txt`.

## 8. Feedback del usuario

- Pidió saber cómo reparte el documento el trabajo entre Angie y ella. Se verificó que no lo divide (§19,
  §25) y se dejó una propuesta en #42.
- Pidió que el Sprint cubra solo sus tareas y que se avise a Joaco y Angie, lo que se hizo en #42.
- Revisará y fusionará ella misma sus PR hacia `dev`.

## 9. Próximos pasos

- Marian fusiona #44 y después #45 en `dev`, cuando el equipo haya visto la constitución.
- **DP-02**: revisar las guías 2026 (trabajo previo, declaración de IA, referencias).
- Esperar a `specs/001-base-web` (Joaco, P-PROY-02 y P-PROY-03) para P-INTERFAZ-03 (plan).
- Acordar con Angie el reparto propuesto en #42.
