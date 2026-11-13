---
id: PROYECTO
titulo: Constitución y proyecto web base
tipo: proyecto
prefijo: PROY
spec: specs/001-base-web
---

# SDD · PROYECTO — Constitución y proyecto web base

Primer SDD del frontend: deja la constitución de Spec Kit y la aplicación web vacía pero completa (rutas, idiomas,
estados, lectura tipada de los archivos publicados y pruebas) sobre la que trabajan todas las áreas.

## 1. Ficha

| Campo | Valor |
|---|---|
| Repositorio | `UraqiVision` (frontend) |
| Constitución | Equipo (no tiene responsable en §19: la redacta quien el equipo acuerde y la revisan todos) |
| Proyecto web base | Joaco, según §25 («Antes: proyecto web base, MapLibre primero») |
| Revisión | Marian (base web) · todo el equipo (constitución) |
| Spec | `specs/001-base-web` |
| Momento (§25) | Antes del sábado 14, si las reglas 2026 lo permiten (DP-02) |

## 2. Alcance del documento maestro

- Arquitectura estática primero (§17): la web solo lee los archivos publicados (§17.3) y llama a Insight (§21.1).
- Stack fijado en §18: React, TypeScript y Vite; CesiumJS sin token de Cesium ion; MapLibre GL JS; Recharts;
  react-i18next con `es.json` y `en.json`; Vitest y Playwright. El hospedaje está pendiente (DP-06).
- Recorrido de §20.1: portada → explorador 3D → análisis de la estación → método y Acerca de.
- Base transversal para los requisitos no funcionales: RNF-01 (portada en menos de 3 s, CesiumJS diferido),
  RNF-03 (100 % es/en), RNF-04 (accesibilidad), RNF-05 (navegadores y celular), RNF-06 (sin claves en el
  navegador), RNF-11 (licencias MIT y CC BY 4.0), RNF-12 (movimiento reducido).
- Fuera del MVP (§8.2): áreas dibujadas por el usuario, alertas, cuentas, bases de datos y colas.

## 3. Reglas y decisiones que aplican

- RN-03, RN-04, RN-05, RN-06, RN-07 y RN-13 rigen cómo se muestra todo dato (§16).
- §28: no inventar datos, cifras ni endpoints; separar hecho, propuesta, hipótesis y pendiente.
- Pendientes que no se deciden aquí: DP-06 (hospedaje), DP-07 (mapa base del globo), DP-01 y DP-02 (guías 2026).

## 4. Contratos e integración

- **Consume**: la carpeta publicada de cada estación (§17.3: `station.json`, `manifest.json`, `change.tif`,
  `views/*.webp`, `scars.geojson`, `hectares.csv`, `validation.json`, `quality.json`, `footprints.geojson`) y
  `atlas/departments.geojson`, producidos por M-PUBLICACIÓN en `UraqiVisionBack`.
- **Llama**: `POST /api/insight` (§21.1), con `station_id`, `question` y `lang`.
- **Entrega a las áreas**: tipos de los contratos, capa de datos con los estados de RF-34, i18n, rutas, tokens de
  diseño y pruebas configuradas.

## 5. Calidad: pruebas y aceptación

- PS-04 (Vitest) para la capa de datos y los estados; PS-06 (la clave no aparece en el bundle ni en el repo).
- La app arranca y construye (`npm run build`, `npm run preview`) y el revisor de código vivo no encuentra código
  muerto (`npm run codigo:revisar`).

## 6. Herramientas del repositorio

- Skills: `documento-maestro`, `sdd-uraqivision`, `sdd-prompts`, `react-component-architecture`,
  `typed-api-integration`, `frontend-data-fetching`, `interfaz-bilingue-accesible`, `design-system-tokens`,
  `vite-bundle-optimization`, `frontend-testing`, `test-driven-development`, `devops-secrets-management`.
- Subagentes: `guardian-alcance`, `revisor-qa`, `react-performance-auditor`, `devsecops-engineer`.
- MCP: `context7` (Vite, React, react-i18next).
- Hooks: guardas de secretos y `.env` (RNF-06), post-edit (paridad es/en), pre-commit, código vivo.

**Referencias del documento maestro (§31)**

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Cesium GS (2026). CesiumJS [Software]** — <https://github.com/CesiumGS/cesium>
  Citada en: §18. Aplica a: RF-02, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-24, RNF-11. Usa la documentación vigente (MCP context7) al implementar el globo; muestra su atribución y licencia en el globo y en Acerca de (RF-24, RNF-11).

<!-- referencias:fin -->

## 7. Riesgos y pendientes

- §24: «Dos motores de mapa duplican el trabajo de la web» → una sola capa de datos para el globo y el mapa.
- DP-02: si las reglas 2026 no permiten trabajo previo, estos prompts pasan al sábado a las 9:00.
- DP-06: no configures el despliegue; prepara solo el build estático.

