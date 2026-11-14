# Textos de la interfaz (RF-33, RF-34, RNF-03): borrador

- **Estado:** borrador para revisar (revisa Mimi, §19).
- **Destino:** cuando exista la base web (`specs/001-base-web`), estos textos se pasan a `es.json` y
  `en.json`.
- **Claves:** las propuestas son provisionales. La estructura final de claves la fija el plan
  (P-INTERFAZ-03).
- **Variables:** se escriben `{{así}}`. Su valor sale siempre de los archivos publicados; ninguno es una
  cifra fija.
- **Origen:** todo sale de la spec 004 y sus aclaraciones. No incluye cifras.

## 1. Estados de la vista (RF-34, FR-008, FR-008a)

| Clave propuesta | Español | English |
|---|---|---|
| `estado.cargando` | Cargando los datos de la estación… | Loading station data… |
| `estado.disponible` | Resultado disponible | Result available |
| `estado.limitados` | Datos limitados: una parte del área no tiene datos válidos. Las cifras afectadas llevan la marca «limitada». | Limited data: part of the area has no valid data. Affected figures are marked "limited". |
| `estado.sinDatos` | Sin datos para esta estación o fecha. Motivo: {{motivo}} | No data for this station or date. Reason: {{motivo}} |
| `estado.fechaIncompatible` | Fecha incompatible: {{motivo}}. Elige otra fecha de la misma órbita. | Incompatible date: {{motivo}}. Choose another date from the same orbit. |
| `estado.error` | No se pudieron cargar los datos. | The data could not be loaded. |
| `estado.reintentar` | Reintentar | Try again |
| `estado.descargaLista` | Descarga lista: {{archivo}} | Download ready: {{archivo}} |
| `estado.descargaFallo` | La descarga de {{archivo}} falló. | The download of {{archivo}} failed. |

Motivos de ejemplo para `{{motivo}}`. Son propuestas, y el motivo real se toma de lo publicado cuando
exista:
- «la estación no publicó este archivo» / "the station did not publish this file"
- «no hay par de la misma órbita para esta fecha» / "there is no same-orbit pair for this date"

## 2. Ausencia de dato y marcas (RN-13, CQ-05, FR-009, FR-010)

| Clave propuesta | Español | English |
|---|---|---|
| `marca.noReportada` | No reportada | Not reported |
| `marca.noReportadaMotivo` | No reportada: {{motivo}} | Not reported: {{motivo}} |
| `marca.limitada` | Limitada | Limited |
| `marca.limitadaAyuda` | El control de datos válidos marcó esta cifra como limitada. | The valid-data check flagged this figure as limited. |
| `marca.controlNoReportado` | Control de calidad no reportado: {{motivo}} | Quality check not reported: {{motivo}} |
| `marca.rangoNoReportado` | Rango no reportado: {{motivo}} | Range not reported: {{motivo}} |

## 3. Validación (RF-11 mostrado en RF-33, FR-006)

| Clave propuesta | Español | English |
|---|---|---|
| `validacion.titulo` | Validación | Validation |
| `validacion.limitada` | Validación limitada | Limited validation |
| `validacion.limitadaDetalle` | No hubo imagen Sentinel-2 válida. Se usó como alternativa: {{alternativa}}. | No valid Sentinel-2 image was available. Alternative used: {{alternativa}}. |
| `validacion.metricasNoReportadas` | Métricas frente a Sentinel-2: no reportadas ({{motivo}}) | Metrics against Sentinel-2: not reported ({{motivo}}) |
| `validacion.verMetodo` | Cómo se validó | How it was validated |

`{{alternativa}}` se escribe con lo publicado en `validation.json`. Los nombres de VC-02 y VC-05 serían:
- «focos de calor» / "fire hotspots"
- «revisión visual» / "visual review"

## 4. Panel de la estación (RF-33, FR-001 a FR-005)

| Clave propuesta | Español | English |
|---|---|---|
| `panel.titulo` | Resumen de la estación | Station summary |
| `panel.periodo` | Periodo | Period |
| `panel.orbita` | Órbita | Orbit |
| `panel.polarizacion` | Polarización | Polarization |
| `panel.hectareas` | Superficie con cambio | Area with change |
| `panel.hectareasValor` | {{valor}} ha (rango: {{min}}–{{max}} ha) | {{valor}} ha (range: {{min}}–{{max}} ha) |
| `panel.datosValidos` | Datos válidos | Valid data |
| `panel.advertencias` | Advertencias | Warnings |
| `panel.hipotesis` | Hipótesis sobre la causa | Hypotheses about the cause |
| `panel.hipotesisAviso` | Son hipótesis con fuente, no certezas. | These are sourced hypotheses, not certainties. |
| `panel.fuente` | Fuente: {{fuente}} · Fecha: {{fecha}} · Método: {{metodo}} | Source: {{fuente}} · Date: {{fecha}} · Method: {{metodo}} |
| `panel.verMetodo` | Ver el método | See the method |
| `panel.zonaHoraria` | hora de Bolivia, UTC−04 | Bolivia time, UTC−04 |

### Clases de parche (RN-05, FR-005)

Las clases son las cuatro del documento. Los textos en inglés son una propuesta.

| Clave propuesta | Español | English |
|---|---|---|
| `clase.quema` | Compatible con quema | Consistent with burning |
| `clase.perdidaPrevia` | Compatible con pérdida previa de estructura | Consistent with prior loss of structure |
| `clase.ambigua` | Evidencia ambigua | Ambiguous evidence |
| `clase.insuficiente` | Datos insuficientes | Insufficient data |

## 5. Idioma y glosario (RF-20, RF-19, FR-012a, FR-014a)

| Clave propuesta | Español | English |
|---|---|---|
| `idioma.selector` | Idioma | Language |
| `idioma.es` | Español | Español |
| `idioma.en` | English | English |
| `glosario.cerrar` | Cerrar definición | Close definition |
| `glosario.abrir` | Ver definición de {{termino}} | See definition of {{termino}} |

Los nombres de los idiomas se escriben en su propio idioma, como es habitual en los selectores de
idioma. Es una propuesta.

## 6. Fuente y calidad (RF-37, FR-019)

| Clave propuesta | Español | English |
|---|---|---|
| `calidad.titulo` | Fuente y calidad | Source and quality |
| `calidad.escenas` | Escenas usadas | Scenes used |
| `calidad.fechas` | Fechas de adquisición | Acquisition dates |
| `calidad.producto` | Producto y madurez | Product and maturity |
| `calidad.crid` | CRID | CRID |
| `calidad.fuenteValidacion` | Fuente de validación | Validation source |
| `calidad.fechaGeneracion` | Fecha de generación | Generation date |

## Pendientes

- La lista definitiva de motivos depende de lo que publique el backend (§17.3).
- Los textos de método y descargas son de Angie (reparto de #42) y no están en este archivo.
