# Herramientas de IA de UraqiVision

Skills, subagentes, hooks y servidores MCP para **Claude Code, Gemini CLI, Codex CLI y opencode**, definidos
una sola vez y generados para cada plataforma. Las reglas del proyecto están en [`AGENTS.md`](../AGENTS.md);
la fuente de verdad es [`docs/UraqiVisionDocumentoMaestrov1.0.pdf`](../docs/UraqiVisionDocumentoMaestrov1.0.pdf).

## Qué se edita y qué se genera

| Se edita a mano (fuente) | Se genera con `node ai/sync.mjs` |
|---|---|
| `.agents/skills/<skill>/` | `.claude/skills/<skill>/` (Gemini, Codex y opencode leen `.agents/skills/` directamente) |
| `ai/agents/<agente>.md` | `.claude/agents/`, `.gemini/agents/`, `.codex/agents/*.toml`, `.opencode/agents/` |
| `ai/hooks/` | `.claude/settings.json`, `.gemini/settings.json`, `.codex/hooks.json`, `.opencode/plugins/uraqi-guardas.js` |
| `ai/mcp/servers.json` (versiones en `ai/mcp/launch.mjs`) | `.mcp.json`, `.gemini/settings.json`, `.codex/config.toml`, `opencode.json` |

Los archivos generados llevan la marca «Generado por ai/sync.mjs». Si los editas a mano, el siguiente sync
los pisa. Tu configuración personal de Claude va en `.claude/settings.local.json` (ignorado por git).
Las skills `speckit-*` y los comandos de Spec Kit los mantiene `specify`, no este script.

```bash
node ai/sync.mjs           # genera o actualiza
node ai/sync.mjs --check   # código 1 si algo quedó desactualizado (útil en CI)
node --test ai/hooks/test/guard.test.mjs   # pruebas de las guardas
```

## Primera vez en tu máquina

1. Node 20 o superior (los hooks y el lanzador de MCP usan Node, sin dependencias).
2. Activa los hooks de git (escaneo de secretos y avisos sobre el mensaje del commit):
   `git config core.hooksPath .githooks`
3. Según tu asistente:
   - **Claude Code**: acepta los servidores de `.mcp.json` la primera vez que abras el proyecto.
   - **Codex CLI**: marca el proyecto como de confianza y revisa los hooks con `/hooks`.
   - **Gemini CLI**: lee `AGENTS.md` gracias a `.gemini/settings.json`.
   - **opencode**: carga `opencode.json` y el plugin de guardas automáticamente.
4. Opcional: `CONTEXT7_API_KEY` en tu entorno para subir el límite de uso de `context7`.

## El coordinador: `vibecodear`

Engineering Manager técnico (adaptado de MichiCode). Diagnostica el proyecto frente al documento maestro,
activa solo los roles necesarios y, para cada uno, sabe qué skills cargar, qué subagentes usar y qué persona
del equipo es responsable ([roles.md](../.agents/skills/vibecodear/references/roles.md)). Trabaja por Sprints
con dos puntos de control (plan y feedback) y documenta en `.vibecodear/sprints/`.

## Skills por rol importadas de chapterCoreIEEE

| Rol | Skills | Cómo se trajeron |
|---|---|---|
| QA | `qa-project-discovery`, `qa-test-strategy`, `qa-test-design`, `qa-automation`, `qa-regression-analysis`, `qa-quality-gates`, `qa-test-reporting`, `qa-defect-analysis`, `qa-security-testing` | Rutas cambiadas a `ai/qa/scripts/`; scripts y fixtures incluidos |
| QA (MIT, obra/superpowers) | `test-driven-development`, `systematic-debugging`, `verification-before-completion` | Copia idéntica, con `LICENSE` y `PROVENANCE.md` (SHA-256 verificado) |
| Frontend | `react-component-architecture`, `frontend-testing`, `vite-bundle-optimization` | Tal cual |
| Frontend / Fullstack | `frontend-data-fetching`, `typed-api-integration`, `react-components-and-state` | Reescritas: UraqiVision no tiene backend NestJS, lee archivos publicados e Insight |
| UI/UX | `design-system-tokens`, `responsive-visual-testing` | Reescritas sin Figma ni tokens `--cc-*`, con las reglas de §20.2 |
| DevSecOps | `devops-secrets-management`, `devops-dependency-security`, `devops-git-workflow`, `devops-release-readiness`, `devops-free-tier-audit`, `devops-supervised-execution` | Rutas cambiadas a `ai/devops/scripts/` |

