# Página Acerca de (RF-24): borrador

- **Estado:** borrador para revisar (revisa Mimi, §19).
- **Spec:** FR-021 y FR-022 de `specs/004-interfaz-bilingue/spec.md`.
- **Fuentes:** la información del equipo sale de la portada y de §19 del documento maestro. Las licencias
  salen de RNF-11 y las referencias de §31, consultadas el 12 de noviembre de 2026 según el documento.
- **Pendientes** (no se inventan):
  - la cita oficial de los datos NISAR (RN-11);
  - las citas de FIRMS y Sentinel-2 según sus guías;
  - la declaración de uso de IA (DP-02);
  - los apellidos o nombres completos del equipo, que el documento no da.

---

## Español

### Qué es UraqiVision

UraqiVision es una web gratuita, en español e inglés, que traduce los datos del radar NISAR en mapas,
cifras e historias sobre la superficie de Bolivia. Responde dos preguntas en la estación San Ignacio de
Velasco: **¿dónde y cuándo quemó el fuego?** y **¿quema o desmonte?**

Es la propuesta del equipo **Houston, tenemos chisme** para el reto *Dancing with the SARs* del NASA
Space Apps Challenge 2026.

### Equipo y roles

| Persona | Rol en el proyecto (§19) |
|---|---|
| Alex | Ingesta: búsqueda, recorte y descarga de escenas; manifiesto y huellas |
| Tabata | Ciencia y validación: speckle, línea base, cociente de HV, clases, hectáreas; comparación con Sentinel-2 y focos de calor |
| Mimi | Publicación de cada estación e Insight |
| Joaco | Globo 3D y mapa de análisis 2D |
| Angie | Atlas: portada y fichas; interfaz |
| Marian | Interfaz: idiomas, glosario, accesibilidad, panel, estados, fuente y calidad |

> Pendiente: confirmar con el equipo cómo quiere aparecer cada persona (nombre completo, enlaces).

### Licencias (RNF-11)

- **Código:** licencia MIT.
- **Textos y datos derivados:** licencia Creative Commons Atribución 4.0 Internacional (CC BY 4.0).
- Los datos de origen conservan su propia licencia y su cita (abajo).

### Datos y cómo citarlos (RN-11)

- **NISAR (NASA-ISRO), producto L2 GCOV, banda L.** Distribuidos por la Alaska Satellite Facility.
  *Cita oficial pendiente: se toma de la guía de uso y citación de datos de la NASA (RN-11).*
- **FIRMS (NASA), focos de calor MODIS y VIIRS.** *Cita pendiente según la guía de FIRMS.*
- **Sentinel-2 (validación óptica).** *Cita pendiente según su guía.*

### Fuentes bolivianas

- Autoridad de Bosques y Tierra (2026). *Boletín oficial 222 de focos de calor.*
- Servicio Nacional de Meteorología e Hidrología (2026). *Pronóstico de focos de calor en Bolivia* y
  *Pronóstico hidrológico.*
- Fundación Amigos de la Naturaleza (2023). *Deforestación en Bolivia 1956–2022*, y SATRIFO (s. f.).
- MapBiomas Bolivia (s. f.). *Capas.*

Son contexto, no resultados ni validación (la validación es la de §23.1). Los enlaces completos están en la lista de
referencias.

### Software

- **CesiumJS** (Cesium GS), para el globo 3D. Su atribución y su licencia se muestran en el globo.
- **MapLibre GL JS**, para el mapa 2D.
- Lo demás está en la lista de licencias del repositorio. *Pendiente: generarla con el plan
  (P-INTERFAZ-03).*

### Uso de inteligencia artificial

*Pendiente de DP-02: forma y contenido según las guías 2026 de Space Apps.* Ningún contenido generado con
IA usa logos ni marcas de la NASA, y las imágenes generadas con IA llevan marca de agua (RN-12).

### Referencias

Lista completa en formato APA 7, según §31 del documento maestro. Se genera a partir del catálogo de
referencias del repositorio (`npm run referencias:lista`).

---

## English

### What UraqiVision is

UraqiVision is a free website, in Spanish and English, that turns NISAR radar data into maps, figures
and stories about Bolivia's land surface. At the San Ignacio de Velasco station it answers two
questions: **where and when did the fire burn?** and **was it burning or clearing?**

It is the **Houston, tenemos chisme** team's project for the *Dancing with the SARs* challenge of the
NASA Space Apps Challenge 2026.

### Team and roles

| Person | Role in the project (§19) |
|---|---|
| Alex | Ingestion: searching, clipping and downloading scenes; manifest and footprints |
| Tabata | Science and validation: speckle, baseline, HV ratio, classes, hectares; comparison with Sentinel-2 and fire hotspots |
| Mimi | Station publishing and Insight |
| Joaco | 3D globe and 2D analysis map |
| Angie | Atlas: home page and department profiles; interface |
| Marian | Interface: languages, glossary, accessibility, panel, view states, source and quality |

### Licenses (RNF-11)

- **Code:** MIT license.
- **Texts and derived data:** Creative Commons Attribution 4.0 International (CC BY 4.0).
- Source data keep their own license and citation (below).

### Data and how to cite them (RN-11)

- **NISAR (NASA-ISRO), L2 GCOV product, L-band.** Distributed by the Alaska Satellite Facility.
  *Official citation pending, to be taken from NASA's data use and citation guidance (RN-11).*
- **FIRMS (NASA), MODIS and VIIRS fire hotspots.** *Citation pending, per FIRMS guidance.*
- **Sentinel-2 (optical validation).** *Citation pending, per its guidance.*

### Bolivian sources

Same list as in Spanish (titles are kept in their original language). They are context, not results or
validation.

### Software

CesiumJS (Cesium GS) for the 3D globe and MapLibre GL JS for the 2D map. *Full list pending.*

### Use of artificial intelligence

*Pending DP-02.* No AI-generated content uses NASA logos or marks, and AI-generated images carry a
watermark (RN-12).
