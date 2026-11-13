---
name: devops-release-readiness
description: Decide con evidencia si un cambio está listo para desplegarse — Git limpio, build/lint/typecheck/tests en verde, configuración y secretos auditados, variables por entorno, dependencias, plan de rollback y verificación posterior — y emite un veredicto NOT_READY / CONFIG_PREPARED / BUILD_VERIFIED. Úsala antes de cada despliegue preview o producción.
argument-hint: "[ruta-app] [preview|production]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(node ai/devops/scripts/*), Bash(git status *), Bash(git log *), Bash(git diff *)
---

# devops-release-readiness

## Propósito
Un único informe de go/no-go que separa hechos verificados de supuestos, antes de tocar cualquier entorno.

## Cuándo usarla
- Antes de `devops-vercel-deployment preview|production`.
- Antes de fusionar a la rama de producción.

## Entradas
- Ruta de la app; entorno objetivo.
- Opcional: archivo de variables descargado (solo para comprobar presencia).

## Salidas
- `reports/devops/readiness-<fecha>.md` con nivel, hallazgos por sección y checklist.

## Herramientas
- `node ai/devops/scripts/deploy-readiness.mjs --root . --app-dir <app> --with-build --out reports/devops/readiness-<fecha>.md`
- `validate-build.mjs`, `dependency-audit.mjs --production`, `env-check.mjs`.

## Procedimiento
1. Git: commit identificable, sin cambios sin confirmar, rama correcta, al día con el remoto.
2. `deploy-readiness.mjs --with-build` (ejecuta los scripts del proyecto: install solo si se pide con `validate-build --install`).
3. Dependencias de producción sin critical/high no aceptados.
4. Variables requeridas presentes en el entorno objetivo (nombres; nunca valores).
5. Migraciones: ¿hay cambios de esquema? → plan separado con aprobación y backup.
6. Producción: punto de rollback identificado (despliegue actual) y smoke checks definidos.
7. Veredicto:
   - `NOT_READY`: algún `high`/`critical` → lista de bloqueos.
   - `CONFIG_PREPARED`: configuración correcta, build no ejecutado.
   - `BUILD_VERIFIED`: build y tests locales en verde.
   - `DEPLOYED_VERIFIED` solo lo otorga `deployment-verification-agent` tras smoke tests reales.

## Ejemplos
- `/devops-release-readiness apps/web production`

## Riesgos
- Tests de relleno (`exit 0`) que dan falsa confianza: el script los marca.
- Declarar "listo" sin haber ejecutado el build.

## Validaciones
- El informe incluye comandos ejecutados, códigos de salida y fecha.

## Criterios de éxito
- Veredicto reproducible por otra persona con los mismos comandos.
