# Tasks: interfaz bilingüe, panel, estados, glosario y fuente y calidad (004)

**Input**: `specs/004-interfaz-bilingue/` (spec, plan, research, data-model, contracts, quickstart, contenido, pruebas)
**Prompt SDD**: P-INTERFAZ-04 · **Issue**: #70
**Responsables**: cada tarea termina con su responsable. Por el reparto de #42 es **Marian**, salvo método
(RF-15) y descargas (RF-21, RF-22), que son de **Angie**. Revisa Mimi.

**Tests**: obligatorios, porque la constitución pide una tarea a la vez con su prueba y el prompt pide la prueba
antes que la implementación. Cada prueba cita su PS (§23.3) y sus casos `CP-xx` de `pruebas/casos-de-prueba.md`.

## Format: `[ID] [P?] [Story] Descripción — Responsable`

- **[P]**: se puede hacer en paralelo (otro archivo y sin dependencias pendientes).
- **[Story]**: US1 a US6 de `spec.md`. Las fases siguen el orden de §25.

## Path Conventions

App única en `web/`, definida por 001: `web/src/features/interface/`, `web/src/pages/`, `web/src/i18n/`,
`web/tests/unit/`, `web/tests/e2e/`.

## Dependencias externas (bloquean el inicio)

- **001-base-web** (Joaco), estas tareas: T003 (estructura), T004 (tokens), T011 (máquina `ViewState`), T015 (i18n
  es/en) y T029 (`ViewStatePresenter`). **004 no las duplica: las extiende.**
- **Extensiones de contrato** (`contracts/interface-extensions.ts`): hay que acordarlas con Joaco y Mimi antes de
  T006.

---

## Phase 1: Setup

- [ ] T001 Crear `web/src/features/interface/` con las subcarpetas `panel/`, `hectareas/`, `glosario/`, `idioma/`, `fuente-calidad/`, `formato/` y `descargas/` (esta última vacía y reservada para Angie), según `plan.md` — Marian
- [ ] T002 [P] Crear los datos de prueba con estructura §17.3 y `evidenceMode: "DEMO"` en `web/tests/fixtures/estacion/`: un juego completo, uno limitado (CQ-05), uno sin CQ-05, uno sin Sentinel-2, uno sin rango, uno con un archivo faltante y uno con fecha incompatible (RN-04, PS-04) — Marian

---

## Phase 2: Foundational (bloquea todas las historias)

- [ ] T003 Llevar a una issue o PR conjunta con Joaco y Mimi la propuesta `contracts/interface-extensions.ts` y registrar lo acordado en `specs/004-interfaz-bilingue/contracts/README.md` (RN-05, RN-06, RF-11, RF-37, CQ-05) — Marian
- [ ] T004 [P] Escribir pruebas de `formatearFecha` (hora de Bolivia, UTC−04, es y en; CP-05) y `formatearHectareas` (separadores por idioma; CP-02) en `web/tests/unit/formato.test.ts` (RN-07, PS-04) — Marian
- [ ] T005 [P] Implementar `formatearFecha` y `formatearHectareas` con `Intl` y `timeZone: 'America/La_Paz'` en `web/src/features/interface/formato/formato.ts` (RN-07, FR-004, FR-013) — Marian
- [ ] T006 Añadir los tipos acordados en T003 a `web/src/contracts/` y sus validadores a la capa de datos de 001, sin normalizar ausencias a 0 (RN-13, RF-37) — Marian
- [ ] T007 [P] Escribir pruebas del adaptador `aCifraMostrada`, que convierte `ReportableValue` y controles en `DisplayedFigure` con las marcas `none`, `limited`, `not-reported`, `range-not-reported` y `control-not-reported`, en `web/tests/unit/cifra.test.ts` (FR-009, FR-010, CP-03, CP-13, CP-20, PS-04) — Marian
- [ ] T008 Implementar `aCifraMostrada` en `web/src/features/interface/panel/cifra.ts`, sin umbrales propios (CQ-05, RN-13) — Marian

