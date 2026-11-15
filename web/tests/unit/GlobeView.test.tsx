// #115, #121 (RF-02, RF-25, RF-30, DP-07, RNF-06, RNF-11, RNF-12): el visor del globo con un doble de CesiumJS
// (jsdom no tiene WebGL) y fotogramas controlados a mano.
import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlobeView, type CesiumModule } from "../../src/features/globe/GlobeView";
import { KEYFRAMES } from "../../src/features/globe/cameraPath";
import { SUNRISE_TIME_ISO } from "../../src/features/globe/globeConfig";
import { createProgressStore } from "../../src/features/globe/scrollProgress";

type Pose = { point: number[]; hpr: { heading: number; pitch: number; range: number } };
type FakeViewer = {
  clock: { currentTime: unknown; shouldAnimate: boolean };
  scene: {
    backgroundColor?: unknown;
    sun: { show: boolean };
    moon: { show: boolean };
    globe: Record<string, unknown>;
    screenSpaceCameraController: { enableInputs: boolean };
  };
};

// Fotogramas manuales: cada flush ejecuta los callbacks pendientes con 16 ms más.
let frames = new Map<number, (now: number) => void>();
let nextId = 1;
let now = 0;
function flush(count = 1) {
  for (let i = 0; i < count; i += 1) {
    const pending = [...frames.values()];
    frames = new Map();
    now += 16;
    for (const cb of pending) cb(now);
  }
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  now = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: (now: number) => void) => {
    const id = nextId++;
    frames.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeCesium(options: { failViewer?: boolean } = {}) {
  const destroy = vi.fn();
  const poses: Pose[] = [];
  const lookAt = vi.fn((point: { point: number[] }, hpr: Pose["hpr"]) => {
    poses.push({ point: point.point, hpr: { heading: hpr.heading, pitch: hpr.pitch, range: hpr.range } });
  });
  const requestRender = vi.fn();
  const resize = vi.fn();
  const pick = vi.fn<(position: unknown) => unknown>(() => undefined);
  const entities: Array<Record<string, unknown>> = [];
  const viewerOptions: unknown[] = [];
  const viewers: FakeViewer[] = [];
  const cesium = {
    Ion: { defaultAccessToken: "sin-cambiar" },
    Viewer: vi.fn(function (this: Record<string, unknown>, _el: Element, opts: unknown) {
      if (options.failViewer) throw new Error("WebGL no disponible");
      viewerOptions.push(opts);
      this.camera = { lookAt, lookAtTransform: vi.fn() };
      this.clock = { currentTime: null, shouldAnimate: true };
      this.scene = {
        pick,
        requestRender,
        sun: { show: true },
        moon: { show: true },
        globe: { enableLighting: false, dynamicAtmosphereLighting: false, dynamicAtmosphereLightingFromSun: false },
        screenSpaceCameraController: { enableInputs: true },
        primitives: { add: vi.fn() },
      };
      this.entities = {
        add: vi.fn((e: Record<string, unknown>) => {
          entities.push(e);
          return e;
        }),
      };
      this.resize = resize;
      this.canvas = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
      this.destroy = destroy;
      this.isDestroyed = () => false;
      viewers.push(this as unknown as FakeViewer);
    }),
    ImageryLayer: { fromProviderAsync: vi.fn((provider: unknown) => ({ provider })) },
    IonImageryProvider: { fromAssetId: vi.fn(async (id: number) => ({ ionImagery: id })) },
    TileMapServiceImageryProvider: { fromUrl: vi.fn(async (url: string) => ({ tms: url })) },
    buildModuleUrl: vi.fn((path: string) => `/cesium/${path}`),
    CesiumTerrainProvider: { fromIonAssetId: vi.fn(async (id: number) => ({ ionTerrain: id })) },
    Terrain: vi.fn(function (this: Record<string, unknown>, promise: unknown) {
      this.promise = promise;
    }),
    Cartesian3: { fromDegrees: vi.fn((...degrees: number[]) => ({ point: degrees })) },
    Cartesian2: vi.fn(function (this: Record<string, unknown>, x: number, y: number) {
      this.x = x;
      this.y = y;
    }),
    HeadingPitchRange: vi.fn(function (this: Record<string, unknown>, heading: number, pitch: number, range: number) {
      Object.assign(this, { heading, pitch, range });
    }),
    DistanceDisplayCondition: vi.fn(function (this: Record<string, unknown>, near: number, far: number) {
      Object.assign(this, { near, far });
    }),
    Math: { toRadians: (d: number) => d },
    Matrix4: { IDENTITY: "identidad" },
    JulianDate: { fromIso8601: vi.fn((iso: string) => ({ iso })) },
    Color: { WHITE: "blanco", BLACK: "negro", BLUE: "azul", TRANSPARENT: "transparente", fromCssColorString: vi.fn((css: string) => css) },
    ConstantProperty: vi.fn(function (this: Record<string, unknown>, value: unknown) {
      this.value = value;
    }),
    LabelStyle: { FILL_AND_OUTLINE: "relleno-y-borde" },
    HeightReference: { CLAMP_TO_GROUND: "pegado-al-suelo" },
  };
  return { cesium: cesium as unknown as CesiumModule, raw: cesium, destroy, poses, pick, entities, viewerOptions, viewers, resize };
}

type Fake = ReturnType<typeof fakeCesium>;

function props(f: Fake, overrides: Partial<ComponentProps<typeof GlobeView>> = {}): ComponentProps<typeof GlobeView> {
  return {
    cesium: f.cesium,
    config: { mode: "no-ion" },
    label: "Globo",
    markerLabels: { bolivia: "Bolivia", station: "San Ignacio de Velasco" },
    progress: createProgressStore(),
    reducedMotion: false,
    onSelectSection: vi.fn(),
    onReady: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

const lastPose = (f: Fake) => f.poses[f.poses.length - 1] as Pose;

describe("GlobeView", () => {
  it("con ion usa el token público y los assets 1 y 2", () => {
    const f = fakeCesium();
    const onReady = vi.fn();
    render(<GlobeView {...props(f, { onReady, config: { mode: "ion", terrainAssetId: 1, imageryAssetId: 2, publicToken: "FAKE_CESIUM_TOKEN_FOR_TESTS" } })} />);

    expect(f.raw.Ion.defaultAccessToken).toBe("FAKE_CESIUM_TOKEN_FOR_TESTS");
    expect(f.raw.IonImageryProvider.fromAssetId).toHaveBeenCalledWith(2);
    expect(f.raw.CesiumTerrainProvider.fromIonAssetId).toHaveBeenCalledWith(1);
    expect(f.raw.TileMapServiceImageryProvider.fromUrl).not.toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("sin ion no toca el token ni pide nada a ion: usa la imagen incluida en CesiumJS", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);

    expect(f.raw.Ion.defaultAccessToken).toBe("sin-cambiar");
    expect(f.raw.IonImageryProvider.fromAssetId).not.toHaveBeenCalled();
    expect(f.raw.TileMapServiceImageryProvider.fromUrl).toHaveBeenCalledWith("/cesium/Assets/Textures/NaturalEarthII");
  });

  it("visor limpio: sin widgets, sin cielo, fondo transparente y sin controles de ratón", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);

    expect(f.viewerOptions[0]).toMatchObject({
      geocoder: false, baseLayerPicker: false, timeline: false, animation: false, sceneModePicker: false,
      navigationHelpButton: false, homeButton: false, fullscreenButton: false, vrButton: false, infoBox: false,
      selectionIndicator: false, projectionPicker: false, skyBox: false,
      contextOptions: { webgl: { alpha: true } }, requestRenderMode: true,
    });
    const scene = f.viewers[0]?.scene;
    expect(scene?.backgroundColor).toBe("transparente");
    expect(scene?.screenSpaceCameraController.enableInputs).toBe(false);
  });

  it("amanecer sutil: luz solar a una hora fija, atmósfera iluminada por el Sol y sin Sol ni Luna dibujados", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);
    const viewer = f.viewers[0];

    expect(viewer?.clock.currentTime).toEqual({ iso: SUNRISE_TIME_ISO });
    expect(viewer?.clock.shouldAnimate).toBe(false);
    expect(viewer?.scene.globe).toMatchObject({ enableLighting: true, dynamicAtmosphereLighting: true, dynamicAtmosphereLightingFromSun: true });
    expect(viewer?.scene.sun.show).toBe(false);
    expect(viewer?.scene.moon.show).toBe(false);
  });

  it("entra viendo la Tierra entera con Bolivia al frente", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);
    expect(lastPose(f)).toEqual({
      point: [KEYFRAMES.earth.longitude, KEYFRAMES.earth.latitude],
      hpr: { heading: KEYFRAMES.earth.heading, pitch: KEYFRAMES.earth.pitch, range: KEYFRAMES.earth.range },
    });
  });

  it("el scroll mueve la cámara con suavidad hasta la vista de la sección y luego deja de dibujar (RF-25)", () => {
    const f = fakeCesium();
    const progress = createProgressStore();
    render(<GlobeView {...props(f, { progress })} />);

    progress.set(2);
    flush();
    const first = lastPose(f).hpr.range;
    expect(first).toBeLessThan(KEYFRAMES.earth.range);
    expect(first).toBeGreaterThan(KEYFRAMES.bolivia.range); // no salta: se acerca poco a poco

    flush(400);
    expect(lastPose(f).hpr.range).toBe(KEYFRAMES.bolivia.range);
    expect(frames.size).toBe(0); // llegó: el bucle se detuvo
  });

  it("con movimiento reducido salta a la vista de la sección activa, sin interpolar (RNF-12)", () => {
    const f = fakeCesium();
    const progress = createProgressStore();
    render(<GlobeView {...props(f, { progress, reducedMotion: true })} />);

    progress.set(1.4);
    flush();
    expect(lastPose(f).hpr.range).toBe(KEYFRAMES.southAmerica.range);
    expect(frames.size).toBe(0);
  });

  it("pone los marcadores de Bolivia y de la estación y los traduce con la interfaz (RNF-03)", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);
    const [bolivia, station] = f.entities as Array<{ id: string; label: { text: unknown } }>;
    expect(bolivia?.id).toBe("bolivia");
    expect(station?.id).toBe("station");

    rerender(<GlobeView {...props(f, { markerLabels: { bolivia: "Bolivia (en)", station: "Station (en)" } })} />);
    expect(bolivia?.label.text).toMatchObject({ value: "Bolivia (en)" });
    expect(station?.label.text).toMatchObject({ value: "Station (en)" });
  });

  it("un clic en un marcador lleva a su sección; en otro lugar o sobre un panel, no", () => {
    const f = fakeCesium();
    const onSelectSection = vi.fn();
    const { getByRole } = render(
      <>
        <div data-globe-overlay=""><button type="button">Bolivia</button></div>
        <GlobeView {...props(f, { onSelectSection })} />
      </>,
    );

    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectSection).not.toHaveBeenCalled();

    f.pick.mockReturnValue({ id: f.entities[0] });
    fireEvent.click(getByRole("button", { name: "Bolivia" }));
    expect(onSelectSection).not.toHaveBeenCalled();

    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectSection).toHaveBeenLastCalledWith("bolivia");
    expect(f.pick).toHaveBeenLastCalledWith({ x: 40, y: 40 });

    f.pick.mockReturnValue({ id: f.entities[1] });
    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectSection).toHaveBeenLastCalledWith("station");
  });

  it("al salir del explorador destruye el visor y deja de escuchar el scroll y los clics", () => {
    const f = fakeCesium();
    const progress = createProgressStore();
    const onSelectSection = vi.fn();
    const { unmount } = render(<GlobeView {...props(f, { progress, onSelectSection })} />);
    unmount();

    expect(f.destroy).toHaveBeenCalledTimes(1);
    progress.set(3);
    expect(frames.size).toBe(0);
    f.pick.mockReturnValue({ id: f.entities[0] });
    fireEvent.click(document.body);
    expect(onSelectSection).not.toHaveBeenCalled();
    expect(document.getElementById("cesiumContainer")).toBeNull();
  });

  it("recalcula el tamaño del lienzo al montar y al cambiar la ventana", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);
    expect(f.resize).toHaveBeenCalledTimes(1);
    fireEvent(window, new Event("resize"));
    expect(f.resize).toHaveBeenCalledTimes(2);
  });

  it("es un fondo montado al principio de <body>, antes que la aplicación, con nombre accesible", () => {
    const f = fakeCesium();
    const { getByRole } = render(<GlobeView {...props(f, { label: "Globo 3D de Bolivia" })} />);
    const globe = getByRole("region", { name: "Globo 3D de Bolivia" });
    expect(document.body.firstElementChild).toBe(globe.parentElement);
  });

  it("si el visor no se puede crear avisa para usar el respaldo textual (RF-30)", () => {
    const f = fakeCesium({ failViewer: true });
    const onError = vi.fn();
    render(<GlobeView {...props(f, { onError })} />);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
