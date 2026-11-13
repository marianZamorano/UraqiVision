---
id: M-GLOBO
titulo: Globo 3D de Bolivia
tipo: modulo
prefijo: GLOBO
spec: specs/005-globo
---

# SDD · M-GLOBO — Globo 3D de Bolivia

El explorador 3D con CesiumJS: Bolivia encuadrada, los nueve departamentos, las estaciones, las huellas de las
escenas NISAR, el cambio sobre el globo y el vuelo de cámara. El globo **explora y ubica**; las mediciones se hacen
en el mapa 2D (§20.2). Si CesiumJS no inicia, todo sigue funcionando en 2D.

## 1. Ficha

| Campo | Valor |
|---|---|
| Módulo (§19) | M-GLOBO · «Globo 3D, departamentos, estaciones, huellas, vuelo, controles, selección y respaldo 2D» |
| Responsable | Joaco, con apoyo de Angie y Marian |
| Revisora | Angie |
| Repositorio | `UraqiVision` (frontend) |
| Spec | `specs/005-globo` |
| Momento (§25) | Sáb 14:00–20:00 departamentos y vuelo de cámara · Dom 9:00–14:00 huellas y cambio sobre el globo · Dom 14:00–19:00 respaldo 2D y pruebas en celular |

## 2. Alcance del documento maestro

| ID | Requisito (§13) | Prioridad |
|---|---|---|
| RF-02 | Explorador 3D: globo con Bolivia encuadrada, los 9 departamentos con su resumen y las estaciones, seleccionables | MVP |
| RF-25 | Vuelo de cámara hacia el departamento o la estación; instantáneo con movimiento reducido | MVP |
| RF-26 | Huellas de las escenas NISAR usadas, con órbita, dirección, fechas y polarizaciones; coinciden con el catálogo CMR | MVP |
| RF-27 | Cambio sobre el globo con leyenda y opacidad, en su extensión correcta y con zonas sin dato transparentes | MVP |
| RF-28 | Controles: volver a la vista de Bolivia y pantalla completa, con mouse, tacto y teclado | MVP |
| RF-29 | Del globo al análisis: «Analizar» abre el mapa 2D; al volver se conservan departamento, estación, fecha, capa y cámara | MVP |
| RF-30 | Respaldo del globo: si CesiumJS no inicia, el atlas se abre en el mapa 2D sin perder funciones esenciales | MVP |
| RF-32 | Selección y ruta territorial resaltadas en el globo y en el mapa: departamento, estación y periodo | MVP |

Recorrido (§20.1): al elegir un departamento la cámara vuela hacia él y se abre su ficha; en una estación se ven la
huella de las escenas y el resumen del cambio. Historias: CU-01, CU-03. Fuera del área: mediciones (son del mapa 2D).

## 3. Reglas y decisiones que aplican

- §18: CesiumJS con un mapa base abierto, **sin token de Cesium ion** y con su atribución.
- RNF-01 (CesiumJS se carga solo al entrar al explorador), RNF-04 (lista textual de departamentos y estaciones como
  alternativa al globo), RNF-05 (usable en el celular), RNF-12 (vuelo instantáneo con movimiento reducido).
- RN-13 (zonas sin dato transparentes, nunca como cero), RN-07 (fechas en hora de Bolivia).
- **DP-07 pendiente** (Joaco, sábado por la mañana): elegir el mapa base del globo y confirmar sus términos y
  atribución. No se elige en un prompt: el plan lo deja configurable hasta que se decida.

## 4. Contratos e integración

- **Consume** (§17.3): `atlas/departments.geojson`, `station.json`, `footprints.geojson` (huellas de las escenas, las
  produce M-INGESTA) y la máscara de cambio para el globo (la publica M-PUBLICACIÓN, RF-27).
- **Comparte** con M-MAPA el estado de selección (RF-29, RF-32, RF-36); abre las fichas de M-ATLAS.
- **Se coordina con**: M-MAPA (selección, fecha), M-ATLAS (fichas), M-INGESTA y M-PUBLICACIÓN en el backend.

## 5. Calidad: pruebas y aceptación

- PS-08 (globo): Bolivia encuadrada, huellas, vuelo, volver a Bolivia, pantalla completa y respaldo 2D (RF-02,
  RF-25 a RF-30). PS-07 (accesibilidad y movimiento reducido). PS-09 (tramo globo → estación → análisis).
- Criterios de §13 de cada requisito de la tabla; en especial, RF-29 conserva departamento, estación, fecha, capa
  activa y posición de cámara.

## 6. Herramientas del repositorio

- Skills: `globo-y-mapa`, `react-components-and-state`, `react-component-architecture`, `vite-bundle-optimization`,
  `frontend-testing`, `test-driven-development`, `responsive-visual-testing`.
- Subagentes: `revisor-interfaz`, `react-performance-auditor`, `react-ui-reviewer`, `uiux-design-auditor`.
- MCP: `context7` (CesiumJS), `playwright` (contra localhost).
- Hooks: pre-commit, código vivo en la promoción.