**Checkpoint**: formatos y marcas probados; las historias pueden empezar.

---

## Phase 3: User Story 1 · Panel de la estación (P1) 🎯 MVP · §25 sábado 9:00–13:00

**Goal**: en un solo panel y en los dos idiomas se ven periodo, órbita, polarización, hectáreas con rango, datos
válidos, validación, advertencias, hipótesis y el enlace al método (RF-33).
**Independent Test**: con el juego completo, el panel muestra los 9 campos y cada cifra coincide con su archivo
(CP-01, CP-04, SC-003).

### Tests for User Story 1

- [ ] T009 [P] [US1] Escribir pruebas del adaptador `aPanelEstacion` (9 campos, rango obligatorio, hipótesis con fuente y clase RN-05, validación limitada con alternativas y métricas no reportadas, `validDataPercent` tal cual) en `web/tests/unit/panel.test.ts` (CP-01, CP-03, CP-06 a CP-08, PS-04) — Marian
- [ ] T010 [P] [US1] Escribir pruebas del componente `PanelEstacion` (procedencia de cada cifra, enlace a `/method`, etiqueta DEMO visible) en `web/tests/unit/PanelEstacion.test.tsx` (CP-04, RN-03, RN-04, PS-03) — Marian

### Implementation for User Story 1

- [ ] T011 [US1] Implementar `aPanelEstacion` en `web/src/features/interface/panel/aPanelEstacion.ts` a partir de `PublishedStationBundle` y sus extensiones (RF-33, FR-001 a FR-007) — Marian
- [ ] T012 [US1] Implementar `PanelEstacion` y `CifraMostrada` (valor, marca con texto o ícono además de color, motivo, fuente, fecha y método) en `web/src/features/interface/panel/PanelEstacion.tsx` (RF-33, RN-03, WCAG 1.4.1) — Marian
- [ ] T013 [US1] Implementar la lista de hipótesis con el aviso «son hipótesis con fuente» y las cuatro clases de RN-05 en `web/src/features/interface/panel/Hipotesis.tsx` (RN-05, FR-005) — Marian
- [ ] T014 [P] [US1] Escribir pruebas del gráfico y la tabla de hectáreas (banda `[mín, máx]`, hueco con `null` y nunca 0, tabla alternativa con los mismos datos) en `web/tests/unit/Hectareas.test.tsx` (RN-06, RN-13, CP-02, CP-03, PS-04) — Marian
- [ ] T015 [US1] Implementar `GraficoHectareas` (Recharts `ComposedChart` con `Area` de rango, `Line` e `isAnimationActive="auto"`) y `TablaHectareas` en `web/src/features/interface/hectareas/` (RN-06, RNF-12, R4) — Marian
- [ ] T016 [US1] Reservar en `PanelEstacion` el espacio de las descargas, un contenedor `descargas/` sin lógica, para que Angie lo complete sin tocar el panel (RF-21, RF-22) — Marian
- [ ] T017 [US1] Añadir las claves `panel.*`, `validacion.*`, `clase.*` y `marca.*` de `contenido/textos-interfaz.md` a `web/src/i18n/es.json` y `web/src/i18n/en.json` (RNF-03) — Marian

**Checkpoint**: US1 funciona sola con los datos de prueba.

---

## Phase 4: User Story 2 · Estados de la vista (P1) · §25 sábado 14:00–20:00

**Goal**: siempre se muestra uno de los seis estados con su mensaje en los dos idiomas, sin pantallas vacías ni
ceros, con anuncio y foco correctos (RF-34, FR-008, FR-008a). Se **extiende** el `ViewStatePresenter` de 001
(T029) y no se crea otro.
**Independent Test**: cada juego de prueba lleva al estado correcto; el reintento devuelve el foco
(CP-10 a CP-20).

### Tests for User Story 2

