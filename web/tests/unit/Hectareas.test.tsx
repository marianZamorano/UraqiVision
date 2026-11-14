// 004 T014: gráfico y tabla de hectáreas con rango (RN-06), hueco y nunca 0 sin dato (RN-13), tabla
// alternativa (RNF-04). Casos CP-02 y CP-03 de pruebas/casos-de-prueba.md. PS-04.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GraficoHectareas,
  TablaHectareas,
  aDatosGrafico,
  type EtiquetasHectareas,
  type PuntoHectareas,
} from "../../src/features/interface/hectareas/Hectareas";

const etiquetas: EtiquetasHectareas = {
  titulo: "Superficie con cambio",
  fecha: "Fecha",
  valor: "Hectáreas",
  rango: "Rango",
  noReportada: "No reportada",
  rangoNoReportado: "Rango no reportado",
};

const puntos: PuntoHectareas[] = [
  { fecha: "2026-08-10T10:00:00Z", estado: "reportado", valor: 1234.5, rango: { min: 1100, max: 1300 } },
  { fecha: "2026-08-22T10:00:00Z", estado: "no-reportado", motivo: "sin par de la misma órbita" },
  { fecha: "2026-09-03T10:00:00Z", estado: "reportado", valor: 0, rango: { min: 0, max: 12.5 } },
  { fecha: "2026-09-15T10:00:00Z", estado: "reportado", valor: 98.2, rango: null, motivoRango: "sin sensibilidad publicada" },
];

describe("aDatosGrafico (datos que recibe el gráfico)", () => {
  it("un valor no reportado pasa como null (hueco), nunca como 0 (RN-13)", () => {
    const datos = aDatosGrafico(puntos);
    expect(datos[1]?.valor).toBeNull();
    expect(datos[1]?.rango).toBeNull();
  });

  it("el rango va como [mín, máx] para dibujar la banda (RN-06)", () => {
    expect(aDatosGrafico(puntos)[0]?.rango).toEqual([1100, 1300]);
  });

  it("un 0 publicado se mantiene como 0 (es un dato, no una ausencia)", () => {
    expect(aDatosGrafico(puntos)[2]?.valor).toBe(0);
  });
});

describe("TablaHectareas (alternativa textual, RNF-04)", () => {
  it("muestra valor y rango con el formato del idioma (CP-02)", () => {
    render(<TablaHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} />);
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]!).getByText("1.234,5")).toBeTruthy();
    expect(within(filas[1]!).getByText("1.100,0–1.300,0")).toBeTruthy();
  });

  it("en inglés usa punto decimal y coma de miles", () => {
    render(<TablaHectareas puntos={puntos} idioma="en" etiquetas={etiquetas} />);
    expect(screen.getByText("1,234.5")).toBeTruthy();
  });

  it("un dato ausente se lee «No reportada» con su motivo, sin ningún 0 (CP-03, RN-13)", () => {
    render(<TablaHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} />);
    const fila = screen.getAllByRole("row")[2]!;
    expect(fila.textContent).toContain("No reportada");
    expect(fila.textContent).toContain("sin par de la misma órbita");
    expect(fila.textContent).not.toMatch(/\b0([,.]0)?\b/);
  });

  it("sin rango publicado muestra «Rango no reportado» con su motivo (RN-06)", () => {
    render(<TablaHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} />);
    const fila = screen.getAllByRole("row")[4]!;
    expect(fila.textContent).toContain("Rango no reportado");
    expect(fila.textContent).toContain("sin sensibilidad publicada");
  });

  it("las fechas van en hora de Bolivia", () => {
    render(<TablaHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} />);
    expect(screen.getByText("10 ago 2026, 06:00")).toBeTruthy();
  });

  it("tiene título y encabezados de columna", () => {
    render(<TablaHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} />);
    expect(screen.getByRole("table", { name: "Superficie con cambio" })).toBeTruthy();
    expect(screen.getAllByRole("columnheader").map((c) => c.textContent)).toEqual(["Fecha", "Hectáreas", "Rango"]);
  });
});

describe("GraficoHectareas", () => {
  it("se dibuja con su título accesible y sin errores", () => {
    render(<GraficoHectareas puntos={puntos} idioma="es" etiquetas={etiquetas} ancho={480} alto={240} />);
    expect(screen.getByRole("figure", { name: "Superficie con cambio" })).toBeTruthy();
  });
});