**Referencias del documento maestro (§31)**

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Cesium GS (2026). CesiumJS [Software]** — <https://github.com/CesiumGS/cesium>
  Citada en: §18. Aplica a: RF-02, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-24, RNF-11. Usa la documentación vigente (MCP context7) al implementar el globo; muestra su atribución y licencia en el globo y en Acerca de (RF-24, RNF-11).

<!-- referencias:fin -->

## 7. Riesgos y pendientes

- §24: el globo 3D es lento en celulares de gama media → carga diferida, menos detalle en el celular y respaldo en
  el mapa 2D (RF-30). Dos motores de mapa duplican trabajo → el globo solo explora.
- DP-07 (mapa base) sin decidir: el globo funciona con uno configurable hasta que Joaco lo resuelva.
- El apoyo de Angie y Marian (§19) se reparte por tareas en P-GLOBO-04.

## 8. Secuencia de prompts

### P-GLOBO-01 · Especificar
- **Orden:** 11
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-PROY-01
- **Momento:** Antes del sábado 14
- **Produce:** specs/005-globo/spec.md
- **Herramientas:** skills `documento-maestro`, `globo-y-mapa`
- **Verificación:** cada requisito conserva su identificador; DP-07 marcada como pendiente

```text
[SDD P-GLOBO-01] /speckit-specify Feature 005-globo (número 005, nombre corto globo) del frontend de UraqiVision, módulo M-GLOBO de §19 (responsable Joaco, con apoyo de Angie y Marian). Explorador 3D que inicia con Bolivia encuadrada y muestra los nueve departamentos con su resumen y las estaciones, seleccionables (RF-02); vuelo de cámara hacia el departamento o la estación elegidos, instantáneo con movimiento reducido (RF-25, RNF-12); huellas de las escenas NISAR usadas con órbita, dirección, fechas y polarizaciones, que coinciden con el catálogo CMR (RF-26); cambio sobre el globo con leyenda y opacidad y zonas sin dato transparentes (RF-27, RN-13); botones para volver a Bolivia y pantalla completa con mouse, tacto y teclado (RF-28); «Analizar» abre el mapa 2D y al volver se conservan departamento, estación, fecha, capa activa y cámara (RF-29); si el globo no inicia, el atlas se abre en el mapa 2D sin perder funciones esenciales (RF-30); y la selección y su ruta (departamento, estación, periodo) resaltadas en el globo y en el mapa (RF-32). El globo explora; las mediciones se hacen en el mapa 2D (§20.2). Lista textual alternativa al globo (RNF-04); usable en el celular (RNF-05). El mapa base del globo es una decisión pendiente (DP-07): no la decidas. Historias CU-01 y CU-03.
```

### P-GLOBO-02 · Aclarar
- **Orden:** 28
- **Fase:** 3 · Aclaraciones
- **Comando:** speckit-clarify
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-01
- **Momento:** Sáb 14:00
- **Produce:** sección Clarifications de specs/005-globo/spec.md
- **Herramientas:** skill `documento-maestro`
- **Verificación:** máximo 5 preguntas; DP-07 sigue pendiente

```text
[SDD P-GLOBO-02] /speckit-clarify Aclara la spec 005-globo con un máximo de 5 preguntas, una a la vez, con una opción recomendada basada en el documento maestro. Prioriza: qué resumen muestra cada departamento en el globo, qué pasa en el celular de gama media (§24), cómo se ve la ruta territorial de RF-32, qué conserva exactamente RF-29 al volver y cómo se comporta el respaldo 2D de RF-30. El mapa base (DP-07) se mantiene como pendiente.
```

### P-GLOBO-03 · Planificar
- **Orden:** 29
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-02
- **Momento:** Sáb 14:00–20:00
- **Produce:** specs/005-globo/plan.md, research.md
- **Herramientas:** skills `globo-y-mapa`, `vite-bundle-optimization`, `react-components-and-state`; MCP `context7`
- **Verificación:** CesiumJS diferido, sin token de Cesium ion; estado compartido con M-MAPA

```text
[SDD P-GLOBO-03] /speckit-plan CesiumJS (§18) aislado detrás de componentes propios, cargado de forma diferida solo al entrar al explorador (RNF-01) y sin token de Cesium ion, con un mapa base configurable hasta que se decida DP-07 y su atribución visible. Reutiliza la capa de datos y el estado de selección compartido que creó 002-mapa-analisis (RF-29, RF-36); no dupliques estado. Respaldo 2D con MapLibre si CesiumJS falla (RF-30). Menos detalle en el celular (§24). Consulta la documentación vigente de CesiumJS con el MCP context7. Marca como hipótesis lo que el documento no fija.
```

### P-GLOBO-04 · Tareas
- **Orden:** 30
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-03
- **Momento:** Sáb 14:00–20:00
- **Produce:** specs/005-globo/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `frontend-testing`
- **Verificación:** responsable y apoyo por tarea; cada tarea con identificador y PS-08

