---
name: qa-test-design
description: Diseña casos de prueba con técnicas de caja negra - particiones de equivalencia, valores límite, tablas de decisión, pairwise y transición de estados - incluyendo datos de prueba y criterios de aceptación Given/When/Then. Usar cuando se pidan casos de prueba, escenarios, datos de prueba o criterios de aceptación para una funcionalidad, formulario, endpoint o regla de negocio.
---

# QA Test Design

## Propósito

Generar un conjunto **mínimo y suficiente** de casos que detecte defectos en fronteras, combinaciones y reglas,
con resultados esperados derivados de la especificación (nunca del código bajo prueba).

## Prerrequisitos

- Especificación de la funcionalidad: campos, rangos, reglas, estados, roles (de requisitos, contrato OpenAPI o
  DTOs/validadores del código).
- Node.js ≥ 18.

## Procedimiento

1. **Modela las entradas** en un `spec.json` (ver [templates/spec.example.json](templates/spec.example.json)):
   tipo, obligatoriedad, rangos, longitudes, enums, formato. Si existe contrato OpenAPI, deriva el modelo de
   sus esquemas (`read_api_contract`).
2. **Genera los casos base**:
   ```bash
   node "ai/qa/scripts/design-cases.mjs" --spec spec.json
   ```
   Produce: caso nominal, EP por campo (válidas/inválidas, tipo incorrecto, null, ausente), BVA (min-1, min,
   min+1, max-1, max, max+1), reglas de la tabla de decisión y combinaciones pairwise.
3. **Revisa y completa** manualmente:
   - Transiciones de estado (estado inicial → evento → estado final, transiciones inválidas).
   - Reglas cruzadas entre campos (p. ej. fecha fin ≥ fecha inicio).
   - Casos de seguridad de entrada (cadenas largas, Unicode, inyección) → coordinar con `qa-security-testing`.
   - Idempotencia, concurrencia y paginación si aplica.
4. **Define el resultado esperado** de cada caso desde la especificación: código/estado, mensaje de error,
   efecto persistido. Si la especificación no lo define, márcalo como *pregunta abierta*.
5. **Escribe criterios de aceptación** Given/When/Then para los casos P1.
6. **Datos de prueba**: sintéticos, deterministas, sin datos personales reales; documenta cómo se crean y limpian.
7. **Prioriza** los casos según el riesgo (`qa-test-strategy`) y elimina duplicados que cubran la misma partición.

## Criterios de decisión

| Situación | Técnica |
|---|---|
| Rangos numéricos o longitudes | BVA + EP |
| Conjuntos discretos (enum, roles) | EP por valor + valor fuera del dominio |
| Varias condiciones que determinan un resultado | Tabla de decisión |
| Muchos parámetros independientes | Pairwise (reduce combinaciones manteniendo todos los pares) |
| Ciclo de vida / workflow | Transición de estados |
| Requisitos ambiguos | Exploratorio + preguntas abiertas antes de automatizar |

## Entradas y salidas

- **Entrada**: `spec.json` y requisitos.
- **Salida**: tabla Markdown (ID, técnica, título, entrada, esperado) o JSON (`--json`) para alimentar
  automatización (`qa-api-testing`, `qa-automation`); lista de preguntas abiertas.

## Criterios de éxito

- Cada partición y cada frontera tiene al menos un caso.
- Cada caso tiene un resultado esperado derivado de la especificación o marcado como pregunta abierta.

## Manejo de errores

- `design-cases` exit 2: spec inválida (tipo desconocido, min > max, enum sin valores): corrige la spec.
- Enormes combinaciones: usa pairwise y prioriza; no generes producto cartesiano.

## Seguridad

No uses datos personales reales ni secretos en los datos de prueba. Los payloads de seguridad se limitan a
validación defensiva dentro del alcance autorizado.

## Aprobación humana

Generar casos en la conversación no requiere aprobación. Escribirlos a disco (`--out`) o en archivos de
prueba requiere aprobación explícita (el hook `qa-guard` lo exige). Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/design-cases.mjs" --spec "ai/qa/tests/fixtures/design-spec.json"
```
Debe incluir casos `EP`, `BVA`, `DecisionTable` y `Pairwise`.

## Referencias

- roadmap.sh/qa: *Test Cases and Scenarios*, *Black Box Testing*, *Testing Techniques*, *ATDD*, *BDD*.
- Guía para pruebas fiables: skill importada `test-driven-development` → `writing-good-tests.md`.
