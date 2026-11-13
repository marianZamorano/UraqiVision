---
id: M-MAPA
titulo: Mapa de análisis 2D
tipo: modulo
prefijo: MAPA
spec: specs/002-mapa-analisis
---

# SDD · M-MAPA — Mapa de análisis 2D

El mapa 2D con MapLibre es donde se mide y se compara (§20.2): máscara de cambio, deslizador antes/después,
vistas por polarización, focos de calor, capas y la línea de tiempo sincronizada. Es la **primera meta del
hackathon**: un antes/después real de San Ignacio el sábado a las 13:00 (§25).

## 1. Ficha

| Campo | Valor |
|---|---|
| Módulo (§19) | M-MAPA · «Mapa de análisis 2D, capas, deslizador y línea de tiempo sincronizada» |
| Responsable | Joaco |
| Revisor | Marian |
| Repositorio | `UraqiVision` (frontend) |
| Spec | `specs/002-mapa-analisis` |
| Momento (§25) | Sáb 9:00–13:00 mapa 2D y deslizador con el primer par real · Sáb 20:00–24:00 línea de tiempo sincronizada |
| Apoyo previsto en §25 | El control de capas (RF-35) figura en §25 para Angie y Marian (Sáb 14:00–20:00): es apoyo a Joaco y se coordina con él |

## 2. Alcance del documento maestro

| ID | Requisito (§13) | Prioridad |
|---|---|---|
| RF-05 | Mapa de cambio de estación: máscara con leyenda, unidades, opacidad y zonas sin dato con trama | MVP |
| RF-06 | Deslizador antes/después de la misma órbita, con mouse, tacto y teclado | MVP |
| RF-07 | Línea de tiempo de la serie: fechas de una órbita, pausa, elección y fechas excluidas con su motivo | MVP |
| RF-08 | Vista por polarización HH, HV y HV/HH; si una fecha solo tiene HH, HV y el cociente se deshabilitan con explicación | MVP |
| RF-10 | Capa de focos de calor FIRMS del periodo, con fecha y fuente | MVP |
| RF-35 | Control de capas: cambio, imagen de la fecha, línea base, focos, datos válidos, zonas sin dato, límites y áreas protegidas, cada una con leyenda, fecha, fuente, unidades y opacidad | MVP |
| RF-36 | Línea de tiempo sincronizada: al elegir fecha cambian imagen, polarizaciones, hectáreas y focos en el globo y en el mapa | MVP |
| RF-38 | Radar frente a óptica en el deslizador con Sentinel-2 cuando exista | Plus |

Fuera del área: el procesamiento (es del backend), RF-39 y RF-40 (Futuro) y lo de §8.2.

## 3. Reglas y decisiones que aplican

- §20.2: el mapa 2D es donde se mide; cada capa con leyenda, unidades, fuente, fecha y opacidad; paleta de un solo
  tono; trama gris para zonas sin dato; cada vista indica fecha, órbita y polarización; contraste para celular.
- RN-01 (misma órbita y grilla: el deslizador solo compara fechas compatibles), RN-07 (fechas UTC mostradas en hora
  de Bolivia), RN-13 (sin dato nunca es cero), RN-04 (nada simulado como resultado).
- RNF-02 (vistas de una estación por debajo de 40 MB), RNF-04 (teclado y foco), RNF-05 (celular), RNF-12
  (animación de la línea de tiempo con movimiento reducido).
- CQ-04: si una fecha no tiene HV, la vista HV se deshabilita para esa fecha.

## 4. Contratos e integración

- **Consume** (§17.3): `views/AAAAMMDD_hv.webp`, `_hh`, `_ratio` con sus límites geográficos; `station.json`
  (órbita, fechas); `quality.json` (fechas excluidas y motivo, datos válidos); `scars.geojson`; focos FIRMS del
  periodo (en `validation.json` según §17.3); `hectares.csv` para lo que cambia con la fecha.
- **Produce para otras áreas**: el estado de selección compartido (fecha, capa activa, polarización) que usa el
  globo (RF-29, RF-36) y el panel de la estación (RF-33).
- **Se coordina con**: M-GLOBO (RF-29, RF-36), M-INTERFAZ (panel y estados), M-PUBLICACIÓN en el backend (formato
  de las vistas y sus límites).

