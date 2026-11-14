import react from '@vitejs/plugin-react'
import { createReadStream, cpSync, existsSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const CESIUM_BASE_URL = '/cesium'
const CESIUM_SOURCE = resolve('node_modules/cesium/Build/Cesium')
const CESIUM_RUNTIME_DIRECTORIES = ['Assets', 'ThirdParty', 'Widgets', 'Workers'] as const
// RNF-11: el texto completo de la licencia acompaña a los recursos publicados de CesiumJS.
const CESIUM_LICENSE = resolve('node_modules/cesium/LICENSE.md')

function contentType(filePath: string): string {
  const types: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.webp': 'image/webp',
  }
  return types[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function cesiumAssetsPlugin(): Plugin {
  return {
    name: 'uraqi-cesium-runtime-assets',
    configureServer(server) {
      server.middlewares.use(CESIUM_BASE_URL, (request, response, next) => {
        const relativePath = decodeURIComponent((request.url ?? '/').split('?')[0]).replace(/^\/+/, '')
        if (relativePath === 'LICENSE.md') {
          response.setHeader('Content-Type', contentType(CESIUM_LICENSE))
          createReadStream(CESIUM_LICENSE).pipe(response)
          return
        }
        const sourcePath = resolve(CESIUM_SOURCE, relativePath)
        const allowedRoot = `${CESIUM_SOURCE}${sep}`

        if (!sourcePath.startsWith(allowedRoot) || !existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
          next()
          return
        }

        response.setHeader('Content-Type', contentType(sourcePath))
        createReadStream(sourcePath).pipe(response)
      })
    },
    closeBundle() {
      for (const directory of CESIUM_RUNTIME_DIRECTORIES) {
        cpSync(resolve(CESIUM_SOURCE, directory), resolve('dist/cesium', directory), {
          recursive: true,
        })
      }
      cpSync(CESIUM_LICENSE, resolve('dist/cesium/LICENSE.md'))
    },
  }
}

export default defineConfig({
  plugins: [react(), cesiumAssetsPlugin()],
  define: {
    CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    modulePreload: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
  },
})
