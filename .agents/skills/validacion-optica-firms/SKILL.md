---
name: validacion-optica-firms
description: Procedimiento de validación de UraqiVision (M-VALIDACIÓN). Cubre dNBR de Sentinel-2 como referencia principal, focos de calor FIRMS para fechar y clasificar parches, zonas de control, sensibilidad del umbral, revisión visual y cálculo de precisión, exhaustividad y Dice (VC-01 a VC-05, RF-10, RF-11, MC-04, MC-05). Usar al validar resultados, al descargar focos FIRMS o imágenes Sentinel-2, o al escribir validation.json.
---

# Validación con Sentinel-2 y FIRMS

Fuente: §10.3, §12 (MC-04, MC-05), §23.1, RF-10 y RF-11 del documento maestro, y la API de área de FIRMS
(`firms.modaps.eosdis.nasa.gov/api/area/`, consultada el 12 nov 2026). Responsable: Tabata, con apoyo de
Alex (revisa Mimi).

## Qué valida cada cosa (§23.1)

| ID | Prueba | Métrica | Papel |
|---|---|---|---|
| VC-01 | Sentinel-2 dNBR | Precisión, exhaustividad y Dice | **Referencia principal**. Antecedente: Dice 0,59 en banda C (Belenguer-Plomer et al., 2019) |
| VC-02 | Focos FIRMS | % de parches con al menos un foco | **Contexto, no prueba**: los focos también fechan y clasifican |
| VC-03 | Zonas de control | Cambio de HV en bosque sin fuego ni desmonte | Debe ser menor que en las cicatrices |
| VC-04 | Sensibilidad del umbral | Hectáreas con los dos umbrales | Se publica el rango |
| VC-05 | Revisión visual | Muestra de parches contra imagen óptica | Junto con VC-02, alternativa si no hay Sentinel-2 válido |

Si no hay imagen Sentinel-2 limpia (humo o nubes, riesgo de §24), la estación dice **«validación limitada»**
y la página de método explica la alternativa usada (RF-11).

## Sentinel-2 y dNBR

- NBR = (NIR − SWIR2) / (NIR + SWIR2), con las bandas NIR y SWIR2 de Sentinel-2 L2A (B8A o B8, y B12).
  dNBR = NBR antes − NBR después.
- Elige imágenes antes y después del evento con la máscara de nubes y sombras de L2A; descarta los píxeles
  enmascarados en lugar de rellenarlos.
- Reproyecta Sentinel-2 a la grilla del radar **solo para comparar**; el análisis de radar no se remuestrea.
- El **umbral de dNBR** para marcar «quemado» no está en el documento: el equipo lo define en el plan con su
  fuente bibliográfica. No lo inventes.
- Cómo se accede a Sentinel-2 (catálogo, librería) tampoco está fijado: propónlo en el plan y consúltalo,
  porque añade una dependencia (§28).

## Métricas (VC-01)

Comparación píxel a píxel (o parche a parche, dilo) sobre el área válida en ambos productos:

- Precisión = TP / (TP + FP) · Exhaustividad = TP / (TP + FN) · Dice = 2·TP / (2·TP + FP + FN).
- Los píxeles sin dato en cualquiera de los dos **no cuentan**; informa cuántos quedaron fuera.
- Con cero positivos de referencia, la métrica es «no reportada» con su motivo, nunca 0 (RN-13).
- Implementa las métricas como funciones puras con pruebas de datos sintéticos (skill `python-geoespacial`).

## Focos FIRMS (RF-10, MC-04)

- API de área: `/api/area/csv/[MAP_KEY]/[SOURCE]/[AREA]/[DAY_RANGE]/[DATE]`.
  - `SOURCE`: por ejemplo `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`, `MODIS_NRT`; los `_SP` son
    de procesamiento estándar (preferibles para un periodo pasado, si ya están disponibles).
  - `AREA`: `oeste,sur,este,norte`. `DAY_RANGE`: de 1 a 5 días por petición. `DATE`: `AAAA-MM-DD`.
  - Límite: 5.000 transacciones cada 10 minutos.
- **`MAP_KEY` es un secreto**: va en una variable de entorno, nunca en el código, la URL registrada ni el
  repositorio. Al registrar la consulta, guarda la URL sin la clave.
- Los focos **fechan y clasifican** parches; **no crean** parches (MC-04).
- La capa del mapa muestra cada foco con su fecha y fuente (RF-10); cita FIRMS según su guía (RN-11).

## Zonas de control (VC-03, MC-05)

Los polígonos de control están **pendientes (DP-05, Tabata)**. Hasta que se elijan, no se calcula la
corrección por fenología ni VC-03.

## Qué guardar en `validation.json`

Para cada métrica: valor o «no reportada» con motivo, fecha y fuente de las imágenes usadas, umbral aplicado,
área válida comparada, porcentaje de parches con foco FIRMS (VC-02) y si la validación es completa o limitada.

## Checklist

- [ ] Sentinel-2 antes y después con máscara de nubes; píxeles enmascarados excluidos.
- [ ] Umbral de dNBR documentado con su fuente en el plan.
- [ ] Precisión, exhaustividad y Dice con funciones probadas; sin dato nunca como 0.
- [ ] `MAP_KEY` solo por variable de entorno.
- [ ] FIRMS usado para fechar y clasificar, no para crear parches.
- [ ] «Validación limitada» si no hubo Sentinel-2 válido.
