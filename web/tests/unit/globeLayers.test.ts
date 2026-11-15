// RF-08: qué imagen de radar de una zona se extiende sobre el globo, según views/index.json (§17.3).
import { describe, expect, it } from "vitest";
import { rectanguloDe, type IndiceVistas } from "../../src/features/map/stationFiles";
import { availableLayers, datesOf, legendOf, timelineDates, viewFor } from "../../src/features/zone/globeLayers";

const vistas: IndiceVistas = {
  esquinas_lonlat: [[-65.8, -11.746], [-65.326, -11.75], [-65.33, -12.224], [-65.805, -12.22]],
  paletas: { radar: ["#000000", "#ffffff"], cambio: ["#8c2d04", "#f7f7f7", "#1d4f85"], optico: ["#1d6b3a", "#f7f7f7", "#7a3a10"] },
  vistas: [
    { archivo: "views/20260620_hv.webp", fecha: "2026-06-20", capa: "hv" },
    { archivo: "views/20260620_hh.webp", fecha: "2026-06-20", capa: "hh" },
    { archivo: "views/20261018_hv.webp", fecha: "2026-10-18", capa: "hv" },
    { archivo: "views/20261006_cambio.webp", fecha: "2026-10-06", capa: "cambio" },
    { archivo: "views/20261018_cambio.webp", fecha: "2026-10-18", capa: "cambio" },
    { archivo: "views/base.webp", fecha: null, capa: "base" },
    { archivo: "views/dnbr.webp", fecha: null, capa: "dnbr" },
    { archivo: "views/val_20261030_hv.webp", fecha: "2026-10-30", capa: "hv", coleccion: "validated" },
  ],
};

describe("capas de radar sobre el globo", () => {
  it("ofrece el cambio, lo normal, el radar y el óptico cuando están publicados", () => {
    expect(availableLayers(vistas)).toEqual(["cambio", "base", "radar", "dnbr"]);
    expect(availableLayers({ ...vistas, vistas: vistas.vistas.filter((v) => v.capa === "hv") })).toEqual(["radar"]);
  });

  it("sin fecha muestra la más reciente; con fecha, esa; con una que la serie no tiene, la más reciente", () => {
    expect(viewFor(vistas, { layer: "cambio" })?.archivo).toBe("views/20261018_cambio.webp");
    expect(viewFor(vistas, { layer: "cambio", date: "2026-10-06" })?.archivo).toBe("views/20261006_cambio.webp");
    expect(viewFor(vistas, { layer: "cambio", date: "2026-12-31" })?.archivo).toBe("views/20261018_cambio.webp");
    expect(viewFor(vistas, { layer: "radar", date: "2026-06-20" })?.archivo).toBe("views/20260620_hv.webp");
    expect(viewFor(vistas, { layer: "base", date: "2026-10-18" })?.archivo).toBe("views/base.webp");
  });

  it("la línea de tiempo recorre todas las fechas con radar; en la línea base va el radar, nunca un cambio de otra fecha", () => {
    expect(timelineDates(vistas)).toEqual(["2026-06-20", "2026-10-18"]);
    const enLineaBase = viewFor(vistas, { layer: "cambio", date: "2026-06-20" });
    expect(enLineaBase?.archivo).toBe("views/20260620_hv.webp");
    // La leyenda es la de lo que se ve: escala del radar en la línea base, la de cambio después.
    expect(legendOf(enLineaBase).palette).toBe("radar");
    expect(legendOf(viewFor(vistas, { layer: "cambio", date: "2026-10-18" })).palette).toBe("cambio");
    expect(legendOf(viewFor(vistas, { layer: "dnbr" })).palette).toBe("optico");
  });

  it("el tramo VALIDATED va aparte: nunca entra a las fechas ni a las imágenes de la serie (RN-02)", () => {
    expect(datesOf(vistas, "radar")).toEqual(["2026-06-20", "2026-10-18"]);
    expect(viewFor(vistas, { layer: "radar", date: "2026-10-30" })?.archivo).toBe("views/20261018_hv.webp");
  });

  it("solo el cambio y el radar llevan fechas", () => {
    expect(datesOf(vistas, "cambio")).toEqual(["2026-10-06", "2026-10-18"]);
    expect(datesOf(vistas, "base")).toEqual([]);
    expect(datesOf(vistas, "dnbr")).toEqual([]);
  });

  it("el rectángulo de la imagen contiene sus cuatro esquinas publicadas", () => {
    expect(rectanguloDe(vistas.esquinas_lonlat)).toEqual([-65.805, -12.224, -65.326, -11.746]);
  });
});
