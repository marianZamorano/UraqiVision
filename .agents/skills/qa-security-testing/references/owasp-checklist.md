# Checklist defensivo OWASP (Top 10 2021 + API Top 10 2023)

| Área | Verificar | Evidencia esperada |
|---|---|---|
| Control de acceso (A01 / API1, API5) | Cada endpoint sensible tiene guard/middleware; roles explícitos; acceso a recursos ajenos → 403/404 (IDOR/BOLA); funciones de admin protegidas | Tabla endpoint → guard → rol; pruebas negativas 401/403 |
| Fallos criptográficos (A02) | Contraseñas con bcrypt/argon2/scrypt; TLS no desactivado; sin MD5/SHA1 para credenciales; secretos fuera del código | `security-baseline` sin `weak-hash`/`tls-disabled`; `scan-secrets` limpio |
| Inyección (A03) | Consultas parametrizadas/ORM; sin concatenación SQL; sin `eval`; comandos sin shell | Sin `sql-concatenation`, `eval`, `command-injection` confirmados |
| Diseño inseguro (A04) | Límites de negocio (cantidades, estados), flujos de recuperación seguros | Casos de `qa-test-design` sobre reglas de negocio |
| Configuración (A05 / API8) | CORS restringido; cabeceras de seguridad (helmet o equivalente); errores sin trazas; `x-powered-by` ausente | `absentHeaders`, revisión de config |
| Componentes vulnerables (A06) | Auditoría de dependencias (con aprobación); versiones fijadas en lockfile | Informe de `npm audit`/equivalente |
| Autenticación (A07 / API2) | Expiración de tokens; sin `alg: none`; rate limiting en login; logout invalida sesión | Sin `jwt-none`; pruebas de token expirado |
| Integridad (A08) | Sin `curl \| sh` en scripts/CI; dependencias de fuentes confiables | Revisión de pipelines |
| Logging y monitoreo (A09) | Eventos de seguridad registrados; sin datos sensibles en logs | Sin `sensitive-logging` |
| SSRF (A10 / API7) | URLs de usuario validadas contra allowlist; sin acceso a metadatos cloud | Revisión de clientes HTTP |
| Exposición excesiva de datos (API3) | DTOs/serializadores de salida explícitos; campos sensibles excluidos | `forbiddenFields` en `qa-api-testing` |
| Consumo de recursos (API4) | Paginación con límite máximo; tamaño de cuerpo limitado; rate limiting | Casos BVA de `limit`/`page`; cuerpo grande → 413 |
| Asignación masiva (API3/API6) | Whitelist de propiedades (`forbidNonWhitelisted`) | Petición con campos extra → 400 |
| Inventario (API9) | Endpoints documentados; sin versiones antiguas expuestas | Comparar contrato vs. rutas reales |
