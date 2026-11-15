import type { PublishedStation } from '../contracts/view-state'

// RN-04: ejemplos de interfaz en memoria, siempre DEMO y sin cifras, hasta que existan
// publicaciones reales de M-PUBLICACIÓN (T027, T047). RN-13: ausencia = «no reportada».
export const demoStations: Record<string, PublishedStation> = {
  'santa-cruz': {
    stationId: 'santa-cruz',
    departmentId: 'santa-cruz',
    label: { es: 'Santa Cruz', en: 'Santa Cruz' },
    evidenceMode: 'DEMO',
    area: {
      value: null,
      unit: 'ha',
      source: 'demo',
      method: 'Ejemplo de interfaz',
      status: 'not-reported',
      reason: 'No reportado',
    },
    orbit: 'DEMO',
    periods: [{ name: 'demo' }],
    provenance: {
      source: 'demo',
      publishedAt: '2026-11-14T00:00:00Z',
      version: 'demo',
    },
    summary: {
      es: 'Estación de ejemplo para pruebas de interfaz; no es un resultado.',
      en: 'Example station for interface testing; not a result.',
    },
  },
  'tarija': {
    stationId: 'tarija',
    departmentId: 'tarija',
    label: { es: 'Tarija', en: 'Tarija' },
    evidenceMode: 'DEMO',
    area: {
      value: null,
      unit: 'ha',
      source: 'demo',
      method: 'Ejemplo de interfaz',
      status: 'not-reported',
      reason: 'No reportado',
    },
    orbit: 'DEMO',
    periods: [{ name: 'demo' }],
    provenance: {
      source: 'demo',
      publishedAt: '2026-11-14T00:00:00Z',
      version: 'demo',
    },
    summary: {
      es: 'Versión demo para pruebas de interfaz.',
      en: 'Demo version for interface testing.',
    },
  },
}

/** No existe una publicación para la estación pedida: es «sin datos» (RN-13), no un fallo de red. */
export class StationNotFoundError extends Error {
  constructor(readonly stationId: string) {
    super(`No hay publicación para la estación ${stationId}`)
    this.name = 'StationNotFoundError'
  }
}

const abortError = () => new DOMException('La solicitud fue cancelada.', 'AbortError')

// Versión beta (#110, provisional hasta acordar C1–C9 con M-PUBLICACIÓN): si VITE_PUBLISHED_API apunta al endpoint
// local del backend (UraqiVisionBack: pipeline_beta/zonas/servidor_estaciones.py), las estaciones publicadas se leen
// de ahí. Sin la variable, la web se comporta como antes: solo ejemplos DEMO (RN-04).
const PUBLISHED_API = String(import.meta.env.VITE_PUBLISHED_API ?? '').replace(/\/+$/, '')

export interface StationSummary {
  stationId: string
  label: { es: string; en: string }
  /** Departamento (nombre en español, como en los límites publicados); agrupa la lista del explorador. */
  departamento?: string | null
}

/** true si la web lee estaciones publicadas por el backend (VITE_PUBLISHED_API). */
export const usesPublishedApi = PUBLISHED_API !== ''

const demoSummaries = (): StationSummary[] =>
  Object.values(demoStations).map(({ stationId, label }) => ({ stationId, label }))

/**
 * Estaciones para el explorador. Si el backend publica al menos una, se muestran SOLO las publicadas: los ejemplos
 * DEMO (sin cifras) no se mezclan con resultados reales (RN-04). Sin endpoint, o si no responde, quedan los DEMO.
 */
export async function listStations(signal?: AbortSignal): Promise<StationSummary[]> {
  if (!PUBLISHED_API) return demoSummaries()
  try {
    const response = await fetch(`${PUBLISHED_API}/estaciones`, { signal })
    if (!response.ok) return demoSummaries()
    const publicadas = (await response.json()) as StationSummary[]
    return publicadas.length ? publicadas : demoSummaries()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return demoSummaries()
  }
}

/** Origen del endpoint (sin /api): las rutas de archivos que devuelve son relativas a él. */
export const publishedOrigin = PUBLISHED_API.replace(/\/api$/, '')

/** Capas de agua de referencia de época seca (exploratorias, fuera del MVP). Sin endpoint o si falla: ninguna. */
export async function listWaterLayers<T>(signal?: AbortSignal): Promise<T[]> {
  if (!PUBLISHED_API) return []
  try {
    const response = await fetch(`${PUBLISHED_API}/agua`, { signal })
    return response.ok ? ((await response.json()) as T[]) : []
  } catch {
    return []
  }
}

/** Carpeta de archivos publicados (§17.3) de una estación del endpoint, o null si es DEMO o no hay endpoint. */
export function stationFilesBase(stationId: string): string | null {
  if (!PUBLISHED_API || demoStations[stationId]) return null
  return `${PUBLISHED_API.replace(/\/api$/, '')}/estaciones/${encodeURIComponent(stationId)}`
}

// Ejemplos en memoria con una espera breve hasta que T027 lea los archivos publicados (§17.3).
// La cancelación corta la espera de inmediato (FR-022).
export async function fetchStation(stationId: string, signal?: AbortSignal): Promise<PublishedStation> {
  if (signal?.aborted) throw abortError()

  if (PUBLISHED_API && !demoStations[stationId]) {
    const response = await fetch(`${PUBLISHED_API}/estaciones/${encodeURIComponent(stationId)}`, { signal })
    if (response.status === 404) throw new StationNotFoundError(stationId)
    if (!response.ok) throw new Error(`El endpoint respondió ${response.status} para ${stationId}`)
    return (await response.json()) as PublishedStation
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 200)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(abortError())
    }, { once: true })
  })

  const station = demoStations[stationId]
  if (!station) throw new StationNotFoundError(stationId)

  return station
}

/** Zona con datos ubicada en el globo (#123): el centro de la caja publicada en su station.json. */
export interface StationLocation {
  stationId: string
  label: { es: string; en: string }
  longitude: number
  latitude: number
}

/** Centro de una caja [oeste, sur, este, norte] en grados, o null si la caja no es válida. */
export function centerOfBbox(bbox: unknown): [number, number] | null {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return null
  }
  const [west, south, east, north] = bbox as [number, number, number, number]
  const valid = west >= -180 && east <= 180 && west < east && south >= -90 && north <= 90 && south < north
  return valid ? [(west + east) / 2, (south + north) / 2] : null
}

/**
 * Ubicación de cada estación publicada, leída de `area.bbox_lonlat` de su station.json (la web no inventa
 * coordenadas). Las DEMO, las que no tienen caja válida y las que fallan se omiten: siguen en la lista textual.
 */
export async function listStationLocations(stations: StationSummary[], signal?: AbortSignal): Promise<StationLocation[]> {
  const locations = await Promise.all(stations.map(async (station) => {
    const base = stationFilesBase(station.stationId)
    if (!base) return null
    try {
      const response = await fetch(`${base}/station.json`, { signal })
      if (!response.ok) return null
      const raw = (await response.json()) as { area?: { bbox_lonlat?: unknown } }
      const center = centerOfBbox(raw.area?.bbox_lonlat)
      return center ? { stationId: station.stationId, label: station.label, longitude: center[0], latitude: center[1] } : null
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      return null
    }
  }))
  return locations.filter((location): location is StationLocation => location !== null)
}
