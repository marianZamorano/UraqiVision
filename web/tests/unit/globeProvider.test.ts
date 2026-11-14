import { describe, expect, it } from 'vitest'
import { resolveGlobeProvider } from '../../src/features/globe/GlobeProvider'

describe('resolveGlobeProvider', () => {
  it('prefers the ion-backed provider when a token is present and WebGL is available', () => {
    const result = resolveGlobeProvider({
      token: 'demo-token',
      webglAvailable: true,
      textualFallback: true,
    })

    expect(result.mode).toBe('ion')
    expect(result.usesIonToken).toBe(true)
    expect(result.usesTextFallback).toBe(false)
  })

  it('uses the textual fallback when the ion token is missing', () => {
    const result = resolveGlobeProvider({
      token: '',
      webglAvailable: true,
      textualFallback: true,
    })

    expect(result.mode).toBe('textual')
    expect(result.usesIonToken).toBe(false)
    expect(result.usesTextFallback).toBe(true)
  })

  it('uses the textual fallback when WebGL is unavailable', () => {
    const result = resolveGlobeProvider({
      token: 'demo-token',
      webglAvailable: false,
      textualFallback: true,
    })

    expect(result.mode).toBe('textual')
    expect(result.usesTextFallback).toBe(true)
  })
})
