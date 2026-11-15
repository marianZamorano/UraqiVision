# Estilo visual del frontend — rama `style/104-estilo-visual-nasa`

Documenta todos los cambios de estilo hechos en esta rama (issue #104). Es una **propuesta de diseño**: el
documento maestro fija las reglas (§20.2: paleta de un solo tono, trama de sin dato, contraste para celular al
aire libre; RNF-04: foco visible y no depender solo del color; RNF-03: textos es/en; RNF-12: movimiento
reducido), no los valores concretos. Pendiente de aprobación del equipo (DP por abrir en §29 si se adopta).

## Commits de la rama (sobre `dev`)

| Commit | Qué trae |
|---|---|
| `5320fa3` style(interfaz): tipografías Orbitron y Roboto y paleta NASA como propuesta (RNF-04) #104 | Orbitron en títulos, Roboto en texto, marca NASA azul/roja, foco azul; corrige la inconsistencia de nombres de tokens entre `tokens.css` y la skill `design-system-tokens` (ya no se documentan nombres `--uv-*` inexistentes). |
| `c76a7d0` style(interfaz): paleta de 7 colores, contraste por rol y diseño responsive (RNF-04) #104 | Paleta de 7 colores, tokens semánticos por rol, tipografía fluida (`clamp`), parrillas responsive en 48rem/64rem, pruebas de contraste por rol. |
| `d79a1a7` style(interfaz): tema oscuro de cielo estrellado, menú y texto blanco (RNF-04) #104 | Tema oscuro, texto blanco, fondo estrellado, menú en pastillas. |
| `94638ab` style(interfaz): menú grotesk, estrellas que parpadean y animaciones sutiles (RNF-04, RNF-12) #104 | Paleta casi negra de azules y violetas sin tonos cálidos, fondo negro puro, vidrio/holografía, estrellas que parpadean (sin desplazamiento), logo SVG de órbita, menú en Space Grotesk centrado separado por barras, animaciones sutiles, `test.css.include` para `shell.css`. |
| `1c5ee9b` docs(specs): documento del estilo visual de la rama (RNF-04) #104 | Este documento (el alcance `frente` no existe en commitlint; quedó como aviso y se corrigió aquí). |
| `9a276ba` Merge branch 'dev' into style/104-estilo-visual-nasa #104 | `dev` al día (react-i18next #105, estados RF-34 #106, navegación accesible #107, mapa beta #110). Conflictos resueltos en `AppShell.tsx` (se conserva el logo SVG sobre el shell traducido) y `shell.css` (se conservan los bloques propios y los nuevos de evidencia/skip-link). |

Nada se fusionó a `dev` ni a ninguna otra rama protegida.

## Archivos tocados

- `web/src/styles/tokens.css` — única fuente de valores visuales (§20.2, RNF-04).
- `web/src/styles/global.css` — base tipográfica, cielo estrellado, headings, foco, `prefers-reduced-motion`.
- `web/src/app/shell.css` — encabezado, navegación, botones, paneles de vidrio, responsive, animaciones.
- `web/src/app/AppShell.tsx` — logo: órbita holográfica SVG (decorativo, `aria-hidden`).
- `web/index.html` — carga de fuentes Google (Orbitron, Roboto, Space Grotesk) con `display=swap`.
- `web/tests/unit/estilos.test.ts` — reglas de contraste, cero tonos cálidos, mayúsculas, tokens de vidrio.
- `web/vite.config.ts` — `test.css.include` también sirve `src/app/shell.css` a las pruebas.
- `.agents/skills/design-system-tokens/SKILL.md` y copia `.claude/` — nombres de token reales del código.

## Tipografías (RNF-03: el idioma del texto no cambia; esto solo afecta la forma)

| Rol | Fuente | Dónde |
|---|---|---|
| Títulos (h1–h3) y logo | Orbitron 600/700 | `--fuente-titulo` |
| Menú y selector de idioma | Space Grotesk 500/700 | `--fuente-menu` |
| Resto del texto | Roboto 400/500/700 | `--fuente-base` |

Las tres son de Google Fonts con licencia SIL Open Font License / Apache 2.0 (Roboto). **Hecho**: se cargan
desde `fonts.googleapis.com` en tiempo de ejecución (petición externa; sin red se cae a `system-ui`, texto
legible igual). **Hipótesis**: para producción conviene autoalojarlas (p. ej. `@fontsource`) por privacidad,
rendimiento (RNF-01/RNF-02) y CSP; DP-06 (hospedaje) sigue pendiente.

Títulos, marca y menú van **siempre en mayúsculas** vía `text-transform: uppercase` en CSS: los textos de
`i18n` (`web/src/i18n/index.ts`) se conservan como están en español e inglés (RNF-03). Lo fija una prueba.

## Paleta (7 colores, sin tonos cálidos: prohibido amarillo, rojo, naranja)

| Token | Valor | Rol |
|---|---|---|
| `--paleta-negro-azulado` | `#000000` | fondo de página (negro puro) |
| `--paleta-azul-abismal` | `#0a1020` | superficie de paneles |
| `--paleta-azul-noche` | `#101a33` | azules de apoyo |
| `--paleta-azul-electrico` | `#255fe0` | marca, stop oscuro del holográfico |
| `--paleta-violeta` | `#6a57e8` | acento holográfico, aurora |
| `--paleta-hielo` | `#7de3ff` | enlaces, foco, estrellas brillantes |
| `--paleta-blanco` | `#ffffff` | texto (todo el texto de cuerpo es blanco o plata) |

Reglas verificadas por pruebas (`web/tests/unit/estilos.test.ts`, WCAG 2.2):

- texto/fondo ≥ 7:1 (propuesta AAA para aire libre; AA es el mínimo exigible);
- texto secundario (plata `#c3ccdd`) ≥ 4.5:1 sobre la superficie;
- foco visible (`--paleta-hielo`) ≥ 3:1 frente al fondo (WCAG 1.4.11);
- texto blanco del botón holográfico ≥ 4.5:1 sobre su stop más oscuro;
- fuera de la escala de cambio no existe ningún hex cálido (prueba explícita);
- la escala de cambio es de un solo tono (violeta-azulado), más oscuro = más cambio (§20.2). Los pasos
  `--cambio-4`/`--cambio-5` quedan bajo 3:1 sobre negro: son referencia gráfica sobre fondo casi negro, la
  cifra se lee siempre en texto blanco (RF-33). **Pendiente de validar con el equipo de ciencia** porque la
  escala de cambio es un contrato visual de §20.2, no solo decoración.
- las zonas sin dato mantienen su trama gris (RN-13), sin cambios.

## Vidrio y holografía

- Tokens `--vidrio-tenue/suave/fuerte` (10/26/55 %), `--desenfoque-vidrio` (14 px), `--holo` (degradado
  hielo→violeta→azul eléctrico) y `--resplandor` (luz difusa hielo).
- Encabezado, paneles, tarjetas de estaciones y botones secundarios usan fondo translúcido con
  `backdrop-filter: blur`. Los degradados holográficos solo van en elementos decorativos (botón primario,
  logo); el texto nunca se pinta con degradado ni sobre amarillo/rojo.

## Movimiento (RNF-12)

- Estrellas: dos capas fijas que **parpadean** (opacidad 5 s y 7 s, alternadas); ya no se desplazan.
- Animaciones sutiles: fundido + subida breve (`aparecer`, `--duracion-aparicion` 0.45 s) al montar pantallas
  y tarjetas; transiciones de color en menú (`--duracion-corta`).
- `prefers-reduced-motion: reduce` anula animaciones y transiciones (prueba existente lo verifica).

## Verificación ejecutada (hechos)

- `npx vitest run`: 146/146 pruebas pasan (22 archivos), tras la fusión con `dev`.
- `npx vite build`: compilación correcta (requiere `maplibre-gl`, declarado en `package.json`; `npm ci` en `web/`).
- Capturas Playwright en 1280 px y 390 px: menú centrado a la derecha del logo con separadores `|`, logo de
  órbita, fondo negro estrellado, tarjetas de vidrio.
- `npm run ai:check`: 42 skills, 14 subagentes, 4 servidores MCP, 0 cambios pendientes; `ai/referencias/catalogo.json`
  tiene 26 URLs y todas están en §31 del documento maestro.
- Conocido y previo a esta rama: `npm run build` (que corre `tsc --noEmit`) falla por faltar `@types/node` en
  `package.json`; se resolverá con una dependencia de desarrollo aparte, con aprobación del equipo.

## Direcciones intentadas y descartadas (no forman parte de esta rama)

Dos propuestas de interfaz se implementaron, se verificaron en el navegador y **se descartaron**: el trabajo
no está en ningún commit ni en el árbol de trabajo, y el `git stash` que lo guardaba se borró por decisión de
la persona (14 nov 2026). Se registran aquí para no repetir el intento sin resolver antes el conflicto de
alcance.

| Dirección intentada | Qué hacía | Por qué se descartó (hecho, con fuente) |
|---|---|---|
| Página única con scroll | `/`, `/explore`, `/method` y `/about` pasaban a secciones de una misma página con navegación lateral por anclas y fundido al entrar en pantalla | §20.1 del documento maestro (líneas 1747-1755) fija «Método y Acerca de: **páginas aparte**, enlazadas desde cada cifra y desde el pie del sitio». Cambiar el recorrido principal es decisión de equipo, no de implementación. |
| Planeta CesiumJS como fondo fijo, con cámara sincronizada al scroll | Visor a pantalla completa (después, en esquina con tinte azul), vuelos `camera.flyTo` por sección, panel de vidrio sin bordes y paleta estricta de azules (#050B14, #121F35, #0047AB, #00E0FF, #FFFFFF) | RNF-01 (líneas 1251-1256): «CesiumJS se carga solo al entrar al explorador», y `web/tests/e2e/home-performance.spec.ts` y `web/tests/e2e/portada.spec.ts` exigen **cero peticiones** de Cesium en `/`. Un fondo de Cesium en la portada rompe además la meta de 3 s (RNF-02). `web/tests/unit/App.test.tsx` exige que la atribución de Cesium no aparezca en `/`. |

Lo que sí quedó de esos intentos, como documentación: las reglas duras de CesiumJS que se registraron en las
skills `globo-y-mapa` y `vite-bundle-optimization` (altura del lienzo + `viewer.resize()` + `ResizeObserver` y
carga de `Widgets/widgets.css`), porque fueron fallos reales observados en el navegador.

## Para decidir por el equipo (pendientes, sin número en §29)

- **Identidad visual**: aprobar o rectificar la paleta de 7 colores y las tres familias tipográficas de esta
  rama. Hoy son propuesta (regla 4 de §28).
- **Fuentes externas**: decidir autoalojar Orbitron, Roboto y Space Grotesk antes del despliegue; depende de
  la elección de hospedaje (DP-06).
- **Referencias que faltan en §31**: no hay entrada para MapLibre GL JS ni para las licencias de las fuentes, y
  la guía de los widgets de CesiumJS tampoco está citada. Sin entrada en §31 no podemos respaldar esas
  elecciones (regla 3 de §28: no inventar). Candidatas, con fecha de consulta 14 nov 2026:
  - CesiumJS — guía de Cesium ion y de los assets de terreno e imagen, y la página de referencia de `Viewer`
    y `ImageryProvider`: https://cesium.com/learn/cesiumjs/ (una entrada distinta a la guía de visualización
    que ya está en §31).
  - CesiumJS — `Widgets/widgets.css` y las carpetas estáticas que hay que servir (`Assets`, `Widgets`,
    `Workers`, `ThirdParty`): https://cesium.com/learn/cesiumjs/ref-doc/
  - MapLibre GL JS (documento §18 lo fijó como tecnología del mapa 2D, sin referencia en §31):
    https://maplibre.org/maplibre-gl-js/docs/
  - Orbitron (SIL Open Font License): https://fonts.google.com/specimen/Orbitron/about
  - Space Grotesk (SIL Open Font License): https://fonts.google.com/specimen/Space+Grotesk/about
  - Roboto (Apache 2.0): https://fonts.google.com/specimen/Roboto/about
  Registrarlas en §31 es tarea del equipo; aquí no se añaden a `ai/referencias/catalogo.json` hasta que estén
  en el documento maestro, porque la validación exige coherencia con §31.

## Límites y pendientes

- Nada de esto está aprobado por el equipo: colores, fuentes y holografía son propuesta (regla 4 de §28).
- No se usan logos ni marcas de la NASA (§ líneas de licencias del documento maestro): la inspiración es de
  color y tipografía, con fuentes de licencia abierta.
- Autoalojar las fuentes y decidir hospedaje depende de DP-06.
- La rama no toca el contrato de datos ni Insight; todo es capa visual.
