# Implementation Plan: Portada y fichas del atlas de los nueve departamentos

**Branch**: `feat/63-plan-portada-atlas` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)
**Issue**: #63 · **Prompt SDD**: P-ATLAS-03 · **Módulo (§19)**: M-ATLAS (ejecuta Angie según el reparto de #46;
revisan Joaco y Marian)

> Fuente de verdad: `docs/UraqiVisionDocumentoMaestrov1.1.pdf`. Lo que el documento no fija se rotula
> **propuesta**; lo que falta verificar, **pendiente**.

## Summary

La portada (RF-01, §20.1) y las nueve fichas de departamento (RF-03, §10.4) se construyen **dentro de la
aplicación base de `specs/001-base-web`**, sin crear rutas, stores ni validadores propios. La portada es la ruta
`/` y no carga CesiumJS (RNF-01). «Explorar Bolivia» lleva a `/explore`, donde la lista textual de departamentos
y estaciones (RNF-04) acompaña al globo de M-GLOBO y lo sustituye si no carga (aclaración 2 de la spec).

El contenido de las fichas vive en un **archivo de contenido de la web**, bilingüe, con fuente, fecha de
consulta y método por afirmación. Lo propuso Angie y **el equipo lo acordó el 2026-11-14**; falta registrarlo en
el documento maestro (constitución, principio III). No es un resultado del pipeline ni un archivo de §17.3. Los
campos exactos son propuesta de diseño. Los textos de interfaz (botones, etiquetas, avisos) van en `es.json` y
`en.json` con react-i18next. Así cada texto tiene una sola fuente.

**Dependencia**: este plan se apoya en `specs/001-base-web` tal como está en el commit `836345a` (plan, modelo de
datos y contratos de P-PROY-03). 001 todavía no pasó P-PROY-04 ni P-PROY-05; si cambia, este plan se revisa
(tarea de revisión en `tasks.md`).

## Technical Context

**Language/Version**: TypeScript en modo `strict` (heredado de 001)

**Primary Dependencies**: React, Vite y react-i18next de la base 001 (§18). La portada y las fichas **no**
añaden dependencias; no importan CesiumJS ni MapLibre.

**Storage**: archivo de contenido estático versionado en el repositorio (fichas y cifras de portada);
`atlas/departments.geojson` publicado por el backend (§17.3). Sin base de datos ni escrituras.

**Testing**: Vitest para el validador del contenido, la lista y las fichas; Playwright para el recorrido
portada → explorador → ficha (PS-09) y la portada sin globo.

**Target Platform**: la de 001: dos últimas versiones de Chrome, Firefox, Edge y Safari; escritorio y móvil desde
320 px (RNF-05).

**Project Type**: páginas y componentes de la SPA estática de 001 (`web/`).

**Performance Goals**: portada útil en < 3 s a 10 Mbps y cero solicitudes del globo en `/` (RNF-01); el contenido
de las fichas se carga con el explorador, no con la portada.

**Constraints**: bilingüe al 100 % (RNF-03), WCAG 2.2 AA y alternativa textual al globo (RNF-04), movimiento
reducido (RNF-12), sin fuentes inventadas (§28), sin dato convertido en cero (RN-13).

**Scale/Scope**: una portada, una lista de 9 departamentos y 1 estación, 9 fichas (Tunari dentro de
Cochabamba), unas 10 claves de interfaz por pantalla en dos idiomas.

## Constitution Check

*GATE: comprobado antes de la investigación y de nuevo después del diseño.*

| Principio | Resultado | Evidencia del plan |
|---|---|---|
| I. Documento maestro primero | PASS | Solo RF-01, RF-03 (MVP) y RF-04 como Plus aparte; Insight en fichas queda pendiente (FR-023); ninguna DP se decide. |
| II. Mostrar con honestidad | PASS | Cada afirmación lleva fuente, fecha y método (RN-03); fenómenos como contexto (RN-04); causas como hipótesis (RN-05); «Fuente en verificación» en vez de inventar; «no reportado» en vez de cero (RN-13). |
| III. Arquitectura estática primero | PASS | Archivo de fichas acordado con el equipo (2026-11-14), pendiente de registro en el documento. Se reutilizan el router, el repositorio de publicaciones y los contratos de 001; no se agrega nada a §17.3; las escenas se muestran tal cual, sin recalcular. |
| IV. Bilingüe y accesible | PASS | Contenido es/en en el mismo registro; textos de interfaz en `es.json`/`en.json`; lista textual con teclado y foco; etiqueta + icono ficha/estación. |
| V. Rendimiento | PASS | La portada no importa el contenido de las fichas ni el globo; el contenido llega con `/explore`. |
| VI. Seguridad y costo | PASS | Sin claves ni servicios nuevos; contenido estático. |
| VII. Trazabilidad | PASS | Artefactos y tareas citan RF/RNF/RN/PS e issue #63. |

**Revisión posterior al diseño**: PASS. El archivo de fichas es contenido editorial de la web (propuesta), no un
formato de publicación; el modelo y el contrato de 003 no tocan los contratos de 001.

## Project Structure

### Documentation (this feature)

```text
specs/003-portada-atlas/
├── spec.md
├── plan.md              # este archivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   └── atlas-content.ts # propuesta: forma del archivo de contenido
└── tasks.md             # P-ATLAS-04
```

