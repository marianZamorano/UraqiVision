# Implementation Plan: Base web navegable y confiable

**Branch**: `docs/58-plan-base-web-cesium-ion` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

## Summary

Construir una aplicación React + TypeScript estricta + Vite que entregue las cinco rutas de §20.1, una capa
única y validada para los archivos estáticos de §17.3, los seis estados de RF-34, español/inglés, accesibilidad
WCAG 2.2 AA y carga diferida del explorador. DP-07 quedó cerrada en el documento maestro v1.1: el globo usa
Cesium ion con World Terrain (asset 1) y Bing Maps Aerial (asset 2), mediante token público restringido. El
adaptador mantiene una experiencia sin ion y una alternativa textual/2D (RF-30).

## Technical Context

**Language/Version**: TypeScript en modo `strict`; JavaScript ES2022 en navegador

**Primary Dependencies**: React, Vite, CesiumJS, MapLibre GL JS, Recharts y react-i18next (§18). Cesium ion es
el proveedor visual aprobado por DP-07; no se incorpora otra librería en este plan.

**Storage**: archivos estáticos publicados por `UraqiVisionBack`; `localStorage` solo para idioma cuando esté
disponible; sin base de datos, cuentas, colas ni escrituras remotas

**Testing**: Vitest para lógica/componentes y Playwright para el recorrido crítico; dobles de CesiumJS y
MapLibre en jsdom

**Target Platform**: sitio web estático, dos últimas versiones de Chrome, Firefox, Edge y Safari; escritorio y
móvil desde 320 px

**Project Type**: SPA estática con rutas recargables y función Insight externa

**Performance Goals**: contenido útil de portada < 3 s a 10 Mbps; ningún recurso del globo antes de entrar al
explorador; cada vista publicada < 40 MB; abortar solicitudes obsoletas

**Constraints**: bilingüe, teclado/foco visible, movimiento reducido, ningún dato ausente convertido en cero,
ninguna credencial privada en bundle/repositorio, planes gratuitos salvo IA, DP-06 sin resolver

**Scale/Scope**: cinco destinos base, nueve departamentos, estaciones publicadas, seis estados RF-34, dos
idiomas y un contrato externo `POST /api/insight`

## Constitution Check

*GATE: comprobado antes de investigación y nuevamente después del diseño.*

| Principio | Resultado | Evidencia del plan |
|---|---|---|
| I. Documento maestro primero | PASS | DP-07 está cerrada en v1.1; DP-06 permanece pendiente y no se configura hospedaje. |
| II. Mostrar con honestidad | PASS | Contratos conservan procedencia, fechas, método, ausencia y marca REAL/DEMO; la vista no recalcula. |
| III. Arquitectura estática primero | PASS | Solo lectura de §17.3 y llamada a Insight; los campos exactos de contratos se marcan como propuesta. |
| IV. Bilingüe y accesible | PASS | Diccionarios es/en, estados anunciables, teclado, foco y alternativa textual. |
| V. Rendimiento | PASS | división por ruta, importación dinámica de Cesium y presupuesto verificable. |
| VI. Seguridad y costo | PASS | No hay claves privadas. El token público ion será solo lectura, limitado por activos y URL y nunca se versionará. |
| VII. Trazabilidad | PASS | Artefactos citan RF/RN/RNF/PS y issue #58. |

**Revisión posterior al diseño**: los contratos no inventan hechos del producto; sus campos nuevos están
rotulados como propuesta. No hay implementación ni configuración de ion, hospedaje o backend en esta fase.

### Condiciones obligatorias para Cesium ion

La decisión DP-07 está cerrada. La implementación debe cumplir todos estos puntos:

1. El token es **público de navegador**, alcance `assets:read`, solo assets 1 y 2 y URLs permitidas.
2. Su valor vive únicamente en `.env` local o en variables del hospedaje; `.env.example` contiene solo el nombre.
3. Se prueba la ruta sin ion y la alternativa 2D/textual; una cuota, rechazo o indisponibilidad no rompe la app.

Este token no es una credencial privada —el navegador puede observarlo—, pero sí un identificador con cuota y
debe minimizarse. Las claves de IA y cualquier token con permisos de escritura nunca llegan al cliente.

## Project Structure

### Documentation (this feature)

