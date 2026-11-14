---
id: M-ATLAS
titulo: Portada y fichas del atlas
tipo: modulo
prefijo: ATLAS
spec: specs/003-portada-atlas
---

# SDD · M-ATLAS — Portada y fichas del atlas

La puerta de entrada: la portada que explica el problema en menos de un minuto y las fichas bilingües de los nueve
departamentos de Bolivia, incluida la de Tunari (§11.3), con sus fuentes.

## 1. Ficha

| Campo | Valor |
|---|---|
| Módulo (§19) | M-ATLAS · «Portada, fichas de departamento y calendario» |
| Responsables | Angie y Marian |
| Reparto acordado (#42, #46) | Organización interna del equipo; §19 no cambia. **Angie** ejecuta M-ATLAS: portada (RF-01), fichas (RF-03), Plus RF-04, y además DP-01. Marian revisa sus PR junto con Joaco |
| Revisor | Joaco |
| Repositorio | `UraqiVision` (frontend) |
| Spec | `specs/003-portada-atlas` |
| Momento (§25) | Antes: textos de fichas · Sáb 9:00–13:00 portada · Sáb 14:00–20:00 fichas bilingües |

## 2. Alcance del documento maestro

| ID | Requisito (§13) | Prioridad |
|---|---|---|
| RF-01 | Portada: el problema, qué es NISAR y cómo usar la web en menos de un minuto; un usuario nuevo llega al atlas en un clic | MVP |
| RF-03 | Ficha de departamento: fenómeno, escenas NISAR, fuentes y estado (estación o ficha); 9 fichas con al menos una fuente; sin estación dice «sin estación disponible» | MVP |
| RF-04 | Calendario de la superficie: qué cambia en cada mes por región, con fuentes | Plus |

Contenido base: §10.4 (los nueve departamentos), §11.3 (Tunari como ficha), §20.1 (portada: una frase del
problema, una imagen radar frente a una óptica con humo y el botón «Explorar Bolivia»). Historias: HU-07 y CU-02.
Fuera del área: la estación de Tunari (pasa a evolución futura, §8.2).

## 3. Reglas y decisiones que aplican

- RN-03 (cada cifra con fuente, fecha y método), RN-05 (causas como hipótesis con fuente), RN-11 (cita de datos
  NISAR), RN-12 (sin logos ni marcas de la NASA en contenido generado con IA; imágenes de IA con marca de agua).
- RNF-03 (100 % es/en), RNF-04 (accesibilidad), RNF-01 (la portada carga en menos de 3 s sin esperar al globo).
- §28: no inventar datos, cifras ni fuentes; cada fuente con fecha de consulta.
- DP-01 (láminas de la demo) y DP-02 (guías 2026) son de Angie y Marian pero no bloquean este SDD.

## 4. Contratos e integración

- **Consume**: `atlas/departments.geojson` (§17.3: límites con fuente, fecha y versión, común a todo el sitio) y el
  `station.json` de cada estación para su resumen.
- **Produce**: textos bilingües de portada y fichas (es.json y en.json), y la lista textual de departamentos y
  estaciones, alternativa al globo (RNF-04).
- **Se coordina con**: M-GLOBO (al elegir un departamento en el globo se abre su ficha, §20.1), M-INTERFAZ (idioma,
  glosario, estados).

## 5. Calidad: pruebas y aceptación

- PS-03 (contenido en ambos idiomas), PS-04 (cambio de idioma), PS-07 (accesibilidad), PS-09 (tramo portada →
  globo del recorrido).
- Criterios de §13: el atlas en un clic desde la portada (RF-01); 9 fichas con al menos una fuente y el aviso «sin
  estación disponible» donde corresponde (RF-03).

## 6. Herramientas del repositorio

- Skills: `fichas-atlas`, `rigor-y-fuentes`, `interfaz-bilingue-accesible`, `react-component-architecture`,
  `design-system-tokens`, `frontend-testing`, `test-driven-development`.
- Subagentes: `revisor-interfaz`, `uiux-design-auditor`, `guardian-alcance`.
- MCP: `playwright` (contra localhost).
- Hooks: post-edit (paridad de claves es/en), pre-commit, código vivo en la promoción.

**Referencias del documento maestro (§31)**

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
- **NASA Space Apps Challenge (2026). Dancing with the SARs** — <https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/>
  Citada en: §3. Aplica a: RF-01, RF-24. Enlázalo en Acerca de y en la entrega; sin logos ni marcas de la NASA en contenido generado con IA (RN-12).
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

## 7. Riesgos y pendientes

- §28: el riesgo principal del atlas es inventar datos o fuentes; cada afirmación necesita su fuente con fecha.
- §24: reglas de Space Apps 2026 distintas a lo previsto (DP-01, DP-02) pueden cambiar la portada de la demo.
- RF-12 y RF-13 (hipótesis y relato local de la estación) no tienen módulo en §19: acuerden quién los redacta (la
  skill `fichas-atlas` cubre su redacción).

## 8. Secuencia de prompts

### P-ATLAS-01 · Especificar
- **Orden:** 9
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-PROY-01
- **Momento:** Antes del sábado 14 (textos de fichas)
- **Produce:** specs/003-portada-atlas/spec.md
- **Herramientas:** skills `documento-maestro`, `fichas-atlas`, `rigor-y-fuentes`
- **Verificación:** cada requisito conserva su identificador; ninguna fuente inventada

```text
[SDD P-ATLAS-01] /speckit-specify Feature 003-portada-atlas (número 003, nombre corto portada-atlas) del frontend de UraqiVision, módulo M-ATLAS de §19 (responsables Angie y Marian). Portada que explica el problema, qué es NISAR y cómo usar la web en menos de un minuto de lectura, con una frase del problema, una imagen radar frente a una óptica con humo y el botón «Explorar Bolivia», desde la que un usuario nuevo llega al atlas en un clic (RF-01, §20.1). Fichas de los nueve departamentos de Bolivia (§10.4) con fenómeno, escenas NISAR, fuentes y estado (estación o ficha); cada ficha con al menos una fuente y los departamentos sin estación dicen «sin estación disponible» (RF-03); Tunari es una ficha, no una estación (§11.3). Todo en español e inglés (RNF-03), accesible (RNF-04), con fuentes con fecha y causas como hipótesis (RN-03, RN-05, RN-11, RN-12). Historias: HU-07 y CU-02. Plus si sobra tiempo: calendario de la superficie (RF-04). Fuera de alcance: la estación de Tunari (§8.2).
```

### P-ATLAS-02 · Aclarar
- **Orden:** 17
- **Fase:** 3 · Aclaraciones
- **Comando:** speckit-clarify
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-01
- **Momento:** Antes del sábado 14
- **Produce:** sección Clarifications de specs/003-portada-atlas/spec.md
- **Herramientas:** skills `documento-maestro`, `fichas-atlas`
- **Verificación:** máximo 5 preguntas; pendientes marcados

```text
[SDD P-ATLAS-02] /speckit-clarify Aclara la spec 003-portada-atlas con un máximo de 5 preguntas, una a la vez, con una opción recomendada basada en el documento maestro. Prioriza: qué campos tiene cada ficha según §10.4, cómo se muestra el estado «ficha» frente a «estación», de dónde sale la imagen radar frente a óptica de la portada (fuente y licencia) y qué se hace si un departamento aún no tiene fuente verificada. No inventes fuentes: lo que falte queda como pendiente.
```

### P-ATLAS-03 · Planificar
- **Orden:** 18
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-02
- **Momento:** Antes del sábado 14
- **Produce:** specs/003-portada-atlas/plan.md, data-model.md
- **Herramientas:** skills `react-component-architecture`, `interfaz-bilingue-accesible`, `design-system-tokens`
- **Verificación:** textos en es.json y en.json; reutiliza la base de 001-base-web

```text
[SDD P-ATLAS-03] /speckit-plan Reutiliza la app y la capa de datos de specs/001-base-web. Textos de portada y fichas en es.json y en.json con react-i18next (§18); el contenido de las fichas en un formato de datos con su fuente y fecha de consulta por afirmación. La portada no carga CesiumJS (RNF-01). La lista textual de departamentos y estaciones sirve como alternativa al globo (RNF-04). Los departamentos leen atlas/departments.geojson (§17.3). Marca como propuesta lo que el documento no fija.
```

### P-ATLAS-04 · Tareas
- **Orden:** 19
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-03
- **Momento:** Antes del sábado 14
- **Produce:** specs/003-portada-atlas/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `fichas-atlas`
- **Verificación:** cada tarea con responsable, identificador y prueba

```text
[SDD P-ATLAS-04] /speckit-tasks Ordena por historia y en el orden de §25: portada el sábado de 9:00 a 13:00, fichas bilingües de 14:00 a 20:00 (los textos se pueden adelantar). Cada tarea lleva su responsable según §19 (Angie o Marian), su identificador y su prueba (PS-03, PS-04, PS-07). Incluye una tarea de revisión de fuentes con la skill rigor-y-fuentes. Prueba antes que implementación; [P] en las paralelizables.
```

### P-ATLAS-05 · Analizar
- **Orden:** 20
- **Fase:** 6 · Análisis
- **Comando:** speckit-analyze
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-04
- **Momento:** Antes del sábado 14
- **Produce:** informe de coherencia (⛔ espera «apruebo»)
- **Herramientas:** subagente `guardian-alcance`
- **Verificación:** sin hallazgos críticos; la persona escribe «apruebo»

```text
[SDD P-ATLAS-05] /speckit-analyze Revisa la coherencia entre spec.md, plan.md y tasks.md de specs/003-portada-atlas y pásalos por el subagente guardian-alcance (alcance de §8, reglas de §16 y §28). Lista los hallazgos por severidad y detente hasta que la persona escriba «apruebo».
```

### P-ATLAS-06 · Implementar portada y fichas
- **Orden:** 26
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-05, P-PROY-07
- **Momento:** Sáb 9:00–13:00 portada · Sáb 14:00–20:00 fichas
- **Produce:** portada (RF-01) y 9 fichas bilingües (RF-03)
- **Herramientas:** skills `test-driven-development`, `fichas-atlas`, `rigor-y-fuentes`, `flujo-issues-y-pr`
- **Verificación:** PS-03 y PS-04 en verde; cada ficha con al menos una fuente

```text
[SDD P-ATLAS-06] /speckit-implement Implementa specs/003-portada-atlas una historia a la vez y prueba primero: primero la portada (RF-01), después las nueve fichas bilingües (RF-03). Cada afirmación de una ficha lleva su fuente con fecha de consulta (skill rigor-y-fuentes); si una fuente no está verificada, se marca como pendiente en vez de inventarla. Crea el issue y la rama tipo/N desde dev (skill flujo-issues-y-pr); un commit por tarea con su identificador. Detente al terminar cada historia y muéstrame la evidencia.
```

### P-ATLAS-07 · Verificar
- **Orden:** 40
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Angie
- **Revisa:** Joaco
- **Depende de:** P-ATLAS-06
- **Momento:** Dom 14:00–19:00
- **Produce:** informe de verificación y PR a dev
- **Herramientas:** subagentes `revisor-interfaz`, `uiux-design-auditor`, `revisor-qa`; MCP `playwright`; `npm run codigo:revisar`
- **Verificación:** criterios de §13 con evidencia; revisión de Joaco

```text
[SDD P-ATLAS-07] /speckit-converge Compara el código con specs/003-portada-atlas y agrega como tareas lo que falte. Verifica con evidencia ejecutada los criterios de §13 de RF-01 y RF-03, el contenido en ambos idiomas (PS-03), la accesibilidad (PS-07) y la portada en escritorio y celular con el MCP playwright contra localhost; revisa fuentes y citas con la skill rigor-y-fuentes y el revisor de código vivo (npm run codigo:revisar). Pide revisión a revisor-interfaz y revisor-qa, y la revisión humana de Joaco (revisor de M-ATLAS según §19). Con todo en verde, abre la PR a dev con «Closes #N».
```

## 9. Definición de terminado

- [ ] La portada explica el problema en menos de un minuto y lleva al atlas en un clic (RF-01).
- [ ] Nueve fichas bilingües, cada una con al menos una fuente con fecha; «sin estación disponible» donde aplica.
- [ ] Ninguna fuente, cifra ni dato inventado (§28); causas como hipótesis (RN-05).
- [ ] PS-03, PS-04 y PS-07 en verde; revisado por Joaco; sin código muerto.
- [ ] PR a dev fusionada y el historial del SDD registrado.
