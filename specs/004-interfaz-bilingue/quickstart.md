# Quickstart: validar la interfaz bilingüe (004)

Es una guía para comprobar que la feature funciona de punta a punta. Los casos detallados están en
`pruebas/casos-de-prueba.md` (CP-01 a CP-64) y los textos en `contenido/`.

## Requisitos previos

- La base web de 001 está implementada (P-PROY-06) y se verificó (P-PROY-07), dentro de la carpeta `web/`.
- Hay datos de prueba con la estructura de §17.3 en `web/public/data/`, marcados con `evidenceMode: "DEMO"`
  (RN-04). Tiene que haber un juego para cada escenario:
  - completo;
  - limitado (CQ-05);
  - sin control CQ-05;
  - sin Sentinel-2 válida;
  - sin rango de hectáreas;
  - con un archivo faltante;
  - con fecha incompatible.
- Las extensiones de `contracts/interface-extensions.ts` están acordadas con 001 y M-PUBLICACIÓN.

## Comandos

Los nombres finales de los comandos los fija la base web.

```bash
cd web
npm run dev          # http://localhost:5173
npm run test         # Vitest: estados, formatos, glosario, paridad es/en
npm run test:e2e     # Playwright: recorrido, idioma, 320 px, movimiento reducido
```

## Escenarios y resultado esperado

| # | Escenario | Resultado esperado | Casos |
|---|---|---|---|
| 1 | Abrir la estación con el juego completo | El panel muestra los 9 campos de RF-33; cada cifra tiene fuente, fecha y método | CP-01, CP-04 |
| 2 | Cambiar a inglés en la estación | Todo en inglés sin recargar; misma estación, fecha y capa; `lang="en"` | CP-30, CP-31 |
| 3 | Juego limitado (CQ-05) | Estado «datos limitados»; marca «limitada» en las cifras afectadas | CP-12 |
| 4 | Juego sin control CQ-05 | «Control de calidad no reportado» y su motivo; la cifra no se oculta | CP-13 |
| 5 | Juego sin Sentinel-2 | «Validación limitada», alternativa VC-02 y VC-05, métricas «no reportadas» | CP-07 |
| 6 | Juego con un archivo faltante | «Sin datos» y su motivo; ningún 0 en pantalla | CP-14, CP-20 |
| 7 | Cortar la red y reintentar | «Error» y reintento; el foco queda en el contenido o en el error | CP-16 a CP-18 |
| 8 | Abrir un término del glosario con ratón, tacto y teclado | Se abre y se cierra (Escape, «cerrar», tocar fuera); el foco vuelve al término | CP-41, CP-42 |
| 9 | Ancho de 320 px, zoom al 200 % y movimiento reducido | Sin desplazamiento horizontal ni animaciones; los estados se siguen percibiendo | CP-63, CP-64 |
| 10 | Revisión automática de accesibilidad en cada estado | 0 violaciones serias o críticas | CP-60 |

## Criterio de salida

- SC-001 a SC-010 de la spec se cumplen con evidencia ejecutada: salida de Vitest y de Playwright, y el informe
  de accesibilidad.
- Los textos de `contenido/` están en `es.json` y `en.json`, sin claves vacías (CP-32).
