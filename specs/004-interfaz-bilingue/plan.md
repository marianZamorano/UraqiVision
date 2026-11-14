# Implementation Plan: interfaz bilingüe, panel, estados, glosario y fuente y calidad

**Branch**: `feat/65-plan-interfaz-bilingue` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)
**Input**: `specs/004-interfaz-bilingue/spec.md` · **Prompt SDD**: P-INTERFAZ-03 · **Issue**: #65
**Responsables**: Marian; Angie en método (RF-15) y descargas (RF-21, RF-22) según el reparto de #42.
Revisa Mimi.

## Summary

Capa de interfaz sobre la base web (`specs/001-base-web`). Incluye:

- panel de la estación (RF-33);
- presentación de los seis estados de RF-34, reutilizable por el mapa y el globo;
- idioma es/en sin recargar (RF-20);
- glosario accesible (RF-19);
- fuente y calidad (RF-37);
- página Acerca de (RF-24).

Angie añade la página de método y las descargas. Todo **muestra** los archivos publicados (§17.3) sin
recalcularlos (RF-37) y reutiliza la capa de datos, los contratos y la máquina `ViewState` de 001. Lo nuevo de
004 son componentes de presentación, textos, formatos y unas **extensiones de contrato propuestas** que hay que
acordar con 001 y M-PUBLICACIÓN (`contracts/interface-extensions.ts`).

## Technical Context

Hereda todo lo de 001: TypeScript `strict`, React, Vite, react-i18next, Recharts, Vitest y Playwright, SPA
estática en `web/`.

- **Language/Version**: TypeScript `strict` (§18: «tipado estricto»).
- **Primary Dependencies**:
  - react-i18next: lo crea 001; esta feature añade los diccionarios y la carga diferida del inglés (R1).
  - Recharts: gráfico de hectáreas con banda de rango (R4).
  - No se añade ninguna dependencia nueva.
- **Storage**: ninguno propio. El idioma va en `RouteState` y en `localStorage` (001).
- **Testing**:
  - Vitest: formatos, marcas, estados, glosario y paridad de claves es/en.
  - Playwright: idioma, recorrido, 320 px, movimiento reducido y accesibilidad.
  - Casos en `pruebas/casos-de-prueba.md`.
- **Target Platform**: la de 001 (dos últimas versiones de los navegadores principales, desde 320 px).
- **Project Type**: módulo de interfaz dentro de la SPA de 001.
- **Performance Goals**:
  - La portada sigue por debajo de 3 s (RNF-01): el inglés, el gráfico y las páginas de Acerca de y método se
    cargan bajo demanda.
- **Constraints**:
  - RN-13: ningún dato ausente se muestra como 0.
  - RN-06: las hectáreas siempre llevan rango.
  - RN-05: las hipótesis llevan siempre su fuente.
  - Accesibilidad: WCAG 2.2 AA y movimiento reducido.
  - DP-02, DP-03 y DP-06 siguen pendientes.
- **Scale/Scope**:
  - 1 panel, 6 estados, 21 términos del glosario, 2 idiomas;
  - páginas: fuente y calidad, Acerca de y, la de Angie, método.

## Constitution Check

*GATE: se comprobó antes de investigar y otra vez después del diseño.*

| Principio | Resultado | Evidencia |
|---|---|---|
| I. Documento maestro primero | PASS | Solo MVP de M-INTERFAZ, más RF-23 y RF-31 como Plus. DP-02, DP-03 y DP-06 quedan pendientes y no se implementan. |
| II. Mostrar con honestidad | PASS | `DisplayedFigure` lleva la marca y el motivo. El rango de hectáreas es obligatorio. Las hipótesis llevan fuente. DEMO es visible. Sin ceros sustitutos. |
| III. Arquitectura estática primero | PASS | Solo se leen los archivos de §17.3 a través de la capa de datos de 001. Los campos nuevos se proponen a M-PUBLICACIÓN y no se inventan. |
| IV. Bilingüe y accesible | PASS | Diccionarios es/en, `lang` dinámico, anuncios, foco y glosario según WCAG 1.4.13. |
| V. Rendimiento | PASS | El inglés y el gráfico se cargan con `import()`. No hay dependencias nuevas. |
| VI. Seguridad y costo | PASS | La feature no usa claves ni tokens. |
| VII. Trazabilidad | PASS | Cada decisión cita su RF, RN, RNF o PS. Issue #65. |

**Revisión posterior al diseño**: PASS. Los contratos nuevos son extensiones marcadas como propuesta y no cambian
los de 001.

## Project Structure

### Documentation (this feature)

```text
specs/004-interfaz-bilingue/
├── spec.md
├── plan.md                  # este archivo
├── research.md              # R1–R9
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   └── interface-extensions.ts   # propuesta, a acordar con 001 y M-PUBLICACIÓN
├── contenido/               # glosario, textos es/en, Acerca de (borradores)
├── pruebas/                 # casos CP-01 a CP-64
└── tasks.md                 # siguiente fase: /speckit-tasks (P-INTERFAZ-04)
```

