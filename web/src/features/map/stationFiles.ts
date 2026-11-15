// Versión beta (#110): forma de los archivos publicados de una estación (§17.3) tal como los escribe hoy el backend
// (UraqiVisionBack pipeline_beta/scripts/08_publicar_borrador.py). Provisional hasta acordar C1–C9 con
// M-PUBLICACIÓN: aquí solo se tipa lo que la web lee.

export type Capa = "hv" | "hh" | "ratio";
/** Vistas por fecha y polarización, más las del relato: línea base, cambio por fecha y testigo óptico. */
export interface Vista {
  archivo: string; fecha: string | null; capa: Capa | "base" | "cambio" | "dnbr"; rango_db?: [number, number];
  /** "validated": tramo aparte (RN-02), con sus propias esquinas porque su grilla puede ser otra. */
  coleccion?: "validated"; crid?: string; esquinas_lonlat?: [number, number][];
}
export interface IndiceVistas {
  esquinas_lonlat: [number, number][];
  paletas: { radar: string[]; cambio: string[]; optico: string[] };
  vistas: Vista[];
}

/** Serie para el gráfico: rango normal del paisaje (p10–p90) y mediana de cada clase, en dB de cambio de HV. */
export interface PuntoSerie {
  fecha: string;
  estado: string;
  rol: "linea_base" | "objetivo" | null;
  rango_normal: [number, number] | null;
  mediana_paisaje: number | null;
  clases: Record<string, number | null> | null;
}
export interface SerieRaw { umbrales_db: [number, number]; calibrados?: boolean; linea_base: string[]; fechas: PuntoSerie[] }

export interface AcuerdoOptico {
  clase_optica: "severa" | "moderada" | "leve" | "sin_cambio" | "reverdecio";
  celdas: number;
  celdas_marcadas: number;
  pct_marcado: number | null;
  ha: number;
  ha_marcadas: number;
}

export interface FechaEstacion {
  fecha: string;
  estado: string; // ok, valores_malos, desplazada, vacia, cobertura_baja, sin_verificar
  correlacion_ref: number | null;
  rol: "linea_base" | "objetivo" | null;
}

export interface StationRaw {
  id: string;
  estado: string; // borrador_exploratorio mientras los umbrales no estén calibrados
  departamento?: string; // nombre del departamento (como en atlas/departments.geojson → shapeName)
  tramo_validated?: Array<{ fecha: string; crid: string; pct_valido: number }>;
  area: { bbox_lonlat: [number, number, number, number] };
  orbita: { track: number; direccion: string; frame: number; coleccion: string; crid: string[] };
  fechas: FechaEstacion[];
  hueco_datos: [string, string];
  // `fuente` es la cita (igual en ambos idiomas); `nota`, la aclaración bilingüe (RNF-03).
  hipotesis: Array<{ es: string; en: string; fuente: string; nota?: { es: string; en: string } }>;
  limites?: string[]; // códigos de límites; la web los traduce (limits.*)
  linea_base?: { fechas: string[] };
  /** Hectáreas de los parches por clase (RN-05), al umbral más sensible: suman el tope del rango (RN-06). */
  resumen_clases_ha?: Array<{ clase: string; ha: number }>;
}

export interface ManifestRaw {
  version_pipeline: string;
  granulos: Array<{ escena: string; fecha: string; crid: string; estado_en_serie: string }>;
}

export interface MetricaVc01 { referencia: string; precision: number; exhaustividad: number; dice: number }
export interface ValidationRaw {
  acuerdo_por_clase_optica: AcuerdoOptico[];
  validacion_limitada: boolean;
  motivo_es: string;
  motivo_en: string;
  vc01_sentinel2: { fechas: [string, string]; encierra_radar?: boolean; metricas: MetricaVc01[] };
  vc02_focos: { parches_con_foco: number; parches_total: number; focos_periodo: number; focos_en_o_junto_a_parche: number };
  vc03_zonas_control: unknown;
  vc05_revision_visual: unknown;
}

export interface QualityRaw {
  "CQ-01_geometria": { ok: boolean };
  "CQ-02_orbita": { ok: boolean };
  "CQ-03_radiometria": { ok: boolean };
  "CQ-04_polarizaciones": { ok: boolean };
  "CQ-05_datos_validos": { pct_valido: number; limitada: boolean };
  "CQ-06_procedencia": { ok: boolean };
  generado_utc: string;
}

/** Propuesta de zonas de control (DP-05 pendiente): la decide M-CIENCIA. */
export interface ControlRaw {
  estado: string; // "aplicada" o sin zonas suficientes
  calibracion: {
    umbrales_db: Record<"estricto" | "central" | "sensible", number>;
    falsa_alarma_en_control_pct: Record<string, number>;
    falsa_alarma_sin_cambio_optico_pct?: Record<string, number>;
  } | null;
  referencia_hv_db: number;
  candidatas_que_cumplen: number;
  elegidas: number;
  deriva_actual_db: Record<string, number>;
  deriva_con_control_db: Record<string, number> | null;
  hectareas_ultima_fecha: {
    actual: Record<"estricto" | "central" | "sensible", number>;
    con_control: Record<"estricto" | "central" | "sensible", number> | null;
  };
}

