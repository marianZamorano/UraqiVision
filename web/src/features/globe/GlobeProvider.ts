// uraqi: vivo — lo carga el visor por nombre
export type GlobeMode = 'ion' | 'no-ion' | 'textual'

export interface GlobeProviderOptions {
  token?: string
  webglAvailable?: boolean
  textualFallback?: boolean
}

export interface GlobeProviderDecision {
  mode: GlobeMode
  usesIonToken: boolean
  usesTextFallback: boolean
}

export function resolveGlobeProvider({
  token = '',
  webglAvailable = true,
  textualFallback = true,
}: GlobeProviderOptions = {}): GlobeProviderDecision {
  const normalizedToken = String(token ?? '').trim()
  const canUseIon = webglAvailable && Boolean(normalizedToken)

  if (canUseIon) {
    return {
      mode: 'ion',
      usesIonToken: true,
      usesTextFallback: false,
    }
  }

  if (webglAvailable) {
    return {
      mode: 'no-ion',
      usesIonToken: false,
      usesTextFallback: false,
    }
  }

  return {
    mode: 'textual',
    usesIonToken: false,
    usesTextFallback: Boolean(textualFallback),
  }
}

export function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')

  return Boolean(context)
}
