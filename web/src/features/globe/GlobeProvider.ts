export type GlobeMode = 'ion' | 'textual'

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
  const canUseIon = webglAvailable && Boolean(normalizedToken) && Boolean(textualFallback)

  if (canUseIon) {
    return {
      mode: 'ion',
      usesIonToken: true,
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
