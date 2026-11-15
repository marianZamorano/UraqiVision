// T036 (001-base-web): preferencia de movimiento reducido (RNF-12, PS-07). La alternativa textual a 320 px se
// verifica en el navegador (tests/e2e/navigation.spec.ts), porque jsdom no calcula el diseño.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "../../src/app/useReducedMotion";

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const query = {
    matches: initial,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => query));
  return {
    change(matches: boolean) {
      query.matches = matches;
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent);
    },
    listeners,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useReducedMotion", () => {
  it("devuelve la preferencia del sistema", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("se actualiza si la preferencia cambia mientras la página está abierta", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => media.change(true));

    expect(result.current).toBe(true);
  });

  it("deja de escuchar al desmontar", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it("sin matchMedia (navegadores antiguos o pruebas) asume movimiento normal", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
