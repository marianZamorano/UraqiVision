// #123 (RF-02, RNF-11): contorno de Bolivia para el globo.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOLIVIA_OUTLINE_CREDIT, outlineRings } from "../../src/features/globe/boliviaOutline";
import { BOLIVIA_RECTANGLE } from "../../src/features/globe/globeConfig";

const square = [[-60, -16], [-59, -16], [-59, -15], [-60, -15], [-60, -16]];

describe("outlineRings", () => {
  it("toma el anillo exterior de Polygon y de cada polígono de MultiPolygon como lon, lat planos", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Polygon", coordinates: [square, square] } },
        { type: "Feature", geometry: { type: "MultiPolygon", coordinates: [[square], [square]] } },
      ],
    };
    const rings = outlineRings(geojson);
    expect(rings).toHaveLength(3);
    expect(rings[0]).toEqual([-60, -16, -59, -16, -59, -15, -60, -15, -60, -16]);
  });

  it("ignora geometrías inválidas o que no son polígonos", () => {
    expect(outlineRings(null)).toEqual([]);
    expect(outlineRings({ features: "x" })).toEqual([]);
    expect(outlineRings({ features: [{ geometry: { type: "Point", coordinates: [1, 2] } }] })).toEqual([]);
    expect(outlineRings({ features: [{ geometry: { type: "Polygon", coordinates: [[[1, 2], [3, "a"], [1, 2], [1, 2]]] } }] })).toEqual([]);
  });
});

describe("archivo publicado del contorno", () => {
  const geojson = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/bolivia-contorno.geojson"), "utf8"));

  it("declara su fuente y su licencia (RNF-11) y el visor muestra el crédito", () => {
    const props = geojson.features[0].properties;
    expect(props.fuente).toMatch(/geoBoundaries/);
    expect(props.licencia).toMatch(/dominio público/i);
    expect(BOLIVIA_OUTLINE_CREDIT).toMatch(/geoBoundaries/);
  });

  it("se convierte en anillos que caen dentro del encuadre de Bolivia", () => {
    const rings = outlineRings(geojson);
    expect(rings.length).toBeGreaterThan(0);
    const [west, south, east, north] = BOLIVIA_RECTANGLE;
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i += 2) {
        expect(ring[i]).toBeGreaterThanOrEqual(west - 0.1);
        expect(ring[i]).toBeLessThanOrEqual(east + 0.1);
        expect(ring[i + 1]).toBeGreaterThanOrEqual(south - 0.1);
        expect(ring[i + 1]).toBeLessThanOrEqual(north + 0.1);
      }
    }
  });
});
