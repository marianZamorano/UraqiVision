// 004 T005: formatos por idioma (RN-07, FR-004, FR-013; research.md R3).
// - Las fechas publicadas son de adquisición, en UTC, y se muestran en hora de Bolivia (America/La_Paz, UTC−04).
// - La etiqueta de la zona («hora de Bolivia, UTC−04») es texto de interfaz: va en i18n (panel.zonaHoraria).
// - Un dato ausente nunca llega aquí: se muestra como «no reportada» con su motivo (RN-13).
// - El CSV descargado no usa estas funciones: escribe ISO 8601 UTC y punto decimal.

export type Idioma = "es" | "en";

/** PROPUESTA (research.md R3): el documento solo fija «hora de Bolivia». */
const LOCALES: Record<Idioma, string> = { es: "es-BO", en: "en-US" };
const ZONA_BOLIVIA = "America/La_Paz";
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;

/** Fecha y hora de adquisición (ISO 8601 en UTC) en hora de Bolivia, según el idioma. */
export function formatearFecha(isoUtc: string, idioma: Idioma): string {
  if (!ISO_UTC.test(isoUtc)) {
    throw new Error(`Fecha de adquisición inválida: se espera ISO 8601 en UTC (terminada en Z), llegó «${isoUtc}»`);
  }
  return new Intl.DateTimeFormat(LOCALES[idioma], {
    timeZone: ZONA_BOLIVIA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoUtc));
}

/** Hectáreas con un decimal y los separadores del idioma. Solo para valores reportados. */
export function formatearHectareas(valor: number, idioma: Idioma): string {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new Error("Valor ausente: muéstralo como «no reportada» con su motivo, nunca como 0 (RN-13)");
  }
  return new Intl.NumberFormat(LOCALES[idioma], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor);
}
