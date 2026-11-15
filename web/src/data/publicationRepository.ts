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

// Ejemplos en memoria con una espera breve hasta que T027 lea los archivos publicados (§17.3).
// La cancelación corta la espera de inmediato (FR-022).
export async function fetchStation(stationId: string, signal?: AbortSignal): Promise<PublishedStation> {
  if (signal?.aborted) throw abortError()

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
