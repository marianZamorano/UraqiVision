// T013 (001-base-web): adaptador de History API sin librería de enrutado (research.md §2, FR-001, FR-002).
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Link, NavLink, navigate, useRoute } from "../../src/app/router";

function CurrentRoute() {
  const location = useRoute();
  return <output>{location ? `${location.route}:${location.stationId ?? ""}` : "unknown"}</output>;
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("router adapter", () => {
  it("lee la ruta actual de la URL", () => {
    window.history.replaceState(null, "", "/station/tarija");
    render(<CurrentRoute />);
    expect(screen.getByRole("status")).toHaveTextContent("station:tarija");
  });

  it("navega con un Link sin recargar y actualiza la URL", () => {
    render(
      <>
        <Link to="/about">Acerca de</Link>
        <CurrentRoute />
      </>,
    );

    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Acerca de" }));

    expect(notPrevented).toBe(false);
    expect(window.location.pathname).toBe("/about");
    expect(screen.getByRole("status")).toHaveTextContent("about:");
  });

  it("deja al navegador los clics con modificador (nueva pestaña)", () => {
    render(<Link to="/about">Acerca de</Link>);

    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "Acerca de" }), { ctrlKey: true });

    expect(notPrevented).toBe(true);
    expect(window.location.pathname).toBe("/");
  });

  it("responde a atrás/adelante (popstate)", () => {
    render(<CurrentRoute />);

    act(() => {
      window.history.pushState(null, "", "/method");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByRole("status")).toHaveTextContent("method:");
  });

  it("navigate con replace no añade una entrada al historial", () => {
    render(<CurrentRoute />);
    const before = window.history.length;

    act(() => navigate("/explore", { replace: true }));

    expect(window.history.length).toBe(before);
    expect(screen.getByRole("status")).toHaveTextContent("explore:");
  });

  it("NavLink marca la página actual con aria-current y la clase active", () => {
    window.history.replaceState(null, "", "/explore");
    render(
      <nav>
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/explore">Explorador</NavLink>
      </nav>,
    );

    expect(screen.getByRole("link", { name: "Explorador" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Explorador" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });
});
