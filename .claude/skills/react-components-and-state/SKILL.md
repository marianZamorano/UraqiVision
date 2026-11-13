---
name: react-components-and-state
description: Guía de componentes reutilizables y manejo de estado en la web de UraqiVision (React + TypeScript), incluido el estado de selección compartido entre el globo y el mapa (RF-29, RF-32, RF-36). Usar al crear o refactorizar componentes y hooks, o al decidir dónde vive el estado (local, contexto o store).
---

# Componentes y estado en React

Adaptada de la skill homónima de chapterCoreIEEE.

## Cuándo aplicar

- Crear o refactorizar componentes y hooks.
- Decidir entre estado local, contexto o store.
- Extraer lógica repetida a componentes o hooks reutilizables.

## Estructura sugerida (propuesta)

```
web/src/
  components/
    ui/            # primitivas accesibles (Button, Slider, Tooltip del glosario)
    globo/         # CesiumJS (carga diferida)
    mapa/          # MapLibre, capas, deslizador, línea de tiempo
    estacion/      # panel de la estación, hectáreas, validación, fuente y calidad
    insight/
  hooks/           # useStation, useHectares, useSelection...
  services/        # lectura tipada de archivos publicados e Insight (skill typed-api-integration)
  i18n/            # es.json, en.json
  pages/           # portada, explorador, análisis, método, acerca de
```

## Reglas de estado

1. **Estado lo más abajo posible**: empieza local y elévalo solo cuando deba compartirse.
2. **Estado de selección único** para globo y mapa: departamento, estación, fecha, capa activa,
   polarización y cámara (RF-29, RF-32, RF-36). Un solo lugar (contexto o store pequeño), nunca copias en
   cada motor de mapa.
3. **Contexto** para lo transversal de baja frecuencia: idioma, preferencia de movimiento reducido.
4. **Datos publicados** en hooks con caché (skill `frontend-data-fetching`), no duplicados en el estado.
5. **Sin `useEffect` para derivar estado**: calcula en el render o con `useMemo` (por ejemplo, las
   polarizaciones disponibles de la fecha elegida).
6. **`useEffect` solo para sincronizar con lo externo** (la instancia de Cesium o de MapLibre), con limpieza:
   destruir el visor al desmontar.
7. **El estado es serializable**, para que el enlace directo (RF-23, Plus) se pueda agregar sin rehacerlo.

## Componentes reutilizables

- Props tipadas con interfaces explícitas; sin `any`.
- `children` para composición antes que props booleanas.
- Sin lógica de negocio ni llamadas HTTP en las primitivas de `ui/`.
- Claves estables en listas (`id`, nunca el índice si la lista cambia).
- Todo texto visible por `t()` (skill `interfaz-bilingue-accesible`).

## Checklist

- [ ] Un solo estado de selección compartido por globo y mapa.
- [ ] Datos publicados sin duplicar en estado local.
- [ ] Efectos con dependencias correctas y limpieza (visores destruidos al desmontar).
- [ ] Props y listas tipadas, sin `any` ni índice como key.
