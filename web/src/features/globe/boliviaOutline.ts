// #123 (RF-02, RNF-11): contorno de Bolivia para dibujar sobre el globo. Archivo estático simplificado
// (public/data/bolivia-contorno.geojson, ~28 KB): unión de los 9 departamentos de geoBoundaries gbOpen BOL ADM1
// (fuente: GeoBolivia, dominio público), Douglas-Peucker 0,01°. Solo para dibujar, no para medir. Se descarga al
// entrar al explorador, nunca en la portada (RNF-01).

export const BOLIVIA_OUTLINE_URL = `${import.meta.env.BASE_URL}data/bolivia-contorno.geojson`;

/** Crédito del contorno en el visor (RNF-11): nombres propios, sin traducción. */
export const BOLIVIA_OUTLINE_CREDIT = "geoBoundaries · GeoBolivia";

type Position = [number, number];

function isPosition(value: unknown): value is Position {
  return Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number";
}

/** Anillos exteriores de cada polígono como arreglos planos [lon, lat, lon, lat, …] (Polygon o MultiPolygon). */
export function outlineRings(geojson: unknown): number[][] {
  const features = (geojson as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const rings: number[][] = [];
  for (const feature of features) {
    const geometry = (feature as { geometry?: { type?: string; coordinates?: unknown } })?.geometry;
    const polygons =
      geometry?.type === "Polygon" ? [geometry.coordinates] : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
    if (!Array.isArray(polygons)) continue;
    for (const polygon of polygons) {
      const exterior = Array.isArray(polygon) ? polygon[0] : undefined;
      if (!Array.isArray(exterior) || exterior.length < 4 || !exterior.every(isPosition)) continue;
      rings.push(exterior.flatMap(([lon, lat]) => [lon, lat]));
    }
  }
  return rings;
}

export async function loadBoliviaOutline(signal?: AbortSignal): Promise<number[][]> {
  const response = await fetch(BOLIVIA_OUTLINE_URL, { signal });
  if (!response.ok) return [];
  return outlineRings(await response.json());
}
