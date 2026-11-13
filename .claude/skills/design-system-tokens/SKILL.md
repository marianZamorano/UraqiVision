---
name: design-system-tokens
description: Uso de design tokens (variables CSS) y consistencia visual en la web de UraqiVision, incluidas la paleta de cambio de un solo tono, la trama de zonas sin dato y el contraste para celular al aire libre (§20.2). Usar al crear o revisar estilos, temas o componentes visuales; prohibido hardcodear colores, espaciados o tipografías.
---

# Design tokens de UraqiVision

Adaptada de la skill homónima de chapterCoreIEEE. El documento maestro no fija todavía un sistema de diseño:
la ubicación y el prefijo de abajo son una **propuesta**; confírmalos con M-INTERFAZ (Angie y Marian) y
registra la decisión.

## Cuándo aplicar

- Crear o modificar estilos de la web (CSS, CSS Modules).
- Revisar que una pantalla nueva sea visualmente consistente con el globo, el mapa y los paneles.
- Añadir un valor visual nuevo (color, espacio, radio, sombra).

## Reglas

1. **Un solo archivo de tokens** (propuesta: `web/src/styles/tokens.css`, prefijo `--uv-`). Fuera de ese
   archivo no hay `#hex`, `rgb()`, `oklch()` ni tamaños sueltos.
2. **Escala de espaciado de 4 px** (`--uv-space-1/2/3/4/6/8`); sin valores intermedios inventados.
3. **Tokens semánticos** sobre primitivos cuando importa el significado: `--uv-color-danger`,
   `--uv-color-surface`, `--uv-color-text-muted`.
4. **Colores de datos con su propio grupo** y nunca reutilizados como colores de interfaz:
   - paleta de cambio de **un solo tono** (más oscuro = más cambio), §20.2;
   - trama gris para **zonas sin dato** (`--uv-nodata-pattern`), nunca el color de «sin cambio» (RN-13);
   - colores de las cuatro clases de parche (RN-05) distinguibles también sin color (patrón o etiqueta).
5. **Contraste**: texto ≥ 4,5:1 y componentes ≥ 3:1 (WCAG 2.2 AA, RNF-04); pensado para lectura en celular
   al aire libre.
6. **Tipografía** solo con la escala tipada (`--uv-font-size-xs..xl`, `--uv-line-height-body`).
7. **Movimiento**: duraciones como tokens (`--uv-duration-*`) que valen `0` con
   `prefers-reduced-motion: reduce` (RNF-12).
8. **Tokens nuevos**: se proponen al equipo antes de agregarlos; no se crean para un solo componente.

## Ejemplo

```css
/* Mal */
.leyenda { padding: 13px; background: #1e90ff; }

/* Bien */
.leyenda {
  padding: var(--uv-space-4);
  background: var(--uv-color-surface);
  border: 1px solid var(--uv-color-border);
}
.sin-dato { background: var(--uv-nodata-pattern); }
```

## Checklist

- [ ] Cero colores, espacios o tipografías fuera del archivo de tokens.
- [ ] La paleta de cambio es de un solo tono y la de sin dato es una trama explicada en la leyenda.
- [ ] Contraste AA verificado en textos, controles y leyendas.
- [ ] Las duraciones se anulan con movimiento reducido.