- [ ] T018 [P] [US2] Escribir pruebas de los seis estados con los datos de prueba (mensaje es/en, «datos limitados» desde CQ-05, «control de calidad no reportado», «sin datos» con motivo, «fecha incompatible») en `web/tests/unit/estados.test.tsx` (CP-10 a CP-15, CP-20, PS-04) — Marian
- [ ] T019 [P] [US2] Escribir pruebas de accesibilidad de los estados: región viva educada, alerta para el error, anuncio de descargas, foco tras reintentar con éxito o con fallo, y reintento por teclado (CP-16 a CP-19, PS-07) en `web/tests/unit/estados-a11y.test.tsx` — Marian

### Implementation for User Story 2

- [ ] T020 [US2] Extender `web/src/app/ViewStatePresenter.tsx` (de 001) con los mensajes, marcas y motivos de `contenido/textos-interfaz.md` §1–2, sin depender del mapa ni del globo (RF-34, FR-011) — Marian
- [ ] T021 [US2] Implementar la gestión del foco tras «reintentar» y los anuncios (educado y alerta) en `web/src/app/ViewStatePresenter.tsx` (FR-008a, WCAG 4.1.3) — Marian
- [ ] T022 [US2] Implementar el indicador estático de «cargando» con movimiento reducido en `web/src/styles/global.css` y en el presentador (FR-024, RNF-12, CP-64) — Marian
- [ ] T023 [US2] Añadir las claves `estado.*` y `marca.*` restantes a `web/src/i18n/es.json` y `en.json` (RNF-03) — Marian

**Checkpoint**: US1 y US2 funcionan; el mapa y el globo ya pueden reutilizar los estados.

---

## Phase 5: User Story 3 · Glosario e idioma (P2) · §25 sábado 20:00–24:00

**Goal**: cambio es/en sin recargar y con el 100 % traducido; glosario de los 21 términos de §30 accesible con
ratón, tacto y teclado (RF-19, RF-20).
**Independent Test**: CP-30 a CP-34 y CP-40 a CP-44.

### Tests for User Story 3

- [ ] T024 [P] [US3] Escribir pruebas del selector de idioma: `lang` del documento, foco que se queda en el selector, nombre accesible, carga diferida de `en.json` y conservación de la vista (CP-31, CP-34, PS-04, PS-07) en `web/tests/unit/idioma.test.tsx` — Marian
- [ ] T025 [P] [US3] Escribir pruebas del glosario: los 21 términos con es y en, apertura con ratón, tacto y teclado, cierre con Escape, botón «cerrar» ≥ 24 px o toque fuera, foco de vuelta al término y WCAG 1.4.13 (CP-40 a CP-44, PS-07) en `web/tests/unit/glosario.test.tsx` — Marian
- [ ] T026 [P] [US3] Escribir la prueba E2E del cambio a inglés en la estación sin recarga y sin textos en español (CP-30, CP-33, SC-001, SC-007) en `web/tests/e2e/idioma.spec.ts` — Marian

### Implementation for User Story 3

- [ ] T027 [US3] Implementar `SelectorIdioma` y la sincronización de `document.documentElement.lang` y `RouteState.lang`, con `import()` de `en.json` la primera vez (`addResourceBundle`), en `web/src/features/interface/idioma/` (RF-20, FR-012a, R1, R2) — Marian
- [ ] T028 [US3] Pasar los 21 términos de `contenido/glosario.md` a `web/src/i18n/es.json` y `en.json` bajo `glosario.terminos.*`, después de que Mimi revise las traducciones (RF-19, RNF-03) — Marian
- [ ] T029 [US3] Implementar `TerminoGlosario` (botón con nombre accesible) y `DefinicionGlosario` (no modal, persistente, «cerrar» ≥ 24 px) en `web/src/features/interface/glosario/` (RF-19, FR-014a) — Marian
- [ ] T030 [US3] Marcar con `TerminoGlosario` los términos de §30 que aparecen en `web/src/features/interface/panel/PanelEstacion.tsx`, `web/src/app/ViewStatePresenter.tsx` y `web/src/features/interface/fuente-calidad/` (FR-014) — Marian

**Checkpoint**: US1 a US3 completas en los dos idiomas.

