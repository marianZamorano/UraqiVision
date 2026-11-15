// #115 (RF-02, DP-07, RNF-06): configuración del globo según el proveedor elegido. El token público solo viaja en
// modo ion y con los assets aprobados 1 (World Terrain) y 2 (Bing Maps Aerial).
import { describe, expect, it } from "vitest";
import { BOLIVIA_CENTER, BOLIVIA_RECTANGLE, SUNRISE_TIME_ISO, globeConfigFor } from "../../src/features/globe/globeConfig";

describe("globeConfigFor", () => {
  it("con ion usa solo los assets aprobados y el token público", () => {
    expect(globeConfigFor("ion", "FAKE_CESIUM_TOKEN_FOR_TESTS")).toEqual({
      mode: "ion",
      terrainAssetId: 1,
      imageryAssetId: 2,
      publicToken: "FAKE_CESIUM_TOKEN_FOR_TESTS",
    });
  });

  it("sin ion no lleva token ni assets de ion", () => {
    expect(globeConfigFor("no-ion", "FAKE_CESIUM_TOKEN_FOR_TESTS")).toEqual({ mode: "no-ion" });
  });

  it("ion sin token cae a sin ion (nunca pide assets sin credencial)", () => {
    expect(globeConfigFor("ion", "")).toEqual({ mode: "no-ion" });
  });

  it("encuadra Bolivia (oeste, sur, este, norte en grados)", () => {
    const [west, south, east, north] = BOLIVIA_RECTANGLE;
    expect(west).toBeLessThan(east);
    expect(south).toBeLessThan(north);
    expect(west).toBeGreaterThan(-75);
    expect(east).toBeLessThan(-55);
    expect(south).toBeGreaterThan(-25);
    expect(north).toBeLessThan(-8);
  });

  it("el marcador de Bolivia queda dentro del encuadre de Bolivia", () => {
    const [west, south, east, north] = BOLIVIA_RECTANGLE;
    for (const [longitude, latitude] of [BOLIVIA_CENTER]) {
      expect(longitude).toBeGreaterThan(west);
      expect(longitude).toBeLessThan(east);
      expect(latitude).toBeGreaterThan(south);
      expect(latitude).toBeLessThan(north);
    }
  });

  it("el amanecer es una hora UTC fija y válida (#121)", () => {
    expect(SUNRISE_TIME_ISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(Number.isNaN(Date.parse(SUNRISE_TIME_ISO))).toBe(false);
  });
});
