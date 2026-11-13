---
name: interfaz-bilingue-accesible
description: Reglas de interfaz de UraqiVision para textos en español e inglés con react-i18next, accesibilidad WCAG 2.2 AA, movimiento reducido, estados de la vista, glosario y formatos de cifras y fechas (RF-19, RF-20, RF-33, RF-34, RNF-03, RNF-04, RNF-12, RN-07, RN-13). Usar al crear o revisar componentes React, textos visibles, formularios, paneles, estados de carga o error, o al auditar una pantalla.
---

# Interfaz bilingüe y accesible

Fuente: §14, §20, RF-19, RF-20, RF-33, RF-34, RN-06, RN-07, RN-13 y PS-04/PS-07. Adaptado de la skill
`accessibility-wcag` del repositorio chapterCoreIEEE, actualizada a **WCAG 2.2 AA** (RNF-04).

## Idiomas (RF-20, RNF-03)

- **Ningún texto visible escrito directamente en un componente**: todo pasa por `t('clave')` de
  react-i18next, con la misma clave en `es.json` y en `en.json`. Esto incluye `alt`, `aria-label`,
  `title`, leyendas, unidades, mensajes de error y textos de descarga.
- El cambio de idioma no recarga la página y también cambia las respuestas de Insight (CU-05).
- Las claves se agrupan por pantalla o módulo (`globo.*`, `mapa.*`, `estacion.*`, `insight.*`, `comun.*`).
- El hook de edición del repositorio avisa si `es.json` y `en.json` quedan con claves distintas.
- `lang` del documento HTML acorde al idioma activo.

## Cifras, fechas y ausencia de dato

- Números con el formato del idioma (`Intl.NumberFormat`): `1.234,5 ha` en español y `1,234.5 ha` en inglés.
- Hectáreas **siempre con rango** (RN-06): p. ej. «1.240 ha (1.100–1.380)».
- Fechas de adquisición guardadas en UTC y mostradas en **hora de Bolivia** (`America/La_Paz`), RN-07.
- **Sin dato nunca es cero** (RN-13, RF-34): muestra «no reportada» y el motivo. Pruébalo (PS-04).

## Estados de la vista (RF-34)

Toda vista que carga datos tiene estos estados, con texto en ambos idiomas: **cargando**, **resultado
disponible**, **datos limitados**, **sin datos**, **fecha incompatible** y **error con reintento**.
Ninguna pantalla queda vacía.

## Accesibilidad (WCAG 2.2 AA, RNF-04)

1. **Teclado**: todo control es alcanzable y operable con Tab, Enter, Escape y flechas; foco **visible**
   y no tapado por paneles fijos (2.4.11). El deslizador (RF-06) se mueve con flechas.
2. **Contraste**: texto ≥ 4,5:1, texto grande y componentes de interfaz ≥ 3:1. Lectura en celular al
   aire libre (§20.2).
3. **Semántica antes que ARIA**: `<button>`, `<nav>`, `<label>`, `<table>`; ARIA solo para lo que falte.
4. **Nombres accesibles**: los botones de solo ícono (pantalla completa, volver a Bolivia, opacidad) llevan
   etiqueta traducida.
5. **Imágenes**: las vistas de radar tienen `alt` que dice fecha, órbita, polarización y qué muestran.
6. **Contenido dinámico**: carga y errores se anuncian con `aria-live="polite"` o `role="alert"`.
7. **Tamaño de objetivo**: al menos 24 × 24 px (2.5.8); mejor 44 × 44 px en táctil.
8. **Arrastre** (2.5.7): el deslizador y el mapa tienen alternativa sin arrastre (botones o teclado).
9. **Reflow**: usable a 320 px de ancho y con 200 % de zoom.
10. **Movimiento reducido** (RNF-12): con `prefers-reduced-motion: reduce` no hay vuelos de cámara ni
    animaciones de la serie; los cambios son instantáneos.
11. **Alternativa al globo**: lista textual de departamentos y estaciones (RNF-04).

## Glosario (RF-19)

Cada término de radar del sitio (banda L, HH, HV, dB, γ0, speckle, CRID, GCOV, línea base…) tiene
definición en ambos idiomas, accesible al pasar el cursor, al tocar y con el foco del teclado. Las
definiciones salen de §30 del documento maestro.

## Checklist

- [ ] Ningún texto visible fuera de `es.json`/`en.json`; mismas claves en ambos.
- [ ] Recorrido completo solo con teclado y foco visible.
- [ ] Contraste AA en textos, controles y leyendas.
- [ ] Los seis estados de RF-34 existen y ninguno muestra cero en lugar de «sin dato».
- [ ] Movimiento reducido probado con la preferencia activada (PS-07).
- [ ] Revisión con axe sin violaciones graves.

## Referencias del documento maestro (§31)

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **NISAR (2025). NASA-ISRO SAR (NISAR) mission science users' handbook (2.ª ed.)** — <https://doi.org/10.48577/jpl.UD4HV3>
  Citada en: no la cita el cuerpo del documento (relación propuesta por el equipo). Aplica a: RN-11, RF-08, RF-15, RF-19, RF-24, RF-16. Fundamentos de la misión y del radar (§9): respalda el texto de qué resalta cada polarización (RF-08), el glosario (RF-19), la página de método y las citas de datos (RN-11, RF-24) y las explicaciones de Insight; el documento no la cita en el cuerpo.

<!-- referencias:fin -->