No se trajeron, por no aplicar a UraqiVision: las skills de NestJS y PostgreSQL, `dynamic-json-forms`,
`devops-container-audit`, `devops-iac-review`, `terraform-style-guide`, `devops-observability`,
`devops-incident-analysis`, `devops-ci-cd-review`, `devops-vercel-deployment` (hospedaje pendiente, DP-06) y
las de API, contratos, integración con base de datos y carga.

## Skills propias de UraqiVision (`.agents/skills/`)

| Skill | Para qué | Módulos |
|---|---|---|
| `documento-maestro` | Encontrar requisitos por identificador, comprobar el alcance, clasificar hechos e hipótesis | Todos |
| `sdd-uraqivision` | Flujo de Spec Kit adaptado al documento y al hackathon, con prompts listos | Todos |
| `ciencia-radar-nisar` | MC-01–MC-09, CQ, VC, unidades lineal/dB, sin dato ≠ 0 | M-INGESTA, M-CIENCIA, M-VALIDACIÓN |
| `publicacion-estacion` | Contrato de la carpeta publicada (§17.3), COG sin pérdida, peso | M-PUBLICACIÓN |
| `globo-y-mapa` | CesiumJS sin ion, carga diferida, respaldo 2D, estado compartido, capas | M-GLOBO, M-MAPA |
| `insight-lector-radar` | Contrato, adaptador, plantillas, límites y seguridad de la clave | M-INSIGHT |
| `interfaz-bilingue-accesible` | es/en, WCAG 2.2 AA, estados de la vista, cifras y fechas | M-INTERFAZ, M-ATLAS |
| `rigor-y-fuentes` | Citas, APA 7, hechos frente a hipótesis, nada inventado | M-ATLAS, contenidos |
| `entrega-hackathon` | Estado frente al plan (§25), demo de 7 láminas, checklist de entrega | Todo el equipo |
| `verification-before-completion` | Evidencia antes de afirmar que algo funciona (MIT, de obra/superpowers) | Todos |

## Subagentes (`ai/agents/`)

El campo `access` del frontmatter decide si pueden escribir (`write`, siempre con aprobación) o no (`read`, por
defecto); `web: true` les da búsqueda web.

### Por rol, importados de chapterCoreIEEE y adaptados

| Subagente | Rol | Acceso |
|---|---|---|
| `qa-architect` | Estrategia de pruebas basada en riesgo (PS, VC, CQ) | Escribe documentos de QA con aprobación |
| `automation-qa-engineer` | Suites pytest, Vitest y Playwright con TDD; pruebas flaky | Escribe pruebas con aprobación |
| `security-qa-engineer` | Seguridad defensiva, claves, Insight, OWASP | Solo lectura |
| `test-evidence-analyst` | Interpreta resultados y redacta defectos | Solo lectura |
| `devsecops-engineer` | Secretos, dependencias, controles de los agentes | Solo lectura |
| `free-tier-architect` | Planes gratuitos (RNF-10), evidencia para DP-06 | Solo lectura, con web |
| `release-readiness-reviewer` | Go/no-go antes de desplegar | Solo lectura |
| `react-performance-auditor` | Rendimiento, CesiumJS diferido, fugas de visores | Escribe con aprobación |
| `uiux-design-auditor` | Tokens, WCAG 2.2, responsive, §20.2 | Solo lectura |
| `react-ui-reviewer` | Componentes, estado compartido, contratos tipados | Escribe con aprobación |

### Propios de UraqiVision (solo lectura)

| Subagente | Cuándo usarlo |
|---|---|
| `guardian-alcance` | Antes de aprobar un plan, tareas o una rama: alcance, DP pendientes, trazabilidad |
| `revisor-cientifico` | Al terminar una parte del pipeline o antes de publicar cifras |
| `auditor-publicacion` | Antes de publicar o desplegar una estación |
| `revisor-interfaz` | Al terminar un componente o pantalla (puede usar Playwright en localhost) |
| `revisor-insight` | Al terminar o cambiar Insight, antes de desplegarlo |
| `revisor-qa` | Antes de marcar una tarea como hecha o integrar una rama |

