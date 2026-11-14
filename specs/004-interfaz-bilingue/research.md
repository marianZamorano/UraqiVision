# Research: interfaz bilingüe (004)

Fuentes consultadas:
- Documento maestro v1.1, la constitución v1.1.0 y `specs/001-base-web` (plan, contratos, modelo de datos).
- Documentación vigente consultada el 2026-11-14 con el MCP context7: react-i18next (`/websites/react_i18next`) y
  Recharts (`/recharts/recharts`).

Lo que el documento no fija está marcado como **propuesta**.

## R1. Carga de idiomas y cambio sin recargar (RF-20, RNF-01, RNF-03)

- **Decisión:** usar la instancia de i18next con react-i18next que crea la base web (`web/src/i18n/`).
  - El español va dentro del bundle inicial. El inglés se carga con `import()` dinámico la primera vez y se
    registra con `i18n.addResourceBundle`, como pide 001 («inglés bajo demanda»).
  - El cambio se hace con `i18n.changeLanguage()`. react-i18next vuelve a pintar por el evento `languageChanged`
    (opción `bindI18n`, por defecto `'languageChanged'`).
- **Motivo:** no añade dependencias (001 dice que no se incorpora otra librería) y la portada sigue por debajo
  de 3 s.
- **Alternativas descartadas:**
  - `i18next-http-backend`: es otra dependencia y otra petición.
  - Cargar los dos idiomas al inicio: pesa más en la portada.

## R2. Idioma declarado de la página (FR-012a, WCAG 3.1.1)

- **Decisión:** al recibir `languageChanged`, actualizar `document.documentElement.lang` (`es` o `en`) y guardar el
  idioma en la ruta (`RouteState.lang`, de 001). El foco no se mueve del selector.
- **Motivo:** el lector de pantalla pronuncia en el idioma correcto y la vista se conserva (SC-007).

## R3. Formatos de fecha y número (RN-07, FR-013)

- **Decisión:** usar `Intl.DateTimeFormat` con `timeZone: 'America/La_Paz'` y `Intl.NumberFormat` con locale
  `es-BO` o `en-US` según el idioma, envueltos en funciones puras `formatearFecha` y `formatearHectareas`.
  - El CSV nunca usa estas funciones: escribe ISO 8601 UTC y punto decimal.
- **Motivo:**
  - Bolivia es UTC−04 todo el año y la zona IANA evita calcular el desfase a mano.
  - Las funciones puras se prueban sin el DOM (CP-02, CP-05).
- **Propuesta:** los locales `es-BO` y `en-US`, y el texto «hora de Bolivia, UTC−04». El documento solo fija
  «hora de Bolivia».
- **Alternativas descartadas:** el formateo ICU dentro de las traducciones (`{num, number}`) mezcla formato y
  texto y obliga a usar la macro ICU.

## R4. Gráfico de hectáreas con rango (RN-06, RN-13)

- **Decisión:** usar un `ComposedChart` de Recharts con un `Area` cuyo `dataKey` devuelve `[mín, máx]` para la
  banda del rango, más un `Line` para el valor.
  - Un valor no reportado se pasa como `null` y Recharts deja un hueco (el punto se trata como ruptura): nunca
    dibuja 0.
  - `isAnimationActive="auto"` respeta `prefers-reduced-motion`.
  - Recharts 3 activa `accessibilityLayer` por defecto: teclado y lector de pantalla.
- **Motivo:** cumple RN-06 (rango siempre visible), RN-13 (hueco en lugar de cero) y RNF-12 sin código extra.
- **Complemento obligatorio:** una tabla con los mismos datos debajo del gráfico. Es la alternativa textual
  (RNF-04, §20.2): el gráfico nunca es la única forma de leer las cifras.
- **Pendiente:** confirmar en el plan de tareas la versión exacta de Recharts que fija la base web.

## R5. Estados de la vista reutilizables (RF-34, FR-008, FR-008a, FR-011)

- **Decisión (corregida en el análisis P-INTERFAZ-05, hallazgo I2):** **extender** el `ViewStatePresenter`
  que crea 001 (T029). No se crea un componente nuevo. 004 le añade:
  - los mensajes, las marcas y los motivos;
  - la alerta del error;
  - las reglas de foco de FR-008a.

  La región de anuncios (001 T016), la base de foco y ARIA (001 T039) y `useReducedMotion` (001 T037) son de 001
  y se reutilizan. El mapa (M-MAPA) y el globo (M-GLOBO) usan el mismo presentador.
