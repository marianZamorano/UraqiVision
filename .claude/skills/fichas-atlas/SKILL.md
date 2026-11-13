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
- Los textos van en `station.json` con forma `{ es, en }` (skill `publicacion-estacion`).

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
