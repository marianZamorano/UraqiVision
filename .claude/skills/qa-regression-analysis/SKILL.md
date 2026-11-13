---
name: qa-regression-analysis
description: Selecciona las pruebas de regresión según el impacto de los cambios (git diff entre ramas o commits, archivos modificados) con un mapa área→rutas→suites, prioriza por riesgo y detecta cuándo se necesita regresión completa. Usar al revisar un PR o una rama, preparar una release, o cuando se pregunte qué pruebas ejecutar tras un cambio.
---

# QA Regression Analysis

## Propósito

Ejecutar **las pruebas que importan** para un cambio concreto, con trazabilidad entre archivos modificados,
áreas funcionales y suites, sin perder seguridad cuando el cambio es transversal.

## Prerrequisitos

- Repositorio git con la rama base disponible localmente.
- Mapa de regresión (`regression-map.json`). Si no existe, créalo a partir de la estructura del proyecto con
  [templates/regression-map.example.json](templates/regression-map.example.json) (requiere aprobación para guardarlo).

## Procedimiento

1. **Cambios**: `git diff --name-only <base>...HEAD` (solo lectura) y `git log --oneline <base>..HEAD`.
2. **Selección**:
   ```bash
   node "ai/qa/scripts/regression-select.mjs" --map regression-map.json --base origin/main
   ```
3. **Revisa la salida**: áreas impactadas ordenadas por riesgo, suites, tags, `alwaysRun` (smoke) y archivos
   **sin mapear** (brecha del mapa → revisar manualmente o actualizar el mapa).
4. **Análisis semántico** complementario: lee el diff de los archivos de mayor riesgo para detectar impactos que
   el mapa no ve (contratos públicos, migraciones, configuración, utilidades compartidas, cambios de
   dependencias).
5. **Propón el plan de regresión**: suites a ejecutar, orden (smoke → áreas P1 → resto), comando y tiempo
   estimado. Si `fullRegression` es verdadero, recomienda la suite completa.
6. Tras la ejecución (aprobada), analiza resultados con `qa-test-reporting`.

## Criterios de decisión

| Cambio | Decisión |
|---|---|
| Manifiestos, lockfiles, migraciones, config global, CI | Regresión completa |
| Código compartido usado por varias áreas | Todas las áreas consumidoras |
| Solo documentación | Smoke opcional |
| Archivos sin mapear | Revisión manual + actualizar mapa |
| Área de riesgo alto | Ejecutar también pruebas de contrato y seguridad relacionadas |

## Entradas y salidas

- **Entradas**: mapa, referencia base (`--base`) o lista de archivos (`--files`).
- **Salidas**: Markdown/JSON con áreas, suites, tags, archivos sin mapear y recomendación.

## Criterios de éxito

Cada archivo cambiado está mapeado a un área o justificado; la selección es reproducible con el mismo comando.

## Manejo de errores

- exit 2 «Referencia git inválida»: solo se aceptan referencias con caracteres seguros.
- `fatal: bad revision`: la base no existe localmente; pedir a la persona `git fetch` (operación de red → aprobación).

## Seguridad

Solo lectura del repositorio. No ejecuta pruebas ni modifica ramas.

## Aprobación humana

Ejecutar las suites seleccionadas o guardar/actualizar el mapa requiere aprobación. Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
printf 'src/auth/login.ts\ndocs/x.md\n' > /tmp/changed.txt
node "ai/qa/scripts/regression-select.mjs" --map "ai/qa/tests/fixtures/regression-map.json" --files /tmp/changed.txt
```
Debe seleccionar el área `auth` y listar `docs/x.md` como sin mapear.

## Referencias

- roadmap.sh/qa: *Regression Testing*, *Smoke Testing*, *Sanity Testing*, *Version Control System*, *Git*.