### Source Code (dentro de la estructura de 001)

```text
web/src/
├── app/                  # de 001; 004 lo EXTIENDE, no lo duplica
│   ├── ViewStatePresenter.tsx   # 001 T029 + mensajes, marcas y reglas de foco de 004 (RF-34, FR-008a)
│   └── LanguageSwitcher.tsx     # 001 T032 + lang del documento e inglés diferido (RF-20, FR-012a)
├── features/interface/
│   ├── panel/            # PanelEstacion (prop opcional `acciones`) y CifraMostrada (RF-33)
│   ├── hectareas/        # gráfico con banda de rango y tabla alternativa (RN-06)
│   ├── glosario/         # TerminoGlosario y su definición (RF-19)
│   ├── fuente-calidad/   # SeccionFuenteCalidad (RF-37)
│   ├── descargas/        # Angie: enlaces RF-22, CSV y PNG RF-21; se insertan en el panel por `acciones`
│   └── formato/          # formatearFecha y formatearHectareas (Intl, America/La_Paz)
├── pages/                # de 001 (T022); 004 completa su contenido
│   ├── AboutPage.tsx     # Acerca de (RF-24)
│   └── MethodPage.tsx    # Angie: método (RF-15)
└── i18n/                 # de 001 (T015); 004 añade sus claves
    ├── es.json           # se carga en el bundle inicial
    └── en.json           # se carga bajo demanda (R1)
```

**Structure Decision**: lo nuevo de 004 vive en `features/interface/`. Los estados, el selector de idioma, las
páginas, i18n, la región de anuncios, el foco, el movimiento reducido y los datos de prueba **son de 001 y se
extienden** (001 T015, T016, T022, T024, T029, T032, T037 y T039), así no hay dos piezas para lo mismo. El
presentador de estados de 001 no importa el mapa ni el globo, de modo que los dos lo reutilizan.

## Architecture and Data Flow

1. La capa de datos de 001 entrega un `ViewState<PublishedStationBundle>`.
2. El `ViewStatePresenter` de 001, extendido por 004, decide qué pintar según `kind`. Con `available` o
   `limited`, pasa el bundle a `PanelEstacion`.
3. Un adaptador puro (`aPanelEstacion`) convierte el bundle y sus extensiones en `PanelEstacion` y
   `DisplayedFigure[]`. Aplica las marcas a partir del `status` y de los controles publicados y **nunca calcula un
   umbral**.
4. Los formatos (`formato/`) dependen solo del idioma activo y de la zona `America/La_Paz`.
5. El cambio de idioma lo emite el `LanguageSwitcher` de 001, extendido, y actualiza `RouteState.lang` y `document.documentElement.lang`, y
   carga `en.json` la primera vez.
6. Las descargas (Angie) leen el mismo bundle y la imagen del mapa de M-MAPA. No modifican los archivos
   publicados.

## Dependencies with other modules

| Con | Qué | Estado |
|---|---|---|
| 001-base-web (Joaco) | Capa de datos, `ViewState`, rutas, i18n, tokens | Plan y tareas listos (P-PROY-03 y P-PROY-04); 004 se implementa cuando 001 esté verificada (P-PROY-07) |
| M-PUBLICACIÓN (Mimi) | Campos propuestos en `interface-extensions.ts` | **Por acordar** |
| M-MAPA (Joaco) | Imagen del mapa para el PNG (R7) | **Por acordar**; tarea de Angie |
| M-VALIDACIÓN (Tabata) | `quality.json` y `validation.json` con CQ-05, VC-02 y VC-05 | Se consume tal cual; DP-03 pendiente |
| Angie | Método y descargas dentro de 004 | Reparto de #42 |

## Testing Strategy

Ver `pruebas/casos-de-prueba.md`. Se escribe la prueba antes del código (TDD).

1. **Unidad:** `formatearFecha`, `formatearHectareas`, `aPanelEstacion` (marcas, rango, hipótesis) y la paridad de
   claves es/en.
2. **Componentes:** lo que 004 añade al `ViewStatePresenter` (mensajes, marcas y foco de FR-008a), glosario
   (ratón, tacto, teclado y WCAG 1.4.13) y lo que 004 añade al `LanguageSwitcher` (`lang` e inglés diferido).
   Las pruebas generales de teclado, anuncios y reintento son de 001 (T035) y no se repiten.
3. **E2E:** recorrido es → en, 320 px y 200 %, movimiento reducido y revisión automática de accesibilidad en cada
   estado.

## Delivery Gates

- Extensiones de contrato acordadas con Joaco y Mimi (o la spec ajustada si no se aceptan).
- Textos de `contenido/` revisados por Mimi y pasados a `es.json` y `en.json`.
- Vitest y Playwright en verde. 0 violaciones serias o críticas de accesibilidad. `sdd:validar` y `ai:check` en
  verde.

## Complexity Tracking

No se añade ningún proyecto, servicio ni dependencia. Las extensiones de contrato son el mínimo necesario para
cumplir RN-05, RN-06, RF-11, RF-37 y CQ-05 sin que la web recalcule nada.
