# Research: Portada y fichas del atlas

Decisiones de la fase 0 de P-ATLAS-03 (issue #63). Fuente de verdad: documento maestro v1.1.

## R1. Dónde vive el contenido de las fichas

- **Decision**: archivo de contenido estático de la web (`web/src/features/atlas/content/`), bilingüe, con fuente
  y fecha de consulta por afirmación. Propuesta de Angie, **acordada por el equipo el 2026-11-14** (consulta tras
  P-ATLAS-05). **Pendiente**: registrarla en el documento maestro, como pide la constitución (principio III).
- **Rationale**: §17.3 no tiene un archivo de fichas; `atlas/departments.geojson` solo trae límites con fuente,
  fecha y versión. Las fichas son contenido editorial de M-ATLAS (§19, RF-03, §10.4), no resultados del
  pipeline. Leer «la web solo muestra archivos ya publicados» (§17) como referido a los resultados era una
  interpretación; el acuerdo del equipo la confirma para las fichas.
- **Alternatives considered**: que el backend publique `atlas/fichas.json` (formato nuevo en §17.3: requiere
  consultar al equipo y a Mimi, §28); dejarlo pendiente (bloquearía el plan).

## R2. Una sola fuente para cada texto

- **Decision**: textos de interfaz (botón «Explorar Bolivia», etiquetas «Estación»/«Ficha», «sin estación
  disponible», «Fuente en verificación», «imagen pendiente», títulos) en `es.json`/`en.json`; contenido con fuente
  (fenómenos, cifras, fuentes) en el archivo de contenido, con sus campos `es` y `en` juntos.
- **Rationale**: el prompt pide textos en i18n y contenido con fuente por afirmación; duplicar el contenido en los
  dos sitios lo desincronizaría (RNF-03, PS-03).
- **Alternatives considered**: todo en `es.json`/`en.json` (pierde la fuente por afirmación); todo en el archivo
  de contenido (mezcla interfaz y contenido y rompe el patrón i18n de 001).

## R3. Identificador de departamento y `atlas/departments.geojson`

- **Decision**: el contenido de las fichas se enlaza con la geometría por el identificador de departamento que
  defina el contrato de 001. Este plan **no elige** nombres de campo.
- **Rationale**: en 001 hay una diferencia: `data-model.md` usa `id` y `name.es/en`, y
  `contracts/published-data.ts` usa `departmentId`, `nameEs` y `nameEn`; además, el contrato está rotulado
  «PROPUESTA DE DISEÑO: acordar campos exactos con M-PUBLICACIÓN». Resolverlo es de Joaco con Mimi.
- **Alternatives considered**: elegir uno de los dos (adelantaría una decisión de otro módulo).
- **Pendiente**: avisar a Joaco de la diferencia; el nombre del departamento visible sale del contenido de la
  ficha (es/en), y la geometría del GeoJSON.

## R4. Escenas NISAR por ficha

- **Decision**: se muestran los valores de §10.4 tal cual (incluido el rango «54–55» de Santa Cruz), con su
  origen: consulta CMR del 12 nov 2026, colección PROVISIONAL, 17 jun–12 nov 2026 (§10.2). No se recalculan.
- **Rationale**: §10.2 dice que las fichas usan los mismos conteos; recalcularlos sería un resultado nuevo sin
  respaldo (RN-03, RN-04).
- **Alternatives considered**: consultar el catálogo desde la web (fuera de §17, y daría cifras distintas).

## R5. Fuentes de las fichas

- **Decision**: cada fuente referencia una entrada de §31 (autor, año, título, enlace) con la fecha de consulta
  que da el documento; las fichas sin fuente en §31 (Pando, La Paz, Tarija, Chuquisaca) llevan el aviso «Fuente en
  verificación» hasta que Angie y Marian la verifiquen y el equipo la registre en §31.
- **Rationale**: §28 prohíbe inventar fuentes; HU-07 pide que la ficha de La Paz se vea igual.
- **Hechos de §31 por ficha**: ver la tabla de fichas de la spec. MAAP y el monitoreo del Zongo (IRD e IHH-UMSA)
  aparecen en §10.4 pero no en §31. Rabatel et al. (2013) y Los Tiempos (2026) están en §31; el cuerpo del
  documento no los cita, y su relación con las fichas la marca como «propuesta por el equipo» el catálogo de
  referencias del repositorio (`ai/referencias/catalogo.json`), no §31.
- **Trabajo de fuentes**: el equipo acordó buscar y verificar las fuentes que faltan en el repositorio del
  backend (`UraqiVisionBack`); el resultado vuelve como propuestas para §31.

## R6. Cifras de la portada

- **Decision**: solo cifras de §4.2 con la fuente, la fecha y el método que da el documento (si no lo da, «método
  no reportado por la fuente», RN-03) (Viceministerio de Defensa Civil
  vía Correo del Sur, 27 oct 2026; SIMB vía eju.tv, 21 jul 2026; FAN 2023; Gobernación de Cochabamba vía Correo del
  Sur, 20 jul 2026). Cuáles se muestran y su redacción es **propuesta** de M-ATLAS. Son contexto externo, no
  resultados del radar: no se les aplica el rango de sensibilidad de RN-06.
- **Rationale**: RN-03 y FR-004.

## R7. Enlace de Santa Cruz a su estación

- **Decision**: la ficha de Santa Cruz enlaza a `/station/:stationId` (ruta de 001) usando el identificador de
  la estación publicada (`station.json`); no se inventa un identificador. Si la estación aún no está publicada, la
  ficha muestra la estación como «no reportada» con su motivo (RN-13).
- **Rationale**: el identificador lo fija M-PUBLICACIÓN.

## R8. Imagen de portada

- **Decision**: espacio de imagen con fuente, licencia y texto alternativo es/en; muestra «imagen pendiente»
  hasta que el equipo aporte las imágenes (aclaración 1).
- **Rationale**: FR-005, RN-04, RN-12.