- **Motivo:** una sola fuente de mensajes y de accesibilidad para los tres módulos (§24: evitar duplicar trabajo).
- **Alternativa descartada:** un `VistaConEstado` propio en `features/interface/estados/`, porque duplicaría el
  presentador de 001.

## R6. Glosario accesible en ratón, tacto y teclado (RF-19, FR-014a)

- **Decisión:** un botón de término (`<button>` con nombre accesible) que abre una definición no modal.
  - Se cierra con Escape, con «cerrar» (≥ 24 × 24 px) o tocando fuera.
  - Se puede pasar el cursor por encima sin que desaparezca, y no desaparece sola (WCAG 1.4.13).
  - Al cerrar, el foco vuelve al término.
  - Las definiciones salen de `contenido/glosario.md`, que se pasa a `es.json` y `en.json`.
- **Alternativas descartadas:** el atributo `title` no se puede usar con el teclado ni en el celular.

## R7. Descargas (RF-21, RF-22; las implementa Angie según el reparto de #42)

- **Decisión:**
  - **RF-22:** un enlace con `download` a la URL publicada del archivo, sin transformarlo.
  - **CSV (RF-21):** se genera en el navegador a partir de `HectaresRow[]`, con encabezado de créditos (FR-016a),
    ISO UTC y punto decimal, como `Blob`.
  - **PNG (RF-21):** se compone en un `canvas` con la imagen del mapa de M-MAPA más la leyenda, las unidades, la
    órbita, la polarización, la trama sin dato y los créditos (FR-016).
- **Dependencia con M-MAPA:** para exportar el lienzo, el mapa tiene que permitirlo, ya sea conservando el buffer
  de dibujo o exportando justo después de un render. Se acuerda con Joaco. Es una **propuesta**.
- **Pendiente:** la URL del sitio en los créditos (DP-06).

## R8. Tokens de diseño y contraste al aire libre (§20.2, RNF-04)

- **Decisión:** variables CSS en `web/src/styles/` (las crea la base web), con tokens semánticos para el texto, la
  superficie, el foco y las marcas (`limitada`, `no-reportada`, `validacion-limitada`), que llevan siempre texto
  o ícono además del color (WCAG 1.4.1).
- **Propuesta al equipo:**
  - El texto del panel apunta a un contraste de **7:1** (nivel AAA de WCAG) para leerse al aire libre.
  - El mínimo exigible sigue siendo AA (4.5:1 para el texto y 3:1 para los componentes).
  - El documento no fija un umbral para el aire libre.

## R9. Huecos entre los contratos de 001 y la spec 004

Los contratos de 001 están marcados como propuesta. Para cumplir la spec 004 hacen falta las **extensiones
propuestas** de `contracts/interface-extensions.ts`, que hay que acordar con Joaco (001) y Mimi (M-PUBLICACIÓN):

| Hueco | Requisito | Propuesta |
|---|---|---|
| `sensitivityRange` solo existe en la variante `limited` | RN-06: rango siempre; §17.3 `hectares.csv` trae el rango | Rango en toda cifra reportada de hectáreas |
| `QualityDocument` no marca CQ-05 ni distingue «no reportado» | FR-010 | Lista de controles CQ-01 a CQ-06, cada uno con un resultado o «not-reported» |
| `ValidationDocument` no dice si la validación es limitada ni la alternativa usada | RF-11, FR-006 | `limited` y `alternatives` (VC-02, VC-05) |
| `StationDocument` no trae hipótesis ni advertencias | RF-33, §17.3 `station.json` | `hypotheses[]` con clase de §11.2 y MC-06 y fuente (RN-05), y `warnings[]` |
| `ManifestDocument` no trae la madurez ni la fuente de validación | RF-37, RN-02 | `maturitySegments` (tramos PROVISIONAL y VALIDATED con su CRID y fechas) y `validationSource` |
| Porcentaje de datos válidos | RF-33, CQ-05 | `validDataPercent: ReportableValue<number>`, **pendiente de DP-03** |
