// #121 (RF-25): progreso continuo del recorrido a partir del scroll.
import { describe, expect, it, vi } from "vitest";
import { createProgressStore, progressFromCenters } from "../../src/features/globe/scrollProgress";

describe("progressFromCenters", () => {
  const centers = [500, 1500, 2500, 3500];

  it("vale el índice de la sección cuyo centro coincide con el de la ventana", () => {
    expect(progressFromCenters(centers, 500)).toBe(0);
    expect(progressFromCenters(centers, 1500)).toBe(1);
    expect(progressFromCenters(centers, 3500)).toBe(3);
  });

  it("avanza linealmente entre secciones y se limita a los extremos", () => {
    expect(progressFromCenters(centers, 1000)).toBe(0.5);
    expect(progressFromCenters(centers, 2750)).toBe(2.25);
    expect(progressFromCenters(centers, 0)).toBe(0);
    expect(progressFromCenters(centers, 9999)).toBe(3);
  });

  it("sin secciones es 0", () => {
    expect(progressFromCenters([], 400)).toBe(0);
  });
});

describe("createProgressStore", () => {
  it("avisa a los suscriptores solo cuando el valor cambia y deja de avisar al desuscribirse", () => {
    const store = createProgressStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(1.5);
    store.set(1.5);
    expect(store.get()).toBe(1.5);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
