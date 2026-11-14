# Data model: portada y fichas del atlas

Modelo del contenido de M-ATLAS (issue #63). Es contenido editorial de la web, no un archivo de §17.3; el equipo
acordó que viva en la web el 2026-11-14 (research.md, R1); los campos exactos son **propuesta de diseño**. Sigue
el mismo criterio de procedencia y de ausencia que `specs/001-base-web/data-model.md`, sin importar ni modificar
sus contratos. Ausencia nunca se convierte en `0` (RN-13).

## Entidades

### LocalizedText

- `es`: texto en español; `en`: texto en inglés. Ambos obligatorios y no vacíos (RNF-03).

### SourceRef (fuente)

- `refId`: identificador de la entrada de §31 a la que corresponde.
- `citation`: autor u organismo, año y título (tal como en §31).
- `url`: enlace de §31.
- `consultedAt`: fecha de consulta (ISO 8601; la que da el documento: 2026-11-12).
- `method`: método que declara la fuente (por ejemplo, «con Landsat y MapBiomas Bolivia») **o**
  `not-reported` («método no reportado por la fuente») (RN-03).
- `relation`: `document` (el cuerpo del documento la cita) o `team-proposed` (está en §31, pero su relación con
  la ficha la marca como propuesta del equipo el catálogo `ai/referencias/catalogo.json`). Se muestra la
  diferencia cuando aplica.

### Claim (afirmación)

- `text`: LocalizedText.
- `kind`: `context` (fenómeno o dato de contexto, RN-04) o `hypothesis` (causa, siempre con fuente, RN-05).
- `sources`: lista de SourceRef; **o** `sourceStatus: "in-verification"` cuando no hay fuente verificada en §31.
  Una afirmación nunca queda sin fuentes y sin aviso.

### SceneCount (escenas NISAR)

- `value`: número **o** `range: [min, max]` (Santa Cruz: 54–55), copiado de §10.4.
- `collection`: `PROVISIONAL`.
- `queriedAt`: `2026-11-12` (consulta CMR, §10.2).
- `period`: `2026-06-17` a `2026-11-12`.
- Si faltara: estado `not-reported` con motivo (RN-13), nunca `0`.

### DepartmentCard (ficha de departamento)

- `departmentId`: identificador que enlaza con `atlas/departments.geojson` (nombre de campo según el contrato de
  001, research.md R3).
- `name`: LocalizedText.
- `phenomenon`: Claim (`kind: context`), valor literal de §10.4.
- `scenes`: SceneCount.
- `sources`: lista de SourceRef o `sourceStatus: "in-verification"`.
- `status`: `station` | `profile` (etiqueta «Estación»/«Ficha» + icono, FR-010a).
- `stationRef?`: solo si `status = station`; identificador de la estación publicada (research.md R7).
- `highlights?`: lugares destacados que son ficha, no estación; Cochabamba incluye el Parque Nacional Tunari
  (§11.3) con sus escenas (18) y fuentes.
- `claims?`: afirmaciones adicionales, cada una con su fuente o aviso.

### HomeContent (contenido de la portada)

- `problemFigures`: lista de afirmaciones con cifra, fuente y fecha (de §4.2, RN-03).
- `image`: `{ status: "pending" }` **o** `{ src, alt: LocalizedText, source, license }` (FR-005).
- Los textos fijos de la portada (frase, explicación de NISAR y de uso, botón) son claves de `es.json`/`en.json`.

### AtlasContent (raíz del archivo)

- `schemaVersion`, `updatedAt`.
- `home`: HomeContent.
- `departments`: exactamente 9 DepartmentCard, uno por departamento de §10.4.

## Reglas de validación

1. Exactamente 9 fichas, con los departamentos de §10.4 y sin repetidos.
2. `phenomenon.es` y `scenes` coinciden literalmente con §10.4; `phenomenon.en` es su traducción.
3. Toda Claim y toda ficha tienen al menos una SourceRef **o** `sourceStatus: "in-verification"`.
4. Toda LocalizedText tiene `es` y `en` no vacíos.
5. Solo Santa Cruz tiene `status: station`; las otras 8 muestran «sin estación disponible» (RF-03).
6. Tunari aparece como `highlight` de Cochabamba, nunca como estación (§11.3, §8.2).
7. Una cifra sin fuente, fecha o método (o «método no reportado por la fuente») es un error de contenido
   (RN-03); un valor ausente es `not-reported` (RN-13).
8. Las cifras de §4.2 son contexto externo, no resultados del radar: no llevan el rango de RN-06.

## Relaciones

```text
AtlasContent ─┬─ HomeContent ── problemFigures[] ── SourceRef
              └─ DepartmentCard[9] ─┬─ SceneCount
                                    ├─ SourceRef[] | in-verification
                                    ├─ highlights[] (Tunari)
                                    └─ departmentId ──> atlas/departments.geojson (001, §17.3)
                                       stationRef ──> station.json publicado (001, §17.3)
```
