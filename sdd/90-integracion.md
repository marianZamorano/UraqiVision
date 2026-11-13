---
id: INTEGRACION
titulo: Integración, recorrido y entrega
tipo: integracion
prefijo: INT
spec: specs/006-integracion
---

# SDD · INTEGRACION — Integración, recorrido y entrega

Une las áreas en un solo producto: Insight en la web, la coherencia entre el globo, el mapa y el panel, el recorrido
completo de §20.1, la entrega del hackathon (§25, §26) y la promoción a `qa` y `main`.

## 1. Ficha

| Campo | Valor |
|---|---|
| Responsables | Equipo. El recorrido en Playwright y la entrega son de Angie y Marian según §25 (Dom 14:00–19:00 y 19:00–23:00) |
| Interfaz de Insight | Sin responsable en §19 dentro del frontend; el contrato y las plantillas son de M-INSIGHT (Mimi, backend). Acuérdenlo antes de P-INT-04 |
| Revisión | Equipo; promoción a qa y main: todos los colaboradores excepto quien la abre |
| Repositorio | `UraqiVision` (frontend) |
| Spec | `specs/006-integracion` |
| Momento (§25) | Especificación antes del sábado · implementación Dom 14:00–19:00 · entrega Dom 19:00–23:00 (envío a las 23:00 como máximo) |

## 2. Alcance del documento maestro

| ID | Requisito (§13) | Prioridad |
|---|---|---|
| RF-16 | Insight: pregunta libre sobre la estación abierta, en el idioma elegido, citando la sección | MVP |
| RF-17 | Insight: 3 a 5 preguntas sugeridas por estación, en ambos idiomas | MVP |
| RF-18 | Insight: respaldo con textos de plantilla si el proveedor falla; ninguna pantalla vacía | MVP |
| RF-29 | Del globo al análisis conservando la selección (verificación de punta a punta) | MVP |
| RF-36 | Misma fecha en el globo, el mapa y el panel (verificación de punta a punta) | MVP |

Recorrido principal de §20.1 y demostración de §26. Historias: CU-01 a CU-05, HU-01 a HU-07.

## 3. Reglas y decisiones que aplican

- §21: Insight es un lector de radar; no calcula, no consulta internet, responde en el idioma elegido y cita la
  sección. RN-09, RN-10 y RN-14. RNF-06 (la clave nunca llega al navegador) y RNF-07 (límites de uso).
- **DP-04 pendiente** (Mimi): límites de Insight. **DP-06 pendiente** (Mimi): hospedaje. **DP-01 y DP-02
  pendientes** (Angie y Marian): láminas y guías de entrega 2026. No se deciden en un prompt.
- Promociones a qa y main solo cuando la persona las pide; aprobación de todos excepto quien abre la PR.

## 4. Contratos e integración

- **Llama**: `POST /api/insight` con `station_id`, `question` y `lang`; recibe `answer`, `citations` y `source`
  («ia» o «plantilla») (§21.1). La web solo conoce esa función (§21.2).
- **Lee**: las preguntas sugeridas de `station.json` (§17.3).
- **Integra**: el estado de selección compartido de M-MAPA y M-GLOBO, el panel y los estados de M-INTERFAZ y las
  fichas de M-ATLAS.

## 5. Calidad: pruebas y aceptación

- PS-05 (Insight: idioma, cita de sección y plantillas si falla), PS-06 (sin clave en el bundle), PS-09 (recorrido
  completo con Playwright en escritorio y celular: portada → globo → estación → análisis → descarga).
- Revisor de código vivo y CI/CD por rama en la promoción (`npm run codigo:revisar`).

## 6. Herramientas del repositorio

- Skills: `typed-api-integration`, `frontend-data-fetching`, `frontend-testing`, `responsive-visual-testing`,
  `qa-regression-analysis`, `entrega-hackathon`, `flujo-issues-y-pr`, `codigo-vivo`, `verification-before-completion`.
- Subagentes: `revisor-qa`, `revisor-interfaz`, `security-qa-engineer`, `release-readiness-reviewer`,
  `revisor-codigo-vivo`.
- MCP: `playwright` (contra localhost), `qa-evidence`, `devops-readiness`.
- Hooks: guarda de código vivo en las promociones, aprobaciones y estado de issues.

## 7. Riesgos y pendientes

- §24: costo o abuso de Insight → límites por sesión y plantillas de respaldo; reglas de Space Apps 2026 distintas
  a lo previsto (DP-01, DP-02).
- Depende de que el backend despliegue la función Insight (DP-06 sin decidir). Mientras tanto, la web usa las
  plantillas de respaldo, nunca respuestas inventadas.
