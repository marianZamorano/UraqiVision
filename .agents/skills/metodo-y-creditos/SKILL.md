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

## Referencias del documento maestro (§31)

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Alaska Satellite Facility (2026). NISAR data user guide** — <https://nisar-docs.asf.alaska.edu/>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: MC-01, RF-26, RF-37, RN-02, CQ-02, CQ-06. Guía de uso de los productos NISAR (GCOV, madurez, CRID, órbitas) que respaldan §10.1: cítala donde se busca, lee y describe el producto, y en la página de método.
- **Autoridad de Bosques y Tierra (2026). Boletín oficial 222 de focos de calor** — <https://www.abt.gob.bo/images/2026/Focos%20de%20Calor/2026%2008%2010%20Boletin%20oficial%20222%20MM.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Contexto oficial de incendios: cítala en la ficha de Santa Cruz, en las hipótesis de la estación y en Acerca de; es contexto, no validación.
- **Belenguer-Plomer, Tanase, Fernandez-Carrillo y Chuvieco (2019). Burned area detection and mapping using Sentinel-1 backscatter coefficient and thermal anomalies** — <https://doi.org/10.1016/j.rse.2019.111345>
  Citada en: §11.1, §12 (MC-08), §23.1 (VC-01). Aplica a: MC-03, MC-08, VC-01, RF-11, RF-15. Cítala en la implementación de MC-03 y MC-08, en las métricas de VC-01 y en la página de método. El Dice de 0,59 es de banda C: no lo presentes como meta ni como resultado de banda L.
- **Cesium GS (2026). CesiumJS [Software]** — <https://github.com/CesiumGS/cesium>
  Citada en: §18. Aplica a: RF-02, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-24, RNF-11. Usa la documentación vigente (MCP context7) al implementar el globo; muestra su atribución y licencia en el globo y en Acerca de (RF-24, RNF-11).
- **MapBiomas Bolivia (s. f.). Capas** — <https://bolivia.mapbiomas.org/en/capas/>
  Citada en: §10.3, §17. Aplica a: RF-14, RF-35, RF-03. Fuente de límites, áreas protegidas y territorios: cada capa que la use muestra fuente y año (RF-14, RF-35) y aparece en Acerca de.
- **NASA Space Apps Challenge (2026). Dancing with the SARs** — <https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/>
  Citada en: §3. Aplica a: RF-01, RF-24. Enlázalo en Acerca de y en la entrega; sin logos ni marcas de la NASA en contenido generado con IA (RN-12).
- **NISAR (2025). NASA-ISRO SAR (NISAR) mission science users' handbook (2.ª ed.)** — <https://doi.org/10.48577/jpl.UD4HV3>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RN-11, RF-08, RF-15, RF-19, RF-24, RF-16. Fundamentos de la misión y del radar (§9): respalda el texto de qué resalta cada polarización (RF-08), el glosario (RF-19), la página de método y las citas de datos (RN-11, RF-24) y las explicaciones de Insight; el documento no la cita en el cuerpo.
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico de focos de calor en Bolivia** — <https://senamhi.gob.bo/focoscalor/2026/FC_7_JULIO_2026/Pron_Focos_Bolivia_20260713.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Cítala en las fichas que usen el pronóstico de focos y en Acerca de; es contexto (un pronóstico), no un resultado ni una validación (RN-10).
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico hidrológico** — <https://senamhi.gob.bo/meteorologia/boletines/pronostico_hidrologico/2026/JULIO/RESUMEN%20EN%20PLANILLA%20PRON%C3%93STICO%20HIDROL%C3%93GICO%20SENAMHI%20LUNES%2027-07-2026.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-24. Cítala en las fichas que usen el pronóstico hidrológico (inundaciones o sequía) y en Acerca de; es contexto, no un resultado.

<!-- referencias:fin -->
