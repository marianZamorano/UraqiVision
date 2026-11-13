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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
- **Ejecuta:** Angie, Marian
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