## 8. Secuencia de prompts

### P-PROY-01 · Constitución
- **Orden:** 1
- **Fase:** 1 · Constitución
- **Comando:** speckit-constitution
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** —
- **Momento:** Antes del sábado 14
- **Produce:** .specify/memory/constitution.md
- **Herramientas:** skills `documento-maestro`, `sdd-uraqivision`; subagente `guardian-alcance`
- **Verificación:** la constitución no tiene marcadores de plantilla y cita §8, §16, §17, §18 y §28

```text
[SDD P-PROY-01] /speckit-constitution Crea la constitución del frontend de UraqiVision a partir de docs/UraqiVisionDocumentoMaestrov1.0.pdf (lee la copia .txt), que es la fuente de verdad y prevalece sobre la constitución. Este repositorio es solo la web; el pipeline y la función Insight viven en UraqiVisionBack. Principios: I. Documento maestro primero: nada fuera del alcance de §8 sin consultar; las decisiones pendientes DP-01 a DP-08 de §29 no se implementan hasta resolverse. II. Mostrar con honestidad: RN-03 a RN-07 y RN-13 son obligatorias (cifras con fuente, fecha y método; sin datos simulados como resultados; causas como hipótesis con fuente; hectáreas con rango; fechas de adquisición en UTC mostradas en hora de Bolivia; la ausencia de dato nunca es cero). III. Arquitectura estática primero (§17): la web solo lee los archivos publicados (§17.3) y llama a Insight por su contrato (§21.1); no recalcula resultados; cambiar el stack de §18 o un contrato requiere acordarlo con el backend y registrarlo en el documento. IV. Bilingüe y accesible: RNF-03, RNF-04 y RNF-12 (100 % es/en, WCAG 2.2 AA, movimiento reducido). V. Rendimiento: RNF-01, RNF-02 y RNF-05 (portada en menos de 3 s, CesiumJS diferido, usable en celular). VI. Seguridad y costo: RNF-06 y RNF-10 (ninguna clave en el navegador ni en el repositorio; planes gratuitos). VII. Trazabilidad: cada spec, tarea, prueba y commit cita sus identificadores (RF, RNF, RN, PS) y su issue. Restricciones: TypeScript estricto, Vitest y Playwright, código MIT y textos CC BY 4.0 (RNF-11). Flujo: issue → rama tipo/N desde dev → PR a dev; una tarea a la vez con su prueba; commits sin Co-Authored-By de IA; código vivo (nada desconectado ni muerto).
```

### P-PROY-02 · Especificar el proyecto web base
- **Orden:** 2
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-01
- **Momento:** Antes del sábado 14 (proyecto web base)
- **Produce:** specs/001-base-web/spec.md
- **Herramientas:** skills `documento-maestro`, `typed-api-integration`, `interfaz-bilingue-accesible`
- **Verificación:** cada requisito conserva su identificador; sin librerías en la spec

```text
[SDD P-PROY-02] /speckit-specify Feature 001-base-web (número 001, nombre corto base-web) del frontend de UraqiVision: la aplicación web base sobre la que trabajan todas las áreas. Debe permitir navegar el recorrido de §20.1 (portada, explorador, análisis de una estación, método y Acerca de) con rutas vacías pero reales; leer de forma tipada y validada los archivos publicados de una estación según §17.3 y atlas/departments.geojson, mostrando siempre uno de los estados de RF-34 (cargando, resultado disponible, datos limitados, sin datos, fecha incompatible y error con reintento) y nunca un cero en lugar de un dato ausente (RN-13); cambiar de idioma español/inglés sin recargar con todos los textos en ambos idiomas (RF-20, RNF-03); respetar la preferencia de movimiento reducido (RNF-12); ser navegable por teclado con foco visible (RNF-04); cargar la portada en menos de 3 s dejando el globo para después (RNF-01); no exponer claves (RNF-06). Los datos de ejemplo para desarrollar se distinguen siempre de resultados reales (RN-04). Fuera de alcance: el contenido de cada área (lo especifican sus SDD) y lo de §8.2.
```

### P-PROY-03 · Planificar el proyecto web base
- **Orden:** 3
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-02
- **Momento:** Antes del sábado 14
- **Produce:** specs/001-base-web/plan.md, research.md, data-model.md, contracts/
- **Herramientas:** skills `react-component-architecture`, `vite-bundle-optimization`, `design-system-tokens`; MCP `context7`
- **Verificación:** el plan usa solo el stack de §18 y define los contratos de §17.3 y §21.1 como tipos

