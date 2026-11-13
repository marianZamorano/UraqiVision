---
name: responsive-visual-testing
description: Verificación visual responsive de la web de UraqiVision con el MCP de Playwright, cubriendo tamaños de pantalla, desbordes, estados de la vista, globo y mapa en celular, movimiento reducido y consola limpia (RNF-04, RNF-05, RNF-12, RF-34, PS-07, PS-09). Usar al validar una pantalla en distintos tamaños o antes de integrar cambios de interfaz.
---

# Verificación visual responsive

Adaptada de la skill homónima de chapterCoreIEEE (sin Figma: UraqiVision no tiene un archivo de diseño de
referencia; los criterios salen de §20 del documento maestro).

## Cuándo aplicar

- Validar una pantalla nueva o modificada en varios tamaños.
- Verificar que no haya desbordes horizontales ni controles inalcanzables en el celular.
- Antes de la demo (§26) y de la prueba de recorrido completo (PS-09).

## Reglas

1. **Cuatro tamaños** con el MCP `playwright` (cambiar tamaño + captura), **solo contra `localhost`**:
   `360x800` (celular), `768x1024` (tablet), `1024x768` (laptop) y `1440x900` (escritorio).
2. **Sin scroll horizontal** a ningún tamaño (WCAG 1.4.10): comprobar
   `document.documentElement.scrollWidth <= innerWidth`.
3. **Globo y mapa en celular** (RNF-05): se pueden mover, hacer zoom y cerrar paneles; los controles de
   pantalla completa y «volver a Bolivia» (RF-28) quedan visibles y operables.
4. **Estados de RF-34** vistos al menos en celular y escritorio: cargando, resultado, datos limitados, sin
   datos, fecha incompatible y error con reintento.
5. **Ambos idiomas**: el inglés y el español no rompen la maquetación (los textos cambian de largo).
6. **Movimiento reducido** (RNF-12): emular `prefers-reduced-motion: reduce` y comprobar que el vuelo de
   cámara y las animaciones se vuelven instantáneos.
7. **Respaldo 2D** (RF-30): si se puede, simular el fallo del globo (por ejemplo deshabilitando WebGL) y
   comprobar que el atlas abre en el mapa 2D.
8. **Consola del navegador**: sin errores de render, 404 de archivos publicados ni avisos de accesibilidad.
9. **Reporte**: hallazgos por gravedad con tamaño, componente y evidencia (captura o medición).

## Flujo

1. Levantar la web en local (comando que indique el plan de la feature).
2. Con el MCP `playwright`, recorrer los cuatro tamaños, los estados y los dos idiomas.
3. Medir desbordes, revisar la consola y probar el movimiento reducido.
4. Emitir el reporte (lo puede hacer el subagente `uiux-design-auditor` o `revisor-interfaz`).

## Checklist

- [ ] Cuatro tamaños probados con captura o medición.
- [ ] Sin scroll horizontal de 320 a 1440 px.
- [ ] Globo, mapa y paneles usables en celular.
- [ ] Estados de RF-34 revisados en ambos idiomas.
- [ ] Movimiento reducido verificado.
- [ ] Consola sin errores.
