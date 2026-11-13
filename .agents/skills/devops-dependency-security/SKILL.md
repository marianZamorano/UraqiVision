---
name: devops-dependency-security
description: Evalúa la seguridad de la cadena de suministro de dependencias — vulnerabilidades conocidas (npm audit), lockfiles reproducibles, scripts de instalación, versiones fijadas, paquetes abandonados o typosquatting — y propone actualizaciones mínimas verificadas. Úsala antes de releases, al añadir dependencias o tras avisos de seguridad.
argument-hint: "[ruta-del-paquete]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(node ai/devops/scripts/dependency-audit.mjs *), Bash(npm audit *), Bash(npm outdated *), Bash(npm ls *), Bash(npm view *)
---

# devops-dependency-security

## Propósito
Reducir el riesgo de dependencias vulnerables o maliciosas sin romper el build.

## Cuándo usarla
- Antes de una release o despliegue a producción.
- Al añadir o actualizar una dependencia.
- Tras un aviso (GitHub Advisory, Dependabot).

## Entradas
- Paquete con `package-lock.json` (pnpm/yarn: ver notas del script).

## Salidas
- Vulnerabilidades por severidad, ruta de dependencia y fix disponible.
- Propuesta de actualización mínima (diff de `package.json`/lockfile) para aprobación.

## Herramientas
- `node ai/devops/scripts/dependency-audit.mjs --root <pkg> [--production]` (`npm audit --json`).
- `npm ls <paquete>`, `npm outdated`, `npm view <paquete> time maintainers repository` (lectura del registro).

## Procedimiento
1. Verifica lockfile presente y coherente (`npm ci` debe funcionar).
2. `dependency-audit.mjs --production` (lo que llega a runtime) y luego completo.
3. Prioriza: critical/high en dependencias de runtime alcanzables > dev-only.
4. Para cada fix: versión mínima que corrige, cambios mayores, changelog. **No uses `npm audit fix --force`.**
5. Dependencias nuevas: comprueba nombre exacto (typosquatting), mantenedores, repositorio, fecha de publicación, scripts `postinstall`, licencia.
6. Aplica cambios solo tras aprobación y valida con `devops-release-readiness` (build + tests).

## Ejemplos
- `/devops-dependency-security apps/api`

## Riesgos
- Actualizaciones mayores que rompen en runtime; instalar paquetes no auditados; scripts de instalación maliciosos.

## Validaciones
- Sin vulnerabilidades critical/high explotables en runtime, o aceptación documentada del riesgo.
- Build y tests en verde tras actualizar.

## Criterios de éxito
- Informe con decisiones (actualizar / mitigar / aceptar) justificadas y verificadas.
