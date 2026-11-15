// #121 (RF-25, RNF-12): trayectoria de la cámara del recorrido.
import { describe, expect, it } from "vitest";
import { dampPose, easeInOutCubic, KEYFRAMES, poseAt, poseDistance, TOUR_SECTIONS } from "../../src/features/globe/cameraPath";
import { BOLIVIA_RECTANGLE, SAN_IGNACIO_CENTER } from "../../src/features/globe/globeConfig";

describe("cameraPath", () => {
  it("el recorrido va de la Tierra entera a la estación, acercándose en cada sección", () => {
    expect(TOUR_SECTIONS).toEqual(["earth", "southAmerica", "bolivia", "station"]);
    const ranges = TOUR_SECTIONS.map((s) => KEYFRAMES[s].range);
    expect([...ranges].sort((a, b) => b - a)).toEqual(ranges);
    expect(KEYFRAMES.earth.range).toBeGreaterThan(10_000_000); // se ve el disco entero
  });

  it("la estación mira al recorte de San Ignacio, dentro de Bolivia", () => {
    const [west, south, east, north] = BOLIVIA_RECTANGLE;
    expect(KEYFRAMES.station).toMatchObject({ longitude: SAN_IGNACIO_CENTER[0], latitude: SAN_IGNACIO_CENTER[1] });
    expect(KEYFRAMES.station.longitude).toBeGreaterThan(west);
    expect(KEYFRAMES.station.longitude).toBeLessThan(east);
    expect(KEYFRAMES.station.latitude).toBeGreaterThan(south);
    expect(KEYFRAMES.station.latitude).toBeLessThan(north);
  });

  it("la aceleración es suave: empieza y termina quieta", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(0.05)).toBeLessThan(0.05);
    expect(easeInOutCubic(0.95)).toBeGreaterThan(0.95);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("en cada sección la pose es la de su vista; fuera del rango se queda en los extremos", () => {
    TOUR_SECTIONS.forEach((section, i) => {
      const pose = poseAt(i);
      expect(pose.longitude).toBeCloseTo(KEYFRAMES[section].longitude);
      expect(pose.range).toBeCloseTo(KEYFRAMES[section].range);
    });
    expect(poseAt(-3)).toEqual(poseAt(0));
    expect(poseAt(99)).toEqual(poseAt(TOUR_SECTIONS.length - 1));
    expect(poseAt(Number.NaN)).toEqual(poseAt(0));
  });

  it("entre secciones la distancia se interpola en escala logarítmica", () => {
    const mid = poseAt(0.5).range;
    expect(mid).toBeCloseTo(Math.sqrt(KEYFRAMES.earth.range * KEYFRAMES.southAmerica.range), -2);
  });

  it("la amortiguación se acerca al destino sin pasarse y llega", () => {
    const from = poseAt(0);
    const to = poseAt(2);
    const step = dampPose(from, to, 1 / 60);
    expect(step.range).toBeLessThan(from.range);
    expect(step.range).toBeGreaterThan(to.range);
    let current = from;
    for (let i = 0; i < 600; i += 1) current = dampPose(current, to, 1 / 60);
    expect(poseDistance(current, to)).toBeLessThan(1e-4);
    expect(dampPose(from, to, 0)).toEqual(from);
  });
});
