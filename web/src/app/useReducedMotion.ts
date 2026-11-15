// T037 (001-base-web): preferencia de movimiento reducido del sistema (RNF-12, §20.2). Se actualiza si la persona la
// cambia con la página abierta. La usan el cambio de página (desplazamiento sin animación) y, más adelante, el vuelo
// del globo y la línea de tiempo (M-GLOBO, M-MAPA) y el indicador de carga de 004.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function mediaQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : null;
}

function subscribe(onChange: () => void): () => void {
  const media = mediaQuery();
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => mediaQuery()?.matches ?? false, () => false);
}
