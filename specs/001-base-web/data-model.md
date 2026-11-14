# Data model: base web

Los tipos exactos adicionales a §17.3 son **propuestas de diseño** hasta acordarlos con M-PUBLICACIÓN; el
contenido mínimo de cada archivo es el de §17.3. `null` o ausencia nunca se normalizan a `0` (RN-13).

## Entidades y relaciones

### RouteState

- `route`: `home | explore | station | method | about`
- `lang`: `es | en`
- `departmentId?`, `stationId?`, `period?`: identificadores validados

### PublishedDepartment

- `id`, `name.es`, `name.en`, geometría GeoJSON, `source`, `acquiredAt`, `version`

### PublishedStation

- `stationId`, `departmentId`, `label.es/en`, `evidenceMode: REAL | DEMO`
- `area` como `ReportableValue<number>`, `orbit` usada y `periods[].before/after`
- `hypotheses[].text` con `source`, `localStory.es/en` y `suggestedQuestions[].es/en`
- `provenance` y referencias a los artefactos de §17.3

### PublicationManifest

- `schemaVersion`, `pipelineVersion`, `publishedAt`, `track?`, `polarizations[]` y `files[].sha256`
- `granules[]` con `name`, `acquiredAt`, `orbit`, `crid` y `checksum` (§17.3)
- Todos los archivos deben referir la misma estación, publicación y periodo.

### ReportableValue<T>

- presente: valor, unidad, fuente, fecha y método
- ausente: estado `not-reported` y motivo; nunca cero sustituto
- limitado: valor, rango/sensibilidad y motivo

### HectaresValue

- `reported`: valor, unidad `ha` y `sensitivityRange` obligatorio (RN-06)
- `not-reported`: motivo; la fila no se sustituye por cero

### ValidationDocument

- `dice`, `controls[]` y `hotspotsContext?` con fuente, fecha y resumen (propuesta de §17.3)

### ScarsGeoJson / FootprintsGeoJson

- cicatrices: `acquiredAt`, `class` (una de las cuatro clases de RN-05) y hectáreas reportables
- huellas: `orbit`, `direction`, `acquiredAt` y `polarizations`

### ViewState<T>

- unión discriminada de: `loading | available | limited | no-data | incompatible-date | error`
- `error` contiene reintento; ningún estado simula resultados.

### GlobeProviderConfig

- `mode`: `no-ion | ion | two-dimensional`
- `terrainAssetId?`, `imageryAssetId?`, `publicToken?`
- `ion` está aprobado por DP-07; `publicToken` nunca se registra ni serializa.

### InsightRequest / InsightResponse

- Solicitud §21.1: `station_id`, `question`, `lang`.
- Respuesta §21.1: `answer`, `citations` (lista de secciones) y `source` (`ia | plantilla`).
- Propuestas: `limitations` y `causal_claim`; causalidad no afirmada o hipótesis con fuente (RN-05).

## Reglas de validación

1. IDs rechazan navegación de ruta (`..`, `/`, `\\`).
2. Fechas son ISO 8601 UTC y corresponden a adquisición.
3. `evidenceMode` es obligatorio; DEMO produce etiqueta visible.
4. Los archivos coinciden en estación, versión, órbita/track, periodo y unidades.
5. Polarizaciones ausentes no habilitan controles.
6. Un dato inválido produce un estado RF-34, no una excepción sin manejar.
7. Respuestas abortadas no actualizan la selección vigente.

## Transiciones de ViewState

```text
selección → loading
loading → available | limited | no-data | incompatible-date | error
error --reintentar→ loading
cualquier estado --nueva selección→ loading (se aborta la solicitud anterior)
```
