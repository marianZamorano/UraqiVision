// Capas de radar de una zona que se pueden extender sobre el globo (RF-08): cuáles hay publicadas, con qué fechas y
// qué imagen corresponde a cada elección. Funciones puras sobre views/index.json (§17.3); la web no calcula nada.
import type { IndiceVistas, Vista } from "../map/stationFiles";

/** En el orden en que se ofrecen: el cambio medido, lo normal (línea base), el radar de la fecha y el testigo óptico. */
export const GLOBE_LAYERS = ["cambio", "base", "radar", "dnbr"] as const;
export type GlobeLayer = (typeof GLOBE_LAYERS)[number];
export type GlobeLayerChoice = { layer: GlobeLayer; date?: string };

/** El radar de la fecha se muestra en HV (volumen de vegetación); HH y HV/HH quedan en el mapa de análisis. */
const capaDe = (layer: GlobeLayer): Vista["capa"] => (layer === "radar" ? "hv" : layer);
/** RN-02: el tramo VALIDATED va aparte y no entra en estas capas. */
const deLaSerie = (vista: Vista) => vista.coleccion !== "validated";
const conFecha = (layer: GlobeLayer) => layer === "cambio" || layer === "radar";

/** Fechas con imagen para una capa, en orden; la línea base y el testigo óptico no llevan fecha. */
export function datesOf(vistas: IndiceVistas, layer: GlobeLayer): string[] {
  if (!conFecha(layer)) return [];
  const capa = capaDe(layer);
  const fechas = vistas.vistas.filter((v) => v.capa === capa && deLaSerie(v) && v.fecha).map((v) => v.fecha as string);
  return [...new Set(fechas)].sort();
}

/** Fechas de la línea de tiempo: todas las que tienen imagen de radar, de la primera a la última de la serie. */
export const timelineDates = (vistas: IndiceVistas): string[] => datesOf(vistas, "radar");

/** ¿La capa cambia con la fecha? (el cambio y el radar sí; lo normal y el testigo óptico son una sola imagen). */
export const isDated = (layer: GlobeLayer): boolean => conFecha(layer);

/**
 * Imagen publicada para la elección. Sin fecha, la más reciente. En la línea de tiempo, el cambio pedido para una
 * fecha anterior a la primera medición (la línea base) no existe: ahí va el radar de esa fecha, que es lo que
 * había; nunca un cambio de otra fecha. Con una fecha que la serie no tiene, la más reciente.
 */
export function viewFor(vistas: IndiceVistas, choice: GlobeLayerChoice): Vista | undefined {
  const capa = capaDe(choice.layer);
  const candidatas = vistas.vistas.filter((v) => v.capa === capa && deLaSerie(v));
  if (!conFecha(choice.layer)) return candidatas[0];
  const fechas = datesOf(vistas, choice.layer);
  const primera = fechas[0];
  if (choice.date && fechas.includes(choice.date)) return candidatas.find((v) => v.fecha === choice.date);
  if (choice.layer === "cambio" && choice.date && primera && choice.date < primera) {
    const radar = vistas.vistas.find((v) => v.capa === "hv" && deLaSerie(v) && v.fecha === choice.date);
    if (radar) return radar;
  }
  return candidatas.find((v) => v.fecha === fechas[fechas.length - 1]);
}

/** Leyenda de colores de la imagen que se está viendo: la del radar, la del cambio o la del testigo óptico. */
export function legendOf(vista: Vista | undefined): { palette: keyof IndiceVistas["paletas"]; ends: string[] } {
  if (vista?.capa === "cambio") return { palette: "cambio", ends: ["colors.changeLo", "colors.changeMid", "colors.changeHi"] };
  if (vista?.capa === "dnbr") return { palette: "optico", ends: ["colors.opticalLo", "colors.opticalHi"] };
  return { palette: "radar", ends: ["colors.radarLo", "colors.radarHi"] };
}

/** Capas que esta zona tiene publicadas. */
export function availableLayers(vistas: IndiceVistas): GlobeLayer[] {
  return GLOBE_LAYERS.filter((layer) => viewFor(vistas, { layer }) !== undefined);
}
