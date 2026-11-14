// 004 T004: formatos de fecha (hora de Bolivia) y de hectáreas por idioma (RN-07, FR-004, FR-013, PS-04).
// Casos de pruebas/casos-de-prueba.md: CP-02 (cifras por idioma) y CP-05 (UTC → hora de Bolivia).
import { describe, expect, it } from "vitest";
import { formatearFecha, formatearHectareas } from "../../src/features/interface/formato/formato";

describe("formatearFecha (RN-07: adquisición en UTC, mostrada en hora de Bolivia)", () => {
  it("convierte UTC a hora de Bolivia (UTC−04) en español", () => {
    expect(formatearFecha("2026-11-14T14:32:00Z", "es")).toBe("14 nov 2026, 10:32");
  });

  it("usa el formato inglés sin cambiar el instante", () => {
    expect(formatearFecha("2026-11-14T14:32:00Z", "en")).toBe("Nov 14, 2026, 10:32");
  });

  it("una adquisición cerca de la medianoche UTC cae el día anterior en Bolivia (CP-05)", () => {
    expect(formatearFecha("2026-11-14T03:30:00Z", "es")).toBe("13 nov 2026, 23:30");
  });

  it("rechaza fechas que no son ISO 8601 en UTC en lugar de mostrar algo inventado", () => {
    expect(() => formatearFecha("14/11/2026", "es")).toThrow(/ISO 8601/);
    expect(() => formatearFecha("2026-11-14T10:32:00-04:00", "es")).toThrow(/UTC/);
  });
});

describe("formatearHectareas (FR-013: separadores por idioma, mismo valor)", () => {
  it("español: coma decimal y punto de miles", () => {
    expect(formatearHectareas(1234.5, "es")).toBe("1.234,5");
  });

  it("inglés: punto decimal y coma de miles", () => {
    expect(formatearHectareas(1234.5, "en")).toBe("1,234.5");
  });

  it("muestra el 0 cuando el dato publicado es realmente 0 (no es ausencia)", () => {
    expect(formatearHectareas(0, "es")).toBe("0,0");
  });

  it("no acepta un valor ausente: la ausencia se muestra como «no reportada», nunca como 0 (RN-13)", () => {
    expect(() => formatearHectareas(Number.NaN, "es")).toThrow(/no reportada/);
    expect(() => formatearHectareas(null as unknown as number, "es")).toThrow(/no reportada/);
  });
});
