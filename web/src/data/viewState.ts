import type { Language, PublishedStation, ViewState } from '../contracts/view-state'

export function createLoadingState(language: Language): ViewState<never> {
  return {
    status: 'loading',
    language,
    message: language === 'es' ? 'Cargando publicación…' : 'Loading publication…',
  }
}

export function buildViewStateFromResult<T>(
  result: {
    status: 'available' | 'limited' | 'no-data' | 'incompatible-date' | 'error'
    message: string
    reason?: string
    data?: T
    retry?: () => void
  },
  language: Language,
): ViewState<T> {
  if (result.status === 'available') {
    return {
      status: 'available',
      language,
      message: result.message,
      data: result.data as T,
    }
  }

  if (result.status === 'limited') {
    return {
      status: 'limited',
      language,
      message: result.message,
      reason: result.reason ?? 'Limitado por procedencia.',
      data: result.data,
    }
  }

  if (result.status === 'no-data') {
    return {
      status: 'no-data',
      language,
      message: result.message,
      reason: result.reason ?? 'Sin datos publicados.',
    }
  }

  if (result.status === 'incompatible-date') {
    return {
      status: 'incompatible-date',
      language,
      message: result.message,
      reason: result.reason ?? 'La fecha no es compatible.',
    }
  }

  return {
    status: 'error',
    language,
    message: result.message,
    reason: result.reason ?? 'No se pudo leer la publicación.',
    retry: result.retry,
  }
}

export function createPublishedStationState(
  station: PublishedStation,
  language: Language,
  retry?: () => void,
): ViewState<PublishedStation> {
  return {
    status: 'available',
    language,
    message: language === 'es' ? 'Resultado disponible' : 'Result available',
    data: station,
    ...(retry ? { retry } : {}),
  }
}

export function createNoDataState(language: Language, reason: string): ViewState<never> {
  return {
    status: 'no-data',
    language,
    message: language === 'es' ? 'Sin datos' : 'No data',
    reason,
  }
}

export function createErrorState(language: Language, reason: string, retry?: () => void): ViewState<never> {
  return {
    status: 'error',
    language,
    message: language === 'es' ? 'Error en la publicación' : 'Publication error',
    reason,
    retry,
  }
}
