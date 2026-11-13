---
name: vite-bundle-optimization
description: Rendimiento y bundle de la web de UraqiVision con Vite, incluidos la configuración de CesiumJS (archivos estáticos y CESIUM_BASE_URL), la carga diferida del globo, la división por rutas, las vistas WebP por fecha y la medición de la portada (RNF-01, RNF-02, RNF-05). Usar al configurar Vite, añadir dependencias pesadas, crear pantallas nuevas o revisar tiempos de carga.
---

# Bundle y rendimiento con Vite

Adaptada de la skill homónima de chapterCoreIEEE. Metas del documento maestro: **portada en menos de 3 s a
10 Mbps** y CesiumJS cargado **solo al entrar al explorador** (RNF-01); vistas de una estación por debajo de
**40 MB** (RNF-02); globo usable en celulares de gama media (RNF-05).

## CesiumJS con Vite

Según la guía oficial de CesiumJS (consultada el 12 nov 2026):

- CesiumJS necesita servir como archivos estáticos cuatro carpetas de `node_modules/cesium/Build/Cesium/`:
  `Workers`, `ThirdParty`, `Assets` y `Widgets`.
- `window.CESIUM_BASE_URL` debe apuntar a donde se sirven esas carpetas y **definirse antes de importar
  CesiumJS**.
- Dos formas de lograrlo: copiar las carpetas en el build (por ejemplo con un plugin de copia estática) y
  fijar `CESIUM_BASE_URL`, o usar un plugin que lo haga solo (la guía de Cesium menciona `vite-plugin-cesium`).
  Elegir un plugin es añadir una dependencia: propónlo en el plan (§28) y verifica su versión con `context7`.
- Importa también `cesium/Build/Cesium/Widgets/widgets.css` en el componente del globo.
- Si el sitio se publica en una subruta (posible con GitHub Pages, DP-06), `base` de Vite y
  `CESIUM_BASE_URL` deben incluirla.

## Reglas

1. **El globo es su propio chunk**: el componente que importa CesiumJS se carga con `React.lazy` o
   `await import("cesium")` al entrar al explorador. La portada no importa nada de CesiumJS (RNF-01).
2. Rutas con `React.lazy` + `<Suspense>`: portada, explorador, análisis, método y Acerca de por separado.
   El fallback de `Suspense` muestra el estado «cargando» traducido (RF-34).
3. MapLibre y Recharts solo en las pantallas que los usan.
4. Las **vistas WebP** de una fecha se piden cuando se eligen; no se precargan todas (RNF-02).
5. Antes de añadir una librería, busca si lo cubre algo nativo (`Intl`, `fetch`, `IntersectionObserver`) o una
   dependencia ya aprobada en §18. Una dependencia nueva se consulta (§28).
6. Sin `console.log` ni código de depuración en producción.
7. **Medir antes y después**: `vite build` y revisar el tamaño de los chunks; Lighthouse sobre la portada con
   la limitación de red del navegador (RNF-01 se mide así).
8. Ninguna variable `VITE_*` con secretos: Vite las incrusta en el bundle (RNF-06).

## Ejemplo

```tsx
import { lazy, Suspense } from "react";

const Explorador = lazy(() => import("./pages/Explorador")); // aquí dentro vive CesiumJS

<Route
  path="/explorar"
  element={
    <Suspense fallback={<EstadoCargando />}>
      <Explorador />
    </Suspense>
  }
/>;
```

## Errores comunes

- Importar CesiumJS desde un archivo que también usa la portada: todo el globo entra en el primer chunk.
- Olvidar `CESIUM_BASE_URL` o definirlo después del import: los workers fallan solo en producción.
- Medir en modo desarrollo: no representa el build de producción.

## Checklist

- [ ] Portada sin CesiumJS; globo en un chunk diferido.
- [ ] Carpetas estáticas de CesiumJS servidas y `CESIUM_BASE_URL` correcto (también con subruta).
- [ ] Vistas WebP pedidas por fecha; estación < 40 MB.
- [ ] Portada < 3 s medida con Lighthouse.
- [ ] Ninguna dependencia nueva sin consultar ni secretos en `VITE_*`.

## Referencias del documento maestro (§31)

<!-- referencias:inicio (generado por ai/sync.mjs desde ai/referencias/catalogo.json; no editar a mano) -->

Enlaces de §31 que aplican aquí. Cítalos (APA 7) donde implementes lo que respaldan y consulta la fuente antes de
usar una afirmación concreta: el contenido de cada enlace no se resume aquí. Detalle: skill `referencias-documento`
y `npm run referencias:revisar`.

- **Cesium GS (2026). CesiumJS [Software]** — <https://github.com/CesiumGS/cesium>
  Citada en: §18. Aplica a: RF-02, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-24, RNF-11. Usa la documentación vigente (MCP context7) al implementar el globo; muestra su atribución y licencia en el globo y en Acerca de (RF-24, RNF-11).

<!-- referencias:fin -->