## 5. Calidad: pruebas y aceptación

- PS-04 (Vitest): RF-06, RF-07, RF-36 y RN-13 (sincronización de la línea de tiempo, deslizador, sin dato ≠ cero).
- PS-07: teclado, foco visible, contraste y movimiento reducido. PS-09: tramo «análisis» del recorrido completo.
- Criterios de §13: capa alineada y opacidad ajustable (RF-05); deslizador con mouse, tacto y teclado (RF-06);
  cada fecha excluida dice por qué (RF-07); ninguna vista muestra un canal inexistente (RF-08); todos los elementos
  muestran la misma fecha (RF-36).

## 6. Herramientas del repositorio

- Skills: `globo-y-mapa`, `frontend-data-fetching`, `typed-api-integration`, `react-components-and-state`,
  `design-system-tokens`, `frontend-testing`, `test-driven-development`, `responsive-visual-testing`.
- Subagentes: `revisor-interfaz`, `react-ui-reviewer`, `react-performance-auditor`, `uiux-design-auditor`.
- MCP: `context7` (MapLibre GL JS), `playwright` (contra localhost).
- Hooks: post-edit (paridad es/en), pre-commit, código vivo en la promoción.

**Referencias del documento maestro (§31)**

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **MapBiomas Bolivia (s. f.). Capas** — <https://bolivia.mapbiomas.org/en/capas/>
  Citada en: §10.3, §17. Aplica a: RF-14, RF-35, RF-03. Fuente de límites, áreas protegidas y territorios: cada capa que la use muestra fuente y año (RF-14, RF-35) y aparece en Acerca de.
- **NISAR (2025). NASA-ISRO SAR (NISAR) mission science users' handbook (2.ª ed.)** — <https://doi.org/10.48577/jpl.UD4HV3>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RN-11, RF-08, RF-15, RF-19, RF-24, RF-16. Fundamentos de la misión y del radar (§9): respalda el texto de qué resalta cada polarización (RF-08), el glosario (RF-19), la página de método y las citas de datos (RN-11, RF-24) y las explicaciones de Insight; el documento no la cita en el cuerpo.

<!-- referencias:fin -->

## 7. Riesgos y pendientes

- §24: hueco permanente de datos NISAR (27 jul – 10 ago) → mostrarlo en la línea de tiempo; escenas VALIDATED con
  solo HH → HV deshabilitada (CQ-04); dos motores de mapa → el mapa solo analiza, el globo solo explora.
- Depende de que el backend publique el primer par real antes de las 13:00 del sábado; mientras tanto, datos de
  ejemplo **marcados como ejemplo** (RN-04).
- RF-35 en §25 está agendado para Angie y Marian: acuérdenlo con Joaco (apoyo).

## 8. Secuencia de prompts

### P-MAPA-01 · Especificar
- **Orden:** 8
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-01
- **Momento:** Antes del sábado 14
- **Produce:** specs/002-mapa-analisis/spec.md
- **Herramientas:** skills `documento-maestro`, `globo-y-mapa`
- **Verificación:** cada requisito conserva su identificador; sin librerías en la spec

```text
[SDD P-MAPA-01] /speckit-specify Feature 002-mapa-analisis (número 002, nombre corto mapa-analisis) del frontend de UraqiVision, módulo M-MAPA de §19 (responsable Joaco). Mapa 2D de análisis de la estación San Ignacio de Velasco que lee los archivos publicados de §17.3 (los produce UraqiVisionBack): máscara de cambio con leyenda, unidades, opacidad y zonas sin dato con trama explicada (RF-05); deslizador antes/después que solo compara fechas de la misma órbita, con mouse, tacto y teclado (RF-06, RN-01); línea de tiempo que recorre las fechas de una órbita, se puede pausar y elegir, y marca cada fecha excluida con su motivo, incluido el hueco del 27 de julio al 10 de agosto (RF-07); vistas HH, HV y HV/HH con texto de qué resalta cada una y canales inexistentes deshabilitados con explicación (RF-08, CQ-04); focos de calor FIRMS del periodo con fecha y fuente (RF-10); control de capas con leyenda, fecha, fuente, unidades y opacidad por capa (RF-35); y línea de tiempo sincronizada: al elegir una fecha cambian imagen, polarizaciones, hectáreas y focos en el mapa y en el globo (RF-36). Reglas: fechas en hora de Bolivia (RN-07), sin dato nunca es cero (RN-13), nada simulado como resultado (RN-04), reglas de visualización de §20.2 y movimiento reducido (RNF-12). Plus si sobra tiempo: radar frente a óptica (RF-38). Fuera de alcance: el procesamiento de datos y lo de §8.2.
```

