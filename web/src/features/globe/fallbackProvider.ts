// RF-30, RNF-04: respaldo textual del explorador cuando el globo 3D no puede usarse.
import type { GlobeProviderDecision } from './GlobeProvider'

export type FallbackReason = 'webgl-unavailable' | 'load-failed'

export interface FallbackProviderState {
  active: boolean
  reason: FallbackReason | null
}

export function resolveFallbackProvider(
  decision: GlobeProviderDecision,
  loadFailed = false,
): FallbackProviderState {
  if (decision.mode === 'textual') {
    return { active: true, reason: 'webgl-unavailable' }
  }

  if (loadFailed) {
    return { active: true, reason: 'load-failed' }
  }

  return { active: false, reason: null }
}
