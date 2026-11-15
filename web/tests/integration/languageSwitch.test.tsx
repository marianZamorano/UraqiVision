// T031 (001-base-web): cambio de idioma en rutas y estados sin recargar ni perder contexto (RF-20, RNF-03, FR-013).
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/app/App";
import { fetchStation } from "../../src/data/publicationRepository";
import i18n from "../../src/i18n";

// Envuelve la función real para contar llamadas sin cambiar su comportamiento.
vi.mock("../../src/data/publicationRepository", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/data/publicationRepository")>();
  return { ...original, fetchStation: vi.fn(original.fetchStation) };
});

function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  return render(<App />);
}

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("es");
});

describe("cambio de idioma", () => {
  it("traduce el shell y la página sin cambiar la URL", async () => {
    renderAt("/explore");
    expect(await screen.findByRole("heading", { level: 1, name: "Explorador" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cambiar el idioma a english/i }));

    expect(await screen.findByRole("heading", { level: 1, name: "Explorer" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch language to español/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/explore");
    expect(document.documentElement.lang).toBe("en");
  });

  it("marca el idioma del nombre visible del selector (WCAG 3.1.2)", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: /english/i })).toHaveAttribute("lang", "en");
  });

  it("traduce la estación sin volver a cargarla ni perder la selección (FR-013, FR-014)", async () => {
    renderAt("/station/tarija");
    expect(await screen.findByRole("heading", { level: 1, name: "Tarija" })).toBeInTheDocument();
    expect(screen.getByText("Órbita")).toBeInTheDocument();
    const calls = vi.mocked(fetchStation).mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: /cambiar el idioma a english/i }));

    expect(await screen.findByText("Orbit")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Tarija" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/station/tarija");
    expect(vi.mocked(fetchStation).mock.calls.length).toBe(calls);
  });
});
