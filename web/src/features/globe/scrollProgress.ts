// #121 (RF-25): progreso del recorrido a partir del scroll. El progreso es continuo: vale i cuando el centro de la
// ventana pasa por el centro de la sección i, y avanza linealmente entre secciones. Vive fuera de React (un store
// pequeño) para que el globo lo lea en cada fotograma sin volver a renderizar la página.
import { useEffect, useState, type RefObject } from "react";

/** Progreso continuo dados los centros de las secciones (en coordenadas del documento) y el centro de la ventana. */
export function progressFromCenters(centers: readonly number[], viewportCenter: number): number {
  const first = centers[0];
  if (first === undefined) return 0;
  if (viewportCenter <= first) return 0;
  for (let i = 0; i < centers.length - 1; i += 1) {
    const a = centers[i] as number;
    const b = centers[i + 1] as number;
    if (viewportCenter <= b) return b > a ? i + (viewportCenter - a) / (b - a) : i + 1;
  }
  return centers.length - 1;
}

export type ProgressStore = {
  get: () => number;
  set: (value: number) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createProgressStore(initial = 0): ProgressStore {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (next === value) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Mide las secciones al desplazarse o cambiar el tamaño (una vez por fotograma) y publica el progreso. Devuelve
 * también la sección activa (redondeada), que sí es estado de React: solo cambia al pasar de una sección a otra.
 */
export function useTourProgress(sections: RefObject<Array<HTMLElement | null>>) {
  const [store] = useState(() => createProgressStore());
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const centers = (sections.current ?? [])
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top + window.scrollY + rect.height / 2;
        });
      const progress = progressFromCenters(centers, window.scrollY + window.innerHeight / 2);
      store.set(progress);
      setActive(Math.round(progress));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections, store]);

  return { store, active };
}
