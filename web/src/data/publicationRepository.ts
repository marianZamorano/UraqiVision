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
}

/** Estaciones del endpoint (si está configurado) seguidas de los ejemplos DEMO. */
export async function listStations(signal?: AbortSignal): Promise<StationSummary[]> {
  const demos = Object.values(demoStations).map(({ stationId, label }) => ({ stationId, label }))
  if (!PUBLISHED_API) return demos
  try {
    const response = await fetch(`${PUBLISHED_API}/estaciones`, { signal })
    if (!response.ok) return demos
    return [...((await response.json()) as StationSummary[]), ...demos]
  } catch {
    return demos
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
