---
description: "Tareas de implementación de la base web navegable y confiable"
---

# Tasks: Base web navegable y confiable

**Input**: Artefactos de diseño de `specs/001-base-web/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/` y `quickstart.md`

**Tests**: Vitest y React Testing Library cubren contratos, estados, accesibilidad y componentes (PS-04). Playwright cubre el recorrido, teclado, móvil y respaldos (PS-07 a PS-09). Las tareas de prueba se escriben antes de su implementación.

**Organization**: Las tareas se agrupan por historia de usuario para poder entregar y comprobar cada incremento de forma independiente. Los campos de contratos que exceden §17.3 y §21.1 son propuestas hasta acordarlas con M-PUBLICACIÓN.

## Path Conventions

- Aplicación: `web/`
- Código: `web/src/`
- Pruebas unitarias e integración: `web/tests/`
- Pruebas de recorrido: `web/tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear el proyecto web estático sin cargar visualizaciones pesadas en la portada.

- [X] T001 Crear `web/` con React, TypeScript estricto y Vite en `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts` e `web/index.html` (RNF-01, RNF-05).
- [X] T002 Configurar scripts de desarrollo, build, preview, Vitest y Playwright en `web/package.json` (PS-04, PS-07, PS-09).
- [X] T003 [P] Configurar la estructura inicial de `web/src/app/`, `web/src/pages/`, `web/src/data/`, `web/src/contracts/`, `web/src/i18n/`, `web/src/styles/` y `web/src/test/` según `plan.md`.
- [X] T004 [P] Configurar tokens CSS, foco visible y la regla global de movimiento reducido en `web/src/styles/tokens.css` y `web/src/styles/global.css` (RNF-04, RNF-12).
- [ ] T005 [P] Declarar solo `VITE_CESIUM_ION_TOKEN=` en `web/.env.example`; ejecutar `npm run env:sync` y pedir a la persona que introduzca el valor localmente, sin leer ni modificar `web/.env` (RNF-06, DP-07).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establecer los contratos, la navegación y las garantías transversales que bloquean todas las historias.

- [ ] T006 [P] Copiar y adaptar los contratos propuestos de publicación en `web/src/contracts/published-data.ts`, conservando `REAL | DEMO`, procedencia, UTC y ausencia distinta de cero (RN-03, RN-04, RN-07, RN-13).
- [ ] T007 [P] Copiar y adaptar los contratos de Insight y de estado de vista en `web/src/contracts/insight.ts` y `web/src/contracts/view-state.ts`, sin cambiar `POST /api/insight` ni implementar backend (RF-34, §21.1).
- [ ] T008 [P] Escribir pruebas de validación para IDs, UTC, campos obligatorios, coherencia de publicación y ausencia frente a cero en `web/tests/unit/contracts.test.ts` (RN-13, PS-04).
- [ ] T009 Implementar validadores puros desde `unknown` en `web/src/data/validatePublishedData.ts` para que datos inválidos produzcan un estado controlado y no resultados parciales (FR-004 a FR-006, FR-010).
- [ ] T010 [P] Escribir pruebas de la máquina de estados, reintento, cancelación y respuestas tardías en `web/tests/unit/viewState.test.ts` (RF-34, RN-13, PS-04).
- [ ] T011 Implementar la máquina de los seis estados RF-34 y el control de solicitudes vigentes en `web/src/data/viewState.ts` (RF-34, FR-007 a FR-010, FR-022).
- [ ] T012 [P] Escribir pruebas del analizador y serializador de rutas recargables en `web/tests/unit/routes.test.ts` (§20.1, RF-29).
- [ ] T013 Implementar el adaptador History API y el estado territorial de URL en `web/src/app/router.ts` y `web/src/app/routeState.ts` (FR-001, FR-002, RF-29).
- [ ] T014 [P] Escribir pruebas de paridad de diccionarios, persistencia de idioma y cambio sin recarga en `web/tests/unit/i18n.test.ts` (RF-20, RNF-03, PS-04).
- [ ] T015 Implementar i18n español/inglés, detección de claves faltantes y persistencia segura de preferencia en `web/src/i18n/index.ts`, `web/src/i18n/es.json` y `web/src/i18n/en.json` (RF-20, RNF-03).
- [ ] T016 Configurar el shell de la aplicación, navegación semántica y región de anuncios de estados en `web/src/app/App.tsx` y `web/src/app/AppShell.tsx` (RNF-04, RF-34).

**Checkpoint**: La base de contratos, rutas, idiomas y estados está lista antes de implementar una historia.

---

## Phase 3: User Story 1 - Recorrer UraqiVision de principio a fin (Priority: P1)

**Goal**: Navegar entre portada, explorador, estación, Método y Acerca de mediante rutas reales y recargables.

**Independent Test**: Desde la portada se alcanzan todos los destinos, se conserva una estación en la URL y ningún destino muestra una pantalla vacía.

- [ ] T017 [P] [US1] Escribir pruebas de componentes para navegación, recarga de ruta y estados de destinos aún no implementados en `web/tests/integration/navigation.test.tsx` (FR-001 a FR-003, PS-04).
- [ ] T018 [P] [US1] Escribir recorrido Playwright de portada, explorador, estación, Método y Acerca de en `web/tests/e2e/navigation.spec.ts` (§20.1, PS-09).
- [ ] T019 [US1] Implementar la página de portada y el enlace «Explorar Bolivia» en `web/src/pages/HomePage.tsx` (RF-01, FR-001).
- [ ] T020 [US1] Implementar el destino diferido del explorador y su estado explícito en `web/src/pages/ExplorePage.tsx` (FR-003, RNF-01).
- [ ] T021 [US1] Implementar la ruta y destino de estación que conserva `stationId` en `web/src/pages/StationPage.tsx` (FR-002, RF-29).
- [ ] T022 [P] [US1] Implementar las páginas reales y accesibles de Método y Acerca de en `web/src/pages/MethodPage.tsx` y `web/src/pages/AboutPage.tsx` (FR-001, RNF-04).
- [ ] T023 [US1] Conectar los destinos con el router en `web/src/app/AppRoutes.tsx` y verificar atrás/adelante (FR-001, FR-002).

**Checkpoint**: El recorrido base es navegable sin depender aún de CesiumJS, MapLibre ni datos publicados.

---

## Phase 4: User Story 2 - Abrir datos publicados sin conclusiones engañosas (Priority: P1)

**Goal**: Cargar publicaciones verificadas y comunicar uno de los seis estados honestos de RF-34.

**Independent Test**: Juegos completos, limitados, ausentes, incompatibles, inválidos y DEMO terminan en un estado y mensaje correctos, con reintento y sin sustituir ausencias por cero.

- [ ] T024 [P] [US2] Crear fixtures completos, limitados, ausentes, incompatibles, inválidos y DEMO en `web/tests/fixtures/published-data/` (RN-04, RN-13, PS-04).
- [ ] T025 [P] [US2] Escribir pruebas de carga, caché, `AbortController`, reintento y validación de todos los artefactos en `web/tests/integration/publicationRepository.test.ts` (RF-34, FR-004 a FR-012, FR-022).
- [ ] T026 [P] [US2] Escribir pruebas del etiquetado visible REAL/DEMO, ausencias y estados anunciables en `web/tests/integration/viewStatePresenter.test.tsx` (RN-04, RN-13, PS-04).
- [ ] T027 [US2] Implementar lectura estática, caché por URL y cancelación de cargas en `web/src/data/publicationRepository.ts` (FR-004 a FR-006, FR-022).
- [ ] T028 [US2] Implementar validación y lectura de `atlas/departments.geojson` en `web/src/data/departmentsRepository.ts` (FR-005, RN-03).
- [ ] T029 [US2] Implementar el presentador bilingüe de estados, ausencias y modo de evidencia en `web/src/app/ViewStatePresenter.tsx` (RF-34, RN-04, RN-13).
- [ ] T030 [US2] Conectar la carga de una estación seleccionada a `StationPage` sin recalcular ni completar datos científicos en `web/src/pages/StationPage.tsx` (FR-021, RF-34).

**Checkpoint**: La aplicación puede consumir publicaciones controladamente y no presenta resultados engañosos.

---

## Phase 5: User Story 3 - Usar toda la base en español o inglés (Priority: P2)

**Goal**: Cambiar todos los textos base y los seis estados entre español e inglés sin recargar ni perder contexto.

**Independent Test**: Al alternar idioma en cada ruta y estado, la ubicación, selección y mensajes permanecen coherentes y sin claves faltantes.

- [ ] T031 [P] [US3] Escribir pruebas de cambio de idioma en rutas y estados de carga/error en `web/tests/integration/languageSwitch.test.tsx` (RF-20, RNF-03, PS-04).
- [ ] T032 [US3] Implementar el selector de idioma accesible y su conexión con el shell en `web/src/app/LanguageSwitcher.tsx` y `web/src/app/AppShell.tsx` (RF-20, RNF-03).
- [ ] T033 [US3] Completar las claves de navegación, páginas, estados, errores y acciones en `web/src/i18n/es.json` y `web/src/i18n/en.json` (RF-20, RNF-03).
- [ ] T034 [US3] Verificar que los mensajes producidos por `ViewStatePresenter` se traduzcan sin alterar estado o selección en `web/src/app/ViewStatePresenter.tsx` (FR-013, FR-014).

**Checkpoint**: La base se puede recorrer completamente en ambos idiomas.

---

## Phase 6: User Story 4 - Navegar con teclado y movimiento reducido (Priority: P2)

**Goal**: Ofrecer teclado, foco, anuncios, alternativa textual y movimiento reducido desde la base común.

**Independent Test**: Sin mouse se navegan acciones y reintento; los estados se anuncian sin mover foco y la alternativa textual permanece utilizable a 320 px con movimiento reducido.

- [ ] T035 [P] [US4] Escribir pruebas de teclado, foco, anuncios ARIA y reintento en `web/tests/integration/accessibility.test.tsx` (RNF-04, RF-34, PS-07).
- [ ] T036 [P] [US4] Escribir pruebas de preferencia reducida y alternativa textual responsive en `web/tests/integration/reducedMotion.test.tsx` (RNF-04, RNF-12, PS-07).
- [ ] T037 [US4] Implementar el hook de preferencia de movimiento reducido en `web/src/app/useReducedMotion.ts` (RNF-12).
- [ ] T038 [US4] Implementar la lista textual navegable de departamentos y estaciones en `web/src/features/globe/TextualExplorerFallback.tsx` (RNF-04, RF-30).
- [ ] T039 [US4] Aplicar foco visible, orden de tabulación, anuncios ARIA y estilos sin animación no esencial en `web/src/app/AppShell.tsx`, `web/src/app/ViewStatePresenter.tsx` y `web/src/styles/global.css` (RNF-04, RNF-12).

**Checkpoint**: La base conserva el recorrido esencial para teclado, lector de pantalla y usuarios con movimiento reducido.

---

## Phase 7: User Story 5 - Entrar rápido y sin exponer credenciales (Priority: P3)

**Goal**: Mantener la portada ligera y preparar el adaptador visual sin que ion, WebGL o sus fallas bloqueen funciones esenciales.

**Independent Test**: La portada no solicita chunks del explorador; el explorador difiere sus proveedores y los respaldos funcionan con ion o WebGL indisponible, sin secretos en bundle o repositorio.

- [ ] T040 [P] [US5] Escribir prueba de red para que la portada no descargue recursos del explorador en `web/tests/e2e/home-performance.spec.ts` (RNF-01).
- [ ] T041 [P] [US5] Escribir pruebas unitarias del selector ion, sin ion y 2D/textual con dobles de WebGL en `web/tests/unit/globeProvider.test.ts` (RF-30, DP-07, PS-08).
- [ ] T042 [P] [US5] Escribir prueba de seguridad de bundle y archivos versionados sin credenciales privadas en `web/tests/integration/secrets.test.ts` (RNF-06, PS-06).
- [ ] T043 [US5] Implementar las fronteras de importación diferida del explorador y proveedores visuales en `web/src/features/globe/lazyGlobe.ts` y `web/src/features/globe/GlobeProvider.ts` (RNF-01, RF-30).
- [ ] T044 [US5] Implementar la configuración de ion restringida a assets 1 y 2, sin serializar ni registrar el token, en `web/src/features/globe/ionProvider.ts` (DP-07, RNF-06).
- [ ] T045 [US5] Implementar proveedor sin ion y selección de respaldo 2D/textual en `web/src/features/globe/fallbackProvider.ts` y `web/src/features/globe/GlobeProvider.ts` (RF-30, RNF-04).
- [ ] T046 [US5] Configurar Vite para separar los recursos de Cesium y verificar atribuciones sin cargarlo desde portada en `web/vite.config.ts` y `web/src/features/globe/GlobeAttribution.tsx` (RNF-01, RNF-11).

**Checkpoint**: La portada permanece independiente del globo y la exploración conserva respaldos obligatorios.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificar el incremento completo antes de pasar a P-PROY-05.

- [ ] T047 [P] Revisar que los contratos en `web/src/contracts/` sigan rotulados como propuesta y acordarlos con M-PUBLICACIÓN antes de estabilizarlos (FR-006, §17.3).
- [ ] T048 [P] Medir portada a 10 Mbps, 320 px y movimiento reducido, y documentar evidencia en `web/tests/e2e/` (RNF-01, RNF-05, RNF-12).
- [ ] T049 Ejecutar `npm test`, `npm run build` y `npm run preview` desde `web/` cuando el proyecto exista y registrar la evidencia de arranque (PS-04, PS-09).
- [ ] T050 Ejecutar `npm run env:check`, `npm run ai:check`, `npm run sdd:validar`, `npm run test:guardas` y `git diff --check` antes de commit (RNF-06, trazabilidad).
- [ ] T051 Ejecutar P-PROY-05 sobre `specs/001-base-web/` y detenerse hasta el «apruebo» antes de implementar (SDD fase 6).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: puede comenzar inmediatamente.
- **Foundational (Phase 2)**: depende del setup y bloquea historias de usuario.
- **US1 y US2 (P1)**: dependen de la fase 2; US2 puede preparar sus fixtures en paralelo, pero conecta a la ruta de estación después de US1.
- **US3 y US4 (P2)**: dependen del shell, i18n y estados de la fase 2; pueden implementarse en paralelo tras su infraestructura.
- **US5 (P3)**: depende del shell, alternativa textual y rutas de las fases anteriores; no habilita aún requisitos específicos de M-GLOBO.
- **Polish (Phase 8)**: depende de las historias deseadas y prepara el análisis P-PROY-05.

### User Story Dependencies

- **US1** entrega las rutas reales y es el primer incremento demostrable.
- **US2** reutiliza ruta, contratos y shell; no altera resultados científicos.
- **US3** reutiliza el proveedor i18n común.
- **US4** reutiliza shell, estados y la alternativa textual; no requiere WebGL.
- **US5** aisla proveedores visuales para M-GLOBO sin sustituir su spec ni sus tareas.

### Parallel Opportunities

- T003, T004 y las tareas de contrato T006 a T008 pueden avanzar en paralelo tras T001 y T002.
- Las pruebas de cada historia marcadas `[P]` se escriben en paralelo antes de sus tareas de implementación.
- US3 y US4 pueden avanzar en paralelo cuando estén disponibles T015, T016 y T029.

## Implementation Strategy

### MVP First

1. Completar setup y fundamento.
2. Entregar US1 con rutas reales y destinos no vacíos.
3. Validar US1 antes de integrar datos, proveedores visuales o módulos especializados.

### Incremental Delivery

1. Añadir US2 para datos y estados honestos.
2. Añadir US3 y US4 para bilingüismo y accesibilidad transversal.
3. Añadir US5 para rendimiento, seguridad y la frontera de proveedores que necesitará M-GLOBO.
4. Ejecutar P-PROY-05; no iniciar P-PROY-06 sin su análisis y aprobación explícita.

## Notes

- `[P]` indica archivos distintos sin dependencia de una tarea incompleta.
- Las tareas de implementación de CesiumJS, huellas, vuelo, selección y cambio en el globo pertenecen a `specs/005-globo` y no se sustituyen aquí.
- DP-06 continúa pendiente: no se configura hospedaje, dominio ni despliegue.
- El valor de `VITE_CESIUM_ION_TOKEN` nunca se lee, imprime, versiona ni incluye en pruebas.