### P-MAPA-02 · Aclarar
- **Orden:** 13
- **Fase:** 3 · Aclaraciones
- **Comando:** speckit-clarify
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-01
- **Momento:** Antes del sábado 14
- **Produce:** sección Clarifications de specs/002-mapa-analisis/spec.md
- **Herramientas:** skill `documento-maestro`
- **Verificación:** máximo 5 preguntas; las decisiones pendientes quedan marcadas, no decididas

```text
[SDD P-MAPA-02] /speckit-clarify Aclara la spec 002-mapa-analisis con un máximo de 5 preguntas, una a la vez y con una opción recomendada basada en el documento maestro. Prioriza: qué hace el deslizador cuando las dos fechas no son de la misma órbita (RN-01), cómo se muestra el hueco del 27 de julio al 10 de agosto en la línea de tiempo (§24), qué ve el usuario si una fecha solo tiene HH (RF-08, CQ-04) y de dónde salen los focos del periodo (§17.3). Lo que dependa de una decisión pendiente de §29 se marca como pendiente, no se decide.
```

### P-MAPA-03 · Planificar
- **Orden:** 14
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-02
- **Momento:** Antes del sábado 14
- **Produce:** specs/002-mapa-analisis/plan.md, research.md, data-model.md, contracts/
- **Herramientas:** skills `globo-y-mapa`, `react-components-and-state`, `frontend-data-fetching`; MCP `context7`
- **Verificación:** MapLibre GL JS aislado detrás de componentes propios; contratos reutilizados de 001-base-web

```text
[SDD P-MAPA-03] /speckit-plan MapLibre GL JS (§18) aislado detrás de componentes propios para poder probarlo con dobles en Vitest; reutiliza la capa de datos y los contratos de specs/001-base-web (no dupliques tipos). Estado de selección compartido (fecha, capa, polarización) en un store que también leerá el globo (RF-29, RF-36). Las vistas son imágenes WebP de 8 bits con sus límites (§22: separar análisis y vista); la web no recalcula nada. Usa los tokens de diseño para la paleta de un solo tono y la trama de zonas sin dato (§20.2). Mantén el peso de las vistas bajo el límite de RNF-02. Consulta la documentación vigente de MapLibre con el MCP context7. Señala como hipótesis todo lo que el documento no fija.
```

### P-MAPA-04 · Tareas
- **Orden:** 15
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-03
- **Momento:** Antes del sábado 14
- **Produce:** specs/002-mapa-analisis/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `frontend-testing`
- **Verificación:** cada tarea con responsable, identificador y prueba; RF-35 marcado como apoyo de Angie y Marian

```text
[SDD P-MAPA-04] /speckit-tasks Ordena por historia de usuario y en el orden de §25: primero el mapa de cambio y el deslizador con el primer par real (meta del sábado 13:00), después polarizaciones y focos, después control de capas y por último la línea de tiempo sincronizada (sábado 20:00–24:00). Cada tarea lleva su responsable según §19 (Joaco) y marca como «apoyo de Angie y Marian» las de RF-35, como agenda §25. Cada tarea cita su identificador y su prueba (PS-04, PS-07). Prueba antes que implementación; [P] en las paralelizables.
```

### P-MAPA-05 · Analizar
- **Orden:** 16
- **Fase:** 6 · Análisis
- **Comando:** speckit-analyze
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-04
- **Momento:** Antes del sábado 14
- **Produce:** informe de coherencia (⛔ espera «apruebo»)
- **Herramientas:** subagente `guardian-alcance`
- **Verificación:** sin hallazgos críticos; la persona escribe «apruebo»

```text
[SDD P-MAPA-05] /speckit-analyze Revisa la coherencia entre spec.md, plan.md y tasks.md de specs/002-mapa-analisis y pásalos por el subagente guardian-alcance (alcance de §8, reglas de §16 y §20.2, pendientes de §29). Lista los hallazgos por severidad y detente hasta que la persona escriba «apruebo».
```

