---
name: metodo-y-creditos
description: Contenido obligatorio de la página de método (RF-15), la sección Fuente y calidad (RF-37), la página Acerca de (RF-24), las licencias (RNF-11) y las citas de datos de NISAR, FIRMS y fuentes bolivianas (RN-08, RN-11) en UraqiVision. Usar al redactar o revisar esas páginas o al preparar la declaración de licencias y créditos.
---

# Método, fuente y calidad, y Acerca de

Fuente: RF-15, RF-24, RF-37, RNF-11, RN-03, RN-08, RN-11, RN-12, §12, §23 y §31 del documento maestro.
Responsables: Angie y Marian (M-INTERFAZ). Cómo citar y escribir con rigor está en `rigor-y-fuentes`.

## Página de método (RF-15)

Enlazada desde **cada estación** y desde cada cifra. Debe contener, en español e inglés:

1. **Pipeline**: los pasos de §12 en lenguaje claro (lineal → máscara → promedio → línea base → dB →
   cambio de HV → umbrales → clases), con los identificadores MC-01 a MC-07.
2. **Parámetros**: tamaño de promedio (~60 m), fechas de la línea base, los dos umbrales y su origen, área
   mínima de 1 ha.
3. **Versión de datos**: producto L2 GCOV, colección y **madurez (PROVISIONAL, RN-08)**, CRID, órbita y
   fechas usadas; tramo VALIDATED aparte si se usa.
4. **Límites**: qué no puede decir el radar por sí solo (§9.1), el hueco del 27 jul al 10 ago, que las clases
   son candidatas y no causas confirmadas (RN-05), y el rango de las hectáreas (RN-06).
5. **Validación**: métricas VC-01 o «validación limitada» con la alternativa usada (RF-11).
6. **Controles de calidad**: resumen de `quality.json` (CQ-01 a CQ-06).
7. Enlace al repositorio y al notebook reproducible (OE6).

## Sección «Fuente y calidad» (RF-37)

En el panel de cada estación: escenas usadas, fechas, órbita, producto y madurez, CRID, fuente de
validación y fecha de generación. **Se genera desde `manifest.json` y `quality.json`**, no se escribe a mano:
así siempre coincide (criterio de aceptación de RF-37).

## Página Acerca de (RF-24)

Enlazada desde todo el sitio (pie de página):

- **Equipo y roles**: «Houston, tenemos chisme», con los integrantes y módulos de §19 tal como el equipo
  quiera aparecer (confirma nombres y roles con el equipo antes de publicar).
- **Reto**: NASA Space Apps Challenge 2026, *Dancing with the SARs*.
- **Licencias (RNF-11)**: código **MIT**; textos y datos derivados **CC BY 4.0**; deben existir los archivos
  `LICENSE` correspondientes en el repositorio.
- **Citas de datos (RN-11)**: NISAR según la guía de uso y citación de datos de la NASA, FIRMS según su guía,
  y las fuentes bolivianas (FAN, ABT, SENAMHI, SERNAP, MapBiomas Bolivia) según sus condiciones. Verifica cada
  guía vigente antes de escribir la cita; usa las referencias de §31 en APA 7.
- **Atribuciones de software y mapas**: CesiumJS (Apache 2.0), MapLibre, y el mapa base del globo con la
  atribución que exijan sus términos (**pendiente, DP-07**).
- **Uso de IA**: dónde se usó IA (incluido Insight) y que las imágenes generadas con IA llevan marca de agua y
  no usan logos ni marcas de la NASA (RN-12).

## Reglas

- Todo en español e inglés (RNF-03), con las mismas cifras en ambos idiomas.
- Ninguna cita, DOI ni URL inventada: solo los de §31 o los que verificaste abriendo la fuente.
- La madurez PROVISIONAL siempre visible en el método (RN-08).

## Checklist

- [ ] El método cubre pipeline, parámetros, versión de datos, límites, validación y calidad.
- [ ] «Fuente y calidad» se genera desde `manifest.json` y `quality.json`.
- [ ] Acerca de tiene equipo, reto, licencias, citas de datos, atribuciones y uso de IA.
- [ ] Existen los `LICENSE` de MIT y CC BY 4.0.
- [ ] Todo bilingüe y enlazado desde cada estación y el pie del sitio.