Cómo invocarlos: en Claude Code, «usa el subagente revisor-qa» o `@agent-revisor-qa`; en opencode,
`@revisor-qa`; en Codex y Gemini, pídelo por su nombre.

## Guardas (hooks)

Una sola lógica (`ai/hooks/lib/guard.mjs`) para las cuatro plataformas. **Bloquean**:

- secretos en comandos, archivos, mensajes y argumentos (claves de Anthropic, OpenAI, Google, GitHub y AWS,
  claves privadas, JWT como los tokens de Earthdata, entradas de `.netrc`);
- leer o escribir `.env*` (salvo `.env.example`), `.netrc`, `*.pem` y `*.key`; escribir en `.git/` o en el PDF
  del documento maestro;
- `git push --force`, `git reset --hard`, `git clean -f`, `--no-verify`, `rm -rf /`, `curl … | sh`,
  `npm publish` e intentos de desactivar permisos.

**Avisan sin bloquear** tras cada edición: JSON o GeoJSON inválido y claves distintas entre `es.json` y
`en.json` (RNF-03). Al iniciar la sesión inyectan un resumen de las reglas clave.

Los permisos nativos piden confirmación para `git push` y `vercel` (Claude y opencode).
Git: `pre-commit` bloquea secretos y `commit-msg` avisa si falta un identificador o hay un `Co-Authored-By` de IA.

## Servidores MCP

| Servidor | Uso | Efectos |
|---|---|---|
| `playwright` (`@playwright/mcp@0.0.83`) | PS-07, PS-08, PS-09: recorrer la app, teclado, idioma, movimiento reducido | Sí: solo contra `localhost` salvo aprobación |
| `context7` (`@upstash/context7-mcp@4.4.4`) | Documentación vigente de CesiumJS, MapLibre, react-i18next, rasterio… | No |
| `qa-evidence` (propio, `ai/qa/mcp-servers/`) | 9 herramientas: resultados JUnit, cobertura, esquemas JSON, quality gates, informe de evidencias | No |
| `devops-readiness` (propio, `ai/devops/mcp-servers/`) | 11 herramientas: stack, secretos por nombre, `.env.example`, planes gratuitos, preparación del despliegue, política de aprobación | No |

### Scripts de apoyo

`ai/qa/scripts/` (risk-matrix, design-cases, quality-gate, contract-diff, regression-select, defect-report,
flaky-detect, security-baseline, scan-secrets, report-build, stack-inspect) y `ai/devops/scripts/` (secret-scan,
env-check, dependency-audit, free-tier-check, detect-stack, deploy-readiness, check-approval-policy). Son Node
sin dependencias; los ejemplos de cada skill usan los fixtures de `ai/qa/tests/fixtures/`. `check-approval-policy`
está adaptado a las guardas de `ai/hooks/`. `secret-scan` marca un token falso a propósito en
`ai/qa/tests/fixtures/sample-project` (es un fixture de prueba).

## Añadir algo

- **Skill**: crea `.agents/skills/<nombre>/SKILL.md` con `name` y `description` en el frontmatter y ejecuta el sync.
- **Subagente**: crea `ai/agents/<nombre>.md` (frontmatter `name`, `description`, `skills`, `mcp`, `color`) y ejecuta el sync.
- **MCP**: añádelo a `ai/mcp/servers.json` y a `SERVERS` en `ai/mcp/launch.mjs` con versión fijada; ejecuta el sync.
- **Regla de guarda**: edítala en `ai/hooks/lib/guard.mjs`, añade su prueba y ejecuta las pruebas.

## Procedencia

Estructura y patrones tomados de tres repositorios: **chapterCoreIEEE** (fuente única con sync multiplataforma,
guardas compartidas, subagentes revisores de solo lectura, lanzador de MCP sin shell, skill de accesibilidad,
`verification-before-completion`), **sdd-horario-productividad** (constitución y prompts de Spec Kit en orden)
y **MichiCode** (puntos de control con aprobación antes de modificar).
