import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

const textExtensions = /\.(?:css|html|js|json|md|ts|tsx)$/
const distDir = join(process.cwd(), 'dist')

describe('secret and bundle hygiene', () => {
  it('keeps the local env file untracked and the example value empty', () => {
    const tracked = execFileSync('git', ['ls-files', 'web/.env'], {
      cwd: join(process.cwd(), '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
    const example = readFileSync(join(process.cwd(), '.env.example'), 'utf8').trim()

    expect(tracked).toBe('')
    expect(example).toBe('VITE_CESIUM_ION_TOKEN=')
  })

  it('keeps the fake token marker inside tests and never logs the public token', () => {
    const sourceFiles = walk(join(process.cwd(), 'src')).filter((file) => textExtensions.test(file))
    const productionMatches = sourceFiles.filter((file) => (
      readFileSync(file, 'utf8').includes('FAKE_CESIUM_TOKEN_FOR_TESTS')
    ))
    const tokenLogs = sourceFiles.filter((file) => (
      /console\.(?:debug|info|log|warn|error)\s*\([^)]*VITE_CESIUM_ION_TOKEN/s.test(readFileSync(file, 'utf8'))
    ))

    expect(productionMatches).toEqual([])
    expect(tokenLogs).toEqual([])
  })

  // Requiere `npm run build` antes; sin dist/ la prueba queda omitida (skipped), no aprobada.
  it.skipIf(!existsSync(distDir))('contains no private credential signatures in the production bundle (needs npm run build)', () => {
    const bundleFiles = walk(distDir).filter((file) => textExtensions.test(file))
    const privateCredentialPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /AKIA[0-9A-Z]{16}/,
      /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
      /gh[oprsu]_[A-Za-z0-9]{30,}/,
    ]
    const unsafeFiles = bundleFiles.filter((file) => {
      const content = readFileSync(file, 'utf8')
      return privateCredentialPatterns.some((pattern) => pattern.test(content))
    })

    expect(unsafeFiles).toEqual([])
  })
})
