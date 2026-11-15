// #121 (RF-25, RNF-12): trayectoria de la cámara del recorrido.
import { describe, expect, it } from "vitest";
import { dampPose, easeInOutCubic, framingShift, KEYFRAMES, portraitZoom, poseAt, poseDistance, TOUR_SECTIONS, ZONES_FROM_PROGRESS } from "../../src/features/globe/cameraPath";
import { BOLIVIA_RECTANGLE } from "../../src/features/globe/globeConfig";

describe("cameraPath", () => {
  it("el recorrido va de la Tierra entera a Bolivia, acercándose en cada sección (#123)", () => {
    expect(TOUR_SECTIONS).toEqual(["earth", "southAmerica", "bolivia"]);
    const ranges = TOUR_SECTIONS.map((s) => KEYFRAMES[s].range);
    expect([...ranges].sort((a, b) => b - a)).toEqual(ranges);
    expect(KEYFRAMES.earth.range).toBeGreaterThan(10_000_000); // se ve el disco entero
  });

  it("la vista de Bolivia mira a un punto dentro de Bolivia y lo bastante cerca para ver las zonas", () => {
    const [west, south, east, north] = BOLIVIA_RECTANGLE;
    expect(KEYFRAMES.bolivia.longitude).toBeGreaterThan(west);
    expect(KEYFRAMES.bolivia.longitude).toBeLessThan(east);
    expect(KEYFRAMES.bolivia.latitude).toBeGreaterThan(south);
    expect(KEYFRAMES.bolivia.latitude).toBeLessThan(north);
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

  it("el encuadre mueve la cámara la mitad de lo tapado, en metros a esa distancia (#123)", () => {
    const fov = Math.PI / 3; // 60°, horizontal en una pantalla apaisada
    const metersPerPixel = (2 * 1_000_000 * Math.tan(fov / 2)) / 1000;
    const shift = framingShift(1_000_000, fov, 1000, 600, { left: 400, right: 100, top: 80, bottom: 0 });
    expect(shift.left).toBeCloseTo(150 * metersPerPixel); // (400 − 100) / 2
    expect(shift.down).toBeCloseTo(-40 * metersPerPixel); // la cabecera empuja la escena hacia abajo
    expect(framingShift(1_000_000, fov, 400, 800, { left: 0, right: 0, top: 0, bottom: 300 }).down).toBeGreaterThan(0);
    expect(framingShift(1_000_000, fov, 0, 0, { left: 400, right: 0, top: 0, bottom: 300 })).toEqual({ left: 0, down: 0 });
    expect(framingShift(1_000_000, fov, 1000, 600, { left: -50, right: -5, top: -2, bottom: -1 })).toEqual({ left: 0, down: 0 });
  });

  it("en pantallas verticales la cámara se aleja para que Bolivia quepa a lo ancho; en apaisadas no (#125)", () => {
    expect(portraitZoom(1440, 900)).toBe(1);
    expect(portraitZoom(390, 844)).toBeGreaterThan(1.4);
    expect(portraitZoom(390, 844)).toBeLessThanOrEqual(2);
    expect(portraitZoom(100, 2000)).toBe(2);
    expect(portraitZoom(0, 0)).toBe(1);
  });

  it("las zonas relevan al marcador de Bolivia a medio camino de la sección de Bolivia", () => {
    expect(ZONES_FROM_PROGRESS).toBe(1.5);
  });
});
