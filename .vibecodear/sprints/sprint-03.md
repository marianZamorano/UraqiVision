# Sprint 03

- **Fecha:** 2026-11-14
- **Sprint anterior:** sprint-02.md
- **Responsable:** Angie (M-ATLAS, §19) · **Issue:** #55 · **Rama:** `feat/55-aclarar-portada-atlas`
- **Objetivo:** P-ATLAS-02: Clarifications de specs/003-portada-atlas (RF-01, RF-03) sin fuentes inventadas, más
  informe de evidencia de DP-01 (#55)
- **Criterio de aceptación:** sección Clarifications con ≤ 5 respuestas de Angie; ninguna fuente inventada ni DP
  dada por resuelta; `npm run sdd:estado` muestra P-ATLAS-02 hecho.
- **Estado final:** ✅ Cumplido (P-ATLAS-02). DP-01: evidencia parcial, por confirmar en el navegador.

## 1. Diagnóstico

- La spec 003 (P-ATLAS-01) ya estaba en `dev` (PR #53, issue #52 cerrado).
- La base `001-base-web` (Joaco, P-PROY-02 a 07) no existe: el equipo acordó no avanzar en nada que dependa
  de ella. P-ATLAS-02 y DP-01 no dependen de ella.
- 4 de 9 fichas sin fuente verificada en §31 (Pando, La Paz, Tarija, Chuquisaca).
- DP-01 (Angie) venció el 13 de noviembre (§29).
- Contradicción documental: CU-02 (ficha → Insight) frente a §8.1 y RF-16 (Insight acotado a la estación).

## 2. Roles utilizados

| Rol | Responsable (§19) | Por qué se activó | Skills y subagentes | Fuente consultada |
| --- | --- | --- | --- | --- |
| Product Owner | Angie | Responder las aclaraciones | `sdd-prompts`, `speckit-clarify` | Documento maestro §8, §10.4, §13, §20.1 |
| Contenidos y rigor | Angie y Marian | Fuentes y pendientes sin inventar | `rigor-y-fuentes`, `referencias-documento` | §28, §31 |
| Engineering Manager | Angie | Orden, alcance y avisos | `guardian-alcance` | §25, §29 |

## 3. Decisiones

| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| Imagen de portada: la aporta el equipo; «imagen pendiente» mientras tanto | Ilustración, IA, dejar sin definir | Angie prefiere pasar las imágenes; evita inventar (RN-04) |
| «Explorar Bolivia» → explorador con globo y lista textual | Solo lista, solo globo | §20.1 y RNF-04; no queda bloqueado si el globo no carga |
| Fichas sin fuente: visibles con «Fuente en verificación» | Ocultar, sin aviso | HU-07 y RN-03; las verifican Angie y Marian |
| Insight en fichas sin estación: pendiente | Solo vía estación, en todas | Requiere consulta al equipo con Mimi (§28) |
| Ficha/estación: etiqueta de texto + icono | Solo texto, decidir en diseño | RNF-04: el color no es la única señal |
| Preguntas sobre campos de ficha y rango 54–55 descartadas | Preguntarlas | Ya fijadas por RF-03, §10.4 y la spec (guardian-alcance) |

## 4. Tareas

| # | Tarea | Identificadores | Rol / responsable | Verificación | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Issue #55 y rama `feat/55-aclarar-portada-atlas` desde `dev` | — | EM / Angie | Issue y rama existen | ✅ |
| 2 | P-ATLAS-02: 5 aclaraciones integradas en la spec | RF-01, RF-03, RNF-04, RN-04, RN-12, CU-02 | PO / Angie | 5 bullets `- Q:`; sin restos contradictorios | ✅ |
| 3 | Historial y commits (push y PR los hace Angie) | — | EM / Angie | `npm run sdd:estado` | 🔄 |
| 4 | Evidencia de DP-01 | DP-01 | Contenidos / Angie | Ver sección 7 | 🔄 Parcial |

## 5. Cambios realizados

| Archivo | Cambio |
| --- | --- |
| `specs/003-portada-atlas/spec.md` | Sección Clarifications (5 Q/A); FR-003, FR-005, FR-009, FR-010a, FR-023; casos límite; historias 4 |
| `sdd/historial/…P-ATLAS-02…` | Confirmación y resultado de P-ATLAS-02 |
| `.vibecodear/sprints/sprint-03.md` | Este documento |

## 6. Pruebas y resultados

Sin código en este Sprint (solo spec). Validación de la spec: 5 aclaraciones, sin marcadores ni texto
contradictorio; checklist de calidad 16/16 sin cambios.

## 7. Problemas encontrados

- **Automatización issue → rama no corre**: el workflow `issue-a-pr.yml` no está en `main` (los eventos de
  issues solo disparan desde la rama por defecto). Rama creada a mano. Avisar a Marian.
- **DP-01, evidencia parcial (no resuelta)**:
  - **Hipótesis por confirmar**: según el resultado del buscador (no se pudo abrir la página), la guía de
    entrega de Space Apps indica una presentación de **como máximo 7 láminas, incluidas las de título e
    introducción**, o un video de 30 s o menos; superar esos límites deja el proyecto fuera de la evaluación
    global; las láminas van en inglés y se entregan como enlace público externo.
  - **Por qué no es un hecho todavía**: las páginas no se pudieron leer desde este equipo (error de
    certificado TLS) y el buscador fechaba la guía en una edición anterior; no está confirmado que sea la
    guía 2026.
  - **Para cerrarla**: Angie y Marian abren en el navegador la [guía de entrega de proyectos](https://www.spaceappschallenge.org/resources/project-submission-guide/)
    y la [página de la edición 2026](https://www.spaceappschallenge.org/2026/), confirman el texto y la
    edición, y el equipo registra la decisión en §29 (fecha de consulta incluida). Se cruza con DP-02 (Marian).

## 8. Feedback del usuario

Angie pidió no avanzar en nada que dependa de la base de Joaco y trabajar en una rama nueva para hacer ella la
PR a `dev`. En la pregunta de la imagen, prefirió que el equipo aporte las imágenes.

## 9. Próximos pasos

- Confirmar DP-01 en el navegador y registrarla (Angie y Marian).
- Consultar al equipo con Mimi la contradicción CU-02 / RF-16 (Insight en fichas sin estación).
- Verificar las fuentes de Pando, La Paz, Tarija y Chuquisaca (Angie y Marian).
- P-ATLAS-03 (planificar) cuando exista `specs/001-base-web` de Joaco.
