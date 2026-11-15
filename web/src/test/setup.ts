// Configuración común de Vitest (001, PS-04): matchers de jest-dom, limpieza entre pruebas (sin globals) y un
// canvas sin WebGL, como en jsdom real, para que el explorador use el respaldo textual (PS-08, RF-30).
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";
import "../i18n";

// Las páginas se cargan con import() diferido (explorador): con toda la suite en paralelo la primera carga puede tardar
// más de 1 s, el límite por defecto de findBy*. 5 s evita fallos intermitentes sin ocultar esperas reales.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: () => null,
});

// jsdom no implementa el desplazamiento de la ventana; el cambio de página lo usa (useRouteFocus).
window.scrollTo = () => {};
