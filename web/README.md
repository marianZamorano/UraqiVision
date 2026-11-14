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
