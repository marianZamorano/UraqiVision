import { describe, expect, it } from 'vitest'
import { resolveGlobeProvider } from '../../src/features/globe/GlobeProvider'
import {
  ION_IMAGERY_ASSET_ID,
  ION_TERRAIN_ASSET_ID,
  readPublicIonToken,
} from '../../src/features/globe/ionProvider'

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

  it('keeps the ion provider independent from whether the textual fallback is enabled', () => {
    const result = resolveGlobeProvider({
      token: 'FAKE_CESIUM_TOKEN_FOR_TESTS',
      webglAvailable: true,
      textualFallback: false,
    })

    expect(result.mode).toBe('ion')
    expect(result.usesIonToken).toBe(true)
  })

  it('uses CesiumJS without ion when WebGL works but the ion token is missing', () => {
    const result = resolveGlobeProvider({
      token: '',
      webglAvailable: true,
      textualFallback: true,
    })

    expect(result.mode).toBe('no-ion')
    expect(result.usesIonToken).toBe(false)
    expect(result.usesTextFallback).toBe(false)
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

describe('ion browser configuration', () => {
  it('uses only the approved asset identifiers and accepts a fake injected token', () => {
    const token = readPublicIonToken({ VITE_CESIUM_ION_TOKEN: ' FAKE_CESIUM_TOKEN_FOR_TESTS ' })

    expect(token).toBe('FAKE_CESIUM_TOKEN_FOR_TESTS')
    expect(ION_TERRAIN_ASSET_ID).toBe(1)
    expect(ION_IMAGERY_ASSET_ID).toBe(2)
  })
})
