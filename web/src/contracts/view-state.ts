export type Language = 'es' | 'en'
export type RouteName = 'home' | 'explore' | 'station' | 'method' | 'about'
export type EvidenceMode = 'REAL' | 'DEMO'
export type ViewStatus = 'loading' | 'available' | 'limited' | 'no-data' | 'incompatible-date' | 'error'

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

export type ViewState<T> =
  | { status: 'loading'; language: Language; message: string }
  | { status: 'available'; language: Language; message: string; data: T }
  | { status: 'limited'; language: Language; message: string; reason: string; data?: T }
  | { status: 'no-data'; language: Language; message: string; reason: string }
  | { status: 'incompatible-date'; language: Language; message: string; reason: string }
  | { status: 'error'; language: Language; message: string; reason: string; retry?: () => void }
