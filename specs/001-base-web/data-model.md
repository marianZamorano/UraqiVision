# Data model: base web

Los tipos exactos adicionales a §17.3 son **propuestas de diseño** hasta acordarlos con M-PUBLICACIÓN. `null` o
ausencia nunca se normalizan a `0` (RN-13).

## Entidades y relaciones

### RouteState

- `route`: `home | explore | station | method | about`
- `lang`: `es | en`
- `departmentId?`, `stationId?`, `period?`: identificadores validados

### PublishedDepartment

- `id`, `name.es`, `name.en`, geometría GeoJSON, `source`, `acquiredAt`, `version`

### PublishedStation

- identidad, departamento, fechas y `evidenceMode: REAL | DEMO`
- referencias a los artefactos de §17.3

### PublicationManifest

- `schemaVersion`, `pipelineVersion`, `publishedAt`, gránulos/CRID, órbita, track, polarizaciones y checksum
- Todos los archivos deben referir la misma estación, publicación y periodo.

### ReportableValue<T>

- presente: valor, unidad, fuente, fecha y método
- ausente: estado `not-reported` y motivo; nunca cero sustituto
- limitado: valor, rango/sensibilidad y motivo

### ViewState<T>

- unión discriminada de: `loading | available | limited | no-data | incompatible-date | error`
- `error` contiene reintento; ningún estado simula resultados.

### GlobeProviderConfig

- `mode`: `no-ion | ion | two-dimensional`
- `terrainAssetId?`, `imageryAssetId?`, `publicToken?`
- `ion` está aprobado por DP-07; `publicToken` nunca se registra ni serializa.

### InsightRequest / InsightResponse

- Solicitud §21.1: `station_id`, `question`, `lang`.
- Respuesta propuesta: explicación, evidencia citada, limitaciones y causalidad no afirmada o hipótesis con fuente.

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
