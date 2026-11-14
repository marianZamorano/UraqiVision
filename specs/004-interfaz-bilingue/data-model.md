# Data model: interfaz bilingüe (004)

Este modelo **reutiliza** las entidades de `specs/001-base-web/data-model.md` (`ReportableValue<T>`,
`ViewState<T>`, `RouteState`, los documentos publicados) y no las duplica. Lo nuevo son modelos de presentación
y las **extensiones propuestas** de los contratos publicados (`contracts/interface-extensions.ts`), que se acuerdan
con 001 y M-PUBLICACIÓN. Ningún dato ausente se normaliza a 0 (RN-13).

## Modelos de presentación

### PanelEstacion (RF-33, FR-001 a FR-007)

Se deriva del `PublishedStationBundle` de 001 y de sus extensiones. **No recalcula nada** (RF-37).

| Campo | Origen | Regla |
|---|---|---|
| `periodo` | `station.periods[]` | Fechas en hora de Bolivia (FR-004) |
| `orbita` | `manifest.track` / `manifest.orbit` | Si falta: «no reportada» y su motivo |
| `polarizaciones` | `manifest.polarizations` | Solo las publicadas |
| `hectareas` | `HectaresRow.hectares` | Siempre con su rango (RN-06); sin rango, «rango no reportado» |
| `datosValidos` | extensión `validDataPercent` | Tal cual; **pendiente de DP-03** |
| `validacion` | `validation` y su extensión | Si es limitada: marca, alternativa y métricas «no reportadas» (FR-006) |
| `advertencias` | extensión `station.warnings` y `quality.limitations` | Traducidas es/en |
| `hipotesis` | extensión `station.hypotheses` | Clase RN-05 y fuente obligatoria (FR-005) |
| `enlaceMetodo` | ruta `/method` (001) | Siempre presente |

### CifraMostrada (FR-002, FR-009, FR-010)

| Campo | Descripción |
|---|---|
| `texto` | Valor ya formateado en el idioma activo, o el texto «no reportada» |
| `marca` | `ninguna` · `limitada` · `no-reportada` · `rango-no-reportado` · `control-no-reportado` |
| `motivo` | Obligatorio si la marca no es `ninguna` |
| `procedencia` | Fuente, fecha (hora de Bolivia y UTC) y método |

Regla: la marca se calcula a partir del `status` de `ReportableValue` y de los controles publicados. Nunca a
partir de un umbral propio.

### SeccionFuenteCalidad (RF-37, FR-019)

Toma los campos campo a campo del manifiesto y del resultado de calidad: escenas (`granules`), fechas, órbita,
producto y madurez, CRID, fuente de validación y fecha de generación (`publishedAt`). Cada campo ausente se
muestra como «no reportado» con su motivo.

### TerminoGlosario (RF-19, FR-014)

| Campo | Regla |
|---|---|
| `id` | Clave estable, por ejemplo `retrodispersion` |
| `termino.es` / `termino.en` | De `contenido/glosario.md` |
| `definicion.es` / `definicion.en` | Español literal de §30; inglés revisado |

Hay 21 términos (§30). Para añadir uno, primero se propone al equipo.

### PreferenciaIdioma (RF-20)

- `lang: 'es' | 'en'`, guardado en `RouteState` (001) y en `localStorage` cuando esté disponible (001).
- Al cambiarlo: `document.documentElement.lang` y formatos (R2, R3).

## Transición de estados

Se usa la máquina de `ViewState` de 001 sin cambios. Lo que añade 004 es la **presentación**:

| Estado (001) | Mensaje (`contenido/textos-interfaz.md`) | Anuncio | Foco |
|---|---|---|---|
| `loading` | `estado.cargando` | Región viva educada | No se mueve |
| `available` | `estado.disponible` | Región viva educada | Contenido cargado, si se llegó por «reintentar» |
| `limited` | `estado.limitados` y marca «limitada» en cada cifra afectada | Región viva educada | No se mueve |
| `no-data` | `estado.sinDatos` y su motivo | Región viva educada | No se mueve |
| `incompatible-date` | `estado.fechaIncompatible` y su motivo | Región viva educada | No se mueve |
| `error` | `estado.error` y el botón `estado.reintentar` | Alerta | El mensaje de error, si se llegó por «reintentar» |

## Reglas de validación añadidas

1. Una hipótesis sin fuente no se muestra como hipótesis válida: produce una advertencia (RN-05).
2. Unas hectáreas sin rango se muestran con la marca `rango-no-reportado` (RN-06, RN-13).
3. Si falta el control CQ-05, se muestra la marca `control-no-reportado` y nunca «limitada» por defecto (FR-010).
4. Si `evidenceMode` es `DEMO` (001), la etiqueta es visible en el panel y en las descargas (RN-04).