---

## Phase 6: User Story 5 · Fuente y calidad, método y Acerca de (P3) · §25 domingo 9:00–14:00

**Goal**: respaldo de cada cifra (RF-37, RF-15, RF-24).
**Independent Test**: CP-50 a CP-52.

### Tests for User Story 5

- [ ] T031 [P] [US5] Escribir pruebas de `SeccionFuenteCalidad`: escenas, fechas, órbita, producto y madurez, CRID, fuente de validación y fecha de generación, comparados campo a campo con `manifest.json` y `quality.json`, más «no reportado» con su motivo (CP-50, SC-003, PS-04) en `web/tests/unit/FuenteCalidad.test.tsx` — Marian
- [ ] T032 [P] [US5] Escribir la prueba E2E del enlace a Acerca de desde todas las pantallas y la página completa en es y en (CP-51, PS-03) en `web/tests/e2e/acerca.spec.ts` — Marian
- [ ] T033 [P] [US5] Escribir pruebas de `MethodPage`: pipeline, parámetros, versión de datos, límites y madurez PROVISIONAL, enlazada desde cada estación (RF-15, RN-08, PS-03) en `web/tests/unit/MethodPage.test.tsx` — Angie

### Implementation for User Story 5

- [ ] T034 [US5] Implementar `SeccionFuenteCalidad` en `web/src/features/interface/fuente-calidad/` (RF-37, FR-019) — Marian
- [ ] T035 [US5] Implementar `AboutPage` con el contenido revisado de `contenido/acerca-de.md` (equipo y roles, licencias MIT y CC BY 4.0, fuentes) en `web/src/pages/AboutPage.tsx`; la cita de NISAR (RN-11) y la declaración de IA (DP-02) quedan como pendientes visibles hasta resolverse (RF-24, RNF-11, RN-12) — Marian
- [ ] T036 [US5] Implementar `MethodPage` en `web/src/pages/MethodPage.tsx` con los textos de método en es y en (RF-15, RN-08; RF-15 sin módulo en §19, asignado a Angie en #42) — Angie

---

## Phase 7: User Story 4 · Descargas (P2) · §25 domingo 9:00–14:00 · Angie

**Goal**: CSV de hectáreas y PNG del mapa con créditos (RF-21); archivos publicados tal cual (RF-22).
**Independent Test**: CSV con cifras idénticas e ISO UTC; archivos de datos idénticos byte a byte (SC-004).
**Dependencia**: el PNG necesita acordar con Joaco cómo se exporta el lienzo del mapa (R7).

### Tests for User Story 4

- [ ] T037 [P] [US4] Escribir pruebas del generador de CSV: encabezado de créditos (FR-016a), ISO 8601 UTC, punto decimal, rango y fuente, independiente del idioma (HU-02, RN-06, PS-04) en `web/tests/unit/csv.test.ts` — Angie
- [ ] T038 [P] [US4] Escribir pruebas de los enlaces RF-22 (URL publicada sin transformar y archivo faltante «no disponible», alcanzable con teclado y con motivo) en `web/tests/unit/descargas.test.tsx` (FR-017, FR-018, PS-07) — Angie

### Implementation for User Story 4

- [ ] T039 [US4] Implementar `generarCsvHectareas` en `web/src/features/interface/descargas/csv.ts` (RF-21, FR-015, FR-016a) — Angie
- [ ] T040 [US4] Implementar los enlaces de descarga RF-22 y el estado «no disponible» en `web/src/features/interface/descargas/Descargas.tsx`, dentro del espacio de T016 (RF-22, FR-017, FR-018) — Angie
- [ ] T041 [US4] Implementar la exportación PNG (imagen del mapa más leyenda, unidades, órbita, polarización, trama sin dato y créditos en el idioma activo) en `web/src/features/interface/descargas/png.ts`, según lo acordado con Joaco (RF-21, FR-016, §20) — Angie

---

## Phase 8: User Story 5b · Celular en campo (P2)

**Independent Test**: CP-63 y SC-009.

- [ ] T042 [P] [US5b] Escribir la prueba E2E a 320 px y con 200 % de zoom (panel, estados, glosario y descargas sin desplazamiento horizontal) en `web/tests/e2e/celular.spec.ts` (RNF-05, WCAG 1.4.10, PS-07) — Marian
- [ ] T043 [US5b] Ajustar los estilos del panel y del glosario para 320 px, con objetivos táctiles ≥ 24 px y el contraste propuesto de R8, en `web/src/features/interface/**/*.css` y `web/src/styles/tokens.css` (RNF-05, §20.2) — Marian

---

## Phase 9: User Story 6 · Plus (P4) · solo si sobra tiempo (§13)

- [ ] T044 [P] [US6] Enlace directo que reproduce el departamento o la estación, con fecha y vista, sobre `RouteState` de 001, en `web/src/features/interface/idioma/enlaceDirecto.ts` (RF-23, Plus) — Marian
- [ ] T045 [P] [US6] Hoja de estilos de impresión de la estación (mapa, cifras, fuentes y límites) en `web/src/styles/print.css` (RF-31, Plus) — Marian

---

## Phase 10: Polish & Cross-Cutting

- [ ] T046 [P] Escribir la prueba de paridad de claves `es.json` y `en.json` para las claves de 004 (CP-32, SC-001, PS-04) en `web/tests/unit/i18n-004.test.ts` — Marian
- [ ] T047 Ejecutar la revisión automática de accesibilidad en cada pantalla y estado de 004, con 0 violaciones serias o críticas (CP-60, SC-006, PS-07) en `web/tests/e2e/a11y-004.spec.ts` — Marian
- [ ] T048 [P] Escribir la prueba de movimiento reducido en todos los estados (CP-64, SC-010, PS-07) en `web/tests/e2e/movimiento.spec.ts` — Marian
- [ ] T049 Validar los 10 escenarios de `quickstart.md` y registrar la evidencia (salida de Vitest, Playwright y del informe de accesibilidad) en `specs/004-interfaz-bilingue/pruebas/evidencia.md` — Marian
- [ ] T050 Pedir la revisión de `revisor-interfaz`, `revisor-qa` y Mimi antes de pasar a P-INTERFAZ-08, y anotar sus hallazgos en `specs/004-interfaz-bilingue/pruebas/evidencia.md` — Marian

---

## Dependencies & Execution Order

- **001 (Joaco)** → Setup (T001, T002) → **Foundational (T003 a T008)** → historias.
- **US1 (T009 a T017)** y **US2 (T018 a T023)** son P1 y pueden ir en paralelo después de Foundational. El orden de
  §25 pone primero el panel.
- **US3 (T024 a T030)**: después de Foundational. T028 espera la revisión de las traducciones por Mimi. T030 usa
  US1 y US2.
- **US5 (T031 a T036)**: después de Foundational. La parte de Angie (T033, T036) es independiente de la de Marian.
- **US4 (T037 a T041)**: después de T016 (espacio reservado). T041 espera el acuerdo con Joaco sobre el lienzo.
- **US5b**: después de US1 a US3. **US6**: solo con tiempo.
- **Polish**: al final.

## Parallel Opportunities

- Foundational: T004 ∥ T005 ∥ T007 (archivos distintos).
- US1: T009 ∥ T010 ∥ T014. US2: T018 ∥ T019. US3: T024 ∥ T025 ∥ T026.
- **Marian ∥ Angie el domingo**: US5 de Marian (T031, T032, T034, T035) en paralelo con US5 y US4 de Angie (T033,
  T036 y T037 a T041).

## Implementation Strategy

1. **MVP**: Foundational y US1 (panel) y US2 (estados). Es lo que la demo necesita primero (§26).
2. Luego US3 (idioma y glosario), que es lo que pide HU-06.
3. El domingo: US5 (Marian y Angie) y US4 (Angie) en paralelo.
4. US5b y Polish antes de P-INTERFAZ-08. US6 solo si sobra tiempo.
