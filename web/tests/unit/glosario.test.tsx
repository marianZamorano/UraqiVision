// 004 T025: término del glosario accesible con ratón, tacto y teclado (RF-19, FR-014a, WCAG 1.4.13; PS-04, PS-07).
// Casos CP-41 a CP-44 de pruebas/casos-de-prueba.md.
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TerminoGlosario } from "../../src/features/interface/glosario/TerminoGlosario";

afterEach(cleanup);

const props = {
  termino: "Retrodispersión",
  definicion: "Energía que vuelve al sensor, normalizada por el terreno.",
  etiquetaCerrar: "Cerrar definición",
};

const abrir = () => fireEvent.click(screen.getByRole("button", { name: "Retrodispersión" }));
const definicion = () => screen.queryByRole("dialog", { name: "Retrodispersión" });

describe("TerminoGlosario", () => {
  it("es un botón con nombre accesible que no cambia de página (CP-44)", () => {
    render(<TerminoGlosario {...props} />);
    const boton = screen.getByRole("button", { name: "Retrodispersión" });
    expect(boton.getAttribute("type")).toBe("button");
    expect(boton.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("al tocarlo o activarlo con el teclado abre la definición (CP-41)", () => {
    render(<TerminoGlosario {...props} />);
    abrir();
    expect(definicion()?.textContent).toContain(props.definicion);
    expect(screen.getByRole("button", { name: "Retrodispersión" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("al pasar el cursor abre la definición (CP-41)", () => {
    render(<TerminoGlosario {...props} />);
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Retrodispersión" }));
    expect(definicion()).not.toBeNull();
  });

  it("no desaparece al sacar el cursor: hay que cerrarla (WCAG 1.4.13, CP-43)", () => {
    render(<TerminoGlosario {...props} />);
    const boton = screen.getByRole("button", { name: "Retrodispersión" });
    fireEvent.mouseEnter(boton);
    fireEvent.mouseLeave(boton);
    expect(definicion()).not.toBeNull();
  });

  it("Escape la cierra y el foco vuelve al término (CP-42)", () => {
    render(<TerminoGlosario {...props} />);
    abrir();
    fireEvent.keyDown(definicion()!, { key: "Escape" });
    expect(definicion()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Retrodispersión" }));
  });

  it("el botón «cerrar» la cierra y devuelve el foco al término (CP-42)", () => {
    render(<TerminoGlosario {...props} />);
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar definición" }));
    expect(definicion()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Retrodispersión" }));
  });

  it("tocar fuera la cierra (CP-42)", () => {
    render(
      <div>
        <TerminoGlosario {...props} />
        <p>Otro contenido</p>
      </div>,
    );
    abrir();
    fireEvent.pointerDown(screen.getByText("Otro contenido"));
    expect(definicion()).toBeNull();
  });

  it("tocar dentro de la definición no la cierra", () => {
    render(<TerminoGlosario {...props} />);
    abrir();
    fireEvent.pointerDown(screen.getByText(props.definicion));
    expect(definicion()).not.toBeNull();
  });

  it("el término y la definición quedan asociados (aria-controls)", () => {
    render(<TerminoGlosario {...props} />);
    abrir();
    const boton = screen.getByRole("button", { name: "Retrodispersión" });
    expect(definicion()?.id).toBe(boton.getAttribute("aria-controls"));
  });
});
