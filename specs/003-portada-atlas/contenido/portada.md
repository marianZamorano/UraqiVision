# Portada (RF-01, §20.1): borrador

- **Estado:** borrador para revisar (revisan Marian y Joaco, §19). Issue #77, tarea T012 y parte de T011.
- **Destino:** cuando exista la base web (`specs/001-base-web`), los textos fijos pasan a `es.json`/`en.json`
  (claves `home.*`, ver `textos-interfaz.md`) y las cifras al archivo de contenido del atlas (data-model.md).
- **Origen:** cada afirmación sale del documento maestro v1.1 (§4.2, §4.3, §9.1, §20.1) o de §31. Nada más.
- **Redacción y traducción al inglés:** **propuesta** de M-ATLAS; el contenido no se puede ampliar sin fuente.
- **Lectura:** unas 150 palabras en español, pensadas para leerse en menos de un minuto (SC-001); se verifica
  en T031.

---

## Español

### Frase del problema (`home.problema`)

Hasta el 11 de octubre de 2026, los incendios afectaron 1,25 millones de hectáreas en Bolivia.
[cifra 1]

### Qué es NISAR (`home.nisar`)

NISAR es una misión de radar de la NASA y la ISRO. El radar emite su propia energía, así que observa de día,
de noche, con humo y con nubes. Su banda L, de unos 24 cm de longitud de onda, penetra la copa de los
árboles: cuando el fuego o el desmonte eliminan la estructura del bosque, la señal que mide (HV) baja.

Esa caída indica pérdida de vegetación, pero por sí sola no dice si fue fuego, desmonte o la caída natural de
hojas del bosque seco en invierno. Por eso la combinamos con focos de calor e imágenes ópticas, y presentamos las causas como hipótesis.

### Cómo usar la web (`home.uso`)

Pulsa «Explorar Bolivia», elige un departamento en el globo o en la lista y lee su ficha. En Santa Cruz,
entra a la estación San Ignacio de Velasco para ver su análisis.

### Botón (`home.explorar`)

Explorar Bolivia

### Imagen (`home.imagen`)

Imagen pendiente: radar frente a óptica con humo. *(FR-005: las imágenes las aporta el equipo con fuente,
licencia y texto alternativo; hasta entonces se muestra este aviso.)*

---

## English

### Problem statement (`home.problema`)

By October 11, 2026, fires had affected 1.25 million hectares in Bolivia. [figure 1]

### What NISAR is (`home.nisar`)

NISAR is a NASA–ISRO radar mission. Radar emits its own energy, so it observes day and night, through smoke
and clouds. Its L-band, with a wavelength of about 24 cm, penetrates the tree canopy: when fire or
clearing removes the forest structure, the signal it measures (HV) drops.

That drop indicates vegetation loss, but on its own it does not say whether it was fire, clearing or the
natural leaf fall of the dry forest in winter. That is why we combine it with heat hotspots and optical images, and
present causes as hypotheses.

### How to use the site (`home.uso`)

Press "Explore Bolivia", choose a department on the globe or in the list and read its profile. In Santa Cruz,
open the San Ignacio de Velasco station to see its analysis.

### Button (`home.explorar`)

Explore Bolivia

### Image (`home.imagen`)

Image pending: radar versus optical with smoke. *(FR-005: the team provides the images with source, license
and alternative text; until then this notice is shown.)*

---

## Cifras del problema (RN-03: fuente, fecha y método)

Solo cifras de §4.2. Son contexto externo, no resultados del radar: no llevan el rango de RN-06. Cuáles se
muestran en la portada es **propuesta** (la frase usa la cifra 1; las demás pueden ir debajo).

| # | Cifra (es) | Figure (en) | Fuente (§31) | Fecha | Método |
|---|---|---|---|---|---|
| 1 | Los incendios de 2026 afectaron 1,25 millones de hectáreas hasta el 11 de octubre; en 2024 superaron los 10 millones | 2026 fires affected 1.25 million hectares up to October 11; in 2024 they exceeded 10 million | Viceministerio de Defensa Civil, vía Correo del Sur. (2026, 27 de octubre). *Bolivia reporta menos del 1% de afectación por incendios forestales respecto a años críticos* | 27 oct 2026 | Método no reportado por la fuente |
| 2 | El 21 de julio de 2026, San Ignacio de Velasco fue el municipio con más focos de calor del país: 735 de 2.835 | On July 21, 2026, San Ignacio de Velasco was the municipality with the most heat hotspots in the country: 735 of 2,835 | SIMB, vía eju.tv. (2026, 21 de julio). *Bolivia cierra este martes con 2.835 focos de calor; Santa Cruz el más afectado* | 21 jul 2026 | Método no reportado por la fuente |
| 3 | San Ignacio de Velasco fue el primer municipio del país en deforestación en 2021–2022, con 117.659 ha | San Ignacio de Velasco ranked first in the country for deforestation in 2021–2022, with 117,659 ha | Fundación Amigos de la Naturaleza. (2023). *Deforestación en Bolivia 1956–2022* | 2023 | Con Landsat y MapBiomas Bolivia |
| 4 | Cochabamba registró 37 incendios forestales y más de 1.200 ha afectadas en 2026 hasta julio | Cochabamba recorded 37 forest fires and more than 1,200 ha affected in 2026 up to July | Gobernación de Cochabamba, vía Correo del Sur. (2026, 20 de julio). *Cochabamba registra 37 incendios forestales y más de 1.200 hectáreas afectadas en 2026* | 20 jul 2026 | Método no reportado por la fuente |

Fecha de consulta de todas las fuentes web: 12 de noviembre de 2026 (§31).

## Respaldo de cada afirmación del texto

| Afirmación | Respaldo |
|---|---|
| NISAR es una misión de radar de la NASA y la ISRO | Título del manual en §31: NISAR. (2025). *NASA-ISRO SAR (NISAR) mission science users' handbook* (2.ª ed.). Relación propuesta por el equipo según `ai/referencias/catalogo.json` |
| Observa de día, de noche, con humo y con nubes | §4.3 |
| Banda L de unos 24 cm que penetra la copa | §4.3 |
| Cuando el fuego o el desmonte eliminan la estructura, la señal (HV) baja | §4.3 |
| La caída no dice sola si fue fuego, desmonte o caída de hojas | §9.1 |
| Se combina con focos de calor e imágenes ópticas; causas como hipótesis | §9.1, RN-05 |
| Recorrido: Explorar Bolivia → globo o lista → ficha → estación | §20.1, RF-01, aclaración 2 de la spec |

## Fuera de este borrador (no se escribe)

- Fecha de lanzamiento, órbita, revisita o resolución de NISAR: el documento no las da.
- La cita formal de los datos NISAR (RN-11): pendiente de la guía vigente de la NASA.
- Logos o marcas de la NASA (RN-12) e imágenes.
- Insight desde las fichas (pendiente, FR-023) y cualquier resultado de la estación (RN-04).
