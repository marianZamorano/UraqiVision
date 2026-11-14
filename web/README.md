# Web de UraqiVision

App de una sola página (React + TypeScript en modo estricto + Vite), definida en `specs/001-base-web` (§18). La web
solo **lee** los archivos publicados de cada estación (§17.3). No recalcula nada (RF-37).

## Comandos

```bash
npm install        # dependencias
npm run dev        # servidor local
npm run build      # comprobación de tipos y build
npm test           # Vitest (pruebas unitarias y de componentes)
npm run test:e2e   # Playwright (navegador). La primera vez: npx playwright install chromium
```

`npm test` arranca Vitest con `scripts/vitest.mjs`. Ese script normaliza la letra de la unidad en Windows: si la
ruta llega como `c:\…`, Vitest carga dos veces el mismo módulo y falla.

## Estructura (001 T003)

Cada carpeta se crea **con su primer archivo real**: no hay carpetas vacías, por la regla de código vivo de la
constitución.

| Carpeta | Contenido | La crea |
|---|---|---|
| `src/app/` | Shell, presentador de estados y selector de idioma | 001 T001 (shell mínimo), T016, T029, T032 |
| `src/pages/` | Portada, explorador, estación, método y Acerca de | 001 T019, T020 y T022 |
| `src/data/` | Lectura de los archivos publicados, máquina `ViewState`, caché | 001 T011 y T027 |
| `src/contracts/` | Tipos de los archivos publicados y de Insight | 001 T006 y T007 |
| `src/i18n/` | `es.json`, `en.json` y la configuración de i18n | 001 T015 |
| `src/styles/` | Tokens CSS, foco visible y movimiento reducido | 001 T004 |
| `src/features/` | Áreas: `globe/`, `map/`, `atlas/` e `interface/` (specs 002 a 005) | Cada área |
| `tests/unit/` · `tests/integration/` · `tests/e2e/` | Vitest y Playwright | 001 T001, T002 y las siguientes |

## CesiumJS y el token público (001 US5)

- CesiumJS se carga con `import('cesium')` **solo** al entrar a `/explore` y nunca sin WebGL (RNF-01, RF-30). La
  portada no pide ningún recurso de Cesium (`tests/e2e/home-performance.spec.ts`).
- `vite.config.ts` define `CESIUM_BASE_URL=/cesium`, sirve en desarrollo `Assets`, `ThirdParty`, `Widgets`,
  `Workers` y `LICENSE.md` de `node_modules/cesium`, y los copia a `dist/cesium` en el build (RNF-11).
- `VITE_CESIUM_ION_TOKEN` es el token **público** de Cesium ion, restringido a `assets:read`, a los assets 1 (World
  Terrain) y 2 (Bing Maps Aerial) y a las URLs del sitio (DP-07, RNF-06). Vive solo en el `.env` de la **raíz** (créalo con
  `npm run env:sync`; Vite lo lee con `envDir: ".."`, issue #82); nunca se registra, imprime ni versiona. Sin token se usa CesiumJS sin ion, y
  sin WebGL, el respaldo textual.
- La ruta absoluta `/cesium` supone que el sitio se sirve desde la raíz del dominio; si el hospedaje usa un
  subdirectorio hay que ajustarla (depende de DP-06, pendiente).
