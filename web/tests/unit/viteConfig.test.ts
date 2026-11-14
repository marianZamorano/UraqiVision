import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('vite bundle split for Cesium', () => {
  it('separates Cesium-related modules from the initial app bundle', () => {
    const configText = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')
    expect(configText).toContain('manualChunks')
    expect(configText).toContain('cesium')
  })
})
