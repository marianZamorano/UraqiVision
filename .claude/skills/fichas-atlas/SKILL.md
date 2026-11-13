---
name: fichas-atlas
description: Cómo redactar y revisar las fichas del atlas de los nueve departamentos de Bolivia en UraqiVision (RF-03, OE3, §10.4), la ficha de Tunari, el relato local (RF-13), las hipótesis con fuente (RF-12), las preguntas sugeridas de Insight (RF-17) y el calendario de la superficie (RF-04, Plus). Usar al escribir o revisar textos del atlas o de una estación.
---

# Fichas del atlas y textos de la estación

Fuente: §7, §10.2, §10.4, §11, RF-03, RF-04, RF-12, RF-13, RF-17 y §31 del documento maestro. Responsables:
Angie y Marian (M-ATLAS; revisa Joaco). Reglas de citas: skill `rigor-y-fuentes`.

## Contenido de cada ficha (RF-03)

1. **Fenómeno** que observa el radar en el departamento.
2. **Escenas NISAR** disponibles (conteo de la consulta al catálogo CMR del 12 nov 2026, §10.2 y §10.4).
3. **Al menos una fuente boliviana**, citada en APA 7 con su referencia de §31.
4. **Estado**: *estación* (con análisis) o *ficha*. Las fichas sin estación dicen **«sin estación disponible»**.
5. Texto breve y claro para ciudadanía y gestores (§7), en español e inglés.

## Los nueve departamentos (copiado de §10.4; si cambia el documento, manda el documento)

| Departamento | Fenómeno | Escenas NISAR | Fuente boliviana | Estado |
|---|---|---|---|---|
| Santa Cruz | Chaqueos, desmonte y recuperación del bosque | 54–55 | FAN, ABT, SENAMHI | Estación |
| Cochabamba | Incendios en el Parque Tunari | 18 | Gobernación (prensa), SENAMHI | Ficha |
| Beni | Inundación y humedales de Moxos | 29 | SENAMHI; Ovando et al. (2016) | Ficha |
| Pando | Deforestación amazónica | 26 | MAAP | Ficha |
| La Paz | Glaciares de la Cordillera Real | 39 | Monitoreo del Zongo desde 1991 (IRD e IHH-UMSA) | Ficha |
| Oruro | Desecamiento del lago Poopó | 37 | SENAMHI; Satgé et al. (2017) | Ficha |
| Potosí | Salar de Uyuni como superficie de referencia | 55 | Fricker et al. (2005) | Ficha |
| Tarija | Incendios del valle central (jul 2026) | 29 | SENAMHI (prensa) | Ficha |
| Chuquisaca | Contexto general | 27 | Fuentes nacionales | Ficha |

**Tunari** (§11.3): queda como ficha con sus escenas (18; órbitas 017A y 169D, 25 jun–13 oct 2026) y fuentes.
La pregunta de si la banda L ve incendios andinos pequeños en laderas es para una etapa posterior: no la
presentes como resultado.

## Textos de la estación San Ignacio de Velasco

- **Hipótesis (RF-12)**: cada una cita al menos una fuente y se presenta como hipótesis (§11.1 y §11.2). Las
  dos preguntas: «¿dónde y cuándo quemó el fuego?» y «¿quema o desmonte?».
- **Relato local (RF-13)**: texto breve del equipo sobre el lugar, en primera persona del equipo, sin cifras
  que no tengan fuente. Lo escribe el equipo; un asistente puede pulirlo, no inventarlo.
- **Preguntas sugeridas (RF-17)**: de 3 a 5 por estación, en ambos idiomas, respondibles **solo** con el
  contenido de la estación, el método y el glosario (RN-09); cada una con su respuesta de plantilla para el
  respaldo de Insight (RF-18).
- Los textos de la estación van en `station.json` con forma `{ es, en }` (§17.3). Ese archivo lo publica el
  backend (`UraqiVisionBack`): coordina ahí los textos de la estación; las fichas del atlas viven en la web.

## Calendario de la superficie (RF-04, Plus)

Qué cambia cada mes por región (quemas, lluvias), con fuentes. Es **Plus**: solo si el equipo lo pide y sobra
tiempo.

## Reglas

- Nada de cifras o fechas que no estén en el documento o en una fuente citada.
- Los fenómenos de las fichas son contexto: no son resultados del radar procesados por UraqiVision, salvo en
  la estación. Dilo claramente para no confundir al lector (RN-04).
- Cada ficha en español e inglés con el mismo contenido.

## Checklist

- [ ] Nueve fichas con fenómeno, escenas, al menos una fuente y estado.
- [ ] «Sin estación disponible» en los departamentos sin estación.
- [ ] Hipótesis con fuente y marcadas como hipótesis.
- [ ] Relato local escrito por el equipo.
- [ ] 3 a 5 preguntas sugeridas con respuesta de plantilla, en ambos idiomas.

## Referencias del documento maestro (§31)

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Autoridad de Bosques y Tierra (2026). Boletín oficial 222 de focos de calor** — <https://www.abt.gob.bo/images/2026/Focos%20de%20Calor/2026%2008%2010%20Boletin%20oficial%20222%20MM.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Contexto oficial de incendios: cítala en la ficha de Santa Cruz, en las hipótesis de la estación y en Acerca de; es contexto, no validación.
- **Bonafilia, Tellman, Anderson e Issenberg (2020). Sen1Floods11** — <https://doi.org/10.1109/CVPRW50498.2020.00113>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RF-03. Antecedente de detección de inundaciones con radar (el documento no la cita en el cuerpo): solo como contexto de la ficha del Beni o de la evolución futura (§27); las inundaciones del Beni están fuera del MVP (§8.2).
- **Correo del Sur (2026, 20 de julio). Cochabamba registra 37 incendios forestales y más de 1.200 hectáreas afectadas en 2026** — <https://correodelsur.com/sociedad/20260720/cochabamba-registra-37-incendios-forestales-y-mas-de-1-200-hectareas-afectadas-en-2026.html>
  Citada en: §4.2. Aplica a: RF-01, RF-03. Fuente del dato de Cochabamba en la portada o en la ficha de Cochabamba (Tunari): cítala con su fecha junto a la cifra (RN-03).
