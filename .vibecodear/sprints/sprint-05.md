# Sprint 05

- **Fecha:** 2026-11-14
- **Sprint anterior:** sprint-04.md
- **Responsable:** Angie (M-ATLAS, §19) · **Issue:** #77 · **Rama:** `feat/77-borrador-contenido-atlas`
- **Objetivo:** borrador es/en de portada y 9 fichas en `specs/003-portada-atlas/contenido/` (T011, T012, T017,
  T018) y revisión de fuentes T024 (RF-01, RF-03, RN-03) (#77)
- **Criterio de aceptación:** textos en ambos idiomas; ninguna fuente, cifra ni dato fuera del documento v1.1;
  cada afirmación con fuente, fecha y método o con «Fuente en verificación»; informe de revisión.
- **Estado final:** ✅ Cumplido (borrador). T024 queda a falta de la revisión humana de Marian.

## 1. Diagnóstico

- P-ATLAS-01 a 05 hechos y en `dev`; P-ATLAS-06 espera P-PROY-07 (Joaco va por P-PROY-05).
- Marian terminó P-INTERFAZ-03 a 05 (a Angie le tocan método y descargas en P-INTERFAZ-07).
- Las tareas de texto de `tasks.md` (T011, T012, T017, T018, T024) se podían adelantar sin código.

## 2. Roles utilizados

| Rol | Responsable (§19) | Por qué se activó | Skills y subagentes | Fuente consultada |
| --- | --- | --- | --- | --- |
| Contenidos y rigor | Angie y Marian | Redactar textos con fuente por afirmación | `rigor-y-fuentes`, `fichas-atlas`, `guardian-alcance` | §4.2, §4.3, §9.1, §10.2, §10.4, §31 |
| UX y accesibilidad | Angie y Marian | Claves es/en, etiqueta + icono, lista textual | `interfaz-bilingue-accesible` | RNF-03, RNF-04 |

## 3. Decisiones

| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| Borrador en `specs/003-portada-atlas/contenido/` | Esperar a `web/` | Patrón de la spec 004; no depende de Joaco |
| Reutilizar «No reportada» de la spec 004 | Clave propia | Evitar duplicados (guardian-alcance) |
| Explicación de NISAR solo con §4.3 y §9.1 | Añadir datos técnicos | El documento no trae más (§28) |
| No registrar P-ATLAS-06 en el historial | Registrarlo como parcial | El prompt no se ejecutó; solo se adelantó contenido de tareas «adelantables» |

## 4. Tareas

| # | Tarea | Identificadores | Rol / responsable | Verificación | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Issue #77 y rama desde `dev` | — | Angie | Issue y rama | ✅ |
| 2 | `portada.md` (T011 parte, T012) | RF-01, RN-03, FR-005 | Contenidos / Angie | Respaldo por afirmación | ✅ borrador |
| 3 | `fichas.md` (T017) | RF-03, HU-07, FR-009 | Contenidos / Angie | §10.4 literal | ✅ borrador |
| 4 | `textos-interfaz.md` (T011, T018) | RNF-03, RNF-04 | UX / Angie | Claves es/en | ✅ borrador |
| 5 | Revisión de fuentes (T024) | RN-03, RN-11, RN-12 | Contenidos / Angie | 9/9 URLs en §31 | 🔄 falta Marian |

## 5. Cambios realizados

| Archivo | Cambio |
| --- | --- |
| `specs/003-portada-atlas/contenido/portada.md` | Nuevo |
| `specs/003-portada-atlas/contenido/fichas.md` | Nuevo |
| `specs/003-portada-atlas/contenido/textos-interfaz.md` | Nuevo |
| `specs/003-portada-atlas/contenido/revision-fuentes.md` | Nuevo (informe T024) |

## 6. Pruebas y resultados

Sin código. Comprobación automática: 9 de 9 URLs citadas están en `ai/referencias/catalogo.json`; texto visible
de la portada en español ≈ 160 palabras.

## 7. Problemas encontrados

- Tres imprecisiones de redacción frente a §4.3 y §9.1, corregidas en la revisión.
- Potosí sin fuente boliviana (la skill la pide; RF-03 no): decide el equipo.

## 8. Feedback del usuario

Angie aprobó el sprint y delegó commits, push, PR y fusión, sin Claude como coautor.

## 9. Próximos pasos

- Revisión de Marian del borrador (T024).
- Fuentes de Pando, La Paz, Tarija y Chuquisaca desde `UraqiVisionBack`.
- P-ATLAS-06 cuando Joaco termine P-PROY-07; método y descargas en P-INTERFAZ-07 con Marian.
