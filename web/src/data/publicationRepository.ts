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

export async function fetchStation(stationId: string, signal?: AbortSignal): Promise<PublishedStation> {
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
