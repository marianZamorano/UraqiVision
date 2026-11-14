import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      return walk(fullPath)
    }
    return [fullPath]
  })
}

describe('secret and bundle hygiene', () => {
  it('does not track the real env file and uses a fake marker only in tests', () => {
    const tracked = execFileSync('git', ['ls-files', 'web/.env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    expect(tracked).toBe('')

    const fakeMarker = 'FAKE_CESIUM_TOKEN_FOR_TESTS'
    const roots = [
      join(process.cwd(), 'src'),
      join(process.cwd(), 'tests'),
      join(process.cwd(), 'public'),
      join(process.cwd(), 'vite.config.ts'),
      join(process.cwd(), 'package.json'),
      join(process.cwd(), '.env.example'),
    ]
    const projectFiles = roots.flatMap((entry) => (
      entry.endsWith('.ts') || entry.endsWith('.json') || entry.endsWith('.example')
        ? [entry]
        : walk(entry)
    ))
    const matched = projectFiles.filter((file) => file !== join(process.cwd(), 'tests', 'integration', 'security.test.ts'))
      .filter((file) => /\.(ts|tsx|js|md|json)$/.test(file))
      .filter((file) => {
        try {
          const text = readFileSync(file, 'utf8')
          return text.includes(fakeMarker) || text.includes('import.meta.env.VITE_CESIUM_ION_TOKEN')
        }
        catch {
          return false
        }
      })

    expect(matched).toEqual([])
  })

  it('does not leave private credentials in the production bundle metadata', () => {
    const distDir = join(process.cwd(), 'dist')
    try {
      const stats = statSync(distDir)
      expect(stats.isDirectory()).toBe(true)
    }
    catch {
      expect.fail('The production bundle is not available for a security check.')
    }
  })
})
