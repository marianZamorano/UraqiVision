// T035 (001-base-web): teclado, foco, anuncios ARIA y reintento (RNF-04, RF-34, PS-07). Sin tabindex positivos,
// el orden de tabulación es el orden del DOM; la pulsación real de Tab y Enter se prueba en tests/e2e/navigation.spec.ts.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app/App";
import { changeLanguage } from "../../src/i18n";

function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  return render(<App />);
}

/** Elementos alcanzables con Tab, en orden de documento. */
function tabbables(root: HTMLElement): HTMLElement[] {
  const selector = "a[href], button:not([disabled]), input, select, textarea, [tabindex]";
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => el.tabIndex >= 0);
}

beforeEach(async () => {
  localStorage.clear();
  await changeLanguage("es");
});

describe("accesibilidad de la base web", () => {
  it("no hay tabindex positivos que alteren el orden natural", () => {
    const { container } = renderAt("/");
    const positive = Array.from(container.querySelectorAll<HTMLElement>("[tabindex]")).filter((el) => el.tabIndex > 0);
    expect(positive).toEqual([]);
  });

  it("el orden de tabulación empieza por saltar al contenido y sigue el recorrido visual", () => {
    const { container } = renderAt("/");

    expect(tabbables(container).map((el) => el.textContent)).toEqual([
      "Saltar al contenido",
      "Inicio",
      "Explorador",
      "English",
      "Explorar Bolivia",
      "Método",
      "Acerca de",
    ]);
  });

  it("saltar al contenido apunta al <main> y le da el foco", () => {
    renderAt("/");
    const skip = screen.getByRole("link", { name: "Saltar al contenido" });

    expect(skip).toHaveAttribute("href", "#contenido");
    fireEvent.click(skip);

    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("el <main> puede recibir foco por programa sin entrar en el orden de Tab", () => {
    renderAt("/");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("al cambiar de página el foco va al contenido principal (no se queda en un enlace que ya no existe)", async () => {
    renderAt("/");
    fireEvent.click(screen.getByRole("link", { name: "Explorar Bolivia" }));

    await screen.findByRole("heading", { level: 1, name: "Explorador" });
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("al abrir una estación, su carga se anuncia en una región viva y el foco se queda en el contenido", async () => {
    renderAt("/explore");
    await screen.findByRole("heading", { level: 1, name: "Explorador" });

    fireEvent.click(screen.getByRole("link", { name: "Tarija" }));
    const status = await screen.findByText(/cargando la publicación/i);

    expect(status.closest("[aria-live='polite']")).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("main"));

    await screen.findByRole("heading", { level: 1, name: "Tarija" });
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });
});
