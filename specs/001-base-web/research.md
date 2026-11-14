# Research: base web y proveedor visual

**Issue**: #58 · **Fecha**: 2026-11-14 · **Clasificación**: decisiones de diseño, no implementación

## Decisiones

### 1. Aplicación estática con división por ruta

**Decisión**: React + TypeScript estricto + Vite; páginas y visualizaciones mediante `import()`.

**Motivo**: es el stack de §18 y permite que la portada cumpla RNF-01 sin descargar CesiumJS. `React.lazy`
espera una función que usa `import()` y difiere la carga hasta renderizar el componente.

**Alternativas descartadas**: SSR añade infraestructura no aprobada; una única entrada eager descarga el globo
en portada; una librería nueva de routing amplía dependencias sin necesidad para cinco rutas.

### 2. Navegación nativa y estado territorial explícito

**Decisión**: un adaptador pequeño sobre History API para las cinco rutas; la selección territorial está en la
URL y el idioma en contexto persistible.

**Motivo**: permite enlaces recargables y atrás/adelante sin agregar otra dependencia.

### 3. Lectura desconocida → validación → dato tipado

**Decisión**: todo JSON/GeoJSON/CSV entra como `unknown`, se valida con funciones puras y recién entonces se
entrega a las vistas. `AbortController` cancela cargas obsoletas y una caché `Map` deduplica por URL+versión.

**Motivo**: evita que publicaciones incompletas parezcan válidas y resuelve FR-022 sin servidor ni librería de
fetching. Los campos exactos propuestos se acuerdan con M-PUBLICACIÓN antes de codificarlos.

### 4. Cesium detrás de un adaptador, con tres resultados posibles

**Decisión**: `GlobeProvider` expone inicialización, vuelo, selección y destrucción. La resolución produce:

1. CesiumJS sin ion, autorizado por §18;
2. Cesium ion, aprobado en §18 y DP-07 del documento maestro v1.1;
3. mapa/lista 2D accesible cuando WebGL, red, ion o proveedor no estén disponibles.

**Motivo**: los tokens controlan acceso a activos ion y deben restringirse por alcance y URLs. Aislarlo evita
que una decisión de proveedor domine rutas, datos o pruebas.

### 5. Tratamiento del token de ion

**Decisión aprobada**: `VITE_CESIUM_ION_TOKEN` será un token público cliente de solo lectura,
limitado a assets 1/2 y URLs permitidas. Su valor va en `.env` local o variable del hospedaje, nunca en Git.

**Motivo**: Vite sustituye variables `VITE_*` en el bundle; son visibles y no sirven para secretos. Aquí solo
son aceptables para un token deliberadamente público y restringido. Claves de IA quedan fuera del navegador.

### 6. Hospedaje y URLs de producción

**Decisión**: no elegir proveedor ni dominio mientras DP-06 siga abierto. Localmente se permiten
`http://localhost:5173` y `http://127.0.0.1:5173`; la URL productiva se agrega tras cerrar DP-06.

## Fuentes técnicas consultadas

- React. (2026). *lazy*. <https://react.dev/reference/react/lazy>
- Vite. (2026). *Env Variables and Modes*. <https://vite.dev/guide/env-and-mode>
- Cesium GS. (2026). *Cesium ion access tokens*. <https://cesium.com/learn/ion/cesium-ion-access-tokens/>
- Cesium GS. (2026). *Visualizing terrain in CesiumJS*. <https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/>
- Cesium GS. (2026). *Imagery*. <https://cesium.com/learn/cesiumjs-learn/cesiumjs-imagery/>

Las fuentes respaldan decisiones técnicas generales. DP-07 se cerró por acuerdo del equipo en el documento
maestro v1.1; DP-06 continúa pendiente.
