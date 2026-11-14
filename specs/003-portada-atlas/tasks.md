# Tasks: Portada y fichas del atlas de los nueve departamentos

**Input**: `specs/003-portada-atlas/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)
**Issue**: #63 · **Prompt SDD**: P-ATLAS-04 · **Módulo (§19)**: M-ATLAS
**Responsable**: Angie en todas las tareas (reparto de #46, registrado en `sdd/m-atlas.md`); revisan Joaco
(revisor de M-ATLAS, §19) y Marian.

**Tests**: obligatorios. La spec y el prompt piden prueba antes que implementación (PS-03, PS-04, PS-07, PS-09).
Cada prueba se escribe primero y debe fallar antes de implementar.

**Orden de §25**: portada el sábado de 9:00 a 13:00 (US1) y fichas bilingües de 14:00 a 20:00 (US2 a US4). Las
tareas de **texto y fuentes** (marcadas «adelantable») no dependen del código de 001 y se pueden hacer ya; las
de código esperan a P-PROY-07 (Joaco).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes).
- **[Story]**: historia de la spec (US1 a US5).
- Cada tarea indica sus identificadores y su prueba.

## Path Conventions

Estructura de `specs/001-base-web/plan.md`: aplicación en `web/`, atlas en `web/src/features/atlas/`,
diccionarios en `web/src/i18n/`, pruebas en `web/tests/unit/` y `web/tests/e2e/`. Los nombres de las
subcarpetas del atlas son propuesta (plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: confirmar que la base de 001 sirve y que el plan sigue vigente.

- [ ] T001 Revisar `specs/003-portada-atlas/plan.md` contra `specs/001-base-web/` cuando P-PROY-05 esté aprobado y ajustar rutas, contratos y estructura si 001 cambió desde el commit 836345a (plan.md, Delivery Gates) — Resp: Angie — Prueba: diff de 001 sin cambios incompatibles
- [ ] T002 Avisar a Joaco de la diferencia de nombres de campo de `atlas/departments.geojson` entre `specs/001-base-web/data-model.md` y `specs/001-base-web/contracts/published-data.ts` y registrar la resolución en `specs/003-portada-atlas/research.md` (R3) — Resp: Angie — Prueba: R3 con la decisión de 001
- [ ] T003 Crear la carpeta `web/src/features/atlas/` con `content/`, `home/`, `department-list/` y `department-card/` dentro de la app de 001 (plan.md) — Resp: Angie — Prueba: `npm run build` de 001 en verde

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el contenido con fuentes y su validador, que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia empieza sin esta fase.

- [ ] T004 [P] Prueba que falla: validador del contenido rechaza una afirmación sin fuentes ni aviso, una LocalizedText sin `en`, fichas distintas de 9 y un `0` en lugar de un valor ausente, en `web/tests/unit/atlas/atlas-content.validate.test.ts` (data-model.md, RN-03, RN-13, RNF-03; PS-03 extendido a fichas, PS-04) — Resp: Angie
- [ ] T005 [P] Prueba que falla: los 9 fenómenos y conteos de escenas coinciden literalmente con §10.4 (incluido «54–55») en `web/tests/unit/atlas/atlas-content.literal.test.ts` (RF-03, FR-008, R4) — Resp: Angie
- [ ] T006 Copiar el contrato `specs/003-portada-atlas/contracts/atlas-content.ts` a `web/src/features/atlas/content/atlas-content.types.ts`, con el mismo criterio de ausencia que 001 y sin modificar sus contratos (data-model.md) — Resp: Angie — Prueba: `tsc` estricto en verde
- [ ] T007 Implementar el validador en `web/src/features/atlas/content/validate.ts` con el estilo de validación de 001 hasta que T004 pase (data-model.md, reglas 1–7) — Resp: Angie — Prueba: T004 en verde
- [ ] T008 Implementar la carga diferida del contenido en `web/src/features/atlas/content/load.ts`, que solo se importa desde `/explore` (RNF-01, plan.md) — Resp: Angie — Prueba: comprobación de que `/` no importa este módulo; la prueba de red completa es T026, en la fase final

**Checkpoint**: contenido validado y cargable; las historias pueden empezar.

---

## Phase 3: User Story 1 - Entender de qué trata el sitio y entrar al atlas (Priority: P1) 🎯 MVP

**Goal**: la portada explica el problema, NISAR y el uso en menos de un minuto y lleva al atlas en un clic (RF-01, §20.1).

**Independent Test**: abrir `/` en escritorio y a 320 px, pulsar «Explorar Bolivia» y llegar a `/explore`; ninguna solicitud del globo en `/` (quickstart 1–3).

### Tests for User Story 1 ⚠️

- [ ] T009 [P] [US1] Prueba que falla: la portada muestra frase del problema, explicación de NISAR y de uso, cifras con fuente y fecha, imagen o «imagen pendiente» y el botón «Explorar Bolivia», en `web/tests/unit/atlas/home.test.tsx` (FR-001 a FR-005, RN-03; PS-04) — Resp: Angie
- [ ] T010 [P] [US1] Prueba que falla: «Explorar Bolivia» navega a `/explore` en un clic y con teclado, en `web/tests/unit/atlas/home.navigation.test.tsx` (RF-01, FR-003; PS-07) — Resp: Angie

### Implementation for User Story 1

- [ ] T011 [P] [US1] **Adelantable**: redactar en es/en la frase del problema, la explicación de NISAR y la de uso (lectura < 1 min) como claves `home.*` en `web/src/i18n/es.json` y `web/src/i18n/en.json` (RF-01, RNF-03); mientras no exista `web/`, el borrador vive en `specs/003-portada-atlas/contenido/` — Resp: Angie — Prueba: claves iguales en ambos idiomas (RNF-03; PS-03 extendido)
- [ ] T012 [P] [US1] **Adelantable**: cargar en `web/src/features/atlas/content/atlas-content.json` las cifras del problema de §4.2 con su fuente, fecha y método (R6) y la imagen con `status: "pending"` (FR-005, aclaración 1); mientras no exista `web/`, el borrador vive en `specs/003-portada-atlas/contenido/` — Resp: Angie — Prueba: revisión T024 contra §4.2 y §31 ahora; T004 en verde al pasarlo a `web/`
- [ ] T013 [US1] Implementar la portada en `web/src/features/atlas/home/Home.tsx` y conectarla a la página `/` de 001, sin importar el globo ni las fichas, hasta que T009 y T010 pasen (RF-01, RNF-01, RNF-12) — Resp: Angie — Prueba: T009, T010 en verde
- [ ] T014 [US1] Integrar las imágenes cuando el equipo las aporte, con fuente, licencia y texto alternativo es/en; sin ellas, mantener «imagen pendiente» (FR-005, RN-04, RN-12) — Resp: Angie — Prueba: T009 en verde

**Checkpoint**: la portada funciona sola y lleva al explorador.

---

## Phase 4: User Story 2 - Leer la ficha de mi departamento aunque no haya estación (Priority: P1)

**Goal**: nueve fichas con fenómeno, escenas, fuentes y estado (RF-03, HU-07, §10.4).

**Independent Test**: abrir las 9 fichas; La Paz muestra fenómeno, 39 escenas, «Fuente en verificación» y «sin estación disponible» (quickstart 4–6).

### Tests for User Story 2 ⚠️

- [ ] T015 [P] [US2] Prueba que falla: la ficha muestra fenómeno, escenas con origen CMR, fuentes con fecha o «Fuente en verificación», etiqueta + icono «Estación»/«Ficha» y «sin estación disponible» en las 8 sin estación, en `web/tests/unit/atlas/department-card.test.tsx` (RF-03, FR-008 a FR-013, FR-010a; PS-04) — Resp: Angie
- [ ] T016 [P] [US2] Prueba que falla: Cochabamba presenta Tunari como ficha, nunca como estación; Santa Cruz enlaza a su estación o la muestra «no reportada» con motivo, en `web/tests/unit/atlas/department-card.cases.test.tsx` (FR-011, FR-012, RN-13, R7) — Resp: Angie

### Implementation for User Story 2

- [ ] T017 [P] [US2] **Adelantable**: redactar en es/en las 9 fichas en `web/src/features/atlas/content/atlas-content.json` con los valores literales de §10.4, las fuentes de §31 (tabla de fichas de la spec) y «Fuente en verificación» en Pando, La Paz, Tarija y Chuquisaca (RF-03, RN-03, RN-04, RN-05); mientras no exista `web/`, el borrador vive en `specs/003-portada-atlas/contenido/` — Resp: Angie — Prueba: revisión T024 contra §10.4 y §31 ahora; T004 y T005 en verde al pasarlo a `web/`
- [ ] T018 [P] [US2] **Adelantable**: claves de interfaz `atlas.*` («Estación», «Ficha», «sin estación disponible», «Fuente en verificación», «no reportado», «escenas NISAR», origen CMR) en `web/src/i18n/es.json` y `web/src/i18n/en.json` (RNF-03); mientras no exista `web/`, el borrador vive en `specs/003-portada-atlas/contenido/` — Resp: Angie — Prueba: claves iguales en ambos idiomas (RNF-03; PS-03 extendido)
- [ ] T019 [US2] Implementar la ficha en `web/src/features/atlas/department-card/DepartmentCard.tsx` hasta que T015 y T016 pasen; las causas como hipótesis con fuente y los fenómenos como contexto (RN-04, RN-05) — Resp: Angie — Prueba: T015, T016 en verde
- [ ] T020 [US2] Conectar la ficha con `RouteState.department` de 001 para que siga abierta al cambiar de idioma y se abra también desde el globo (M-GLOBO) (FR-024, RNF-03) — Resp: Angie — Prueba: T015 y T016 en verde; el cambio de idioma con la ficha abierta se verifica en T027

**Checkpoint**: las 9 fichas se leen completas en ambos idiomas.

---

## Phase 5: User Story 3 - Encontrar un departamento sin usar el globo (Priority: P2)

**Goal**: lista textual de departamentos y estaciones como alternativa al globo (RNF-04).

**Independent Test**: recorrer la lista solo con teclado y abrir las 9 fichas sin tocar el globo; con el globo caído, la lista sigue (quickstart 7 y 9).

### Tests for User Story 3 ⚠️

- [ ] T021 [P] [US3] Prueba que falla: la lista muestra los 9 departamentos y la estación con etiqueta + icono, se recorre con teclado y foco visible y abre cada ficha, en `web/tests/unit/atlas/department-list.test.tsx` (RNF-04, FR-018, FR-019; PS-07) — Resp: Angie
- [ ] T022 [P] [US3] Prueba que falla: si el globo no carga, `/explore` muestra la lista sola y las fichas siguen abriéndose, en `web/tests/unit/atlas/explore-fallback.test.tsx` (FR-003, aclaración 2) — Resp: Angie

### Implementation for User Story 3

- [ ] T023 [US3] Implementar la lista en `web/src/features/atlas/department-list/DepartmentList.tsx` y montarla en la página `/explore` de 001 junto al globo, hasta que T021 y T022 pasen (RNF-04, FR-003, FR-018) — Resp: Angie — Prueba: T021, T022 en verde

**Checkpoint**: el atlas es usable sin globo.

---

## Phase 6: User Story 4 - Saber de dónde sale cada dato de la ficha (Priority: P2)

**Goal**: cada afirmación con fuente y fecha, o con el aviso «Fuente en verificación» (RN-03, RF-03, §28).

**Independent Test**: revisar las 9 fichas y la portada contra §10.4 y §31: toda afirmación tiene fuente con fecha o aviso.

- [ ] T024 [US4] **Adelantable**: revisión de fuentes con la skill `rigor-y-fuentes` del contenido de portada y fichas en `web/src/features/atlas/content/atlas-content.json`: cada fuente coincide con §31 (cita, enlace, fecha de consulta), las relaciones «propuestas por el equipo» se marcan, la cita de NISAR sigue RN-11 y nada se inventa (RN-03, RN-11, RN-12, §28) — Resp: Angie, con revisión de Marian — Prueba: informe de la revisión sin hallazgos abiertos
- [ ] T025 [US4] Verificar con Marian las fuentes de Pando, La Paz, Tarija y Chuquisaca y, si se confirman, pedir al equipo que las registre en §31 antes de quitar el aviso (FR-009, aclaración 3) — Resp: Angie y Marian — Prueba: §31 actualizado o aviso vigente

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Prueba de red: `/` no solicita recursos del globo ni el contenido de fichas y carga en < 3 s a 10 Mbps, en `web/tests/e2e/atlas.performance.spec.ts` (RNF-01, FR-006) — Resp: Angie
- [ ] T027 [P] E2E: portada → «Explorar Bolivia» → ficha de La Paz en escritorio y a 320 px, en español e inglés, en `web/tests/e2e/atlas.journey.spec.ts` (extensión de PS-09; HU-07, RNF-05, RNF-03) — Resp: Angie
- [ ] T028 [P] Accesibilidad con axe y revisión manual (contraste WCAG 2.2 AA, textos alternativos, movimiento reducido) de portada, lista y fichas, en `web/tests/e2e/atlas.a11y.spec.ts` (RNF-04, RNF-12; PS-07) — Resp: Angie
- [ ] T031 [P] Verificar que el texto de la portada se lee en menos de un minuto: conteo de palabras del texto visible y lectura cronometrada por una persona que no lo conozca (SC-001, RF-01); el umbral de palabras es **propuesta** — Resp: Angie
- [ ] T029 Ejecutar los escenarios de `specs/003-portada-atlas/quickstart.md` y `npm run codigo:revisar` antes de la PR — Resp: Angie — Prueba: todos los escenarios en verde

### Plus (solo si el MVP está terminado)

- [ ] T030 [US5] *(Plus, RF-04)* Calendario de la superficie con fenómeno por mes y región, cada uno con fuente; requiere su propia prueba antes de implementar — Resp: Angie

### Fuera de estas tareas

- Insight desde las fichas: pendiente de consulta con Mimi (FR-023); no se implementa.
- Recalcular escenas o consultar el catálogo desde la web (R4).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 y T003 esperan a que 001 esté implementada (P-PROY-07); T002 se puede hacer ya.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: tras Foundational (portada, sábado 9:00–13:00 en §25).
- **US2, US3 (Phases 4–5)**: tras Foundational; US3 usa la ficha de US2 para abrirla.
- **US4 (Phase 6)**: revisa el contenido de US1 y US2.
- **Polish (Phase 7)**: tras las historias que se entreguen.

### User Story Dependencies

- US1: independiente.
- US2: independiente de US1 (se llega por `/explore` directo).
- US3: abre las fichas de US2.
- US4: revisa el contenido de US1 y US2.
- US5 (Plus): independiente, al final.

### Within Each User Story

- Prueba primero, que falle; luego contenido y textos; luego componente; luego conexión con 001.

### Parallel Opportunities

- **Ya, sin código de 001** (adelantables): T002, T011, T012, T017, T018, T024, T025.
- En Foundational: T004 y T005 en paralelo.
- Dentro de cada historia: las pruebas [P] en paralelo; T011/T012 y T017/T018 en paralelo.

---

## Parallel Example: User Story 1

```text
T009 Prueba de la portada                 (web/tests/unit/atlas/home.test.tsx)
T010 Prueba de navegación                 (web/tests/unit/atlas/home.navigation.test.tsx)
T011 Textos home.* es/en                  (web/src/i18n/es.json, en.json)
T012 Cifras de §4.2 e imagen pendiente    (web/src/features/atlas/content/atlas-content.json)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Adelantar ahora los textos y fuentes (T011, T012, T017, T018, T024).
2. Cuando 001 esté lista: Setup y Foundational.
3. US1 (portada) → validar con quickstart 1–3.

### Incremental Delivery

US1 portada → US2 fichas → US3 lista → US4 revisión de fuentes → Polish; cada paso se valida solo.

### Parallel Team Strategy

Angie implementa (reparto de #46); Marian revisa las fuentes (T024, T025) y las PR; Joaco revisa como revisor
de M-ATLAS y resuelve R3 en 001.

---

## Notes

- Un commit por tarea con su identificador y `#N` del issue de implementación (P-ATLAS-06).
- Ninguna fuente inventada: lo no verificado conserva «Fuente en verificación».
- Insight en fichas y calendario Plus quedan fuera del MVP.
