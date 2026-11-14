# Glosario bilingüe (RF-19) — borrador

- **Estado**: borrador para revisar. Revisa Mimi (§19).
- **Fuente**: §30 del documento maestro v1.1 (14 nov 2026; §30 no cambia respecto de la v1.0).
- **Spec**: FR-014 y FR-014a de `specs/004-interfaz-bilingue/spec.md`.

La definición en español es **literal** del documento. La traducción al inglés es **propuesta** y hay
que revisarla antes de pasarla a `en.json`. Para añadir un término que no está en §30, primero se
propone al equipo para incluirlo en §30 (§1, §28).

| # | Término (es) | Término (en) | Definición (es, §30) | Definition (en, propuesta) |
|---|---|---|---|---|
| 1 | Banda L | L-band | Microondas de unos 24 cm de longitud de onda; penetran la vegetación | Microwaves with a wavelength of about 24 cm; they penetrate vegetation |
| 2 | COG | COG | GeoTIFF optimizado para la nube: se puede leer por partes | Cloud Optimized GeoTIFF: it can be read in parts |
| 3 | CRID | CRID | Identificador de la versión de procesamiento de un producto NISAR | Identifier of the processing version of a NISAR product |
| 4 | dB | dB | Decibelios: escala logarítmica de la potencia de la señal | Decibels: a logarithmic scale of signal power |
| 5 | dNBR | dNBR | Índice óptico de severidad de quema, diferencia del NBR antes y después del fuego | Optical burn severity index: the difference in NBR before and after the fire |
| 6 | Earthdata Login | Earthdata Login | Cuenta gratuita de la NASA para descargar datos | Free NASA account for downloading data |
| 7 | FIRMS | FIRMS | Sistema de la NASA que publica focos de calor de MODIS y VIIRS | NASA system that publishes MODIS and VIIRS fire hotspots |
| 8 | GCOV | GCOV | Producto NISAR de covarianza polarimétrica geocodificada | NISAR geocoded polarimetric covariance product |
| 9 | Gránulo | Granule | Un archivo individual de un producto satelital | A single file of a satellite product |
| 10 | HH / HV | HH / HV | Polarizaciones: horizontal-horizontal y horizontal-vertical | Polarizations: horizontal-horizontal and horizontal-vertical |
| 11 | Huella de escena | Scene footprint | Polígono que marca el área de la Tierra cubierta por una escena satelital | Polygon marking the area of the Earth covered by a satellite scene |
| 12 | Línea base | Baseline | Estado de referencia antes del cambio | Reference state before the change |
| 13 | Órbita (track) | Orbit (track) | Trayectoria del satélite; solo se comparan escenas de la misma | The satellite's path; only scenes from the same track are compared |
| 14 | PROVISIONAL | PROVISIONAL | Productos calibrados y parcialmente validados | Calibrated and partially validated products |
| 15 | VALIDATED | VALIDATED | Productos NISAR con validación completa; disponibles desde las adquisiciones del 21 de octubre de 2026 | Fully validated NISAR products; available from acquisitions of October 21, 2026 onward |
| 16 | Retrodispersión (γ0) | Backscatter (γ0) | Energía que vuelve al sensor, normalizada por el terreno | Energy returned to the sensor, normalized for terrain |
| 17 | RXD | RXD | Detector de anomalías Reed-Xiaoli, basado en la distancia de Mahalanobis (Plus) | Reed-Xiaoli anomaly detector, based on the Mahalanobis distance (Plus) |
| 18 | Cociente de HV | HV ratio | Relación entre la señal HV de una fecha y la de la línea base, expresada en dB | Ratio between the HV signal on a date and the baseline HV signal, expressed in dB |
| 19 | Speckle | Speckle | Ruido granular propio de las imágenes de radar | Granular noise inherent to radar images |
| 20 | TIOC | TIOC | Territorio Indígena Originario Campesino | Indigenous Native Peasant Territory (Territorio Indígena Originario Campesino) |
| 21 | WebGL | WebGL | Tecnología del navegador para dibujar gráficos 3D; la necesitan el globo y el mapa | Browser technology for drawing 3D graphics; the globe and the map need it |

## Notas para revisar

- **RXD (17)** es Plus en el documento. Solo se muestra en el sitio si se implementa el método Plus. Si
  no aparece en ninguna pantalla, puede omitirse del glosario visible.
- **TIOC (20)**: en inglés se conserva la sigla y el nombre oficial en español entre paréntesis, porque
  es una figura legal boliviana. Es una propuesta.
- **Referencia sugerida** para revisar la redacción técnica en inglés: el NISAR science users' handbook
  (§31, <https://doi.org/10.48577/jpl.UD4HV3>). No se copió texto de él.