```text
[SDD P-GLOBO-04] /speckit-tasks Ordena por historia y en el orden de §25: departamentos, vuelo de cámara, controles y selección (sábado 14:00–20:00); huellas y cambio sobre el globo (domingo 9:00–14:00); respaldo 2D y pruebas en celular (domingo 14:00–19:00). Cada tarea lleva su responsable según §19 (Joaco) y, donde corresponda, el apoyo de Angie o Marian; su identificador y su prueba (PS-08, PS-07). Prueba antes que implementación; [P] en las paralelizables.
```

### P-GLOBO-05 · Analizar
- **Orden:** 31
- **Fase:** 6 · Análisis
- **Comando:** speckit-analyze
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-04
- **Momento:** Sáb 14:00–20:00
- **Produce:** informe de coherencia (⛔ espera «apruebo»)
- **Herramientas:** subagente `guardian-alcance`
- **Verificación:** sin hallazgos críticos; la persona escribe «apruebo»

```text
[SDD P-GLOBO-05] /speckit-analyze Revisa la coherencia entre spec.md, plan.md y tasks.md de specs/005-globo y pásalos por el subagente guardian-alcance (alcance de §8, reglas de §16 y §20.2, pendiente DP-07). Lista los hallazgos por severidad y detente hasta que la persona escriba «apruebo».
```

### P-GLOBO-06 · Implementar departamentos, vuelo, controles y selección
- **Orden:** 32
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-05, P-PROY-07, P-MAPA-06
- **Momento:** Sáb 14:00–20:00
- **Produce:** RF-02, RF-25, RF-28, RF-29 y RF-32
- **Herramientas:** skills `test-driven-development`, `globo-y-mapa`, `flujo-issues-y-pr`; subagente `react-performance-auditor`
- **Verificación:** PS-08 de encuadre, vuelo y controles en verde

```text
[SDD P-GLOBO-06] /speckit-implement Implementa de specs/005-globo el explorador con Bolivia y sus departamentos (RF-02), el vuelo de cámara con movimiento reducido (RF-25, RNF-12), los controles (RF-28), el paso al análisis conservando la selección (RF-29) y la ruta territorial (RF-32), una tarea a la vez y prueba primero (PS-08). CesiumJS se carga diferido (RNF-01). Crea el issue y la rama tipo/N desde dev (skill flujo-issues-y-pr); un commit por tarea con su identificador. Detente al terminar cada historia y muéstrame la evidencia.
```

### P-GLOBO-07 · Implementar huellas, cambio sobre el globo y respaldo 2D
- **Orden:** 37
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-06
- **Momento:** Dom 9:00–14:00 huellas y cambio · Dom 14:00–19:00 respaldo 2D y celular
- **Produce:** RF-26, RF-27 y RF-30
- **Herramientas:** skills `test-driven-development`, `globo-y-mapa`, `responsive-visual-testing`; MCP `playwright`
- **Verificación:** PS-08 de huellas y respaldo en verde; prueba en celular

```text
[SDD P-GLOBO-07] /speckit-implement Implementa de specs/005-globo las huellas de las escenas NISAR a partir de footprints.geojson (RF-26), el cambio sobre el globo con leyenda, opacidad y zonas sin dato transparentes (RF-27, RN-13) y el respaldo en el mapa 2D si CesiumJS no inicia (RF-30), una tarea a la vez y prueba primero (PS-08). Prueba el globo en un celular de gama media o en la emulación del MCP playwright (RNF-05, §24). Detente al terminar cada historia y muéstrame la evidencia.
```

### P-GLOBO-08 · Verificar
- **Orden:** 42
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Joaco
- **Revisa:** Angie
- **Depende de:** P-GLOBO-07
- **Momento:** Dom 14:00–19:00
- **Produce:** informe de verificación y PR a dev
- **Herramientas:** subagentes `revisor-interfaz`, `react-performance-auditor`, `uiux-design-auditor`, `revisor-qa`; MCP `playwright`; `npm run codigo:revisar`
- **Verificación:** criterios de §13 y PS-08 con evidencia; revisión de Angie

```text
[SDD P-GLOBO-08] /speckit-converge Compara el código con specs/005-globo y agrega como tareas lo que falte. Verifica con evidencia ejecutada los criterios de §13 de RF-02 y RF-25 a RF-30 y RF-32: prueba del globo (PS-08), accesibilidad y movimiento reducido (PS-07), escritorio y celular con el MCP playwright contra localhost, peso y carga diferida de CesiumJS (RNF-01) y revisor de código vivo (npm run codigo:revisar). Pide revisión a revisor-interfaz, react-performance-auditor y revisor-qa, y la revisión humana de Angie (revisora de M-GLOBO según §19). Con todo en verde, abre la PR a dev con «Closes #N».
```

## 9. Definición de terminado

- [ ] Bolivia encuadrada con sus nueve departamentos y las estaciones, seleccionables.
- [ ] Vuelo, controles, huellas y cambio sobre el globo cumplen su criterio de §13.
- [ ] Al volver del análisis se conserva la selección completa (RF-29); el respaldo 2D funciona (RF-30).
- [ ] CesiumJS diferido, sin token de Cesium ion, con atribución; DP-07 resuelta o configurable.
- [ ] PS-07 y PS-08 en verde; revisado por Angie; sin código muerto.
- [ ] PR a dev fusionada y el historial del SDD registrado.
