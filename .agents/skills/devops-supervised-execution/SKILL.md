---
name: devops-supervised-execution
description: Protocolo obligatorio de supervisión humana para ejecutar herramientas, skills o agentes DevOps sobre un proyecto — inspección de solo lectura, plan con alcance/archivos/comandos/sistemas externos/riesgos, aprobación explícita y acotada por operación, ejecución limitada a lo aprobado, verificación con evidencias y parada si cambia el alcance. Úsala al inicio de cualquier operación DevOps con efectos.
argument-hint: "[objetivo de la operación]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(node ai/devops/scripts/check-approval-policy.mjs *)
---

# devops-supervised-execution

## Propósito
Garantizar que ninguna acción con efectos (remotos, sobre datos o facturables) ocurre sin una aprobación humana explícita, acotada y registrada. Ningún agente aprueba sus propias acciones.

## Cuándo usarla
Siempre que una tarea DevOps vaya a: desplegar, modificar infraestructura, IAM, red, DNS o dominios, ejecutar migraciones, borrar datos o recursos, rotar o modificar secretos remotos, habilitar servicios facturables, o alterar pipelines/permisos de despliegue.

## Entradas
- Objetivo de la operación.

## Salidas
- Solicitud de aprobación (plantilla abajo), registro de ejecución y evidencias en `reports/devops/`.

## Herramientas
- `node ai/devops/scripts/check-approval-policy.mjs --settings .claude/settings.json`: confirma que las barreras técnicas están activas.
- Guardas `uraqi-guard` de `ai/hooks/` (bloqueos) y permisos nativos de cada plataforma (confirmaciones).

## Procedimiento
1. **Comprobar barreras**: ejecuta `check-approval-policy.mjs`. Si los hooks no están activos, informa de que la supervisión depende solo de instrucciones y recomienda instalarlos (`install-claude-integration.mjs`).
2. **Inspección (solo lectura)**: estado actual sin modificar recursos externos.
3. **Plan** con la plantilla, separando tres clases de acción:
   - A. Solo lectura (se ejecutan sin aprobación).
   - B. Modificaciones locales (archivos del repo; reversibles con Git).
   - C. Acciones remotas / datos / costes (cada una necesita aprobación explícita).
4. **Aprobación**: espera un "sí" explícito de la persona para las acciones C enumeradas. Una aprobación cubre **solo** esas acciones, recursos y entorno. Silencio, ambigüedad o "sigue" genérico no aprueban acciones C nuevas.
5. **Ejecución**: solo lo aprobado, en el orden presentado. El diálogo `ask` de Claude Code es la confirmación técnica final de cada comando.
6. **Verificación**: evidencias (salidas, IDs de despliegue, smoke tests) en el informe.
7. **Cambio de alcance**: si aparece un recurso, entorno, coste o riesgo nuevo, **detente** y solicita una nueva aprobación.

### Plantilla de solicitud
```
## Solicitud de aprobación — <operación>
Objetivo: <qué y por qué>
Entorno: <local | preview | producción> · Proyecto/equipo: <...>
A. Solo lectura: <comandos>
B. Cambios locales: <archivos>
C. Acciones remotas (requieren tu aprobación):
  1. <comando exacto> → efecto: <...> → reversión: <...>
Sistemas externos: <Vercel, Neon, GitHub...>
Datos/variables usados: <nombres, entorno> (sin valores)
Coste: <ninguno | riesgo: ...>
Riesgos: <...>
Verificación posterior: <smoke tests, inspect...>
¿Apruebas las acciones C.1..C.n tal como están descritas? (sí/no)
```

## Ejemplos
- `/devops-supervised-execution desplegar preview de apps/web`

## Riesgos
- Modo `bypassPermissions`: omite prompts; la plantilla de settings lo desactiva (`disableBypassPermissionsMode`).
- Comandos ofuscados que eluden patrones: los hooks son una defensa adicional, no infalible; la persona debe leer cada `ask`.

## Validaciones
- Toda acción C ejecutada tiene una aprobación previa en la conversación y una entrada en el registro de hooks.

## Criterios de éxito
- Cero acciones remotas sin aprobación; informe con evidencias reproducibles.
