// #123 (RF-29, RN-04): ubicación de las zonas publicadas, leída de area.bbox_lonlat de su station.json.
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function repositoryWithApi(api: string) {
  vi.stubEnv("VITE_PUBLISHED_API", api);
  vi.resetModules();
  return import("../../src/data/publicationRepository");
}

const summary = (stationId: string) => ({ stationId, label: { es: `Zona ${stationId}`, en: `Area ${stationId}` } });

describe("centerOfBbox", () => {
  it("devuelve el centro de una caja válida [oeste, sur, este, norte]", async () => {
    const { centerOfBbox } = await import("../../src/data/publicationRepository");
    const center = centerOfBbox([-61.045, -16.153, -60.575, -15.693]);
    expect(center?.[0]).toBeCloseTo(-60.81, 6);
    expect(center?.[1]).toBeCloseTo(-15.923, 6);
  });

  it("rechaza cajas mal formadas, invertidas o fuera de rango (no inventa coordenadas)", async () => {
    const { centerOfBbox } = await import("../../src/data/publicationRepository");
    expect(centerOfBbox(undefined)).toBeNull();
    expect(centerOfBbox([1, 2, 3])).toBeNull();
    expect(centerOfBbox([-60, -16, -61, -15])).toBeNull();
    expect(centerOfBbox([-200, -16, -61, -15])).toBeNull();
    expect(centerOfBbox([-61, -16, "a", -15])).toBeNull();
    expect(centerOfBbox([-61, Number.NaN, -60, -15])).toBeNull();
  });
});

describe("listStationLocations", () => {
  it("lee la caja de cada estación publicada y omite las DEMO, las sin caja y las que fallan", async () => {
    const repo = await repositoryWithApi("http://api.test/api");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/estaciones/beni-norte/station.json")) {
        return new Response(JSON.stringify({ area: { bbox_lonlat: [-65.8, -12.22, -65.33, -11.75] } }));
      }
      if (url.endsWith("/estaciones/sin-caja/station.json")) return new Response(JSON.stringify({ area: {} }));
      return new Response("no", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const locations = await repo.listStationLocations([
      summary("beni-norte"), summary("sin-caja"), summary("rota"), summary("santa-cruz"),
    ]);

    expect(locations).toHaveLength(1);
    expect(locations[0]).toMatchObject({ stationId: "beni-norte", label: { es: "Zona beni-norte", en: "Area beni-norte" } });
    expect(locations[0]?.longitude).toBeCloseTo(-65.565, 6);
    expect(locations[0]?.latitude).toBeCloseTo(-11.985, 6);
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/estaciones/beni-norte/station.json", expect.anything());
    // santa-cruz es un ejemplo DEMO: nunca se le pide nada al backend.
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("santa-cruz"))).toBe(false);
  });

  it("sin backend configurado no hay puntos (solo la lista textual)", async () => {
    const repo = await repositoryWithApi("");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await repo.listStationLocations([summary("beni-norte")])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
