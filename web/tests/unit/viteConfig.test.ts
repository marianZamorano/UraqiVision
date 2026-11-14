import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('vite bundle split for Cesium', () => {
  it('loads Cesium through a dynamic import boundary', () => {
    const loaderText = readFileSync(join(process.cwd(), 'src/features/globe/lazyGlobe.ts'), 'utf8')

    expect(loaderText).toContain("import('cesium')")
  })

  it('defines a stable Cesium asset base and copies runtime assets at build time', () => {
    const configText = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')

    expect(configText).toContain('CESIUM_BASE_URL')
    expect(configText).toContain('Assets')
    expect(configText).toContain('ThirdParty')
    expect(configText).toContain('Widgets')
    expect(configText).toContain('Workers')
  })
})
