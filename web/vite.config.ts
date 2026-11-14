/// <reference types="vitest/config" />
// Base web (specs/001-base-web, T001): SPA estática con React + Vite (§18). Sin CesiumJS en la portada (RNF-01).
// CesiumJS (001 T046, RNF-01, RNF-11): se importa de forma diferida desde el explorador; sus recursos de ejecución
// (Assets, ThirdParty, Widgets, Workers) y su licencia se sirven en desarrollo y se copian a dist/cesium.
// Sin manualChunks: producía una dependencia circular que cargaba Cesium en la portada.
import react from "@vitejs/plugin-react";
import { createReadStream, cpSync, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";

const CESIUM_BASE_URL = "/cesium";
const CESIUM_SOURCE = resolve("node_modules/cesium/Build/Cesium");
const CESIUM_RUNTIME_DIRECTORIES = ["Assets", "ThirdParty", "Widgets", "Workers"] as const;
const CESIUM_LICENSE = resolve("node_modules/cesium/LICENSE.md");

function contentType(filePath: string): string {
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".webp": "image/webp",
  };
  return types[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function cesiumAssetsPlugin(): Plugin {
  return {
    name: "uraqi-cesium-runtime-assets",
    configureServer(server) {
      server.middlewares.use(CESIUM_BASE_URL, (request, response, next) => {
        const relativePath = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/").replace(/^\/+/, "");
        if (relativePath === "LICENSE.md") {
          response.setHeader("Content-Type", contentType(CESIUM_LICENSE));
          createReadStream(CESIUM_LICENSE).pipe(response);
          return;
        }
        const sourcePath = resolve(CESIUM_SOURCE, relativePath);
        const allowedRoot = `${CESIUM_SOURCE}${sep}`;

        if (!sourcePath.startsWith(allowedRoot) || !existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
          next();
          return;
        }

        response.setHeader("Content-Type", contentType(sourcePath));
        createReadStream(sourcePath).pipe(response);
      });
    },
    closeBundle() {
      for (const directory of CESIUM_RUNTIME_DIRECTORIES) {
        cpSync(resolve(CESIUM_SOURCE, directory), resolve("dist/cesium", directory), { recursive: true });
      }
      cpSync(CESIUM_LICENSE, resolve("dist/cesium/LICENSE.md"));
    },
  };
}

export default defineConfig({
  // Un solo .env local en la raíz del repositorio (AGENTS.md §6, issue #82): de ahí sale VITE_CESIUM_ION_TOKEN.
  envDir: "..",
  plugins: [react(), cesiumAssetsPlugin()],
  define: {
    CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL),
  },
  test: {
    environment: "jsdom",
    // Matchers de jest-dom, limpieza entre pruebas y doble de canvas sin WebGL (PS-08).
    setupFiles: ["./src/test/setup.ts"],
    // Las pruebas de T004 leen los tokens y estilos globales; sin esto Vitest entrega el CSS vacío.
    css: { include: [/src\/styles\/.+\.css/] },
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
  },
});
