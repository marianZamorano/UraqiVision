# SDD de UraqiVision · frontend

Guía para implementar la web de UraqiVision **desde cero**, tal como la define el documento maestro
(`docs/UraqiVisionDocumentoMaestrov1.1.pdf`), con **Spec-Driven Development** (Spec Kit): primero la
especificación, después el código. Este repositorio es la web; el pipeline y la función Insight tienen su propio
SDD en [`UraqiVisionBack`](https://github.com/marianZamorano/UraqiVisionBack).

## Cómo está organizado

Un SDD por área de §19, todos con la misma estructura ([`00-estructura.md`](00-estructura.md)):

| SDD | Área | Responsable (§19) | Spec de Spec Kit |
|---|---|---|---|
| [`01-proyecto.md`](01-proyecto.md) | Constitución y proyecto web base | Equipo · Joaco (§25) | `specs/001-base-web` |
| [`m-mapa.md`](m-mapa.md) | M-MAPA · Mapa de análisis 2D | Joaco | `specs/002-mapa-analisis` |
| [`m-atlas.md`](m-atlas.md) | M-ATLAS · Portada y fichas | Angie y Marian | `specs/003-portada-atlas` |
| [`m-interfaz.md`](m-interfaz.md) | M-INTERFAZ · Idiomas, panel, estados, descargas | Angie y Marian | `specs/004-interfaz-bilingue` |
| [`m-globo.md`](m-globo.md) | M-GLOBO · Globo 3D de Bolivia | Joaco, con apoyo de Angie y Marian | `specs/005-globo` |
| [`90-integracion.md`](90-integracion.md) | Integración, recorrido y entrega | Equipo | `specs/006-integracion` |

Los módulos M-INGESTA, M-CIENCIA, M-VALIDACIÓN, M-PUBLICACIÓN y M-INSIGHT son del backend. La web se coordina con
ellos por dos contratos: los archivos publicados de cada estación (§17.3) y `POST /api/insight` (§21.1).

## Cómo se usa (cada prompt)

1. **Quién eres**: el asistente pregunta con opción múltiple qué colaborador eres (§19) si aún no lo sabe.
2. **Qué sigue**: `npm run sdd:siguiente -- --yo` imprime tu siguiente prompt, listo para copiar.
3. **Pega el prompt** en tu asistente. Empieza con su etiqueta (`[SDD P-MAPA-01]`). El hook del mensaje lo
   reconoce y el asistente **te pregunta antes de ejecutarlo** (opción múltiple): ejecutarlo tal cual,
   modificarlo antes o posponerlo. Si no eres quien lo ejecuta según el SDD, te avisa que es apoyo a otro rol.
4. **Se ejecuta** el comando de Spec Kit (o la skill) del prompt, con sus puntos de control.
5. **Al terminar**, el asistente registra el resultado en el historial y **te muestra el siguiente prompt** en un
   bloque listo para copiar y pegar. Si lo olvida, el hook de fin de turno se lo exige.
6. **Commitea** lo producido y la entrada del historial en la rama de tu issue (skill `flujo-issues-y-pr`).

| Comando | Para qué |
|---|---|
| `npm run sdd:estado` | Progreso de cada SDD, conflictos y tu siguiente prompt |
| `npm run sdd:siguiente -- --yo` | Tu siguiente prompt, listo para copiar (`--asistente codex\|gemini\|opencode` lo adapta) |
| `npm run sdd:ver -- P-MAPA-03` | Un prompt concreto |
| `npm run sdd:historial` | Qué pasó con cada prompt: decisiones, resultados, cambios y conflictos |
| `npm run sdd:validar` | Que todos los SDD conserven la estructura común |

Los comandos de registro los ejecuta el asistente:
`node ai/scripts/sdd.mjs confirmar <ID> --decision ejecutar|modificar|omitir` antes de ejecutar y
`node ai/scripts/sdd.mjs registrar <ID> --resultado hecho|parcial|conflicto|en-espera` al terminar.

### Comandos de Spec Kit en cada asistente

Los prompts usan la sintaxis de Claude Code. `npm run sdd:siguiente -- --asistente <nombre>` los convierte:

| Claude Code | Codex CLI | Gemini CLI | opencode |
|---|---|---|---|
| `/speckit-specify` | `$speckit-specify` | `/speckit.specify` | `/speckit.specify` |

## Historial de prompts

Cada confirmación y cada resultado es un archivo JSON en [`historial/`](historial/) (uno por entrada: varias
personas pueden registrar a la vez sin conflictos de merge). Guarda quién, cuándo, en qué rama, la decisión, el
resultado, una nota y la huella del texto del prompt. Con eso `npm run sdd:estado` detecta:

- **prompts modificados después de ejecutarse**: el texto cambió desde que se marcó «hecho»;
- **dependencias re-ejecutadas**: una dependencia se volvió a ejecutar después; el resultado puede no valer;
- **conflictos declarados**: un prompt registrado como «conflicto», con su nota.

Un prompt se puede **cambiar** cuando haga falta: se edita en su archivo (con issue, rama y PR) y su ejecución
queda registrada con la decisión «modificar» y el motivo.

## Herramientas que intervienen

| Momento | Herramienta | Qué hace |
|---|---|---|
| Antes de todo | Skill `documento-maestro` | Buscar requisitos por identificador y comprobar el alcance |
| Cada prompt | Skill `sdd-prompts` | Confirmar con la persona, ejecutar, registrar y entregar el siguiente |
| Cada prompt | Hook del mensaje (`prompt-guard`) | Reconoce `[SDD P-…]`, pide confirmar y avisa de dependencias, cambios y apoyo |
| Fin de cada prompt | Hook de fin de turno (`fin-turno`, Stop o AfterAgent) | Exige registrar el resultado y mostrar el siguiente prompt |
| Especificación y plan | Subagente `guardian-alcance` | Revisa el plan y las tareas contra §8, §16, §28 y §29 |
| Plan | MCP `context7` | Documentación vigente de CesiumJS, MapLibre, react-i18next, Recharts |
| Implementación | Skills `test-driven-development`, `globo-y-mapa`, `interfaz-bilingue-accesible`, `frontend-data-fetching`, `typed-api-integration` | Prueba primero y reglas de cada área |
| Verificación | Subagentes `revisor-interfaz`, `revisor-qa`, `uiux-design-auditor`, `react-ui-reviewer`; MCP `playwright` | Pantallas, pruebas con evidencia, accesibilidad y recorrido en el navegador |
| Commits | Hooks de git | Issue en cada commit, división por temas, secretos, coherencia y estructura de los SDD |
| Promoción a qa y main | Revisor de código vivo, `release-readiness-reviewer` | Sin código roto ni muerto; veredicto de despliegue |
| Coordinación | Skill `vibecodear` | Toma el siguiente prompt de tus módulos como objetivo del Sprint |

## Orden de los prompts

Orden global según el plan del hackathon (§25). Cada área avanza en paralelo con su responsable; respeta las
dependencias. Esta tabla se genera de los SDD (`npm run ai:sync`).

<!-- sdd:orden (generado por ai/sync.mjs desde sdd/*.md; no editar a mano) -->

| # | Prompt | Paso | SDD | Comando | Ejecuta | Depende de | Momento (§25) |
|---|---|---|---|---|---|---|---|
| 1 | `P-PROY-01` | Constitución | [PROYECTO](01-proyecto.md) | `speckit-constitution` | Equipo | — | Antes del sábado 14 |
| 2 | `P-PROY-02` | Especificar el proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-specify` | Joaco | P-PROY-01 | Antes del sábado 14 (proyecto web base) |
| 3 | `P-PROY-03` | Planificar el proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-plan` | Joaco | P-PROY-02 | Antes del sábado 14 |
| 4 | `P-PROY-04` | Tareas del proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-tasks` | Joaco | P-PROY-03 | Antes del sábado 14 |
| 5 | `P-PROY-05` | Analizar el proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-analyze` | Joaco | P-PROY-04 | Antes del sábado 14 |
| 6 | `P-PROY-06` | Implementar el proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-implement` | Joaco | P-PROY-05 | Antes del sábado 14, o sábado 9:00 si DP-02 no lo permite |
| 7 | `P-PROY-07` | Verificar el proyecto web base | [PROYECTO](01-proyecto.md) | `speckit-converge` | Joaco | P-PROY-06 | Antes del sábado 14 |
| 8 | `P-MAPA-01` | Especificar | [M-MAPA](m-mapa.md) | `speckit-specify` | Joaco | P-PROY-01 | Antes del sábado 14 |
| 9 | `P-ATLAS-01` | Especificar | [M-ATLAS](m-atlas.md) | `speckit-specify` | Angie | P-PROY-01 | Antes del sábado 14 (textos de fichas) |
| 10 | `P-INTERFAZ-01` | Especificar | [M-INTERFAZ](m-interfaz.md) | `speckit-specify` | Angie, Marian | P-PROY-01 | Antes del sábado 14 |
| 11 | `P-GLOBO-01` | Especificar | [M-GLOBO](m-globo.md) | `speckit-specify` | Joaco | P-PROY-01 | Antes del sábado 14 |
| 12 | `P-INT-01` | Especificar la integración | [INTEGRACION](90-integracion.md) | `speckit-specify` | Equipo | P-MAPA-01, P-ATLAS-01, P-INTERFAZ-01, P-GLOBO-01 | Antes del sábado 14 |
| 13 | `P-MAPA-02` | Aclarar | [M-MAPA](m-mapa.md) | `speckit-clarify` | Joaco | P-MAPA-01 | Antes del sábado 14 |
| 14 | `P-MAPA-03` | Planificar | [M-MAPA](m-mapa.md) | `speckit-plan` | Joaco | P-MAPA-02 | Antes del sábado 14 |
| 15 | `P-MAPA-04` | Tareas | [M-MAPA](m-mapa.md) | `speckit-tasks` | Joaco | P-MAPA-03 | Antes del sábado 14 |
| 16 | `P-MAPA-05` | Analizar | [M-MAPA](m-mapa.md) | `speckit-analyze` | Joaco | P-MAPA-04 | Antes del sábado 14 |
| 17 | `P-ATLAS-02` | Aclarar | [M-ATLAS](m-atlas.md) | `speckit-clarify` | Angie | P-ATLAS-01 | Antes del sábado 14 |
| 18 | `P-ATLAS-03` | Planificar | [M-ATLAS](m-atlas.md) | `speckit-plan` | Angie | P-ATLAS-02 | Antes del sábado 14 |
| 19 | `P-ATLAS-04` | Tareas | [M-ATLAS](m-atlas.md) | `speckit-tasks` | Angie | P-ATLAS-03 | Antes del sábado 14 |
| 20 | `P-ATLAS-05` | Analizar | [M-ATLAS](m-atlas.md) | `speckit-analyze` | Angie | P-ATLAS-04 | Antes del sábado 14 |
| 21 | `P-INTERFAZ-02` | Aclarar | [M-INTERFAZ](m-interfaz.md) | `speckit-clarify` | Angie, Marian | P-INTERFAZ-01 | Antes del sábado 14 |
| 22 | `P-INTERFAZ-03` | Planificar | [M-INTERFAZ](m-interfaz.md) | `speckit-plan` | Marian (con Angie en método y descargas) | P-INTERFAZ-02 | Antes del sábado 14 |
| 23 | `P-INTERFAZ-04` | Tareas | [M-INTERFAZ](m-interfaz.md) | `speckit-tasks` | Marian (con Angie en método y descargas) | P-INTERFAZ-03 | Antes del sábado 14 |
| 24 | `P-INTERFAZ-05` | Analizar | [M-INTERFAZ](m-interfaz.md) | `speckit-analyze` | Marian (con Angie en método y descargas) | P-INTERFAZ-04 | Antes del sábado 14 |
| 25 | `P-MAPA-06` | Implementar mapa, deslizador, polarizaciones y capas | [M-MAPA](m-mapa.md) | `speckit-implement` | Joaco | P-MAPA-05, P-PROY-07 | Sáb 9:00–13:00 (primer par real) y Sáb 14:00–20:00 |
| 26 | `P-ATLAS-06` | Implementar portada y fichas | [M-ATLAS](m-atlas.md) | `speckit-implement` | Angie | P-ATLAS-05, P-PROY-07 | Sáb 9:00–13:00 portada · Sáb 14:00–20:00 fichas |
| 27 | `P-INTERFAZ-06` | Implementar panel y estados | [M-INTERFAZ](m-interfaz.md) | `speckit-implement` | Marian | P-INTERFAZ-05, P-PROY-07 | Sáb 9:00–13:00 panel · Sáb 14:00–20:00 estados |
| 28 | `P-GLOBO-02` | Aclarar | [M-GLOBO](m-globo.md) | `speckit-clarify` | Joaco | P-GLOBO-01 | Sáb 14:00 |
| 29 | `P-GLOBO-03` | Planificar | [M-GLOBO](m-globo.md) | `speckit-plan` | Joaco | P-GLOBO-02 | Sáb 14:00–20:00 |
| 30 | `P-GLOBO-04` | Tareas | [M-GLOBO](m-globo.md) | `speckit-tasks` | Joaco | P-GLOBO-03 | Sáb 14:00–20:00 |
| 31 | `P-GLOBO-05` | Analizar | [M-GLOBO](m-globo.md) | `speckit-analyze` | Joaco | P-GLOBO-04 | Sáb 14:00–20:00 |
| 32 | `P-GLOBO-06` | Implementar departamentos, vuelo, controles y selección | [M-GLOBO](m-globo.md) | `speckit-implement` | Joaco | P-GLOBO-05, P-PROY-07, P-MAPA-06 | Sáb 14:00–20:00 |
| 33 | `P-INT-02` | Planificar la integración | [INTEGRACION](90-integracion.md) | `speckit-plan` | Equipo | P-INT-01 | Sáb 14:00–20:00 |
| 34 | `P-INT-03` | Tareas de la integración | [INTEGRACION](90-integracion.md) | `speckit-tasks` | Equipo | P-INT-02 | Sáb 14:00–20:00 |
| 35 | `P-MAPA-07` | Implementar la línea de tiempo sincronizada | [M-MAPA](m-mapa.md) | `speckit-implement` | Joaco | P-MAPA-06 | Sáb 20:00–24:00 |
| 36 | `P-INTERFAZ-07` | Implementar idioma, glosario, método, Acerca de, fuente y calidad y descargas | [M-INTERFAZ](m-interfaz.md) | `speckit-implement` | Marian, Angie (Angie: método y descargas) | P-INTERFAZ-06 | Sáb 20:00–24:00 glosario e idioma · Dom 9:00–14:00 método, Acerca de, fuente y calidad, descargas |
| 37 | `P-GLOBO-07` | Implementar huellas, cambio sobre el globo y respaldo 2D | [M-GLOBO](m-globo.md) | `speckit-implement` | Joaco | P-GLOBO-06 | Dom 9:00–14:00 huellas y cambio · Dom 14:00–19:00 respaldo 2D y celular |
| 38 | `P-INT-04` | Implementar la integración | [INTEGRACION](90-integracion.md) | `speckit-implement` | Equipo | P-INT-03, P-MAPA-07, P-INTERFAZ-07, P-GLOBO-06 | Dom 9:00–14:00 |
| 39 | `P-MAPA-08` | Verificar | [M-MAPA](m-mapa.md) | `speckit-converge` | Joaco | P-MAPA-07 | Dom 14:00–19:00 |
| 40 | `P-ATLAS-07` | Verificar | [M-ATLAS](m-atlas.md) | `speckit-converge` | Angie | P-ATLAS-06 | Dom 14:00–19:00 |
| 41 | `P-INTERFAZ-08` | Verificar | [M-INTERFAZ](m-interfaz.md) | `speckit-converge` | Marian (con Angie en método y descargas) | P-INTERFAZ-07 | Dom 14:00–19:00 |
| 42 | `P-GLOBO-08` | Verificar | [M-GLOBO](m-globo.md) | `speckit-converge` | Joaco | P-GLOBO-07 | Dom 14:00–19:00 |
| 43 | `P-INT-05` | Verificar el recorrido completo | [INTEGRACION](90-integracion.md) | `speckit-converge` | Marian | P-INT-04, P-MAPA-08, P-ATLAS-07, P-INTERFAZ-08, P-GLOBO-08 | Dom 14:00–19:00 |
| 44 | `P-INT-06` | Preparar la entrega | [INTEGRACION](90-integracion.md) | `entrega-hackathon` | Angie | P-INT-05 | Dom 19:00–23:00 |
| 45 | `P-INT-07` | Pedir la promoción a qa y main | [INTEGRACION](90-integracion.md) | `flujo-issues-y-pr` | Equipo | P-INT-06 | Dom 19:00–23:00, solo cuando la persona lo pida |

<!-- /sdd:orden -->

## Reglas

- El documento maestro manda. Las decisiones pendientes de §29 (DP-01 a DP-08) no se deciden en un prompt: se
  marcan como pendientes.
- Hasta la fase de implementación solo se escriben artefactos de Spec Kit (`.specify/`, `specs/`).
- Ninguna implementación sin la aprobación de la persona en el análisis (⛔).
- Cada spec, tarea, prueba y commit cita sus identificadores (RF, RNF, RN, MC, CQ, VC, PS).
- Las promociones a `qa` y `main` solo se abren cuando la persona las pide.
