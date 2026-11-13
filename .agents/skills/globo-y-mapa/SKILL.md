---
name: globo-y-mapa
description: Reglas para el globo 3D de Bolivia con CesiumJS y el mapa 2D de análisis con MapLibre GL JS en UraqiVision (RF-02, RF-05 a RF-08, RF-25 a RF-30, RF-32, RF-35, RF-36), incluida la carga diferida, el respaldo 2D, el estado compartido y el movimiento reducido. Usar al crear o revisar componentes del globo, del mapa, de capas, del deslizador o de la línea de tiempo.
---

# Globo (CesiumJS) y mapa de análisis (MapLibre)

Fuente: §17, §18, §20 y los RF citados. Antes de usar una API concreta de CesiumJS o MapLibre, consulta su
documentación vigente (MCP `context7` o la documentación oficial). No escribas opciones de memoria.

## Reparto de responsabilidades (§20.2, riesgo «dos motores» de §24)

- **El globo explora y ubica**: departamentos, estaciones, huellas de escenas (RF-26), cambio superpuesto
  (RF-27), vuelo de cámara (RF-25), controles (RF-28).
- **El mapa 2D mide y compara**: mapa de cambio (RF-05), deslizador (RF-06), línea de tiempo (RF-07),
  polarizaciones (RF-08), focos (RF-10), control de capas (RF-35).
- Los dos **leen los mismos archivos publicados** (skill `publicacion-estacion`). Nada se calcula en el
  navegador que ya venga calculado en esos archivos.

## Reglas del globo

- **Sin token de Cesium ion**, con un mapa base abierto y su atribución visible. Qué mapa base usar está
  **pendiente (DP-07)**: deja el proveedor configurable y no elijas uno por tu cuenta.
- Desactiva los widgets que dependen de ion (por ejemplo el geocodificador y el selector de capas base).
  Verifica en la documentación cuáles son en la versión instalada.
- **Carga diferida** (RNF-01): CesiumJS solo se carga al entrar al explorador (import dinámico), nunca en
  la portada.
- **Respaldo 2D** (RF-30): si WebGL o CesiumJS fallan al iniciar, el atlas se abre en el mapa 2D con
  departamentos y estaciones, sin perder funciones esenciales.
- **Movimiento reducido** (RF-25, RNF-12): con `prefers-reduced-motion: reduce`, el vuelo de cámara es
  instantáneo (duración 0) y no hay animaciones.
- **Alternativa textual** (RNF-04): una lista de departamentos y estaciones, navegable por teclado, que hace
  lo mismo que hacer clic en el globo.
- En celulares de gama media: menos detalle y respaldo 2D (riesgo de §24).

## Reglas del mapa

- Cada capa muestra **leyenda, unidades, fuente, fecha y opacidad** (RF-35, §20.2).
- Paleta de cambio de **un solo tono** (más oscuro = más cambio).
- **Zonas sin dato con trama gris** explicada en la leyenda; nunca se pintan como «sin cambio» (RN-13).
- Cada vista indica **fecha, órbita y polarización**.
- RF-08: si una fecha solo tiene HH, las vistas HV y HV/HH se **deshabilitan con una explicación**; nunca se
  muestra un canal inexistente.
- RF-06: el deslizador compara dos fechas **de la misma órbita** y funciona con mouse, tacto y teclado
  (flechas para mover, con un nombre accesible y valor anunciado).
- RF-07: las fechas excluidas aparecen marcadas con su motivo; el hueco del 27 jul al 10 ago se muestra.

## Estado compartido (RF-29, RF-32, RF-36)

Un único estado de selección para globo y mapa: departamento, estación, fecha, capa activa, polarización
y posición de cámara.

- Al pulsar «Analizar» y volver, el globo conserva la selección y la cámara (RF-29).
- Al elegir una fecha cambian a la vez la imagen, las polarizaciones disponibles, las hectáreas y los
  focos, en el globo y en el mapa (RF-36). Pruébalo con Vitest (PS-04).
- La región elegida queda resaltada con su ruta departamento → estación → periodo (RF-32).
- El enlace directo con fecha y vista (RF-23) es **Plus**: deja el estado serializable, pero no lo
  construyas salvo que el equipo lo pida.

## Pruebas

PS-04 (Vitest: sincronización de la línea de tiempo y estados), PS-08 (globo: Bolivia encuadrada, huellas,
vuelo, volver a Bolivia, pantalla completa y respaldo 2D) y PS-09 (Playwright: portada → globo → estación →
análisis → descarga, en escritorio y celular). Con el MCP `playwright`, solo contra `localhost`.
