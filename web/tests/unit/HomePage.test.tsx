// #131 (RF-01): en la portada la barra de desplazamiento de la ventana solo aparece mientras se desplaza la página, y
// al salir de la portada todo vuelve a la normalidad.
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../../src/pages/HomePage";

const root = document.documentElement;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HomePage: barra de desplazamiento que aparece al desplazarse (#131)", () => {
  it("la oculta en la portada, la muestra al desplazarse y la vuelve a ocultar al parar", () => {
    const { unmount } = render(<HomePage />);
    expect(root).toHaveClass("scrollbar-auto");
    expect(root).not.toHaveClass("is-scrolling");

    fireEvent.scroll(window);
    expect(root).toHaveClass("is-scrolling");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(root).not.toHaveClass("is-scrolling");

    fireEvent.scroll(window);
    unmount();
    expect(root).not.toHaveClass("scrollbar-auto");
    expect(root).not.toHaveClass("is-scrolling");
  });
});