### P-MAPA-06 · Implementar mapa, deslizador, polarizaciones y capas
- **Orden:** 25
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-05, P-PROY-07
- **Momento:** Sáb 9:00–13:00 (primer par real) y Sáb 14:00–20:00
- **Produce:** mapa 2D con RF-05, RF-06, RF-08, RF-10 y RF-35
- **Herramientas:** skills `test-driven-development`, `globo-y-mapa`, `flujo-issues-y-pr`; subagente `react-ui-reviewer`
- **Verificación:** pruebas PS-04 en verde; antes/después real visible a las 13:00

```text
[SDD P-MAPA-06] /speckit-implement Implementa de specs/002-mapa-analisis las historias del mapa de cambio (RF-05), el deslizador (RF-06), las polarizaciones (RF-08), los focos FIRMS (RF-10) y el control de capas (RF-35), una tarea a la vez y prueba primero. Primero el mapa y el deslizador con el primer par real publicado por UraqiVisionBack: es la meta del sábado a las 13:00 (§25); si aún no hay datos reales, usa los de ejemplo claramente marcados como ejemplo (RN-04). Crea el issue y la rama tipo/N desde dev (skill flujo-issues-y-pr); un commit por tarea con su identificador. Detente al terminar cada historia y muéstrame la evidencia.
```

### P-MAPA-07 · Implementar la línea de tiempo sincronizada
- **Orden:** 35
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-06
- **Momento:** Sáb 20:00–24:00
- **Produce:** línea de tiempo con RF-07 y RF-36
- **Herramientas:** skills `test-driven-development`, `react-components-and-state`, `frontend-testing`
- **Verificación:** PS-04 de sincronización en verde; fechas excluidas con motivo

```text
[SDD P-MAPA-07] /speckit-implement Implementa de specs/002-mapa-analisis las historias de la línea de tiempo (RF-07) y su sincronización (RF-36): al elegir una fecha cambian la imagen, las polarizaciones disponibles, las hectáreas y los focos del periodo, y el globo recibe la misma fecha por el estado compartido. Marca las fechas excluidas con su motivo (incluido el hueco del 27 de julio al 10 de agosto) y respeta el movimiento reducido al animar (RNF-12). Prueba primero (PS-04, RN-13). Detente al terminar cada historia y muéstrame la evidencia.
```

### P-MAPA-08 · Verificar
- **Orden:** 39
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-MAPA-07
- **Momento:** Dom 14:00–19:00
- **Produce:** informe de verificación y PR a dev
- **Herramientas:** subagentes `revisor-interfaz`, `uiux-design-auditor`, `react-ui-reviewer`, `revisor-qa`; MCP `playwright`; `npm run codigo:revisar`
- **Verificación:** cada criterio de §13 con evidencia; revisión de Marian

```text
[SDD P-MAPA-08] /speckit-converge Compara el código con specs/002-mapa-analisis y agrega como tareas lo que falte. Luego verifica cada criterio de aceptación de §13 para RF-05, RF-06, RF-07, RF-08, RF-10, RF-35 y RF-36 con evidencia ejecutada: pruebas (PS-04), accesibilidad y movimiento reducido (PS-07), pantalla en escritorio y celular con el MCP playwright contra localhost, y revisor de código vivo (npm run codigo:revisar). Pide revisión a revisor-interfaz, uiux-design-auditor y revisor-qa, y la revisión humana de Marian (revisora de M-MAPA según §19). Con todo en verde, abre la PR a dev con «Closes #N».
```

## 9. Definición de terminado

- [ ] Antes/después real de San Ignacio en el mapa 2D (meta del sábado 13:00).
- [ ] RF-05, RF-06, RF-07, RF-08, RF-10, RF-35 y RF-36 cumplen su criterio de §13 con evidencia.
- [ ] Ninguna vista muestra un canal inexistente; las fechas excluidas dicen por qué.
- [ ] La fecha elegida es la misma en el mapa, el panel y el globo.
- [ ] PS-04 y PS-07 en verde; revisado por Marian; sin código muerto.
- [ ] PR a dev fusionada y el historial del SDD registrado.