- **Correo del Sur (2026, 27 de octubre). Bolivia reporta menos del 1% de afectación por incendios forestales respecto a años críticos** — <https://correodelsur.com/sociedad/20261027/bolivia-reporta-menos-del-1-de-afectacion-por-incendios-forestales-respecto-a-anos-criticos.html>
  Citada en: §4.2. Aplica a: RF-01. Fuente de las cifras nacionales del problema en la portada: cítala con su fecha junto a la cifra (RN-03).
- **eju.tv (2026, 21 de julio). Bolivia cierra este martes con 2.835 focos de calor; Santa Cruz el más afectado** — <https://eju.tv/?p=5043100>
  Citada en: §4.2. Aplica a: RF-01, RF-13. Fuente del dato de focos de San Ignacio en la portada y el relato de la estación: cítala con su fecha; es contexto del problema, el análisis radar usa eventos posteriores al 10 de agosto (§11).
- **Fricker et al. (2005). Assessment of ICESat performance at the Salar de Uyuni, Bolivia** — <https://doi.org/10.1029/2005GL023423>
  Citada en: §10.4. Aplica a: RF-03. Cítala en la ficha de Potosí.
- **Fundación Amigos de la Naturaleza (2023). Deforestación en Bolivia 1956–2022** — <https://fan-bo.org/wp-content/uploads/2024/08/Deforestacionen-Bolivia-1956-2022.pdf>
  Citada en: §4.2, §10.3, §11. Aplica a: RF-01, RF-03, RF-12, RF-13, MC-06. Cítala en la portada, en la ficha de Santa Cruz, en el relato y las hipótesis de San Ignacio y como contexto de la pregunta 2 (quema o desmonte).
- **Fundación Amigos de la Naturaleza (s. f.). SATRIFO: Sistema de alerta temprana de riesgo de incendios forestales** — <https://incendios.fan-bo.org/Satrifo/mapa-interactivo/>
  Citada en: §10.3. Aplica a: RF-03, RF-12. Contexto de áreas quemadas históricas para fichas e hipótesis; no sustituye la validación de §23.1.
- **Los Tiempos (2026, 10 de julio). Cuatro incendios afectaron al Parque Tunari en lo que va del año** — <https://www.lostiempos.com/actualidad/cochabamba/20260710/cuatro-incendios-afectaron-al-parque-tunari-que-va-del-ano>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RF-03. Fuente de prensa para la ficha de Cochabamba y Tunari (§10.4: «Gobernación (prensa)», §11.3).
- **Maillard (2023). Post-fire natural regeneration trends in Bolivia: 2001–2021** — <https://doi.org/10.3390/fire6010018>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RF-03, RF-12. Regeneración después del fuego en Bolivia: contexto de «recuperación del bosque» de la ficha de Santa Cruz (§10.4) y de las hipótesis; el documento no la cita en el cuerpo.
- **MapBiomas Bolivia (s. f.). Capas** — <https://bolivia.mapbiomas.org/en/capas/>
  Citada en: §10.3, §17. Aplica a: RF-14, RF-35, RF-03. Fuente de límites, áreas protegidas y territorios: cada capa que la use muestra fuente y año (RF-14, RF-35) y aparece en Acerca de.
- **Oakes, Hardy, Bunting y Rosenqvist (2024). RadWet-L** — <https://doi.org/10.3390/rs16122078>
  Citada en: §27. Aplica a: RF-03. Evolución futura (§27): solo como contexto de la ficha del Beni; no implementes la estación del Beni en el MVP (§8.2).
- **Ovando et al. (2016). Extreme flood events in the Bolivian Amazon wetlands** — <https://doaj.org/article/1c212c78528541e28a5421fbd6b2ef09>
  Citada en: §10.4. Aplica a: RF-03. Cítala en la ficha del Beni.
- **Rabatel et al. (2013). Current state of glaciers in the tropical Andes** — <https://doi.org/10.5194/tc-7-81-2013>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RF-03. Contexto de la ficha de La Paz (glaciares de la Cordillera Real, §10.4); el documento no la cita en el cuerpo.
- **Satgé et al. (2017). Role of climate variability and human activity on Poopó Lake droughts between 1990 and 2015** — <https://doi.org/10.3390/rs9030218>
  Citada en: §10.4. Aplica a: RF-03. Cítala en la ficha de Oruro.
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico de focos de calor en Bolivia** — <https://senamhi.gob.bo/focoscalor/2026/FC_7_JULIO_2026/Pron_Focos_Bolivia_20260713.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-12, RF-24. Cítala en las fichas que usen el pronóstico de focos y en Acerca de; es contexto (un pronóstico), no un resultado ni una validación (RN-10).
- **Servicio Nacional de Meteorología e Hidrología (2026). Pronóstico hidrológico** — <https://senamhi.gob.bo/meteorologia/boletines/pronostico_hidrologico/2026/JULIO/RESUMEN%20EN%20PLANILLA%20PRON%C3%93STICO%20HIDROL%C3%93GICO%20SENAMHI%20LUNES%2027-07-2026.pdf>
  Citada en: §10.3, §10.4. Aplica a: RF-03, RF-24. Cítala en las fichas que usen el pronóstico hidrológico (inundaciones o sequía) y en Acerca de; es contexto, no un resultado.

<!-- referencias:fin -->
