---
name: typed-api-integration
description: Contratos tipados entre la web de UraqiVision y sus dos fuentes de datos, los archivos publicados de cada estación (§17.3) y la función POST /api/insight (§21.1). Usar al definir tipos TypeScript de station.json, manifest.json, quality.json, hectares.csv o GeoJSON, al validar datos en tiempo de ejecución o al crear la capa de servicios de la web.
---

# Integración tipada: archivos publicados e Insight

Adaptada de la skill homónima de chapterCoreIEEE. UraqiVision **no tiene backend de API**: la web lee
archivos estáticos ya publicados y solo llama a un servidor para Insight (§17).

## Cuándo aplicar

- Crear o cambiar los tipos de los archivos de una estación o del contrato de Insight.
- Crear la capa de servicios (`web/src/services/`, propuesta) que lee esos archivos.

## Reglas

1. **Una sola puerta a los datos**: toda lectura de archivos publicados y toda llamada a `/api/insight`
   pasan por la capa de servicios. Ningún componente hace `fetch` directo.
2. **Tipos únicos** para cada archivo de §17.3 (`StationJson`, `Manifest`, `Quality`, `HectaresRow`,
   `ScarFeature`, `Footprint`) y para Insight (`InsightRequest { station_id, question, lang }`,
   `InsightResponse { answer, citations, source: 'ia' | 'plantilla' }`). Sin `any` ni tipos duplicados.
3. **Validación en tiempo de ejecución** de lo que se lee: un archivo publicado puede estar incompleto. Si
   falta un campo, la vista pasa a «datos limitados» o «sin datos» (RF-34), nunca a un cero (RN-13).
4. **Sin dato tipado explícitamente**: `number | null` con un motivo, no `0` ni `NaN` silencioso.
5. **Textos bilingües tipados**: `{ es: string; en: string }` para todo texto de `station.json` (RNF-03).
6. **Fechas** como cadenas ISO en UTC en los archivos; la conversión a hora de Bolivia es de la interfaz
   (RN-07).
7. **Base de los archivos por configuración** (variable de Vite sin secretos), nunca hardcodeada.
8. **Errores de Insight encapsulados**: si la función falla, la interfaz muestra la respuesta de plantilla
   (RF-18); el componente nunca lee un código HTTP crudo.
9. **Ningún secreto en el cliente**: la clave del proveedor de IA solo vive en el servidor (RNF-06).
10. **Cambiar un contrato** (formato de archivo o de Insight) requiere consultar al equipo y actualizar el
    documento maestro (§28).

## Ejemplo

```ts
export interface HectaresRow { date: string; hectares: number | null; low: number | null; high: number | null; reason?: string }

export async function getHectares(stationId: string, signal?: AbortSignal): Promise<HectaresRow[]> {
  const res = await fetch(`${DATA_BASE_URL}/${stationId}/hectares.csv`, { signal });
  if (!res.ok) throw new DataLoadError('hectares', res.status);
  return parseHectaresCsv(await res.text()); // valida cada fila; sin dato -> null + motivo
}
```

## Checklist

- [ ] Ningún componente hace HTTP directo.
- [ ] Un tipo por archivo de §17.3 y por mensaje de Insight, sin duplicados.
- [ ] Lo leído se valida y la ausencia de dato queda como `null` con motivo.
- [ ] Textos `es`/`en` tipados y fechas en UTC.
