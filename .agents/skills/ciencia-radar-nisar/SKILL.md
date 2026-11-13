---
name: ciencia-radar-nisar
description: Reglas científicas para el pipeline de UraqiVision con NISAR L2 GCOV en banda L (HH, HV), métodos MC-01 a MC-09, controles de calidad CQ-01 a CQ-06 y validación VC-01 a VC-05. Usar al escribir o revisar código Python de ingesta, línea base, cociente de HV, parches, fenología, clases de parche, hectáreas o validación con Sentinel-2 y FIRMS.
---

# Ciencia de radar NISAR en UraqiVision

Fuente: §9, §10, §11, §12 y §23 del documento maestro. Todo lo que no esté allí se consulta; no se
suponen capacidades del satélite ni valores de las capas.

## Datos

- Producto: **NISAR L2 GCOV**. PROVISIONAL `C2854338529-ASF` (CRID P05023) y VALIDATED `C3622241360-ASF`
  (CRID P05036). Nunca BETA.
- Polarizaciones: HHHH y HVHV (modo DHDH) o solo HH (SHSH) según órbita y fecha. Capas de apoyo: `mask`,
  `numberOfLooks`, `rtcGammaToSigmaFactor`. **Qué codifica `mask` está pendiente (DP-03)**: no lo supongas.
- Hueco permanente del instrumento: 27 de julio al 10 de agosto de 2026. Los eventos analizados son
  posteriores al 10 de agosto.
- Acceso con Earthdata Login (asf_search, earthaccess). Las credenciales viven en `~/.netrc` o variables de
  entorno; **nunca** se leen, imprimen ni versionan.

## Orden obligatorio del procesamiento (§12)

1. Leer HHHH y HVHV en **potencia lineal**.
2. Aplicar la máscara y los controles CQ-01 a CQ-06.
3. Promediar **en lineal** hasta unos 60 m (speckle, MC-01).
4. Línea base = **mediana** por píxel de al menos 3 fechas previas compatibles (MC-02).
5. Convertir línea base y fecha objetivo a dB: `10·log10(potencia)`.
6. Cambio de HV = HV(fecha) en dB − HV(línea base) en dB (MC-03).
7. Dos umbrales (rango de sensibilidad) y área mínima de 1 ha (MC-04).
8. Una de cuatro clases por parche (MC-06).

Errores típicos que esta skill debe frenar:

- Promediar en dB. Los promedios y la mediana se calculan en lineal; el dB es solo para comparar y mostrar.
- Comparar fechas de órbitas o grillas distintas (RN-01). Una serie = una órbita = una grilla.
- Mezclar PROVISIONAL y VALIDATED en la misma serie (RN-02) sin la armonización documentada.
- Remuestrear los datos de análisis. Solo las vistas se remuestrean (§22).
- Rellenar sin-dato con 0. Se usa `NaN` o máscara y se informa como «no reportada» (RN-13).
- Usar los focos FIRMS para **crear** parches. Solo los fechan y clasifican (MC-04).

## Métodos

| ID | Clave | Cuidado |
|---|---|---|
| MC-01 | Misma órbita y grilla; pila float32 lineal a ~60 m con máscara de válidos | Artefactos en bordes de PROVISIONAL: recortar lejos de los bordes |
| MC-02 | Mediana de HV lineal, ≥ 3 fechas previas | Pocas fechas por el inicio en junio y el hueco |
| MC-03 | Cociente de HV en dB, dos umbrales calibrados con controles y dNBR | Umbrales dependen de zona y fecha |
| MC-04 | Parches ≥ 1 ha con fecha de primera detección | Los menores se descartan |
| MC-05 | Cambio relativo a polígonos de control sin fuego ni desmonte | Polígonos pendientes (DP-05) |
| MC-06 | Orden temporal HV/focos y forma del parche → 4 clases | Las clases **no confirman causas** |
| MC-07 | Hectáreas = píxeles × área de píxel en UTM, con rango de los dos umbrales | Depende del umbral |
| MC-08 | RXD (Mahalanobis), **Plus** | Solo si sobra tiempo |
| MC-09 | Clasificador scikit-learn con dNBR, **Plus** | No clasifica desmonte |

Las cuatro clases (RN-05), con estos nombres exactos: *compatible con quema*, *compatible con pérdida previa
de estructura*, *evidencia ambigua*, *datos insuficientes*.

## Controles antes de publicar (CQ, §23.2)

CQ-01 geometría (CRS, grilla, resolución, extensión) · CQ-02 órbita (track, dirección, separación) ·
CQ-03 radiometría (producto, gamma-cero, unidades, rango físico) · CQ-04 polarizaciones (HH y HV en cada
fecha; si falta HV, la vista HV se deshabilita) · CQ-05 porcentaje de datos válidos · CQ-06 procedencia
(gránulos, CRID, sumas de verificación, versión del pipeline). El resultado va a `quality.json`.
Una fecha excluida siempre lleva su motivo (RF-07).

## Validación (VC, §23.1)

VC-01 precisión, exhaustividad y Dice frente al dNBR de Sentinel-2 (referencia: Dice 0,59 en banda C,
Belenguer-Plomer et al., 2019) · VC-02 % de parches con foco FIRMS (contexto, no prueba) · VC-03 zonas de
control · VC-04 sensibilidad del umbral · VC-05 revisión visual. Sin imagen Sentinel-2 válida, la estación
dice **«validación limitada»** (RF-11).

## Pruebas (PS-01, PS-02)

- Unitarias con pytest y **datos sintéticos** pequeños (arrays NumPy hechos a mano) para dB, promedio de
  speckle, mediana, cociente de HV y hectáreas. Los valores esperados se calculan a mano, no con la misma
  función que se prueba.
- Caso obligatorio: un píxel `NaN` en una fecha no debe convertirse en cero ni contaminar la mediana.
- PS-02: el COG publicado conserva exactamente los valores del análisis (comparar arrays con igualdad exacta).
