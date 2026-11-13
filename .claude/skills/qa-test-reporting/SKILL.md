---
name: qa-test-reporting
description: Genera informes de pruebas basados en evidencia - resultados de ejecución (JUnit, Jest/Vitest), rendimiento (k6), quality gates, métricas, defectos y pruebas no ejecutadas - separando hechos verificados, hipótesis y recomendaciones, sin afirmar éxitos no demostrados. Usar cuando se pida un informe, resumen de resultados, estado de calidad, métricas de pruebas o evidencias para una release.
---

# QA Test Reporting

## Propósito

Comunicar el estado de calidad de forma **honesta y verificable**: cada afirmación respaldada por un artefacto,
y lo no probado declarado como tal.

## Prerrequisitos

- Artefactos reales de ejecución (JUnit XML, JSON de Jest/Vitest, resumen de k6, coverage-summary.json,
  salida de quality gates). Sin artefactos no hay informe de resultados: solo un informe de estado de planificación.

## Procedimiento

1. **Inventario de evidencia**: lista cada artefacto, su origen (comando, commit, entorno, fecha). Si un
   artefacto no tiene trazabilidad, márcalo como de procedencia desconocida.
2. **Analiza** con las herramientas MCP (`parse_test_results`, `summarize_k6_results`,
   `evaluate_quality_gate`) o los scripts equivalentes.
3. **Construye el informe**:
   ```bash
   node "ai/qa/scripts/report-build.mjs" --title "Informe de pruebas <sprint/release>" \
     --results junit.xml --k6 k6-summary.json --notes notas.json --commit <sha> --environment local
   ```
   `notas.json`: `facts`, `hypotheses`, `recommendations`, `notExecuted` (ver `--help`). O usa
   `build_evidence_report` (no escribe en disco).
4. **Métricas** (solo las calculables con la evidencia): totales, tasa de éxito, fallos por área, flaky,
   cobertura, p95/p99, tasa de error, defectos por severidad, cobertura de requisitos/riesgos.
5. **Pruebas no ejecutadas**: enumera cada una con su motivo (sin entorno, sin datos, sin autorización, bloqueada).
6. **Revisión final**: aplica `verification-before-completion`: ninguna frase implica éxito sin evidencia.

## Criterios de decisión

| Situación | Redacción |
|---|---|
| Sin artefactos de ejecución | «SIN EVIDENCIA DE EJECUCIÓN» (nunca «pasa») |
| Algún fallo o gate no superado | «NO APTO» + fallos enumerados |
| Todo verde pero con pruebas pendientes | «APTO según la evidencia aportada» + lista de pendientes y riesgo residual |
| Resultados antiguos o de otro commit | Indicarlo y no usarlos como evidencia del commit actual |

## Entradas y salidas

- **Entradas**: artefactos, notas (hechos/hipótesis/recomendaciones/pendientes), contexto (commit, entorno, alcance).
- **Salidas**: informe Markdown con veredicto, tablas de resultados, rendimiento, gates, hechos, hipótesis,
  recomendaciones y pendientes.

## Criterios de éxito

Cada cifra del informe es trazable a un artefacto; las pruebas pendientes están declaradas; sin secretos.

## Manejo de errores

- `report-build` exit 2: archivo inexistente o formato no reconocido → convertir o excluir declarándolo.
- Artefactos contradictorios (mismo caso pasa y falla): reportar como posible flaky.

## Seguridad

El texto se redacta automáticamente; aun así, revisa que no aparezcan datos personales o internos innecesarios.

## Aprobación humana

Guardar el informe en el repositorio o enviarlo a sistemas externos (wiki, chat, gestor de pruebas) requiere
aprobación explícita. Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/report-build.mjs" --title "Demo" --results "ai/qa/tests/fixtures/junit-mixed.xml"
```
Debe mostrar el veredicto «NO APTO» y la tabla de fallos.

## Referencias

- roadmap.sh/qa: *Reporting* (TestRail, Allure, jUnit), *Manage your Testing*.
- Skill importada: `verification-before-completion`.
