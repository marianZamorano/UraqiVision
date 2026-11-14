import type { PublishedStation } from '../contracts/view-state'

export const demoStations: Record<string, PublishedStation> = {
  'santa-cruz': {
    stationId: 'santa-cruz',
    departmentId: 'santa-cruz',
    label: { es: 'Santa Cruz', en: 'Santa Cruz' },
    evidenceMode: 'REAL',
    area: {
      value: 382.4,
      unit: 'ha',
      source: 'atlas/departments.geojson',
      measuredAt: '2026-11-14T00:00:00Z',
      method: 'Publicación validada',
      status: 'reported',
    },
    orbit: 'NISAR',
    periods: [{ name: '2026-11', before: '2026-11-01T00:00:00Z', after: '2026-11-30T00:00:00Z' }],
    provenance: {
      source: 'M-PUBLICACIÓN',
      publishedAt: '2026-11-14T15:00:00Z',
      version: 'v1.0',
    },
    summary: {
      es: 'Estación de referencia con disponibilidad de datos y procedencia verificada.',
      en: 'Reference station with verified data availability and provenance.',
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
      measuredAt: '2026-11-14T00:00:00Z',
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
