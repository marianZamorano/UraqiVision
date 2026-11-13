---
name: qa-test-strategy
description: Define la estrategia de pruebas de un proyecto o funcionalidad - alcance, niveles (unitario, integración, sistema, aceptación, E2E), tipos funcionales y no funcionales, análisis de riesgos con matriz probabilidad×impacto, priorización, entornos, datos, criterios de entrada/salida y trazabilidad. Usar cuando se pida una estrategia o plan de pruebas, priorizar qué probar o evaluar riesgos de calidad.
---

# QA Test Strategy

## Propósito

Decidir **qué probar, a qué nivel, con qué profundidad y en qué orden** según el riesgo, y dejarlo trazable a
requisitos. La estrategia se basa en el contexto real (`qa-project-discovery`), no en supuestos.

## Prerrequisitos

- Resultado de `qa-project-discovery` (o contexto equivalente aportado por la persona).
- Requisitos, historias de usuario o criterios de aceptación disponibles (si no existen, regístralo como riesgo).

## Procedimiento

1. **Alcance**: lista funcionalidades dentro/fuera de alcance y supuestos.
2. **Identifica riesgos** por área (funcional, seguridad, datos, rendimiento, integración, usabilidad,
   cumplimiento). Para cada uno estima probabilidad e impacto (1–5) con su justificación (complejidad,
   frecuencia de cambio, historial de defectos, criticidad de negocio, exposición).
3. **Calcula la matriz de riesgo**:
   ```bash
   node "ai/qa/scripts/risk-matrix.mjs" --input riesgos.json
   ```
   Formato de `riesgos.json`: ver `--help` o `ai/qa/tests/fixtures/risks.json`.
4. **Asigna niveles y tipos** de prueba por área según la pirámide (muchas unitarias, menos integración, pocas
   E2E) ajustada al riesgo: P1 → funcionales + negativas + límites + integración + no funcionales + regresión
   automatizada; P4 → smoke/exploratorio.
5. **Enfoques**: caja negra (comportamiento/contrato), caja blanca (cobertura de ramas en lógica crítica),
   caja gris (API + verificación en base de datos). Incluye sesiones exploratorias con charter para áreas nuevas.
6. **Entornos y datos**: dónde se ejecuta cada nivel, aislamiento, datos sintéticos, mocks vs. dependencias reales.
7. **Criterios de entrada/salida y quality gates** (enlaza con `qa-quality-gates`).
8. **Trazabilidad**: matriz requisito → riesgo → casos → automatización → evidencia.
9. Redacta la estrategia con [templates/test-strategy.md](templates/test-strategy.md).

## Criterios de decisión

| Señal | Decisión |
|---|---|
| Score ≥ 15 (crítico) | Automatizar y ejecutar en cada cambio; revisión de seguridad si toca auth/datos |
| Lógica de negocio compleja y aislable | Unitarias con tablas de casos (`qa-test-design`) |
| Fronteras entre servicios/DB | Integración con dependencias reales efímeras (`qa-integration-testing`) |
| Contrato consumido por terceros | Contract testing (`qa-contract-testing`) |
| Flujos críticos de usuario | Pocos E2E estables (`qa-automation`) |
| Requisitos de latencia/volumen | `qa-performance-testing` con umbrales acordados |
| Funcionalidad nueva o ambigua | Exploratorio con charter y time-box |

## Entradas y salidas

- **Entradas**: contexto del proyecto, requisitos, riesgos conocidos, restricciones (tiempo, entornos).
- **Salidas**: documento de estrategia (plantilla), matriz de riesgos, matriz de trazabilidad, lista de
  pruebas no ejecutables y su motivo.

## Criterios de éxito

- Todo riesgo P1/P2 tiene al menos un tipo de prueba asignado y un criterio de salida medible.
- Lo no cubierto se declara como riesgo residual aceptado o pendiente.

## Manejo de errores

- Requisitos ausentes → documenta supuestos y pide validación a la persona; no inventes requisitos.
- `risk-matrix` exit 2 → valores fuera de 1–5 o ids ausentes: corrige la entrada.

## Seguridad

Solo lectura y razonamiento. No ejecutes pruebas en esta skill. No incluyas datos reales ni secretos en ejemplos.

## Aprobación humana

Guardar la estrategia en el repositorio requiere aprobación explícita (ruta y contenido). La estrategia no
autoriza por sí misma ninguna ejecución: cada ejecución posterior tiene su propio plan y aprobación.
Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/risk-matrix.mjs" --input "ai/qa/tests/fixtures/risks.json"
```
R1 debe aparecer primero con prioridad P1.

## Referencias

- roadmap.sh/qa: *Test Prioritization*, *Testing Approaches*, *SDLC Delivery Model*, *Testing Techniques*, *Test Planning*.
- ISTQB Foundation: pruebas basadas en riesgo.