/** Capa de agua de referencia de época seca (10_mapa_agua.py), exploratoria y fuera del MVP (§8.2). */
export interface CapaAgua {
  id: string;
  nombre: { es: string; en: string };
  esquinas_lonlat: [number, number][];
  imagen: string; // ruta relativa al origen del endpoint
  ha_agua_permanente: number | null;
  ha_agua_ocasional: number | null;
}

export interface ArchivosEstacion {
  vistas: IndiceVistas;
  estacion: StationRaw;
  scars: GeoJSON.FeatureCollection;
  fires: GeoJSON.FeatureCollection;
  deps: GeoJSON.FeatureCollection;
  manifest: ManifestRaw;
  validacion: ValidationRaw;
  calidad: QualityRaw;
  serie: SerieRaw;
  control: ControlRaw | null;
  zonasControl: GeoJSON.FeatureCollection | null;
  huellas: GeoJSON.FeatureCollection | null;
  hect: Record<string, string>[];
  horas: Record<string, string>;
}

/** Lo que la ficha de una zona en el explorador necesita: pocos archivos y livianos (RNF-01). */
export interface ResumenZona {
  estacion: StationRaw;
  vistas: IndiceVistas;
  hect: Record<string, string>[];
}

/** Rectángulo `[oeste, sur, este, norte]` que contiene a las esquinas publicadas de una imagen. */
export function rectanguloDe(esquinas: ReadonlyArray<readonly [number, number]>): [number, number, number, number] {
  const lon = esquinas.map((c) => c[0]);
  const lat = esquinas.map((c) => c[1]);
  return [Math.min(...lon), Math.min(...lat), Math.max(...lon), Math.max(...lat)];
}

async function leerJson<T>(base: string, archivo: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${base}/${archivo}`, { signal });
  if (!r.ok) throw new Error(`${archivo}: ${r.status}`);
  return (await r.json()) as T;
}

async function leerTexto(base: string, archivo: string, signal?: AbortSignal): Promise<string> {
  const r = await fetch(`${base}/${archivo}`, { signal });
  if (!r.ok) throw new Error(`${archivo}: ${r.status}`);
  return r.text();
}

/** Ficha de una zona: station.json, el índice de vistas y hectares.csv (sin parches, focos ni manifiesto). */
export async function cargarResumenZona(base: string, signal?: AbortSignal): Promise<ResumenZona> {
  const [estacion, vistas, csv] = await Promise.all([
    leerJson<StationRaw>(base, "station.json", signal),
    leerJson<IndiceVistas>(base, "views/index.json", signal),
    leerTexto(base, "hectares.csv", signal),
  ]);
  return { estacion, vistas, hect: leerCsv(csv) };
}

/** Todos los archivos publicados de una estación (§17.3) que usan el mapa de análisis y la respuesta paso a paso. */
export async function cargarArchivosEstacion(base: string, signal?: AbortSignal): Promise<ArchivosEstacion> {
  const j = <T,>(archivo: string) => leerJson<T>(base, archivo, signal);
  // La propuesta de zonas de control y las huellas son opcionales: una estación sin ellas sigue funcionando.
  const opcional = <T,>(archivo: string) => j<T>(archivo).catch(() => null);
  const [vistas, estacion, scars, fires, deps, manifest, validacion, calidad, serie, control, zonasControl, huellas, csv] = await Promise.all([
    j<IndiceVistas>("views/index.json"), j<StationRaw>("station.json"), j<GeoJSON.FeatureCollection>("scars.geojson"),
    j<GeoJSON.FeatureCollection>("fires.geojson"), j<GeoJSON.FeatureCollection>("atlas/departments.geojson"),
    j<ManifestRaw>("manifest.json"), j<ValidationRaw>("validation.json"), j<QualityRaw>("quality.json"), j<SerieRaw>("serie.json"),
    opcional<ControlRaw>("control_propuesta.json"), opcional<GeoJSON.FeatureCollection>("control_candidatas.geojson"),
    opcional<GeoJSON.FeatureCollection>("footprints.geojson"), leerTexto(base, "hectares.csv", signal),
  ]);
  // RN-07: hora real de adquisición (UTC) a partir del nombre de cada escena del manifiesto.
  const horas: Record<string, string> = {};
  for (const g of manifest.granulos) {
    const m = /_(\d{8})T(\d{2})(\d{2})(\d{2})_/.exec(g.escena);
    if (m) horas[g.fecha] = `${g.fecha}T${m[2]}:${m[3]}:${m[4]}Z`;
  }
  return { vistas, estacion, scars, fires, deps, manifest, validacion, calidad, serie, control, zonasControl, huellas, hect: leerCsv(csv), horas };
}

/** Las cuatro clases de RN-05 con su color en el mapa (categóricos; acordar como tokens con M-INTERFAZ). */
export const CLASES = [
  { id: "compatible_quema", color: "#c8501e" },
  { id: "perdida_previa", color: "#6b4fa0" },
  { id: "ambigua", color: "#c9a227" },
  { id: "insuficiente", color: "#7d8793" },
] as const;

/** CSV simple con comillas dobles (hectares.csv). */
export function leerCsv(texto: string): Record<string, string>[] {
  const [cab, ...filas] = texto.trim().split(/\r?\n/);
  const cols = (cab ?? "").split(",");
  return filas.map((f) => {
    const celdas = f.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [];
    return Object.fromEntries(cols.map((c, i) => [c, celdas[i] ?? ""]));
  });
}
