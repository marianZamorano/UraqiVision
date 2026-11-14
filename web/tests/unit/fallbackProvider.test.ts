import { describe, expect, it } from 'vitest'
import { resolveFallbackProvider } from '../../src/features/globe/fallbackProvider'
import { resolveGlobeProvider } from '../../src/features/globe/GlobeProvider'

// RF-30: el respaldo textual se activa sin WebGL o si CesiumJS no llega a cargar.
describe('resolveFallbackProvider', () => {
  it('activates the textual fallback when WebGL is unavailable', () => {
    const decision = resolveGlobeProvider({ token: '', webglAvailable: false })

    expect(resolveFallbackProvider(decision)).toEqual({ active: true, reason: 'webgl-unavailable' })
  })

  it('activates the textual fallback when the Cesium module fails to load', () => {
    const decision = resolveGlobeProvider({ token: '', webglAvailable: true })

    expect(resolveFallbackProvider(decision, true)).toEqual({ active: true, reason: 'load-failed' })
  })

  it('stays inactive while the 3D globe can be used', () => {
    const decision = resolveGlobeProvider({ token: 'FAKE_CESIUM_TOKEN_FOR_TESTS', webglAvailable: true })

    expect(resolveFallbackProvider(decision)).toEqual({ active: false, reason: null })
  })
})
