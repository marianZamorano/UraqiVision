---
name: qa-automation
description: Diseña, implementa y mantiene automatización de pruebas (unitarias, integración, API, E2E/UI y headless) con el framework del proyecto, incluyendo estructura de suites, fixtures y mocks, page objects, estabilidad y detección de pruebas flaky. Usar cuando se pida automatizar pruebas, crear o refactorizar una suite, configurar Jest/Vitest/Playwright/Cypress/pytest/JUnit o investigar pruebas inestables.
---

# QA Automation (incluye automatización de UI)

## Propósito

Producir automatización **fiable, mantenible y rápida**, con el framework que el proyecto ya usa, siguiendo la
pirámide de pruebas. Absorbe la familia *ui-automation*.

## Prerrequisitos

- Framework de pruebas identificado (`qa-project-discovery`). Si no existe, propón uno con justificación; su
  instalación requiere aprobación.
- Casos diseñados (`qa-test-design`) y priorizados (`qa-test-strategy`).

## Procedimiento

1. **Elige el nivel más bajo** que detecte el defecto: unitario > integración/API > E2E.
2. **Respeta las convenciones** del repositorio: ubicación (`test/`, `__tests__/`, `*.spec.ts`), nombres,
   helpers existentes, comandos (`npm test`, `pytest`, `mvn test`).
3. **Escribe las pruebas** aplicando la skill importada `test-driven-development` y su guía
   `writing-good-tests.md`: nombra el fallo que detecta cada prueba, valores esperados literales, sin aserciones
   sobre mocks, mocks solo en la frontera lenta/externa.
4. **Datos y aislamiento**: fixtures/factories deterministas; cada prueba crea y limpia lo suyo; sin
   dependencia del orden; reloj y aleatoriedad controlados.
5. **UI / E2E** (cuando exista interfaz):
   - Localizadores por rol/etiqueta/texto accesible (`getByRole`, `getByLabel`), no por CSS frágil.
   - Esperas por condición/aserción web-first; nunca `sleep` fijo.
   - Page Object o Screenplay solo si reduce duplicación real.
   - Ejecución headless en CI; trazas/capturas solo en fallo.
   - Accesibilidad básica con axe (si el proyecto lo adopta) en páginas críticas.
6. **Ejecuta localmente** (con aprobación) el subconjunto afectado y después la suite completa.
7. **Estabilidad**: si hay sospecha de flaky, ejecuta N veces guardando JUnit y analiza:
   ```bash
   node "ai/qa/scripts/flaky-detect.mjs" run1.xml run2.xml run3.xml
   ```
   Sigue [references/flaky-playbook.md](references/flaky-playbook.md).
8. **Integra en CI** con `qa-quality-gates`.

## Criterios de decisión

| Situación | Decisión |
|---|---|
| Lógica pura | Unitaria, sin mocks |
| Frontera con DB/broker | Integración con dependencia efímera real |
| Servicio externo de terceros | Mock/stub en la frontera HTTP (nock, msw, WireMock) + contract test |
| Flujo crítico de usuario | E2E mínimo y estable |
| Prueba flaky | Cuarentena con ticket y causa raíz; nunca reintentos ciegos como solución |
| Framework ausente | Proponer el estándar del ecosistema (Vitest/Jest, pytest, JUnit 5, Playwright) |

## Entradas y salidas

- **Entradas**: casos diseñados, código bajo prueba, convenciones.
- **Salidas**: archivos de prueba (con aprobación), comandos de ejecución, resultados JUnit, informe de flaky.

## Criterios de éxito

- Las pruebas nuevas fallan cuando se introduce el defecto que deben detectar (red → green verificado).
- La suite pasa de forma estable en 3 ejecuciones consecutivas.

## Manejo de errores

- La prueba pasa a la primera sin fallar antes: no demuestra nada → revisa la aserción.
- Fallos intermitentes: `flaky-detect` + `systematic-debugging`; no subas timeouts a ciegas.

## Seguridad

Sin credenciales reales en fixtures; sin acceso a servicios externos reales desde pruebas automatizadas
(salvo entornos aprobados); no desactivar TLS ni validaciones para "hacer pasar" pruebas.

## Aprobación humana

Requieren aprobación: crear/modificar archivos de prueba o configuración, instalar dependencias de testing
(incluye descarga de navegadores) y ejecutar suites que levanten servicios. Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/flaky-detect.mjs" "ai/qa/tests/fixtures/junit-pass.xml" "ai/qa/tests/fixtures/junit-run2.xml"
```
Debe detectar 2 pruebas flaky (código 1).

## Referencias

- roadmap.sh/qa: *Frontend Automation*, *Backend Automation*, *Headless Testing*, *Unit Testing*, *TDD*, *Mocking*.
- Skills importadas: `test-driven-development`, `systematic-debugging`.
