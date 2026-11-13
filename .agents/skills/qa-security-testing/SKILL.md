---
name: qa-security-testing
description: Realiza pruebas de seguridad DEFENSIVAS dentro de un alcance autorizado - baseline estático de patrones inseguros (CWE), detección de secretos, revisión de autenticación/autorización, validación de entradas, cabeceras, dependencias vulnerables y checklist OWASP Top 10 / API Top 10. Usar cuando se pida revisar la seguridad de una aplicación o API, buscar secretos o vulnerabilidades, o validar controles de acceso.
---

# QA Security Testing (defensivo)

## Propósito

Encontrar debilidades de seguridad **antes** de que lleguen a producción, con métodos defensivos, en un
alcance explícitamente autorizado, y reportarlas con evidencia y recomendación.

## Prerrequisitos

- **Alcance escrito** por la persona: repositorio, entornos y hosts permitidos, técnicas permitidas, ventana.
- Por defecto el alcance es **solo análisis estático del repositorio** y pruebas dinámicas contra `localhost`.

## Procedimiento

1. **Secretos**:
   ```bash
   node "ai/qa/scripts/scan-secrets.mjs" .         # árbol de trabajo
   node "ai/qa/scripts/scan-secrets.mjs" --staged  # antes de commit
   ```
   Un secreto encontrado se reporta enmascarado; recomendar rotación (no basta con borrarlo del repo).
2. **Baseline estático**:
   ```bash
   node "ai/qa/scripts/security-baseline.mjs" --root .
   ```
   Cada hallazgo es una **hipótesis**: confírmalo leyendo el código antes de reportarlo como vulnerabilidad.
3. **Revisión dirigida** con [references/owasp-checklist.md](references/owasp-checklist.md): control de acceso
   (guards por endpoint, IDOR), autenticación (expiración, algoritmos, almacenamiento de contraseñas),
   validación (whitelist, tamaño), inyección (consultas parametrizadas), exposición de datos, configuración
   (CORS, cabeceras, errores), logging y rate limiting.
4. **Dependencias**: proponer `npm audit --omit=dev` / `pip-audit` / `mvn dependency-check` (envían el
   inventario de dependencias a un servicio externo → requiere aprobación).
5. **Pruebas dinámicas defensivas** (solo `localhost` u hosts aprobados): casos de autorización negativa,
   validación de entrada y cabeceras mediante `qa-api-testing` (`forbiddenFields`, `absentHeaders`, 401/403).
6. **Informe**: severidad (CVSS cualitativo), CWE, evidencia (archivo:línea o petición/respuesta redactada),
   impacto, recomendación y estado (confirmado / hipótesis).

## Criterios de decisión

| Situación | Decisión |
|---|---|
| Hallazgo del baseline sin confirmar | Reportar como hipótesis, no como vulnerabilidad |
| Secreto real en el historial | Severidad alta: rotación + limpieza del historial (decisión de la persona) |
| Escaneo activo (ZAP, nuclei, sqlmap) | Solo con alcance escrito y host aprobado; el hook lo deniega fuera de política |
| Explotación / pivoting / persistencia | **Fuera de alcance** siempre |

## Entradas y salidas

- **Entradas**: alcance autorizado, raíz del repositorio.
- **Salidas**: informe de hallazgos con CWE, severidad, evidencia y recomendación; JSON de `security-baseline`.

## Criterios de éxito

Checklist OWASP recorrido para el alcance; cada hallazgo con evidencia y estado; ningún secreto expuesto en
el informe.

## Manejo de errores

- `security-baseline` exit 1 indica hallazgos al nivel `--fail-on` (no es un error).
- Falsos positivos en tests/fixtures: severidad rebajada automáticamente; confirmar manualmente.

## Seguridad

- Nunca incluyas secretos completos en informes, commits o mensajes; usa la salida enmascarada.
- No uses payloads destructivos ni pruebas de denegación de servicio.
- No accedas a datos de otros usuarios reales; usa cuentas de prueba.

## Aprobación humana

Requieren aprobación: cualquier prueba dinámica, escaneos, auditorías de dependencias con red, y la
propuesta de correcciones (las aplica la persona o un agente autorizado, no esta skill). Ver [SUPERVISED_EXECUTION.md](../../docs/SUPERVISED_EXECUTION.md).

## Verificación

```bash
node "ai/qa/scripts/security-baseline.mjs" --root "ai/qa/tests/fixtures/sample-project"
```
Debe reportar `sql-concatenation`, `cors-wildcard`, `sensitive-logging` y `weak-random-token`.

## Referencias

- roadmap.sh/qa: *Security Testing* (Authentication/Authorization, Vulnerability Scanning, Secrets Management, OWASP 10, Attack Vectors).
- OWASP Top 10 (2021), OWASP API Security Top 10 (2023), CWE Top 25.