```text
[SDD P-PROY-03] /speckit-plan Usa el stack fijado en §18 del documento maestro: React + TypeScript estricto + Vite, react-i18next con es.json y en.json, Vitest con React Testing Library y Playwright; CesiumJS (sin token de Cesium ion) y MapLibre GL JS solo se instalan y se cargan de forma diferida cuando sus áreas los usen. Define en contracts/ los tipos de station.json, manifest.json, quality.json, validation.json, hectares.csv, scars.geojson, footprints.geojson y la solicitud y respuesta de POST /api/insight (§21.1), como propuesta de diseño marcada como tal. Capa de datos con estados de RF-34, cancelación y caché (skill frontend-data-fetching). Estructura de carpetas por área (globo, mapa, atlas, interfaz) con dobles de prueba para CesiumJS y MapLibre. Design tokens con la paleta de cambio de un solo tono y la trama de zonas sin dato (§20.2). Consulta la documentación vigente con el MCP context7. No configures hospedaje (DP-06 pendiente). Marca como hipótesis o pendiente todo lo que el documento no fija.
```

### P-PROY-04 · Tareas del proyecto web base
- **Orden:** 4
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-03
- **Momento:** Antes del sábado 14
- **Produce:** specs/001-base-web/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `frontend-testing`
- **Verificación:** cada tarea con responsable, identificador y prueba

```text
[SDD P-PROY-04] /speckit-tasks Ordena por historia de usuario. Cada tarea lleva su responsable según §19 o §25 del documento maestro (la base web es de Joaco), el identificador que resuelve (RF, RNF, RN) y su prueba de §23.3 (PS-04, PS-06). Prueba antes que implementación. Marca con [P] las paralelizables. Incluye una tarea que compruebe que la app construye y vuelve a levantar (npm run build y npm run preview).
```

### P-PROY-05 · Analizar el proyecto web base
- **Orden:** 5
- **Fase:** 6 · Análisis
- **Comando:** speckit-analyze
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-04
- **Momento:** Antes del sábado 14
- **Produce:** informe de coherencia (⛔ espera «apruebo»)
- **Herramientas:** subagente `guardian-alcance`
- **Verificación:** sin hallazgos críticos; la persona escribe «apruebo»

```text
[SDD P-PROY-05] /speckit-analyze Revisa la coherencia entre spec.md, plan.md y tasks.md de specs/001-base-web y pásalos además por el subagente guardian-alcance (alcance de §8, reglas de §16 y §28, pendientes de §29). Lista los hallazgos por severidad y detente hasta que la persona escriba «apruebo».
```

### P-PROY-06 · Implementar el proyecto web base
- **Orden:** 6
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-05
- **Momento:** Antes del sábado 14, o sábado 9:00 si DP-02 no lo permite
- **Produce:** aplicación web base con pruebas en verde
- **Herramientas:** skills `test-driven-development`, `flujo-issues-y-pr`, `frontend-testing`; hooks de git
- **Verificación:** npm test en verde; npm run build y npm run preview funcionan

```text
[SDD P-PROY-06] /speckit-implement Implementa specs/001-base-web una tarea a la vez, prueba primero (skill test-driven-development). Antes de empezar crea el issue de la feature y su rama tipo/N desde dev (skill flujo-issues-y-pr); un commit por tarea citando su identificador y el issue. Marca cada tarea [X] solo con su prueba en verde. Detente al terminar cada historia de usuario y muéstrame la evidencia (salida de las pruebas). No configures hospedaje (DP-06).
```

### P-PROY-07 · Verificar el proyecto web base
- **Orden:** 7
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Joaco
- **Revisa:** Marian
- **Depende de:** P-PROY-06
- **Momento:** Antes del sábado 14
- **Produce:** informe de verificación y PR a dev
- **Herramientas:** subagentes `revisor-qa`, `react-performance-auditor`, `devsecops-engineer`; `npm run codigo:revisar`
- **Verificación:** cada criterio con evidencia; sin código muerto; PR a dev fusionada

```text
[SDD P-PROY-07] /speckit-converge Compara el código con specs/001-base-web (spec, plan y tareas) y agrega como tareas lo que falte. Después verifica cada criterio de aceptación con evidencia ejecutada: pruebas (npm test), build y arranque (npm run build, npm run preview), revisor de código vivo (npm run codigo:revisar) y que ninguna clave llegue al bundle (PS-06). Pide revisión a los subagentes revisor-qa y react-performance-auditor. Con todo en verde, abre la PR a dev con «Closes #N».
```

## 9. Definición de terminado

- [ ] Constitución sin marcadores de plantilla, aprobada por el equipo.
- [ ] La app navega el recorrido de §20.1 con rutas reales y estados de RF-34.
- [ ] Contratos de §17.3 y §21.1 tipados y marcados como propuesta.
- [ ] Cambio de idioma sin recargar y movimiento reducido respetado.
- [ ] `npm test`, `npm run build` y `npm run preview` en verde; `npm run codigo:revisar` sin errores.
- [ ] PR a dev fusionada y el historial del SDD registrado.