### Source Code (repository root)

Solo dentro de la estructura de 001 (`specs/001-base-web/plan.md`); nada fuera de ella:

```text
web/
├── src/
│   ├── pages/                      # páginas `/` (portada) y `/explore` de 001
│   ├── features/
│   │   └── atlas/                  # M-ATLAS
│   │       ├── content/            # propuesta: archivo de contenido bilingüe de fichas y cifras de portada
│   │       ├── home/               # portada (RF-01)
│   │       ├── department-list/    # lista textual (RNF-04)
│   │       └── department-card/    # ficha (RF-03)
│   └── i18n/                       # es.json y en.json de 001 (claves `home.*` y `atlas.*`)
└── tests/
    ├── unit/                       # validador del contenido, ficha, lista
    └── e2e/                        # portada → explorador → ficha
```

**Structure Decision**: M-ATLAS vive en `web/src/features/atlas/` (carpeta prevista por 001). Las páginas `/` y
`/explore` son las de 001; el atlas aporta sus componentes. Los nombres de las subcarpetas son **propuesta**.

## Architecture and Data Flow

1. `/` carga la portada con el shell de 001: textos de `es.json`/`en.json`, cifras del problema con fuente y
   fecha desde el contenido de portada, imagen (o «imagen pendiente», FR-005) y el botón «Explorar Bolivia».
   No importa el módulo del globo ni el contenido de las fichas (RNF-01).
2. «Explorar Bolivia» navega a `/explore` (router de 001, un clic, RF-01).
3. En `/explore`, la lista textual se arma con el contenido de las fichas: los nueve departamentos y la estación
   de Santa Cruz, cada uno con etiqueta «Estación»/«Ficha» y su icono. El globo (M-GLOBO) se monta al lado; si no
   carga, la lista queda sola (FR-003, FR-018).
4. Al elegir un departamento (en la lista o en el globo), la ruta guarda `department` (RouteState de 001) y se
   abre su ficha; la misma ficha sigue abierta al cambiar de idioma.
5. La ficha muestra fenómeno, escenas (valor o rango con origen CMR, §10.2), fuentes con fecha o «Fuente en
   verificación», y el estado. Santa Cruz enlaza a su estación (`/station/:stationId` de 001) cuando la estación
   publicada exista; si no, se muestra «no reportada» con motivo (RN-13).
6. La geometría de cada departamento llega de `atlas/departments.geojson` por el repositorio de publicaciones de
   001; el contenido de la ficha se enlaza por identificador de departamento.
7. El contenido se valida al cargarlo (validador con el estilo de 001): una ficha sin fuente verificada pasa la
   validación solo si declara el aviso «Fuente en verificación»; una afirmación sin fuente ni aviso es un error de
   contenido detectado por las pruebas, nunca una ficha publicada sin fuente.

## Routing, Loading and Performance

- Rutas: las de 001 (`/`, `/explore`, `/station/:stationId`). El atlas no agrega rutas.
- El contenido de las fichas se importa de forma diferida con `/explore`; la portada solo incluye su propio
  contenido (frase, cifras, imagen).
- Ningún prefetch del globo ni de las fichas en `/`; se verifica con la prueba de red de 001 (RNF-01).
- `prefers-reduced-motion`: la portada y la lista no animan nada esencial (RNF-12).

## Testing Strategy

- **Unidad (Vitest)**: el validador del contenido (9 departamentos; valores de §10.4 literales; cada afirmación
  con fuente y fecha o aviso; es/en completos) — extensión a las fichas del criterio de contenido de PS-03, que en
  el documento se refiere a las estaciones; cifras de portada con fuente y fecha (RN-03); ausencia → «no
  reportado» (RN-13, PS-04).
- **Componentes (Vitest)**: lista con teclado y foco visible; etiqueta + icono ficha/estación; «sin estación
  disponible»; «Fuente en verificación»; «imagen pendiente»; cambio de idioma sin perder la ficha (PS-04, PS-07).
- **E2E (Playwright)**: portada → «Explorar Bolivia» → ficha de La Paz (HU-07) en escritorio y 320 px; explorador
  sin globo (lista sola); portada sin solicitudes del globo (RNF-01). Es una extensión del recorrido de PS-09
  (portada → globo → estación → análisis → descarga), que se cubre completo en la integración.
- **Accesibilidad**: axe y revisión manual de contraste y textos alternativos (PS-07).
- **Fuentes**: revisión con la skill `rigor-y-fuentes` contra §10.4 y §31.

## Delivery Gates

- 001 implementada y verificada (P-PROY-07) antes de implementar (P-ATLAS-06).
- Revisión de este plan si 001 cambia tras P-PROY-04/05.
- Diferencia de nombres de campo de `atlas/departments.geojson` en 001 resuelta por Joaco con M-PUBLICACIÓN
  (ver research.md, R3).
- Imágenes de portada aportadas por el equipo con fuente y licencia (o «imagen pendiente»).
- `npm run build`, Vitest, Playwright, `sdd:validar`, revisión de fuentes y código vivo en verde.

## Complexity Tracking

No se añade ningún proyecto, servicio, dependencia ni formato publicado. El único artefacto nuevo es el archivo
de contenido de las fichas, que es la mínima forma de cumplir RN-03 (fuente por afirmación) sin tocar §17.3.
