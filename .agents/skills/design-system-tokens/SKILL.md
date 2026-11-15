---
name: design-system-tokens
description: Uso de design tokens (variables CSS) y consistencia visual en la web de UraqiVision, incluidas la paleta de cambio de un solo tono, la trama de zonas sin dato y el contraste para celular al aire libre (§20.2). Usar al crear o revisar estilos, temas o componentes visuales; prohibido hardcodear colores, espaciados o tipografías.
---

# Design tokens de UraqiVision

Adaptada de la skill homónima de chapterCoreIEEE. El documento maestro no fija todavía un sistema de diseño:
la ubicación y los nombres de abajo son una **propuesta**; confírmalos con M-INTERFAZ (Angie y Marian) y
registra la decisión.

## Cuándo aplicar

- Crear o modificar estilos de la web (CSS, CSS Modules).
- Revisar que una pantalla nueva sea visualmente consistente con el globo, el mapa y los paneles.
- Añadir un valor visual nuevo (color, espacio, radio, sombra).

## Reglas

1. **Un solo archivo de tokens** (propuesta: `web/src/styles/tokens.css`, nombres de `tokens.css`, sin prefijo). Fuera de ese
   archivo no hay `#hex`, `rgb()`, `oklch()` ni tamaños sueltos.
2. **Escala de espaciado de 4 px** (`--espacio-N/2/3/4/6/8`); sin valores intermedios inventados.
3. **Tokens semánticos** sobre primitivos cuando importa el significado: `--color-acento`,
   `--color-superficie`, `--color-texto-secundario`.
4. **Colores de datos con su propio grupo** y nunca reutilizados como colores de interfaz:
   - paleta de cambio de **un solo tono** (más oscuro = más cambio), §20.2;
   - trama gris para **zonas sin dato** (`--trama-sin-dato`), nunca el color de «sin cambio» (RN-13);
   - colores de las cuatro clases de parche (RN-05) distinguibles también sin color (patrón o etiqueta).
5. **Contraste**: texto ≥ 4,5:1 y componentes ≥ 3:1 (WCAG 2.2 AA, RNF-04); pensado para lectura en celular
   al aire libre.
6. **Tipografía**: solo con la escala tipada (`--texto-base`, `--texto-menu`, `--texto-titulo`,
   `--texto-subtitulo`, `--interlineado`) y con las tres familias declaradas en el archivo de tokens:
   `--fuente-titulo` (Orbitron: titulares y logo), `--fuente-menu` (Space Grotesk: navegación y etiquetas de
   destino) y `--fuente-base` (Roboto: todo el texto corrido). Ningún componente escribe `font-family`.
   Las tres son de licencia abierta (Orbitron y Space Grotesk: SIL Open Font License; Roboto: Apache 2.0).
   Hoy se piden a `fonts.googleapis.com` desde `web/index.html` con `display=swap` y reserva en `system-ui`,
   así que sin red la web sigue siendo legible. **Antes de publicar hay que autoalojarlas** (p. ej.
   `@fontsource`; añadir una dependencia se propone al equipo): es una petición externa que pesa en RNF-01 y
   RNF-02 y depende de la política de contenido externo del hospedaje (pendiente DP-06).
7. **Mayúsculas**: títulos, marca y destinos de navegación van en mayúsculas por CSS (`text-transform`), nunca
   editando los textos de `i18n` (RNF-03): el español y el inglés se conservan tal cual.
8. **Movimiento**: duraciones como tokens (`--duracion-*`) que valen `0` con
   `prefers-reduced-motion: reduce` (RNF-12).
9. **Tokens nuevos**: se proponen al equipo antes de agregarlos; no se crean para un solo componente. La
   paleta y las familias tipográficas de marca son **propuesta pendiente de aprobación**, no decisión tomada.

## Ejemplo

```css
/* Mal */
.leyenda { padding: 13px; background: #1e90ff; }

/* Bien */
.leyenda {
  padding: var(--espacio-N);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
}
.sin-dato { background: var(--trama-sin-dato); }
```

## Checklist

- [ ] Cero colores, espacios o tipografías fuera del archivo de tokens.
- [ ] Las familias vienen solo de `--fuente-titulo`, `--fuente-menu` y `--fuente-base`; ninguna fuente nueva
      sin licencia verificada (SIL OFL o Apache 2.0) y sin decidir el autoalojo antes del despliegue.
- [ ] La paleta de cambio es de un solo tono y la de sin dato es una trama explicada en la leyenda.
- [ ] Contraste AA verificado en textos, controles y leyendas.
- [ ] Las duraciones se anulan con movimiento reducido.
