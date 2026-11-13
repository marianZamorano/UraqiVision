# Vibecodear (UraqiVision)

Engineering Manager técnico que coordina las skills y subagentes de UraqiVision por Sprints. Adaptada de la
skill homónima del repositorio **MichiCode**, que funcionaba sobre cualquier proyecto. Aquí:

- los roles corresponden a los módulos y responsables de §19 del documento maestro, y cada rol sabe qué skills
  y subagentes usar ([references/roles.md](references/roles.md));
- el objetivo de cada Sprint sale del alcance MVP (§8, §13), del plan del hackathon (§25) y, si existen, de
  las tareas de Spec Kit;
- cada plan pasa por el subagente `guardian-alcance` antes del punto de control de aprobación.

## Flujo

```
Analizar → Diagnosticar → Roles (skills + subagentes + responsable) → Objetivo → Plan
→ ⛔ aprobación → Implementar delegando → Probar → Ejecutar local → ⛔ feedback → Documentar → Iterar
```

## Uso

En Claude Code `/vibecodear`; en los demás asistentes, pide «usa la skill vibecodear». En lenguaje natural:
*«vibecodea el proyecto: quiero el antes/después real de San Ignacio en el mapa 2D»*.

Los scripts (solo librería estándar de Python 3.9+) también se ejecutan solos desde la raíz del repositorio:

```bash
python .agents/skills/vibecodear/scripts/inspect_project.py .
python .agents/skills/vibecodear/scripts/verify.py .                            # paquetes Node
python .agents/skills/vibecodear/scripts/verify.py . --cmd "python -m pytest -q" # pipeline Python
python .agents/skills/vibecodear/scripts/run_local.py web --cmd "npm run dev" --port 5173 --path /
python .agents/skills/vibecodear/scripts/sprint_doc.py new . --objective "..."
python .agents/skills/vibecodear/scripts/sprint_doc.py list .
```

Los Sprints quedan en `.vibecodear/sprints/sprint-NN.md` con un índice en `.vibecodear/README.md`.

## Estructura

| Archivo | Para qué |
| --- | --- |
| `SKILL.md` | Flujo, marco de UraqiVision, puntos de control y reglas de seguridad |
| `references/roles.md` | Roles con responsable, señales, skills, subagentes, checklist y fuente |
| `references/troubleshooting.md` | Qué hacer ante cada error habitual |
| `assets/sprint-template.md` | Plantilla del Sprint (con identificadores y responsables) |
| `scripts/inspect_project.py` | Stack, tests, variables (solo nombres), secretos (archivo:línea), herramientas, puertos |
| `scripts/verify.py` | build/test/lint por paquete Node o el comando que indiques |
| `scripts/run_local.py` | Levanta la app, maneja puertos ocupados, comprueba HTTP y la detiene |
| `scripts/sprint_doc.py` | Crea y lista los documentos de Sprint |
| `tests/` | Pruebas de los scripts: `python -m unittest discover -s tests -v` (desde esta carpeta) |

## Seguridad

No muestra valores de `.env` ni `.netrc`; pide confirmación antes de instalar, borrar, hacer `git push` o
desplegar; `run_local.py` solo detiene lo que él mismo levantó.