- Responsable de la interfaz de Insight sin definir en §19 (ver Ficha).

## 8. Secuencia de prompts

### P-INT-01 · Especificar la integración
- **Orden:** 12
- **Fase:** 2 · Especificación
- **Comando:** speckit-specify
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** P-MAPA-01, P-ATLAS-01, P-INTERFAZ-01, P-GLOBO-01
- **Momento:** Antes del sábado 14
- **Produce:** specs/006-integracion/spec.md
- **Herramientas:** skills `documento-maestro`, `typed-api-integration`
- **Verificación:** cada requisito conserva su identificador; DP-04 y DP-06 marcadas como pendientes

```text
[SDD P-INT-01] /speckit-specify Feature 006-integracion (número 006, nombre corto integracion) del frontend de UraqiVision. Insight en la página de análisis, siempre a mano (§20.1): pregunta libre sobre la estación abierta en el idioma elegido, citando la sección de la que sale la respuesta (RF-16); 3 a 5 preguntas sugeridas por estación en ambos idiomas, leídas de station.json (RF-17); y respaldo con textos de plantilla si el proveedor falla, sin pantallas vacías ni errores técnicos (RF-18). Consume solo el contrato POST /api/insight de §21.1 (lo implementa UraqiVisionBack); la clave nunca llega al navegador (RNF-06); respeta RN-09, RN-10 y RN-14 al mostrar respuestas. Además, coherencia de punta a punta: la selección se conserva entre el globo y el mapa (RF-29) y la fecha es la misma en el globo, el mapa y el panel (RF-36); y el recorrido completo de §20.1 (portada → globo → estación → análisis → descarga) funciona en escritorio y celular. Los límites de uso de Insight (DP-04) y el hospedaje (DP-06) son decisiones pendientes: no las decidas.
```

### P-INT-02 · Planificar la integración
- **Orden:** 33
- **Fase:** 4 · Plan
- **Comando:** speckit-plan
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** P-INT-01
- **Momento:** Sáb 14:00–20:00
- **Produce:** specs/006-integracion/plan.md, contracts/
- **Herramientas:** skills `typed-api-integration`, `frontend-data-fetching`
- **Verificación:** el contrato de §21.1 coincide con el del backend

```text
[SDD P-INT-02] /speckit-plan Reutiliza el contrato de POST /api/insight definido en specs/001-base-web/contracts y confírmalo contra el de UraqiVisionBack (§21.1): si difieren, no elijas tú; regístralo como conflicto para que lo acuerden ambos repositorios. La web llama a una sola función (§21.2), con tiempo de espera, reintento y paso a plantillas si falla (RF-18). El recorrido de PS-09 se escribe en Playwright. No configures hospedaje (DP-06).
```

### P-INT-03 · Tareas de la integración
- **Orden:** 34
- **Fase:** 5 · Tareas
- **Comando:** speckit-tasks
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** P-INT-02
- **Momento:** Sáb 14:00–20:00
- **Produce:** specs/006-integracion/tasks.md
- **Herramientas:** skills `sdd-uraqivision`, `qa-regression-analysis`
- **Verificación:** cada tarea con responsable acordado, identificador y prueba (PS-05, PS-09)

```text
[SDD P-INT-03] /speckit-tasks Ordena por historia: Insight en la web (RF-16 a RF-18), coherencia de punta a punta (RF-29, RF-36) y recorrido completo (PS-09). Cada tarea lleva el responsable que acuerde el equipo (la interfaz de Insight no tiene responsable en §19 en el frontend; el recorrido en Playwright es de Angie y Marian según §25), su identificador y su prueba (PS-05, PS-06, PS-09). Prueba antes que implementación.
```

### P-INT-04 · Implementar la integración
- **Orden:** 38
- **Fase:** 7 · Implementación
- **Comando:** speckit-implement
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** P-INT-03, P-MAPA-07, P-INTERFAZ-07, P-GLOBO-06
- **Momento:** Dom 9:00–14:00
- **Produce:** Insight en la web y coherencia de punta a punta
- **Herramientas:** skills `test-driven-development`, `typed-api-integration`, `flujo-issues-y-pr`; subagente `security-qa-engineer`
- **Verificación:** PS-05 y PS-06 en verde; plantillas si la función no responde

