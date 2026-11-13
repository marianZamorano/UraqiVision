---
name: devops-secrets-management
description: Detecta secretos expuestos, define dónde debe vivir cada secreto (variables del proveedor por entorno, secretos de CI, gestores de secretos), valida variables requeridas sin mostrar valores y guía la rotación tras una filtración. Úsala antes de commits/despliegues, al añadir integraciones o ante una sospecha de exposición.
argument-hint: "[scan|plan|rotate] [ruta]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(node ai/devops/scripts/secret-scan.mjs *), Bash(node ai/devops/scripts/env-check.mjs *), Bash(vercel env ls *), Bash(gh secret list *), Bash(git log *)
---

# devops-secrets-management

## Propósito
Ningún secreto en el repositorio, en logs, en `vercel.json`, en scripts ni en el bundle del navegador; cada secreto en el almacén correcto y con un plan de rotación.

## Regla de entorno de UraqiVision (prevalece)
- Solo `.env` (local, nunca se sube) y `.env.example` (versionado, misma estructura, claves sensibles vacías).
  Otro `.env.<x>` solo si es imprescindible, declarado en `package.json` → `uraqi.envPermitidos` con su `.example`.
- `npm run env:check` revisa; `npm run env:sync` crea o alinea el `.env` sin leer ni mostrar valores (única forma
  en que un asistente lo genera); `npm run env:compartir` copia el `.env` a Descargas para compartirlo.
- Un cambio de estructura obliga a una **pausa** para comunicarlo al equipo antes de continuar (lo aplica el
  hook `pre-commit`; el workflow `Entorno` menciona a los colaboradores en la PR).

## Cuándo usarla
- `scan`: antes de un commit, PR o despliegue.
- `plan`: al añadir una integración o un entorno (preview/producción).
- `rotate`: cuando un secreto se haya expuesto (commit, log, captura, chat).

## Entradas
- Ruta del proyecto; `.env.example` con los nombres requeridos.
- Para `rotate`: qué secreto (nombre, nunca el valor) y dónde se expuso.

## Salidas
- Hallazgos (archivo:línea, tipo, longitud — **nunca el valor**).
- Matriz secreto × entorno (Development / Preview / Production / CI) con su almacén.
- Para `rotate`: checklist paso a paso para la persona.

## Herramientas
- `node ai/devops/scripts/secret-scan.mjs --root . | --staged`.
- `node ai/devops/scripts/env-check.mjs --example .env.example [--env-file <archivo>]` (presencia, no valores).
- `vercel env ls`, `gh secret list` (solo nombres).
- Hook git opcional: `.githooks/pre-commit`.

## Procedimiento
1. **Escaneo**: árbol completo y, si aplica, historial (`git log -p -S '<prefijo>'` solo con prefijos genéricos como `AKIA`, nunca con el valor).
2. **Clasificación**: verdadero positivo / placeholder / fixture. Las excepciones se marcan con `devops-allow-secret` en la línea y se justifican en la revisión.
3. **Almacenes**:
   - Runtime en Vercel → Project Settings > Environment Variables, separando Production y Preview (Preview nunca con credenciales de producción salvo aprobación).
   - CI → GitHub Actions Secrets / Environments (los de producción en un environment protegido).
   - Local → `.env.local` ignorado por Git; plantilla en `.env.example` sin valores.
   - Nunca: prefijos públicos (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) para secretos.
4. **`.gitignore`**: `.env*` (excepto `.example`), `.vercel/`, `*.pem`, `*.tfstate`, `*.tfvars`.
5. **Rotación** (`rotate`): revocar en el proveedor → generar nuevo → actualizar almacenes → redeploy → verificar → limpiar historial solo si es necesario (reescribir historia requiere aprobación y coordinación; la rotación es lo que protege, no el borrado).

## Ejemplos
- `/devops-secrets-management scan`
- `/devops-secrets-management rotate DATABASE_URL expuesto en un log de CI`

## Riesgos
- Imprimir valores para "comprobarlos": prohibido (los hooks deniegan `cat .env`, `printenv`, `echo $TOKEN`).
- `vercel env pull` escribe secretos en disco local: requiere aprobación y el archivo debe estar ignorado.
- Modificar o rotar secretos remotos: siempre aprobación explícita.

## Validaciones
- `secret-scan` sin hallazgos `high`/`critical` sin justificar.
- `env-check` con todas las variables requeridas presentes en cada entorno.

## Criterios de éxito
- Inventario de secretos por entorno sin valores, almacenes correctos y procedimiento de rotación documentado.
