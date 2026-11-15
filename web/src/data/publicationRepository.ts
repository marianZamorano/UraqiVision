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

// LOCAL (provisional, sin acordar con M-PUBLICACIÓN): si VITE_PUBLISHED_API apunta al servidor de estaciones del
// backend (nasa/zonas/servidor_estaciones.py), las estaciones publicadas se leen de ahí; si no, solo hay demos.
const PUBLISHED_API = String(import.meta.env.VITE_PUBLISHED_API ?? '').replace(/\/+$/, '')

/** Carpeta de archivos publicados de una estación del backend, o null si es una demo o no hay servidor. */
export function stationFilesBase(stationId: string): string | null {
  if (!PUBLISHED_API || demoStations[stationId]) {
    return null
  }
  return `${PUBLISHED_API.replace(/\/api$/, '')}/estaciones/${encodeURIComponent(stationId)}`
}

export interface StationSummary {
  stationId: string
  label: { es: string; en: string }
}

export async function listStations(signal?: AbortSignal): Promise<StationSummary[]> {
  const demos = Object.values(demoStations).map(({ stationId, label }) => ({ stationId, label }))
  if (!PUBLISHED_API) {
    return demos
  }
  try {
    const response = await fetch(`${PUBLISHED_API}/estaciones`, { signal })
    if (!response.ok) {
      return demos
    }
    const published = (await response.json()) as StationSummary[]
    return [...published, ...demos]
  } catch {
    return demos
  }
}

export async function fetchStation(stationId: string, signal?: AbortSignal): Promise<PublishedStation> {
  if (PUBLISHED_API && !demoStations[stationId]) {
    const response = await fetch(`${PUBLISHED_API}/estaciones/${encodeURIComponent(stationId)}`, { signal })
    if (!response.ok) {
      throw new Error(`Station ${stationId} not found (${response.status})`)
    }
    return (await response.json()) as PublishedStation
  }

  await new Promise((resolve) => setTimeout(resolve, 200))

  if (signal?.aborted) {
    throw new DOMException('La solicitud fue cancelada.', 'AbortError')
  }

  const station = demoStations[stationId]

  if (!station) {
    throw new Error(`Station ${stationId} not found`)
  }

  return station
}
