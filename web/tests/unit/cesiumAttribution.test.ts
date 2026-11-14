import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// RNF-11, RF-24: la atribución visible del explorador reproduce la licencia instalada de CesiumJS.
describe('Cesium attribution notice', () => {
  const notice = readFileSync(join(process.cwd(), 'public/cesium/attribution.txt'), 'utf8')
  const license = readFileSync(join(process.cwd(), 'node_modules/cesium/LICENSE.md'), 'utf8')

  it('quotes the copyright line of the installed CesiumJS license', () => {
    const copyrightLine = (license.split(/\r?\n/)[0] ?? '').trim()

    expect(copyrightLine).toMatch(/^Copyright /)
    expect(notice).toContain(copyrightLine)
  })

  it('names the license, links the full text and the project source', () => {
    expect(license).toContain('Apache License')
    expect(notice).toContain('Apache License 2.0')
    expect(notice).toContain('/cesium/LICENSE.md')
    expect(notice).toContain('https://github.com/CesiumGS/cesium')
  })

  it('is plain UTF-8 without a byte order mark', () => {
    expect(notice.charCodeAt(0)).not.toBe(0xfeff)
  })
})
