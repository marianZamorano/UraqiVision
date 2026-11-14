// Base web (specs/001-base-web): SPA estática con React + Vite (§18). Sin CesiumJS en la portada (RNF-01).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Escucha en la red local para probar desde el celular (RNF-05).
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    // Las pruebas de estilos (001 T004) leen el CSS; sin esto Vitest lo entrega vacío.
    css: true,
    // Pruebas junto al código (src/) y en tests/unit y tests/integration. Las e2e son de Playwright.
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
  },
});
