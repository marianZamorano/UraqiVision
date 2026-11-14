export interface FallbackProviderState {
  mode: 'textual' | 'scaled'
  enabled: boolean
  reason?: string
}

export function resolveFallbackProvider(webglAvailable: boolean): FallbackProviderState {
  if (!webglAvailable) {
    return {
      mode: 'textual',
      enabled: true,
      reason: 'WebGL is unavailable. The textual fallback remains active.',
    }
  }

  return {
    mode: 'textual',
    enabled: true,
  }
}
