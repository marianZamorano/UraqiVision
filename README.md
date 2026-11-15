# UraqiVision

| | Enlace |
|---|---|
| 🌐 **App en vivo** | <https://uraqivision.vercel.app/> |
| 🖥️ **Frontend** (este repositorio) | <https://github.com/marianZamorano/UraqiVision> |
| ⚙️ **Backend** (pipeline y Insight) | <https://github.com/marianZamorano/UraqiVisionBack> |

---

Web bilingüe (español e inglés) que traduce los datos del radar **NISAR** (L2 GCOV, banda L) en mapas, cifras e
historias que se entienden. Parte de un globo 3D de Bolivia y lleva a las zonas analizadas para responder dos
preguntas: **¿dónde y cuándo quemó el fuego?** y **¿fue quema o desmonte?**

> *¿Por qué intentamos colonizar otros planetas cuando no somos capaces de cuidar el nuestro?*

- **Reto:** NASA Space Apps Challenge 2026, *Dancing with the SARs*.
- **Para quién:** gestores de áreas protegidas y de territorios indígenas.
- **Por qué radar:** la banda L atraviesa el humo y las nubes, justo cuando los satélites ópticos no ven nada.

## Cómo se usa

1. **Viaja:** desplázate por el globo desde la Tierra entera hasta Bolivia.
2. **Elige:** haz clic en una de las zonas que analizamos con el radar.
3. **Lee:** mira qué cambió, dónde y cuándo, con la fuente y el rango de cada cifra.

## Cómo está hecho

| Parte | Tecnología |
|---|---|
| Web (este repositorio) | React, TypeScript, Vite |
| Globo 3D | CesiumJS con Cesium ion (World Terrain y Bing Maps Aerial) |
| Mapa 2D | MapLibre GL JS |
| Gráficos | Recharts |
| Idiomas | react-i18next (`es.json` y `en.json`) |
| Pruebas | Vitest, React Testing Library y Playwright |
| Hospedaje | Vercel |

La web **solo lee** lo que publica el backend: los archivos de cada estación y la respuesta de Insight. No recalcula
ninguna cifra. El procesamiento de NISAR (ingesta, ciencia, validación y publicación) vive en
[UraqiVisionBack](https://github.com/marianZamorano/UraqiVisionBack).

## Correrlo en tu computadora

Necesitas Node.js y npm.

```bash
git clone https://github.com/marianZamorano/UraqiVision.git
cd UraqiVision
npm install          # herramientas del repositorio (hooks, commitlint)
npm run env:sync     # crea el .env a partir de .env.example, sin mostrar valores
cd web
npm install
npm run dev          # http://localhost:5173
```

Variables del `.env` (la estructura está en `.env.example`; nunca se suben valores):

- `VITE_CESIUM_ION_TOKEN`: token **público** de Cesium ion, solo de lectura y restringido a los assets 1 y 2. Sin
  él, el globo usa CesiumJS sin ion.
- `VITE_PUBLISHED_API`: dirección de los archivos que publica el backend.

Otros comandos, desde `web/`:

```bash
npm run build      # comprobación de tipos y build de producción
npm test           # pruebas unitarias y de componentes (Vitest)
npm run test:e2e   # pruebas en el navegador (Playwright); la primera vez: npx playwright install chromium
```

Más detalle de la web en [`web/README.md`](web/README.md).

## Estructura del repositorio

| Carpeta | Qué hay |
|---|---|
| `web/` | La aplicación web |
| `docs/` | Documento maestro del proyecto (la fuente de verdad) |
| `specs/` · `sdd/` | Especificaciones y prompts del desarrollo guiado por especificaciones (Spec Kit) |
| `ai/` | Skills, subagentes, hooks y guardas de los asistentes de IA, con su ayuda en [`ai/README.md`](ai/README.md) |

## Equipo

| Módulo | Responsable |
|---|---|
| Globo 3D y mapa de análisis (M-GLOBO, M-MAPA) | Joaco |
| Atlas e interfaz (M-ATLAS, M-INTERFAZ) | Angie y Marian |
| Ingesta de datos (M-INGESTA) | Alex |
| Ciencia y validación (M-CIENCIA, M-VALIDACIÓN) | Tabata |
| Publicación e Insight (M-PUBLICACIÓN, M-INSIGHT) | Mimi |

## Cómo trabajamos

Cada cambio sigue el flujo **issue → rama → commits → PR**. Todo entra primero a `dev` (integración), luego pasa a
`qa` (preproducción) y por último a `main` (producción). Las reglas completas están en [`AGENTS.md`](AGENTS.md).

## Uso de IA

En el desarrollo usamos asistentes de IA (Claude Code, Gemini CLI, Codex CLI y opencode), con las instrucciones
comunes de [`AGENTS.md`](AGENTS.md). Las herramientas que les dimos están documentadas en [`ai/README.md`](ai/README.md).
