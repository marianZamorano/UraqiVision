/// <reference types="vitest/config" />
// Base web (specs/001-base-web, T001): SPA estática con React + Vite (§18). Sin CesiumJS en la portada (RNF-01).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
  },
});
