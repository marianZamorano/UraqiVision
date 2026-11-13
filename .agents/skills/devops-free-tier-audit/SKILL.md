---
name: devops-free-tier-audit
description: Evalúa si una arquitectura puede ejecutarse con planes gratuitos reales (Vercel Hobby, Neon, Supabase, GitHub Actions u otros), compara consumo previsto o real con las cuotas documentadas, detecta riesgos de cargos, suspensión o uso comercial prohibido y propone alternativas gratuitas compatibles. Úsala antes de elegir proveedores o cuando el consumo se acerque a los límites.
argument-hint: "[proveedor|all] [archivo-de-consumo.json]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, WebFetch, Bash(node ai/devops/scripts/free-tier-check.mjs *), Bash(node ai/devops/scripts/detect-stack.mjs *)
---

# devops-free-tier-audit

## Propósito
Responder con evidencia: **¿se puede operar gratis?, ¿hasta cuándo? y ¿qué podría generar un cargo?** Nunca habilita servicios ni introduce métodos de pago.

## Cuándo usarla
- Al diseñar el despliegue (junto a `devops-vercel-deployment analyze`).
- Al añadir un servicio externo (BD, almacenamiento, colas, email).
- Mensualmente o cuando el dashboard de un proveedor avise de consumo.

## Entradas
- Componentes y servicios (informe de `devops-project-discovery`).
- Opcional: consumo en JSON `{"provider":"vercel","plan":"hobby","monthly":{...}}` exportado o transcrito del dashboard.
- `ai/devops/config/free-tier-limits.json` (límites verificados con fecha y fuentes).

## Salidas
- Tabla por servicio: función, plan, cuota relevante, consumo estimado/real, % usado, qué ocurre al exceder, tarjeta requerida, uso comercial, alternativa.
- Lista de riesgos de coste y de suspensión, y protecciones de gasto configurables (o la constancia de que no existen).

## Herramientas
- `node ai/devops/scripts/free-tier-check.mjs --show all` y `--usage consumo.json`.
- WebFetch a las páginas oficiales de precios para re-verificar si `verifiedAt` tiene más de 90 días o falta un proveedor.

## Procedimiento
1. **Frescura de datos**: `free-tier-check.mjs --show all`. Si `stale: true` o el proveedor no está, re-verifica en la fuente oficial y propone actualizar `free-tier-limits.json` (cambio en `ai/devops/config/` → requiere aprobación).
2. **Mapa de servicios**: para cada componente, identifica el proveedor y el plan. No elijas por popularidad: compara compatibilidad técnica (runtime, conexiones, regiones, extensiones) y restricciones.
3. **Restricciones duras** (bloquean "gratis"):
   - Vercel Hobby: solo uso personal **no comercial**; funciones ≤ 300 s; cron 1/día; sin spend management.
   - Neon Free: 0,5 → 1 GB por proyecto, 100 CU-h/proyecto, scale-to-zero obligatorio (cold start), 5 GB egress.
   - Supabase Free: 500 MB, 2 proyectos activos, **pausa tras 7 días de inactividad**.
   - GitHub Actions: repos públicos gratis; privados 2.000 min/mes; sin método de pago se bloquea al agotarse.
4. **Estimación de consumo**: invocaciones/mes, transferencia, CPU activa, almacenamiento, minutos de CI. Usa supuestos explícitos (tráfico, tamaño de respuesta) y márgenes.
5. **Comparación**: `free-tier-check.mjs --usage`. ≥ 80 % = riesgo alto; ≥ 100 % = el servicio se pausará/bloqueará (o facturará si hay tarjeta).
6. **Riesgos de coste**: pruebas gratuitas que pasan a pago, add-ons de Marketplace, compras de dominio, upgrades. Señala que el agente **no** debe activarlos (los hooks los deniegan).
7. **Alternativas**: para cada riesgo, una alternativa gratuita compatible o la conclusión honesta de que no existe.

## Ejemplos
- `/devops-free-tier-audit all` → evaluación de la arquitectura completa.
- `/devops-free-tier-audit vercel consumo-octubre.json` → comparación con el consumo real.

## Riesgos
- Límites cambiantes: nunca afirmes un límite sin fecha de verificación y fuente.
- Confundir "plan gratuito" con "prueba gratuita" (trial) que convierte a pago.
- Proyectos comerciales en Hobby: incumplen la política de uso aunque el consumo sea bajo.

## Validaciones
- Cada cifra del informe tiene fuente y fecha.
- El informe indica qué ocurre al exceder cada cuota (pausa, bloqueo o cargo).
- Ninguna acción de alta, upgrade o compra se ejecutó.

## Criterios de éxito
- Veredicto claro: GRATIS-VIABLE / GRATIS-CON-RIESGOS / NO-GRATIS, con justificación.
- Lista de umbrales a vigilar y cómo consultarlos (dashboard, CLI o MCP).
