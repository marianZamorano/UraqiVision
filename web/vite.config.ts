/// <reference types="vitest/config" />
// Base web (specs/001-base-web, T001): SPA estática con React + Vite (§18). Sin CesiumJS en la portada (RNF-01).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Las pruebas de T004 leen los tokens y estilos globales; sin esto Vitest entrega el CSS vacío.
    css: { include: [/src\/styles\/.+\.css/] },
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
  },
});
