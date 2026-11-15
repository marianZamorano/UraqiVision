export type Language = 'es' | 'en'
export type RouteName = 'home' | 'explore' | 'station' | 'method' | 'about'
export type EvidenceMode = 'REAL' | 'DEMO'
export type ViewKind = 'loading' | 'available' | 'limited' | 'no-data' | 'incompatible-date' | 'error'

export interface RouteState {
  route: RouteName
  lang: Language
  departmentId?: string
  stationId?: string
  period?: string
}

export interface ReportableValue<T> {
  value: T | null
  unit?: string
  source?: string
  measuredAt?: string
  method?: string
  status: 'reported' | 'not-reported' | 'limited'
  reason?: string
}

export interface PublishedStation {
  stationId: string
  departmentId: string
  label: {
    es: string
    en: string
  }
  evidenceMode: EvidenceMode
  area: ReportableValue<number>
  orbit: string
  periods: Array<{
    name: string
    before?: string
    after?: string
  }>
  provenance: {
    source: string
    publishedAt: string
    version: string
  }
  summary: {
    es: string
    en: string
  }
}

/**
 * Los seis estados de RF-34, como en specs/001-base-web/contracts/view-state.ts (001 T007, T011).
 * `reason` y `message` son claves de traducción (`states.reason.*`): el estado no guarda textos en un idioma, así
 * que cambiar de idioma traduce sin alterarlo (FR-013, FR-014). 004 extiende la presentación, no este tipo.
 */
export type ViewState<T> =
  | { kind: 'loading'; requestId: string }
  | { kind: 'available'; data: T; evidenceMode: EvidenceMode }
  | { kind: 'limited'; data: T; evidenceMode: EvidenceMode; reason: string }
  | { kind: 'no-data'; reason: string }
  | { kind: 'incompatible-date'; reason: string; availablePeriods: string[] }
  | { kind: 'error'; message: string; retry: () => void }
