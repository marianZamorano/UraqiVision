---
name: react-component-architecture
description: Arquitectura de componentes React + TypeScript de la web de UraqiVision, cubriendo composición, props, hooks, ubicación de archivos y cómo aislar CesiumJS y MapLibre detrás de componentes propios para poder probarlos y cambiar de vista sin perder estado (RF-29, RF-30). Usar al crear o refactorizar componentes, hooks o la estructura de carpetas de la web.
---

# Arquitectura de componentes React

Adaptada de la skill homónima de chapterCoreIEEE. La estructura de carpetas y las reglas de estado están en
`react-components-and-state`; esta skill fija cómo se escribe cada componente.

## Reglas

1. **Un componente por archivo**, con el nombre en PascalCase (`PanelEstacion.tsx`).
2. **Componentes funcionales puros**: sin clases ni efectos ocultos en el render.
3. **Props tipadas** con una `interface` exportada; nunca `any`. Los datos de los archivos publicados usan los
   tipos de `typed-api-integration`.
4. **Presentacionales** (sin estado) en `components/ui/` o en la carpeta del módulo; **contenedores** con
   lógica en la carpeta del módulo (`globo/`, `mapa/`, `estacion/`, `insight/`). Ninguno importa la capa de
   servicios directamente salvo los contenedores, a través de hooks.
5. **Motores de mapa aislados**: CesiumJS y MapLibre viven solo dentro de `<Globo>` y `<MapaAnalisis>`, que
   reciben props declarativas (selección, capas, fecha, opacidad) y emiten eventos (`onSeleccionar`). El resto
   de la app no toca la API de los motores. Así:
   - se prueban con dobles en Vitest (skill `frontend-testing`);
   - el respaldo 2D (RF-30) es cambiar `<Globo>` por `<MapaAnalisis>` con las mismas props;
   - volver del análisis conserva la selección (RF-29), porque el estado no vive dentro del motor.
6. **Ciclo de vida del motor**: crear el visor en un efecto con referencia al contenedor y **destruirlo** en la
   limpieza; actualizar capas cuando cambian las props, sin recrear el visor.
7. **Hooks** para la lógica que el componente no debe conocer: carga de datos, preferencia de movimiento
   reducido, idioma.
8. **Composición antes que configuración**: `children` o slots en lugar de booleanos como `showX`.
9. **Listas** con `key` estable (id de departamento, estación o fecha), nunca el índice.
10. **Derivar en el render** (polarizaciones disponibles, rango de hectáreas formateado), no con `useEffect`.
11. **Estilos** con CSS Modules y tokens (skill `design-system-tokens`); estilos en línea solo para valores
    dinámicos como la opacidad de una capa.
12. **Textos** siempre por `t()` (skill `interfaz-bilingue-accesible`).

## Ejemplo

```tsx
export interface SelectorPolarizacionProps {
  disponibles: Array<"hh" | "hv" | "ratio">;
  activa: "hh" | "hv" | "ratio";
  onCambiar: (p: "hh" | "hv" | "ratio") => void;
}

export function SelectorPolarizacion({ disponibles, activa, onCambiar }: SelectorPolarizacionProps) {
  const { t } = useTranslation();
  return (
    <fieldset>
      <legend>{t("mapa.polarizacion.titulo")}</legend>
      {(["hh", "hv", "ratio"] as const).map((p) => (
        <label key={p}>
          <input type="radio" name="polarizacion" checked={activa === p}
                 disabled={!disponibles.includes(p)} onChange={() => onCambiar(p)} />
          {t(`mapa.polarizacion.${p}`)}
          {!disponibles.includes(p) && <span> — {t("mapa.polarizacion.noDisponible")}</span>}
        </label>
      ))}
    </fieldset>
  );
}
```

El ejemplo cumple RF-08: la polarización inexistente se deshabilita y se explica.

## Errores comunes

- Llamar a la API de CesiumJS o MapLibre desde componentes de fuera de `<Globo>` o `<MapaAnalisis>`.
- Recrear el visor en cada render o no destruirlo al desmontar (fugas de memoria y de WebGL).
- Componentes de cientos de líneas: separar presentacional, contenedor y hook.

## Checklist

- [ ] Nombre de archivo igual al componente; props tipadas sin `any`.
- [ ] CesiumJS y MapLibre solo dentro de sus componentes, con props declarativas.
- [ ] Visores destruidos al desmontar y no recreados en cada render.
- [ ] Textos por `t()`; listas con `key` estable.
