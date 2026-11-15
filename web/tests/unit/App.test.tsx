// T001 (001-base-web): la aplicación monta el shell con un landmark principal (RNF-04) y sus rutas (FR-001, FR-002).
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app/App";

// Sin librería de enrutado (research.md §2): la ruta se fija en la URL antes de montar.
function renderAt(path: string) {
  window.history.replaceState(null, "", path);
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("monta el shell con un landmark <main>", () => {
    renderAt("/");
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("no renderiza ningún 0 como sustituto de datos ausentes (RN-13)", () => {
    const { container } = renderAt("/");
    expect(container.textContent).not.toMatch(/\b0\b/);
  });

  it("renders the home page at the root route without the Cesium attribution (RNF-01)", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1, name: "UraqiVision" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /atribución de cesium/i })).not.toBeInTheDocument();
  });

  it("renders a station detail route", async () => {
    renderAt("/station/santa-cruz");
    expect(await screen.findByRole("heading", { name: /santa cruz/i })).toBeInTheDocument();
  });

  it("shows the Cesium attribution inside the explorer route (RNF-11)", async () => {
    renderAt("/explore");
    expect(await screen.findByRole("link", { name: /atribución de cesium/i })).toBeInTheDocument();
  });
});
