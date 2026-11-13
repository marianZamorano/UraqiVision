---
name: vite-bundle-optimization
description: "Practicas de rendimiento y bundle con Vite: code splitting, lazy loading, dependencias pesadas y metricas. Usar al añadir dependencias pesadas, rutas/pantallas nuevas o al revisar tiempos de carga."
---

# Optimizacion de bundle con Vite

## Cuando aplicar

- Anadir una dependencia nueva (sobre todo pesadas: graficos, mapas, editores).
- Crear rutas/pantallas nuevas en el router.
- Revisar por que la app tarda en cargar o el bundle crece sin control.

## Reglas

1. Rutas con `React.lazy` + `<Suspense>`: cada pantalla es un chunk separado;
   el usuario descarga solo lo que visita.
2. Dependencias pesadas se importan dinamicamente (`await import(...)`) o se
   colocan en `build.rollupOptions.output.manualChunks` por vendor.
3. Antes de anadir una libreria: buscar si la necesidad ya se cubre con
   nativo (IntersectionObserver, `Intl`, fetch) o con tree-shakeable ESM.
4. Imports de solo una funcion => importar el subpath
   (`lodash-es/debounce`), no el paquete completo.
5. Sin `console.log` ni debug en produccion ( ESLint `no-console` en CI ).
6. Imagenes: assets <=20kB inlineados; el resto con `srcset`/formatos
   modernos y lazy loading nativo.
7. Medir antes y despues: `npx vite build --mode production` y revisar el
   tamanio de los chunks; comparar con la rama base en el PR.
8. `manualChunks` para vendors grandes que cambian poco: cache del navegador
   aprovechable sin re-descargar la app.

## Ejemplo

```tsx
import { lazy, Suspense } from "react";

const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));

<Route
  path="/reports"
  element={
    <Suspense fallback={<Spinner />}>
      <ReportsPage />
    </Suspense>
  }
/>;
```

## Errores comunes

- Lazy en componentes de 3kB: fragmenta el bundle sin beneficio.
- Importar una libreria completa por una funcion => +200kB en el chunk.
- Medir solo en dev: el build de desarrollo no representa el produccion.

## Checklist

- [ ] Pantallas pesadas cargan con `lazy` + `Suspense`.
- [ ] Cada dependencia nueva justifica su tamanio en el bundle.
- [ ] Build de produccion revisado antes de abrir el PR.
- [ ] Sin logs de debug ni imports sin tree-shaking.
