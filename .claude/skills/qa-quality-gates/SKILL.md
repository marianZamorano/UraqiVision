---
name: qa-quality-gates
description: Define y evalúa quality gates objetivos (pruebas sin fallos, tasa de éxito, cobertura, latencia p95, tasa de error, cambios incompatibles de contrato, secretos) para uso local y en pipelines CI/CD, fallando cuando falta evidencia. Usar cuando se pida configurar quality gates, criterios de salida, controles de calidad en CI, o decidir si un cambio está listo para merge o release.
---

# QA Quality Gates

## Propósito

Convertir los criterios de salida en **controles automáticos** con código de salida, que bloquean cuando una
métrica no se cumple **o no hay evidencia** para medirla.

## Prerrequisitos

- Criterios de salida acordados (`qa-test-strategy`).
- Artefactos generados por el pipeline: JUnit/JSON de pruebas, `coverage-summary.json`, resumen k6, diff de
  contratos (JSON de `contract-diff --json`).

## Procedimiento

1. **Define los gates** en `gates.json` a partir de [templates/gates.example.json](templates/gates.example.json).
   Marca como `"required": false` solo los gates que legítimamente pueden no aplicar (p. ej. rendimiento en PRs).
2. **Evalúa localmente**:
   ```bash
   node "ai/qa/scripts/quality-gate.mjs" --config gates.json \
     --results reports/junit.xml --coverage coverage/coverage-summary.json \
     --contract-diff reports/contract-diff.json --secrets-scan src
   ```
   o con la herramienta MCP `evaluate_quality_gate`.
3. **Integra en CI**: adapta [templates/github-actions-quality-gate.yml](templates/github-actions-quality-gate.yml)
   (u otro proveedor). El paso del gate debe ejecutarse **después** de generar los artefactos y con `if: always()`
   para evaluar también ejecuciones fallidas.
4. **Revisa los resultados**: un gate `fail` por «Métrica no disponible» indica falta de evidencia (pipeline
   mal configurado), no éxito.
5. Documenta excepciones aprobadas (gate omitido, umbral temporalmente reducido) con responsable y fecha de revisión.

## Criterios de decisión

| Gate | Umbral recomendado de partida | Requerido en PR |
|---|---|---|
| `failedTests == 0` | 0 | Sí |
| `passRate >= 100` | 100 | Sí |
| `coverageLines >= X` | Valor actual (no bajar) → objetivo 80 | Sí |
| `breakingChanges == 0` | 0 (salvo versión mayor aprobada) | Sí si hay contrato |
| `secretsFound == 0` | 0 | Sí |
| `p95Ms <= SLO`, `errorRate <= 0.01` | SLO acordado | No en PR; sí en release |

## Entradas y salidas

- **Entradas**: `gates.json` y artefactos.
- **Salidas**: tabla PASS/FAIL/SKIPPED por gate, métricas calculadas (`--json`), código 0/1/2.

## Criterios de éxito

El gate falla cuando debe (fallo o ausencia de evidencia) y pasa solo con evidencia completa.

## Manejo de errores

- exit 2 «Configuración de gates inválida»: revisar `op` (`>=`, `<=`, `>`, `<`, `==`) y `value` numérico.
- exit 2 con artefacto ilegible: corregir la generación del artefacto en el pipeline.

## Seguridad

Los gates no deben imprimir secretos (el escaneo reporta solo el recuento). No desactives gates para "hacer
pasar" un pipeline sin aprobación documentada.

## Aprobación humana

Crear o modificar pipelines CI (`.github/workflows/**`, `.gitlab-ci.yml`…) es una ruta sensible: el hook pide
aprobación con aviso destacado. Cambiar umbrales también requiere aprobación. Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/quality-gate.mjs" --config "ai/qa/tests/fixtures/gates.json" --results "ai/qa/tests/fixtures/junit-mixed.xml" --coverage "ai/qa/tests/fixtures/coverage-summary.json"
```
Debe salir con código 1 (`no-failures` FAIL).

## Referencias

- roadmap.sh/qa: *CI / CD*, *Repo Hosting Services*, *Reporting*.