```text
specs/001-base-web/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── published-data.ts
│   ├── insight.ts
│   └── view-state.ts
└── tasks.md                 # fase posterior: /speckit-tasks
```

### Source Code (repository root)

```text
web/
├── index.html
├── package.json
├── vite.config.ts
├── public/
│   └── data/
├── src/
│   ├── app/
│   ├── pages/
│   ├── features/
│   │   ├── globe/
│   │   ├── map/
│   │   ├── atlas/
│   │   └── interface/
│   ├── data/
│   ├── contracts/
│   ├── i18n/
│   ├── styles/
│   └── test/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .env.example
```

**Structure Decision**: una sola aplicación en `web/`, separada de las herramientas de gobierno del repositorio.
Las páginas dependen de contratos y servicios comunes; no importan Cesium directamente. Esto permite reemplazar
el proveedor visual, probar sin WebGL y conservar un recorrido 2D/textual.

## Architecture and Data Flow

1. El router carga inmediatamente el shell y la portada; las otras páginas son módulos diferidos.
2. La ruta conserva `lang`, `department`, `station` y `period`; atrás/adelante usa History API.
3. El repositorio de publicaciones solicita `atlas/departments.geojson` o la carpeta de estación con `fetch`.
4. Un validador convierte datos desconocidos en contratos tipados; una incoherencia produce un estado RF-34,
   nunca un objeto parcial tratado como resultado.
5. `AbortController` cancela selecciones anteriores; una caché en memoria deduplica solicitudes por URL+versión.
6. La máquina de estado entrega exactamente un estado a la página. La presentación traduce mensajes, anuncia
   cambios accesibles y conserva ausencia como ausencia.
7. Al entrar al explorador se importa el módulo del globo. El selector de proveedor intenta solo rutas
   autorizadas: ion preferido; sin ion o 2D/textual si falla.
8. Insight se llama por HTTPS desde un cliente separado; sus respuestas se validan y no se mezclan con datos
   científicos publicados.

## Routing, Loading and Performance

- Rutas propuestas: `/`, `/explore`, `/station/:stationId`, `/method`, `/about`.
- `import()` por página y una segunda frontera para Cesium/MapLibre; ningún prefetch del globo en portada.
- Presupuesto inicial: shell, portada, i18n español y CSS esencial; inglés y visualizaciones bajo demanda.
- Las vistas ráster no se cargan hasta elegir estación/fecha; se respeta el límite RNF-02.
- El CI inspecciona chunks y una prueba de red verifica RNF-01. Un aumento debe justificarse en la PR.
- `prefers-reduced-motion` desactiva vuelos y transiciones no esenciales; el cambio de ubicación sigue indicado.

## Testing Strategy

- **Contrato/unidad (Vitest)**: validadores de todos los archivos, ausencia frente a cero, marcas REAL/DEMO,
  máquina RF-34, caché, cancelación y traducciones completas (PS-04).
- **Componentes (Vitest)**: foco, anuncios ARIA, reintento, lista textual y movimiento reducido.
- **Integración**: juegos completos, limitados, ausentes, incompatibles, corruptos y tardíos; Cesium/MapLibre con
  dobles deterministas.
- **E2E (Playwright)**: portada → explorador → estación → método → acerca; recarga directa, atrás/adelante,
  teclado, es/en, 320 px y fallback sin WebGL/ion (PS-08).
- **Seguridad (PS-06)**: búsqueda de credenciales en repositorio y bundle; `.env` ignorado; el token de prueba es
  un marcador inválido, nunca el valor real.
- **Rendimiento**: portada a 10 Mbps < 3 s y cero solicitudes de chunks/activos del globo antes de `/explore`.

## Delivery Gates

- Token ion restringido a `assets:read`, assets 1 y 2 y URLs autorizadas, con su valor fuera de Git.
- DP-06 cerrado antes de configurar dominio o despliegue; hasta entonces solo build/preview local.
- Contratos acordados con M-PUBLICACIÓN antes de convertir propuestas en implementación estable.
- `npm run build`, Vitest, Playwright, `sdd:validar`, `ai:check`, revisión de secretos y código vivo en verde.

## Complexity Tracking

No se introduce un proyecto, servicio o patrón fuera del alcance aprobado. El adaptador de proveedor es la mínima
frontera necesaria para cumplir simultáneamente DP-07 cerrada, RF-30 y los respaldos obligatorios.
