<!--
Sync Impact Report
- Versión: 1.0.0 → 1.1.0 (DP-07 cerrada y política de token público de Cesium ion)
- Principios: se definen I a VII (la plantilla traía 5 marcadores genéricos)
  I. Documento maestro primero · II. Mostrar con honestidad · III. Arquitectura estática primero ·
  IV. Bilingüe y accesible · V. Rendimiento · VI. Seguridad y costo · VII. Trazabilidad
- Secciones añadidas: Restricciones técnicas y de licencia · Flujo de desarrollo y calidad · Gobernanza
- Secciones eliminadas: ninguna
- Plantillas (.specify/templates/*): no se modifican; leen esta constitución al ejecutarse.
- Pendientes:
  - La ratificación del equipo: P-PROY-01 la ejecuta «Equipo» (§19). Esta versión la lanzó Marian en el
    issue #42 y no se considera ratificada por todo el equipo hasta que Joaco, Angie y Mimi la revisen
    en la PR.
  - «TypeScript estricto» es una convención del equipo (prompt P-PROY-01); §18 solo dice TypeScript.
- DP-07 se cerró el 14 de noviembre de 2026 en el documento maestro v1.1: Cesium ion usa assets 1 y 2 con
  token público `assets:read` restringido; los respaldos sin ion y 2D siguen siendo obligatorios.
- Corrección frente al prompt: en el documento, RNF-02 es el peso de los archivos de vista (< 40 MB)
  y la carga diferida de CesiumJS es parte de RNF-01. Prevalece el documento.
-->

# Constitución del frontend de UraqiVision

Este repositorio es **solo la web** de UraqiVision. El pipeline en Python y la función Insight viven en el
repositorio `UraqiVisionBack`. La fuente de verdad es `docs/UraqiVisionDocumentoMaestrov1.1.pdf`
(copia para búsquedas: `docs/UraqiVisionDocumentoMaestrov1.1.txt`). Si esta constitución contradice al
documento maestro, **prevalece el documento** (§1, §28), y es esta constitución la que se corrige.

## Core Principles

### I. Documento maestro primero

- Toda spec, plan, tarea y cambio de código MUST quedar dentro del alcance aprobado de §8 y de las
  prioridades de §13 (MVP antes que Plus; lo Futuro no se implementa).
- Nada fuera del MVP (§8.2 incluido) se agrega sin consultar al equipo.
- Las decisiones pendientes DP-01 a DP-08 (§29) MUST NOT implementarse ni darse por resueltas hasta que
  su responsable las cierre. Lo que dependa de ellas se marca como **pendiente**.
- Lo que no está en el documento **no está decidido**. Toda afirmación se clasifica como hecho
  verificado (con fuente y fecha), propuesta de diseño, hipótesis o pendiente.
- No se reabren decisiones ya tomadas, como el globo con CesiumJS, salvo que el equipo lo pida.

Razón: el reto se evalúa sobre un alcance concreto y el tiempo del hackathon (§25) no admite desvíos.

### II. Mostrar con honestidad (NO NEGOCIABLE)

La web MUST cumplir estas reglas de §16 en cada pantalla, descarga y texto:

- **RN-03**: cada cifra muestra su fuente, su fecha y su método.
- **RN-04**: no se muestran datos simulados ni ejemplos como si fueran resultados. Los datos de prueba
  viven solo en las pruebas.
- **RN-05**: las causas del cambio se presentan como hipótesis con fuente, nunca como certeza.
- **RN-06**: las hectáreas se informan con su rango de sensibilidad.
- **RN-07**: las fechas son las de adquisición del satélite, en UTC, y se muestran en hora de Bolivia.
- **RN-13**: la ausencia de dato nunca se muestra como cero. Una métrica que no se pudo calcular aparece
  como «no reportada», con su motivo.

No se inventan datos, cifras, fechas, fuentes, autores, DOI, endpoints ni resultados (§28). Las
referencias son las de §31.

Razón: el usuario principal son los gestores de áreas protegidas y territorios indígenas, que toman
decisiones con lo que la web muestra.

### III. Arquitectura estática primero

- La web solo **lee** los archivos publicados de cada estación (§17.3: `station.json`, `manifest.json`,
  `change.tif`, `views/*`, `scars.geojson`, `hectares.csv`, `validation.json`, `quality.json`,
  `footprints.geojson` y `atlas/departments.geojson`), y llama a Insight solo por su contrato
  (§21.1: `POST /api/insight` con `station_id`, `question` y `lang`).
- La web MUST NOT recalcular resultados que ya vienen publicados; sus cifras coinciden con esos archivos
  (RF-09, RF-37).
- Cambiar el stack de §18 (React, TypeScript, Vite, CesiumJS con Cesium ion restringido y respaldos sin ion/2D,
  MapLibre GL JS, Recharts,
  react-i18next), un formato de archivo o el contrato de Insight requiere acordarlo con el backend y con
  el equipo, y registrarlo en el documento maestro antes de implementarlo.
- Las reglas del pipeline (RN-01, RN-02, promedio lineal antes que dB, COG sin pérdida) pertenecen a
  `UraqiVisionBack`. Una tarea de backend se deriva allí, no se implementa aquí.

Razón: un sitio estático es barato, rápido y verificable. Separar mostrar de calcular evita que la web y
el pipeline den cifras distintas.

### IV. Bilingüe y accesible

- **RNF-03**: el 100 % de los textos de interfaz y contenidos están en español e inglés (`es.json` y
  `en.json`). Ningún texto visible va escrito directamente en el código.
- **RNF-04**: la web se puede recorrer entera con el teclado y con el foco visible, cumple el contraste
  WCAG 2.2 AA, tiene textos alternativos e incluye una lista textual de departamentos y estaciones como
  alternativa al globo.
- **RNF-12**: el vuelo de cámara y las animaciones respetan la preferencia del sistema de reducir
  movimiento.

Razón: el público es bilingüe y debe poder usar la web en cualquier dispositivo y condición.

### V. Rendimiento

- **RNF-01**: la portada carga en menos de 3 s con una conexión de 10 Mbps. CesiumJS se carga solo al
  entrar al explorador.
- **RNF-02**: los archivos de vista de una estación pesan menos de 40 MB en total.
- **RNF-05**: la web funciona en las dos últimas versiones de Chrome, Firefox, Edge y Safari. En el
  celular, el globo, el mapa y los paneles son usables.

Razón: se usa en campo, con conexiones limitadas y en el celular.

### VI. Seguridad y costo

- **RNF-06**: la clave del proveedor de IA nunca llega al navegador ni al repositorio. Ninguna clave privada,
  token con escritura ni credencial aparece en el código, los commits, los prompts ni los argumentos de herramientas.
- El token público de Cesium ion puede llegar al navegador únicamente con `assets:read`, restringido a los assets
  1 y 2 y a las URLs autorizadas. Su valor vive en el entorno local o del hospedaje y nunca se documenta ni versiona.
- Las variables de entorno se reducen a `.env`, que es local y nunca se sube, y `.env.example`, que se
  sube sin valores sensibles.
- **RNF-10**: todo el stack funciona en planes gratuitos, salvo el consumo del proveedor de IA. El
  hospedaje sigue pendiente (DP-06) y no se elige aquí.

Razón: es un proyecto de hackathon sin presupuesto, con un servicio de IA que no debe exponerse.

### VII. Trazabilidad

- Cada spec, tarea, prueba, commit y PR MUST citar los identificadores del documento que resuelve (RF,
  RNF, RN, MC, CQ, VC, PS) y su issue.
- Los commits siguen Conventional Commits:
  `tipo(alcance): descripción en minúscula (IDENTIFICADORES) #N`.
- Cada tarea tiene un responsable humano según §19. Apoyar el módulo de otra persona se avisa y se anota
  en el issue y en la PR.
- La entrega declara dónde y cómo se usó IA.

Razón: con seis personas en dos repositorios y 39 horas, solo la trazabilidad permite saber qué cumple
cada requisito.

## Restricciones técnicas y de licencia

- Lenguaje: TypeScript en modo `strict`, por convención del equipo (§18 fija TypeScript, no el modo).
- Pruebas: Vitest para unidades y componentes, Playwright para el recorrido en el navegador. CesiumJS y
  MapLibre se sustituyen por dobles en jsdom.
- Licencias (RNF-11): el código es MIT y los textos y datos derivados son CC BY 4.0, con sus archivos
  LICENSE en el repositorio. Las atribuciones de datos y librerías aparecen en Acerca de (RF-24).
- Sin marcas ni logos de la NASA en contenido generado con IA (RN-12).

## Flujo de desarrollo y calidad

- Git: issue → rama `tipo/N-descripcion` desde `dev` → PR a `dev` con `Closes #N` → PR `dev → qa` →
  PR `qa → main`. Nunca se hace commit, push ni merge directo en `main`, `qa` ni `dev`. Nunca se usa
  `--force`, `reset --hard` ni `--no-verify`. Las ramas no se borran.
- Se trabaja una tarea a la vez, con la prueba antes de la implementación. Nada se da por terminado sin
  ejecutar su verificación en ese momento.
- Commits sin `Co-Authored-By` de asistentes de IA. Un commit por tema.
- Código vivo: nada desconectado, muerto, a medias o con datos simulados llega a `qa` ni a `main`.
- Spec Kit: constitución → spec → aclaraciones → plan → tareas → análisis → implementación →
  verificación, con los prompts de `sdd/` y su historial en `sdd/historial/`.

## Governance

- Jerarquía: documento maestro > esta constitución > specs, planes y tareas de `specs/` > código.
  Ante un conflicto se corrige el documento subordinado, nunca el maestro.
- Enmiendas: se proponen por issue y PR a `dev` y requieren la revisión del equipo. Cada enmienda
  actualiza el Sync Impact Report y la versión.
- Versionado semántico: MAJOR cuando se elimina o redefine un principio, MINOR cuando se añade un
  principio o sección o se amplía de forma sustancial, PATCH para aclaraciones y redacción.
- Cumplimiento: el análisis de Spec Kit (`/speckit-analyze`), el subagente `guardian-alcance` y los hooks
  del repositorio comprueban esta constitución. Cualquier PR que la incumpla se corrige antes de
  fusionarse.

**Version**: 1.1.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
