// T017 (001-base-web): navegación entre destinos, recarga de ruta y anuncios del cambio de página
// (FR-001 a FR-003, RNF-04, PS-04). Ningún destino queda vacío.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app/App";
import { changeLanguage } from "../../src/i18n";

function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  return render(<App />);
}

const nav = () => within(screen.getByRole("navigation", { name: "Navegación principal" }));
const footer = () => within(screen.getByRole("navigation", { name: "Más información" }));

beforeEach(async () => {
  localStorage.clear();
  await changeLanguage("es");
});

describe("navegación de la base web", () => {
  it("la cabecera solo tiene Inicio y Explorador; Método y Acerca de van en el pie (#129, RF-15, RF-24)", () => {
    renderAt("/");
    expect(nav().getAllByRole("link").map((a) => a.textContent)).toEqual(["Inicio", "Explorador"]);
    expect(footer().getAllByRole("link").map((a) => a.textContent)).toEqual(["Método", "Acerca de"]);
  });

  it("desde la portada se llega a cada destino y ninguno queda vacío", async () => {
    renderAt("/");

    fireEvent.click(nav().getByRole("link", { name: "Explorador" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Explorador" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Tarija" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Tarija" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/station/tarija");

    fireEvent.click(footer().getByRole("link", { name: "Método" }));
    expect(screen.getByRole("heading", { level: 1, name: "Método" })).toBeInTheDocument();

    fireEvent.click(footer().getByRole("link", { name: "Acerca de" }));
    expect(screen.getByRole("heading", { level: 1, name: "Acerca de" })).toBeInTheDocument();

    fireEvent.click(nav().getByRole("link", { name: "Inicio" }));
    expect(screen.getByRole("heading", { level: 1, name: "UraqiVision" })).toBeInTheDocument();
  });

  it("recargar una ruta de estación conserva la estación (FR-002)", async () => {
    renderAt("/station/santa-cruz");
    expect(await screen.findByRole("heading", { level: 1, name: "Santa Cruz" })).toBeInTheDocument();
  });

  it("una estación sin publicación muestra «sin datos», no una pantalla vacía (FR-003)", async () => {
    renderAt("/station/no-existe");
    expect(await screen.findByText(/no hay una publicación para esta estación/i)).toBeInTheDocument();
  });

  it("una ruta desconocida vuelve a la portada", async () => {
    renderAt("/ruta-inexistente");
    expect(await screen.findByRole("heading", { level: 1, name: "UraqiVision" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("atrás y adelante restauran el destino", async () => {
    renderAt("/");
    fireEvent.click(footer().getByRole("link", { name: "Método" }));
    expect(screen.getByRole("heading", { level: 1, name: "Método" })).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByRole("heading", { level: 1, name: "UraqiVision" })).toBeInTheDocument();
  });

  it("anuncia el cambio de página y actualiza el título del documento", async () => {
    renderAt("/");
    fireEvent.click(footer().getByRole("link", { name: "Método" }));

    expect(await screen.findByText("Página: Método")).toBeInTheDocument();
    expect(document.title).toBe("Método · UraqiVision");
  });

  it("marca la página actual en el pie", () => {
    renderAt("/about");
    expect(footer().getByRole("link", { name: "Acerca de" })).toHaveAttribute("aria-current", "page");
  });
});
