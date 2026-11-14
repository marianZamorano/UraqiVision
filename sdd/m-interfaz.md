---
id: M-INTERFAZ
titulo: Interfaz bilingüe, panel, estados y descargas
tipo: modulo
prefijo: INTERFAZ
spec: specs/004-interfaz-bilingue
---

# SDD · M-INTERFAZ — Interfaz bilingüe, panel, estados y descargas

Todo lo que hace que la web se lea, se entienda y se use: idiomas, glosario, panel de la estación, estados de la
vista, fuente y calidad, descargas y Acerca de. Es transversal: lo usan el globo, el mapa y el atlas.

## 1. Ficha

| Campo | Valor |
|---|---|
| Módulo (§19) | M-INTERFAZ · «Idiomas, glosario, descargas, accesibilidad, Acerca de, panel, estados, fuente y calidad» |
| Responsables | Angie y Marian |
| Reparto acordado (#42, #46) | Organización interna del equipo; §19 no cambia. **Marian**: panel (RF-33), estados (RF-34), glosario (RF-19), idioma (RF-20), fuente y calidad (RF-37), Acerca de (RF-24), Plus RF-23 y RF-31, y DP-02. **Angie**: método (RF-15) y descargas (RF-21, RF-22). El panel deja un espacio reservado para las descargas |
| Revisora | Mimi |
| Repositorio | `UraqiVision` (frontend) |
| Spec | `specs/004-interfaz-bilingue` |
| Momento (§25) | Sáb 9:00–13:00 panel de la estación · Sáb 14:00–20:00 estados de la vista · Sáb 20:00–24:00 glosario e idioma · Dom 9:00–14:00 método, Acerca de, fuente y calidad, descargas |
| Sin módulo en §19 | RF-15 (página de método): §25 lo agenda para Angie y Marian el domingo de 9:00 a 14:00; se incluye aquí y, según el reparto (#42), lo hace Angie |

## 2. Alcance del documento maestro

| ID | Requisito (§13) | Prioridad |
|---|---|---|
| RF-19 | Glosario: define términos de radar al pasar el cursor o tocar; todos los términos del sitio definidos | MVP |
| RF-20 | Cambio de idioma español/inglés sin recargar; 100 % de los textos traducidos | MVP |
| RF-21 | Descarga de PNG del mapa actual y CSV de la serie de hectáreas, con fecha, fuente y créditos | MVP |
| RF-22 | Descarga de change.tif (COG), scars.geojson y manifest.json de cada estación, válidos y con licencia | MVP |
| RF-23 | Enlace directo que reproduce un departamento o una estación, con fecha y vista | Plus |
| RF-24 | Página Acerca de: equipo y roles, licencias, fuentes y citas de datos (NISAR, FIRMS, fuentes bolivianas) | MVP |
| RF-31 | Ficha imprimible de la estación (mapa, cifras, fuentes y límites) | Plus |
| RF-33 | Panel de la estación: periodo, órbita, polarización, hectáreas con rango, porcentaje de datos válidos, validación, advertencias, hipótesis y enlace al método, en ambos idiomas | MVP |
| RF-34 | Estados de la vista: cargando, resultado disponible, datos limitados, sin datos, fecha incompatible y error con reintento; «sin datos» nunca como cero | MVP |
| RF-37 | Fuente y calidad: escenas, fechas, órbita, producto y madurez, CRID, fuente de validación y fecha de generación; coincide con manifest.json y quality.json | MVP |
| RF-15 | Página de método: pipeline, parámetros, versión de datos y límites, enlazada desde cada estación (sin módulo en §19) | MVP |

Historias: HU-02, HU-03, HU-05, HU-06; CU-04, CU-05. Fuera del área: Insight (lo especifica 90-integracion junto
con M-INSIGHT del backend) y lo de §8.2.

## 3. Reglas y decisiones que aplican

- RN-03, RN-05, RN-06, RN-07, RN-08 (madurez PROVISIONAL en la página de método), RN-11 (citas NISAR), RN-12 y
  RN-13 (sin dato «no reportada» con su motivo, nunca cero).
- RNF-03 (100 % es/en), RNF-04 (teclado, foco, contraste WCAG 2.2 AA, textos alternativos), RNF-11 (licencias),
  RNF-12 (movimiento reducido). §20.2: cifras siempre con su rango.
- La web no recalcula nada: las cifras coinciden con los archivos publicados (RF-09, RF-37).

## 4. Contratos e integración

- **Consume** (§17.3): `station.json` (periodo, órbita, hipótesis, relato local), `hectares.csv`, `validation.json`,
  `quality.json`, `manifest.json`, `change.tif` y `scars.geojson` (para descargarlos tal cual).
- **Produce**: componentes de estado (RF-34) y panel (RF-33) que usan el mapa y el globo; diccionarios es.json y
  en.json; glosario; páginas de método y Acerca de.
- **Se coordina con**: M-MAPA (panel junto al mapa, PNG del mapa actual), M-GLOBO (estados del globo),
  M-PUBLICACIÓN en el backend (formato de los archivos que se descargan y sus licencias).

## 5. Calidad: pruebas y aceptación

- PS-03 (cada estación con sus archivos y textos en ambos idiomas), PS-04 (formatos de cifras, estados de la vista,
  cambio de idioma; RF-20, RF-34, RN-13), PS-07 (accesibilidad), PS-09 (tramo «descarga» del recorrido).
- Criterios de §13 de cada requisito de la tabla, en especial: ninguna pantalla vacía (RF-34) y fuente y calidad
  coinciden con manifest.json y quality.json (RF-37).

## 6. Herramientas del repositorio

- Skills: `interfaz-bilingue-accesible`, `descargas-y-exportacion`, `metodo-y-creditos`, `rigor-y-fuentes`,
  `design-system-tokens`, `frontend-data-fetching`, `typed-api-integration`, `frontend-testing`,
  `test-driven-development`, `responsive-visual-testing`.
- Subagentes: `revisor-interfaz`, `uiux-design-auditor`, `react-ui-reviewer`, `revisor-qa`.
- MCP: `playwright` (contra localhost), `context7` (react-i18next, Recharts).
- Hooks: post-edit (paridad de claves es/en), pre-commit, código vivo en la promoción.

**Referencias del documento maestro (§31)**

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Alaska Satellite Facility (2026). NISAR data user guide** — <https://nisar-docs.asf.alaska.edu/>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: MC-01, RF-26, RF-37, RN-02, CQ-02, CQ-06. Guía de uso de los productos NISAR (GCOV, madurez, CRID, órbitas) que respaldan §10.1: cítala donde se busca, lee y describe el producto, y en la página de método.
- **Autoridad de Bosques y Tierra (2026). Boletín oficial 222 de focos de calor** — <https://www.abt.gob.bo/images/2026/Focos%20de%20Calor/2026%2008%2010%20Boletin%20oficial%20222%20MM.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Contexto oficial de incendios: cítala en la ficha de Santa Cruz, en las hipótesis de la estación y en Acerca de; es contexto, no validación.
- **Belenguer-Plomer, Tanase, Fernandez-Carrillo y Chuvieco (2019). Burned area detection and mapping using Sentinel-1 backscatter coefficient and thermal anomalies** — <https://doi.org/10.1016/j.rse.2019.111345>
  Citada en: §11.1, §12 (MC-08), §23.1 (VC-01). Aplica a: MC-03, MC-08, VC-01, RF-11, RF-15. Cítala en la implementación de MC-03 y MC-08, en las métricas de VC-01 y en la página de método. El Dice de 0,59 es de banda C: no lo presentes como meta ni como resultado de banda L.
- **Cesium GS (2026). CesiumJS [Software]** — <https://github.com/CesiumGS/cesium>
  Citada en: §18. Aplica a: RF-02, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-24, RNF-11. Usa la documentación vigente (MCP context7) al implementar el globo; muestra su atribución y licencia en el globo y en Acerca de (RF-24, RNF-11).
- **GDAL/OGR contributors (2026). COG: Cloud Optimized GeoTIFF generator** — <https://gdal.org/drivers/raster/cog.html>
  Citada en: §22. Aplica a: RNF-09, RF-22, PS-02, MC-01. Opciones del driver COG al escribir change.tif y los COG por fecha sin pérdida; cítala donde se escriben y en la prueba de integridad (PS-02).
- **NASA Space Apps Challenge (2026). Dancing with the SARs** — <https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/>
  Citada en: §3. Aplica a: RF-01, RF-24. Enlázalo en Acerca de y en la entrega; sin logos ni marcas de la NASA en contenido generado con IA (RN-12).
- **NISAR (2025). NASA-ISRO SAR (NISAR) mission science users' handbook (2.ª ed.)** — <https://doi.org/10.48577/jpl.UD4HV3>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RN-11, RF-08, RF-15, RF-19, RF-24, RF-16. Fundamentos de la misión y del radar (§9): respalda el texto de qué resalta cada polarización (RF-08), el glosario (RF-19), la página de método y las citas de datos (RN-11, RF-24) y las explicaciones de Insight; el documento no la cita en el cuerpo.
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico de focos de calor en Bolivia** — <https://senamhi.gob.bo/focoscalor/2026/FC_7_JULIO_2026/Pron_Focos_Bolivia_20260713.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Cítala en las fichas que usen el pronóstico de focos y en Acerca de; es contexto (un pronóstico), no un resultado ni una validación (RN-10).
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico hidrológico** — <https://senamhi.gob.bo/meteorologia/boletines/pronostico_hidrologico/2026/JULIO/RESUMEN%20EN%20PLANILLA%20PRON%C3%93STICO%20HIDROL%C3%93GICO%20SENAMHI%20LUNES%2027-07-2026.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-24. Cítala en las fichas que usen el pronóstico hidrológico (inundaciones o sequía) y en Acerca de; es contexto, no un resultado.

<!-- referencias:fin -->

## 7. Riesgos y pendientes

- §24: humo o nubes sin imagen Sentinel-2 limpia → la estación dice «validación limitada» (RF-11) y la página de
  método lo explica.
- RF-15 sin módulo en §19 (ver Ficha). El control de capas (RF-35, de M-MAPA) aparece en §25 para Angie y Marian:
  es apoyo a Joaco.
- Las licencias de los datos descargables dependen de lo que publique el backend (RNF-11).

## 8. Secuencia de prompts

### P-INTERFAZ-01 · Especificar
- **Orden:** 10
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Angie, Marian
- **Revisa:** Mimi
- **Depende de:** P-PROY-01
- **Momento:** Antes del sábado 14
- **Produce:** specs/004-interfaz-bilingue/spec.md
- **Herramientas:** skills `documento-maestro`, `interfaz-bilingue-accesible`, `descargas-y-exportacion`, `metodo-y-creditos`
- **Verificación:** cada requisito conserva su identificador; sin librerías en la spec

```text
[SDD P-INTERFAZ-01] /speckit-specify Feature 004-interfaz-bilingue (número 004, nombre corto interfaz-bilingue) del frontend de UraqiVision, módulo M-INTERFAZ de §19 (responsables Angie y Marian). Panel de la estación con periodo, órbita, polarización, hectáreas con rango, porcentaje de datos válidos, validación, advertencias, hipótesis y enlace al método, en ambos idiomas (RF-33); estados de la vista cargando, resultado disponible, datos limitados, sin datos, fecha incompatible y error con reintento, sin pantallas vacías y con «no reportada» y su motivo en lugar de cero (RF-34, RN-13); glosario de términos de radar al pasar el cursor o tocar (RF-19); cambio de idioma sin recargar con el 100 % de los textos traducidos (RF-20, RNF-03); descarga de PNG del mapa actual y CSV de hectáreas con fecha, fuente y créditos (RF-21) y de change.tif, scars.geojson y manifest.json tal como se publican (RF-22); sección fuente y calidad que coincide con manifest.json y quality.json (RF-37); página Acerca de con equipo y roles, licencias, fuentes y citas de datos (RF-24, RN-11, RNF-11); y página de método con pipeline, parámetros, versión de datos, límites y la madurez del producto (RF-15, RN-08). Accesible (RNF-04, RNF-12). Plus si sobra tiempo: enlace directo (RF-23) y ficha imprimible (RF-31). Historias HU-02, HU-03, HU-05, HU-06. Fuera de alcance: Insight y lo de §8.2.
```

### P-INTERFAZ-02 · Aclarar
- **Orden:** 21
- **Fase:** 3 · Aclaraciones
- **Comando:** speckit-clarify
- **Ejecuta:** Angie, Marian
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-01
- **Momento:** Antes del sábado 14
- **Produce:** sección Clarifications de specs/004-interfaz-bilingue/spec.md
- **Herramientas:** skill `documento-maestro`
- **Verificación:** máximo 5 preguntas; pendientes marcados

```text
[SDD P-INTERFAZ-02] /speckit-clarify Aclara la spec 004-interfaz-bilingue con un máximo de 5 preguntas, una a la vez, con una opción recomendada basada en el documento maestro. Prioriza: cuándo una cifra se marca como «datos limitados» (CQ-05), qué dice el panel si no hubo imagen Sentinel-2 válida (RF-11, «validación limitada»), qué términos entran en el glosario, qué créditos llevan el PNG y el CSV (RF-21) y cómo se formatean fechas y cifras en cada idioma (RN-07). Lo que dependa de §29 queda como pendiente.
```

### P-INTERFAZ-03 · Planificar
- **Orden:** 22
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Marian (con Angie en método y descargas)
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-02
- **Momento:** Antes del sábado 14
- **Produce:** specs/004-interfaz-bilingue/plan.md, data-model.md
- **Herramientas:** skills `interfaz-bilingue-accesible`, `descargas-y-exportacion`, `design-system-tokens`; MCP `context7`
- **Verificación:** react-i18next con es.json y en.json; Recharts para hectáreas; reutiliza 001-base-web

```text
[SDD P-INTERFAZ-03] /speckit-plan Reutiliza la app, la capa de datos y los contratos de specs/001-base-web. react-i18next con es.json y en.json y formatos de fecha y número por idioma (§18, RN-07); Recharts para el gráfico de hectáreas con rango (§18, RN-06); componentes de estado de RF-34 reutilizables por el mapa y el globo; descargas que entregan los archivos publicados sin transformarlos (RF-22) y que generan PNG y CSV con fecha, fuente y créditos (RF-21). Tokens de diseño con contraste para celular al aire libre (§20.2). Consulta react-i18next y Recharts con el MCP context7. Marca como propuesta lo que el documento no fija.
```

### P-INTERFAZ-04 · Tareas
- **Orden:** 23
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Marian (con Angie en método y descargas)
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-03
- **Momento:** Antes del sábado 14
- **Produce:** specs/004-interfaz-bilingue/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `frontend-testing`
- **Verificación:** cada tarea con responsable, identificador y prueba, en el orden de §25

```text
[SDD P-INTERFAZ-04] /speckit-tasks Ordena por historia y en el orden de §25: panel de la estación (sábado 9:00–13:00), estados de la vista (14:00–20:00), glosario e idioma (20:00–24:00) y método, Acerca de, fuente y calidad y descargas (domingo 9:00–14:00). Cada tarea lleva su responsable según §19 (Angie o Marian), su identificador y su prueba (PS-03, PS-04, PS-07). Prueba antes que implementación; [P] en las paralelizables.
```

### P-INTERFAZ-05 · Analizar
- **Orden:** 24
- **Fase:** 6 · Análisis
- **Comando:** speckit-analyze
- **Ejecuta:** Marian (con Angie en método y descargas)
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-04
- **Momento:** Antes del sábado 14
- **Produce:** informe de coherencia (⛔ espera «apruebo»)
- **Herramientas:** subagente `guardian-alcance`
- **Verificación:** sin hallazgos críticos; la persona escribe «apruebo»

```text
[SDD P-INTERFAZ-05] /speckit-analyze Revisa la coherencia entre spec.md, plan.md y tasks.md de specs/004-interfaz-bilingue y pásalos por el subagente guardian-alcance (alcance de §8, reglas de §16, §20.2 y §28). Lista los hallazgos por severidad y detente hasta que la persona escriba «apruebo».
```

### P-INTERFAZ-06 · Implementar panel y estados
- **Orden:** 27
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Marian
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-05, P-PROY-05
- **Momento:** Sáb 9:00–13:00 panel · Sáb 14:00–20:00 estados
- **Produce:** panel de la estación (RF-33) y estados de la vista (RF-34)
- **Herramientas:** skills `test-driven-development`, `interfaz-bilingue-accesible`, `flujo-issues-y-pr`
- **Verificación:** PS-04 de estados y RN-13 en verde

```text
[SDD P-INTERFAZ-06] /speckit-implement Arranca solo cuando la fase 1 de specs/001-base-web (T001 a T004: web/ con React, Vite, Vitest y tokens) esté fusionada en dev; nunca crees web/ ni dupliques nada de 001. Implementa de specs/004-interfaz-bilingue primero el setup, la parte común y el panel de la estación (T001 a T017, RF-33) y después los estados de la vista (T018 a T023, RF-34), que esperan al ViewStatePresenter de 001 (T029); una tarea a la vez y prueba primero (PS-04, RN-13: nunca cero en lugar de un dato ausente). Las cifras salen tal cual de los archivos publicados, con su rango (RN-06). Crea el issue y la rama tipo/N desde dev (skill flujo-issues-y-pr); un commit por tarea con su identificador. Detente al terminar cada historia y muéstrame la evidencia.
```

### P-INTERFAZ-07 · Implementar idioma, glosario, método, Acerca de, fuente y calidad y descargas
- **Orden:** 36
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Marian, Angie (Angie: método y descargas)
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-06
- **Momento:** Sáb 20:00–24:00 glosario e idioma · Dom 9:00–14:00 método, Acerca de, fuente y calidad, descargas
- **Produce:** RF-19, RF-20, RF-21, RF-22, RF-24, RF-37 y RF-15
- **Herramientas:** skills `test-driven-development`, `descargas-y-exportacion`, `metodo-y-creditos`, `rigor-y-fuentes`
- **Verificación:** PS-03 y PS-04 en verde; fuente y calidad coinciden con manifest.json y quality.json

```text
[SDD P-INTERFAZ-07] /speckit-implement Implementa de specs/004-interfaz-bilingue el glosario (RF-19) y el cambio de idioma (RF-20) el sábado por la noche, y el domingo la página de método (RF-15, RN-08), Acerca de (RF-24, RN-11, RNF-11), fuente y calidad (RF-37) y las descargas (RF-21, RF-22), una historia a la vez y prueba primero. Cifras, créditos y citas salen de los archivos publicados y de la skill metodo-y-creditos; nada inventado (§28). Detente al terminar cada historia y muéstrame la evidencia.
```

### P-INTERFAZ-08 · Verificar
- **Orden:** 41
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Marian (con Angie en método y descargas)
- **Revisa:** Mimi
- **Depende de:** P-INTERFAZ-07
- **Momento:** Dom 14:00–19:00
- **Produce:** informe de verificación y PR a dev
- **Herramientas:** subagentes `revisor-interfaz`, `uiux-design-auditor`, `react-ui-reviewer`, `revisor-qa`; MCP `playwright`; `npm run codigo:revisar`
- **Verificación:** criterios de §13 con evidencia; revisión de Mimi

```text
[SDD P-INTERFAZ-08] /speckit-converge Compara el código con specs/004-interfaz-bilingue y agrega como tareas lo que falte. Verifica con evidencia ejecutada los criterios de §13 de RF-15, RF-19, RF-20, RF-21, RF-22, RF-24, RF-33, RF-34 y RF-37: contenido en ambos idiomas (PS-03), estados y formatos (PS-04), accesibilidad y movimiento reducido (PS-07), pantallas en escritorio y celular con el MCP playwright contra localhost, archivos descargados válidos y revisor de código vivo (npm run codigo:revisar). Pide revisión a revisor-interfaz, uiux-design-auditor y revisor-qa, y la revisión humana de Mimi (revisora de M-INTERFAZ según §19). Con todo en verde, abre la PR a dev con «Closes #N».
```

## 9. Definición de terminado

- [ ] 100 % de los textos en español e inglés, sin recargar al cambiar de idioma.
- [ ] Ninguna pantalla vacía; ningún dato ausente mostrado como cero.
- [ ] Panel, fuente y calidad y descargas coinciden con los archivos publicados.
- [ ] Método y Acerca de completos, con licencias y citas de datos.
- [ ] PS-03, PS-04 y PS-07 en verde; revisado por Mimi; sin código muerto.
- [ ] PR a dev fusionada y el historial del SDD registrado.
