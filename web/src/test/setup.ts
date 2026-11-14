// Configuración común de Vitest (001, PS-04): matchers de jest-dom, limpieza entre pruebas (sin globals) y un
// canvas sin WebGL, como en jsdom real, para que el explorador use el respaldo textual (PS-08, RF-30).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: () => null,
});
