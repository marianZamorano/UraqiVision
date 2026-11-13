---
name: frontend-testing
description: Pruebas de la web de UraqiVision con Vitest y React Testing Library, incluidos dobles para el globo de CesiumJS y el mapa de MapLibre (WebGL no existe en jsdom), estados de RF-34, sin dato nunca como cero, cambio de idioma, sincronización de la línea de tiempo y movimiento reducido (PS-04, PS-07, PS-08). Usar al escribir o revisar pruebas de componentes, hooks o servicios de la web.
---

# Pruebas de la web (Vitest + React Testing Library)

Adaptada de la skill homónima de chapterCoreIEEE. Cubre PS-04 (interfaz), parte de PS-07 (accesibilidad) y
la lógica de PS-08 (globo); el recorrido completo en navegador es PS-09 con Playwright (skill
`qa-automation`).

## Reglas

1. **Comportamiento visible**: queries por rol o texto accesible (`getByRole`, `getByLabelText`); nunca
   `container.querySelector` ni clases CSS.
2. **Un test, un comportamiento**, con nombre en el lenguaje del usuario («muestra "no reportada" cuando falta
   la cifra»).
3. **WebGL no existe en jsdom**: CesiumJS y MapLibre no se montan en Vitest. Aísla el motor detrás de un
   componente o adaptador propio (`<Globo>`, `<MapaAnalisis>`) y sustitúyelo por un doble en las pruebas de
   pantallas. La lógica (estado de selección, capas activas, fecha) se prueba sin el motor.
4. **Red mockeada en el borde**: la capa de servicios (`services/`), nunca el componente ni el hook bajo
   prueba. Los archivos publicados de prueba son pequeños y hechos a mano; nunca datos reales presentados como
   resultados (RN-04).
5. **Los seis estados de RF-34**: cargando, resultado, datos limitados, sin datos, fecha incompatible y error
   con reintento.
6. **Sin dato ≠ 0** (RN-13): un caso por componente que muestra cifras.
7. **Idiomas** (RF-20, CU-05): renderiza con react-i18next en `es` y en `en`; al cambiar de idioma cambian los
   textos sin recargar. Una prueba de que `es.json` y `en.json` tienen las mismas claves.
8. **Sincronización** (RF-36): al cambiar la fecha, cambian a la vez imagen, polarizaciones disponibles,
   hectáreas y focos.
9. **Polarizaciones** (RF-08): con una fecha solo HH, las vistas HV y HV/HH están deshabilitadas con su
   explicación.
10. **Movimiento reducido** (RNF-12): con `matchMedia('(prefers-reduced-motion: reduce)')` simulado, el vuelo
    de cámara recibe duración 0 (se verifica en la llamada al doble del globo).
11. **Determinismo**: fechas fijas (`vi.useFakeTimers`, `vi.setSystemTime`), zona horaria explícita para
    probar la hora de Bolivia (RN-07); limpiar mocks en `afterEach`.

## Ejemplo

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PanelHectareas } from "./PanelHectareas";

describe("PanelHectareas", () => {
  it("muestra 'no reportada' con su motivo cuando falta la cifra", () => {
    render(<PanelHectareas fila={{ date: "2026-09-15", hectares: null, low: null, high: null, reason: "Datos insuficientes" }} />);
    expect(screen.getByText(/no reportada/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0/)).not.toBeInTheDocument();
  });

  it("muestra las hectáreas con su rango", () => {
    render(<PanelHectareas fila={{ date: "2026-09-15", hectares: 1240, low: 1100, high: 1380 }} />);
    expect(screen.getByText(/1\.240 ha/)).toBeInTheDocument();
    expect(screen.getByText(/1\.100.*1\.380/)).toBeInTheDocument();
  });
});
```

## Errores comunes

- Intentar montar CesiumJS o MapLibre en jsdom: falla o queda en blanco.
- Probar detalles de implementación (estado interno, clases).
- Mockear el propio módulo bajo prueba: el test pasa aunque la lógica esté rota.

## Checklist

- [ ] Globo y mapa sustituidos por dobles; su lógica probada aparte.
- [ ] Seis estados de RF-34 y el caso de sin dato.
- [ ] Ambos idiomas y paridad de claves.
- [ ] Sincronización de fecha y polarizaciones deshabilitadas.
- [ ] Movimiento reducido verificado.
- [ ] `npm test` en verde antes de integrar.
