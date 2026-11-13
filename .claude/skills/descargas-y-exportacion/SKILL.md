---
name: descargas-y-exportacion
description: Reglas de las descargas de UraqiVision, es decir PNG del mapa y CSV de hectáreas con fecha, fuente y créditos (RF-21), descarga de change.tif, scars.geojson y manifest.json (RF-22), ficha imprimible (RF-31, Plus) y enlace directo (RF-23, Plus). Usar al implementar o revisar botones de descarga, la exportación de la vista actual o la versión imprimible de una estación.
---

# Descargas y exportación

Fuente: RF-21, RF-22, RF-23, RF-31, RN-03, RN-06, RN-07, RN-13, RNF-09, RNF-11, CU-01 y HU-02 del documento
maestro. Responsables: Angie y Marian (M-INTERFAZ), con Mimi para los archivos (M-PUBLICACIÓN).

## Descarga de PNG y CSV (RF-21, MVP)

- **PNG del mapa actual**: lo que el usuario ve (capa, fecha, polarización, opacidad), con un pie que incluya
  fecha de adquisición, órbita, polarización, leyenda con unidades, fuente (NISAR, ASF) y créditos.
- **CSV de hectáreas** (HU-02): columnas de fecha, hectáreas, rango inferior y superior y fuente; una línea
  de encabezado o un archivo adjunto con créditos, licencia (CC BY 4.0) y fecha de generación.
- **Sin dato ≠ 0** (RN-13): la celda queda vacía y una columna de motivo lo explica.
- Las cifras del CSV **coinciden exactamente** con `hectares.csv` publicado (RF-09): el CSV se genera desde
  ese archivo, no se recalcula en el navegador.
- Fechas en UTC con la hora de Bolivia indicada aparte (RN-07); decimales con punto en el CSV para que lo
  lean las hojas de cálculo en cualquier idioma, y el idioma solo afecta a los encabezados.
- Nombre de archivo con estación, fecha y vista: `san-ignacio_20260915_hv.png`.

## Descarga de datos (RF-22, MVP)

- `change.tif` (COG sin pérdida, RNF-09), `scars.geojson` y `manifest.json` de cada estación, servidos tal
  cual están publicados: la web no los transforma.
- Junto a los enlaces, la licencia (CC BY 4.0, RNF-11) y cómo citar.
- Criterio de aceptación: archivos válidos, georreferenciados y con licencia.

## Enlace directo (RF-23, Plus)

URL que abre un departamento o una estación con fecha y vista. Solo si el equipo lo pide; el estado de
selección ya es serializable (skill `react-components-and-state`).

## Ficha imprimible (RF-31, Plus)

Página de la estación preparada para imprimir o guardar como PDF desde el navegador (`@media print`): mapa,
cifras con rango, fuentes y límites. Solo si el equipo lo pide.

## Accesibilidad e idiomas

- Botones de descarga con nombre accesible que diga qué se descarga y en qué formato.
- Encabezados del CSV y pie del PNG en el idioma elegido; los datos, iguales en ambos.

## Pruebas

- Vitest: el CSV generado tiene las columnas correctas, celdas vacías con motivo para sin dato y las mismas
  cifras que `hectares.csv` de prueba.
- Playwright (PS-09): el recorrido termina en una descarga en escritorio y celular.

## Checklist

- [ ] PNG con fecha, órbita, polarización, leyenda, fuente y créditos.
- [ ] CSV con rango, fuente, licencia y sin ceros falsos; idéntico a `hectares.csv`.
- [ ] `change.tif`, `scars.geojson` y `manifest.json` descargables tal cual, con licencia.
- [ ] Plus (RF-23, RF-31) solo si el equipo lo pidió.