```text
[SDD P-INT-04] /speckit-implement Implementa specs/006-integracion una tarea a la vez y prueba primero: Insight en la web contra el contrato de §21.1 con paso a plantillas si falla (RF-16 a RF-18, PS-05), sin ninguna clave en el navegador (PS-06), y la coherencia de selección y fecha entre el globo, el mapa y el panel (RF-29, RF-36). Si la función Insight aún no está desplegada, la web muestra las plantillas, nunca respuestas inventadas. Crea el issue y la rama tipo/N desde dev; un commit por tarea. Detente al terminar cada historia y muéstrame la evidencia.
```

### P-INT-05 · Verificar el recorrido completo
- **Orden:** 43
- **Fase:** 8 · Verificación
- **Comando:** speckit-converge
- **Ejecuta:** Angie, Marian
- **Revisa:** Equipo
- **Depende de:** P-INT-04, P-MAPA-08, P-ATLAS-07, P-INTERFAZ-08, P-GLOBO-08
- **Momento:** Dom 14:00–19:00
- **Produce:** recorrido PS-09 en verde y PR a dev
- **Herramientas:** subagentes `revisor-qa`, `revisor-interfaz`, `security-qa-engineer`; MCP `playwright`, `qa-evidence`; `npm run codigo:revisar`
- **Verificación:** PS-05, PS-06 y PS-09 con evidencia; sin código muerto

```text
[SDD P-INT-05] /speckit-converge Compara el código con specs/006-integracion y agrega como tareas lo que falte. Ejecuta el recorrido completo de PS-09 con Playwright en escritorio y celular (portada → globo → estación → análisis → descarga) y verifica PS-05 y PS-06 con evidencia ejecutada; analiza los resultados con el MCP qa-evidence. Pasa el revisor de código vivo (npm run codigo:revisar) y pide revisión a revisor-qa y security-qa-engineer. Con todo en verde, abre la PR a dev con «Closes #N».
```

### P-INT-06 · Preparar la entrega
- **Orden:** 44
- **Fase:** Entrega
- **Comando:** entrega-hackathon
- **Ejecuta:** Angie, Marian
- **Revisa:** Equipo
- **Depende de:** P-INT-05
- **Momento:** Dom 19:00–23:00
- **Produce:** checklist de la demo (§26) y de la entrega, con la declaración de uso de IA
- **Herramientas:** skills `entrega-hackathon`, `rigor-y-fuentes`, `metodo-y-creditos`; subagente `release-readiness-reviewer`
- **Verificación:** checklist completo; DP-01 y DP-02 resueltas por sus responsables

```text
[SDD P-INT-06] /entrega-hackathon estado. Revisa la entrega del frontend frente al plan de §25 y la demostración de §26: recorrido funcionando, textos en ambos idiomas, Acerca de con licencias y citas (RN-11), declaración de dónde y cómo se usó IA (§28) y formulario de entrega en inglés. Señala lo pendiente, en especial DP-01 y DP-02, sin decidirlas. Pide el veredicto del subagente release-readiness-reviewer (sin desplegar: DP-06).
```

### P-INT-07 · Pedir la promoción a qa y main
- **Orden:** 45
- **Fase:** Promoción
- **Comando:** flujo-issues-y-pr
- **Ejecuta:** Equipo
- **Revisa:** Equipo
- **Depende de:** P-INT-06
- **Momento:** Dom 19:00–23:00, solo cuando la persona lo pida
- **Produce:** PR dev → qa y, tras probar en preproducción, PR qa → main
- **Herramientas:** skills `flujo-issues-y-pr`, `codigo-vivo`; subagente `revisor-codigo-vivo`; guarda de código vivo
- **Verificación:** sin código roto ni muerto; aprobación de todos excepto quien abre la PR

```text
[SDD P-INT-07] /flujo-issues-y-pr Pido de forma explícita la promoción dev → qa del frontend. Antes de abrirla, pasa el revisor de código vivo (npm run codigo:revisar y el subagente revisor-codigo-vivo) y muéstrame los hallazgos con su plan; si hay errores, no la abras. Lista en la descripción todos los issues que lleva (node ai/scripts/issues-de-promocion.mjs dev qa). Después de probar en preproducción, la promoción qa → main se pide aparte. Ninguna se fusiona sin la aprobación de todos los colaboradores excepto quien la abre.
```

## 9. Definición de terminado

- [ ] Insight responde en el idioma elegido, cita la sección y usa plantillas si falla (PS-05).
- [ ] Ninguna clave en el bundle ni en el repositorio (PS-06).
- [ ] Recorrido PS-09 en verde en escritorio y celular.
- [ ] Entrega revisada con la declaración de uso de IA; DP-01 y DP-02 resueltas por sus responsables.
- [ ] Promociones abiertas solo a pedido, sin código muerto y con la aprobación de todos.
