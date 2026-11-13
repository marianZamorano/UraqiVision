---
name: devops-git-workflow
description: Aplica un flujo Git seguro para trabajo DevOps — inspección del estado, ramas de trabajo derivadas de la rama correcta, commits atómicos y descriptivos, preview por rama, protección de la rama de producción y push sin force — preservando siempre el trabajo ajeno. Úsala al empezar una tarea, antes de commitear o al preparar un PR.
argument-hint: "[start <rama>|commit|pr]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git branch *), Bash(git log *), Bash(git diff *), Bash(git remote *), Bash(git fetch *), Bash(git show *), Bash(node ai/devops/scripts/secret-scan.mjs *)
---

# devops-git-workflow

## Propósito
Que cada cambio sea trazable, revisable y desplegable por rama, sin perder trabajo ni reescribir historia compartida.

## Cuándo usarla
- `start`: crear o reutilizar una rama de trabajo.
- `commit`: agrupar y confirmar cambios validados.
- `pr`: preparar la descripción y comprobaciones del PR.

## Entradas
- Nombre de la rama y rama base deseada.

## Salidas
- Rama creada/reutilizada, commits con mensajes convencionales, descripción de PR.

## Herramientas
- Lectura de Git (`status`, `branch -a`, `log`, `diff`, `remote -v`, `fetch`).
- `secret-scan.mjs --staged` antes de cada commit.
- Escritura (`switch -c`, `add`, `commit`) en local; `push` requiere aprobación (hook `ask`).

## Procedimiento
1. **Inspección**: rama actual, cambios sin confirmar, ramas locales/remotas. Si hay trabajo ajeno sin confirmar, **no** hagas stash/reset/checkout: pregunta.
2. **Rama base**: deriva de la rama de producción actualizada (normalmente `main`), no de ramas de QA/feature con cambios ajenos. Si la rama ya existe, inspecciona su contenido (`git log main..<rama>`) antes de reutilizarla.
3. **Commits**: atómicos, tras validar (lint/tests/auditorías); mensaje `tipo(ámbito): descripción` (`feat`, `fix`, `ci`, `docs`, `chore`, `refactor`, `test`). Antes: `secret-scan --staged`.
4. **Push**: `git push -u origin <rama>` con aprobación. Nunca `--force`, `--no-verify`, ni push a `main`.
5. **PR**: resumen, riesgos, cómo se probó, enlace al preview (si existe y está verificado), checklist de readiness.
6. **Producción**: merge a `main` solo por una persona (o con aprobación explícita); con integración Git de Vercel, el merge despliega a producción.

## Ejemplos
- `/devops-git-workflow start feat/ci-pipeline`
- `/devops-git-workflow commit`

## Riesgos
- `reset --hard`, `clean -fdx`, `branch -D`, rebase de ramas compartidas: requieren aprobación (hook `ask`).
- Mezclar cambios ajenos en commits propios: usa `git add <rutas>` explícitas.

## Validaciones
- `git status` limpio tras el commit (salvo trabajo ajeno preservado).
- `secret-scan --staged` sin hallazgos.

## Criterios de éxito
- Historia lineal y legible, sin secretos, con rama remota creada solo con autorización.
