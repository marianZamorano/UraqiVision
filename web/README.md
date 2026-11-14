# Web de UraqiVision

App de una sola página (React + TypeScript en modo estricto + Vite, con `react-router-dom`), definida en
`specs/001-base-web` (§18). La web solo **lee** los archivos publicados de cada estación (§17.3). No recalcula nada
(RF-37).

## Comandos

```bash
npm install        # dependencias
npm run dev        # servidor local (también en la red local para probar desde el celular)
npm run build      # comprobación de tipos (tsc -b) y build
npm run lint       # oxlint
npm test           # Vitest (pruebas unitarias y de componentes)
npm run test:e2e   # Playwright (navegador). La primera vez: npx playwright install chromium
```

`npm test` arranca Vitest con `scripts/vitest.mjs`. Ese script normaliza la letra de la unidad en Windows: si la
ruta llega como `c:\…`, Vitest carga dos veces el mismo módulo y falla.

## Estructura

Cada carpeta se crea **con su primer archivo real**: no hay carpetas vacías, por la regla de código vivo de la
constitución.

| Ruta | Contenido |
|---|---|
| `src/main.tsx` · `src/App.tsx` | Entrada, router y rutas (`/`, `/explore`, `/station/:stationId`, `/method`, `/about`) |
| `src/app/` | `AppShell` (shell e idioma) y `ViewStatePresenter` (estados de RF-34) |
| `src/pages/` | Portada, explorador, estación, método y Acerca de |
| `src/data/` | Máquina `ViewState`, repositorio de publicaciones |
| `src/contracts/` | Tipos de los archivos publicados y de Insight |
| `src/i18n/` | Idiomas es/en |
| `src/styles/` | Tokens (`tokens.css`) y estilos globales (`global.css`): foco visible y movimiento reducido |
| `src/features/` | Áreas: `globe/`, `map/`, `atlas/` e `interface/` (specs 002 a 005) |
| `tests/unit/` · `tests/integration/` · `tests/e2e/` | Vitest y Playwright. También hay pruebas junto al código (`src/**/*.test.tsx`) |
