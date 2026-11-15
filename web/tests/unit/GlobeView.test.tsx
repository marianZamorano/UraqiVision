// #115, #121, #123 (RF-02, RF-25, RF-29, RF-30, DP-07, RNF-06, RNF-11, RNF-12): el visor del globo con un doble de CesiumJS
// (jsdom no tiene WebGL) y fotogramas controlados a mano.
import { fireEvent, render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GlobeView, type CesiumModule } from "../../src/features/globe/GlobeView";
import { KEYFRAMES, zonePose } from "../../src/features/globe/cameraPath";
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
  // Contorno de Bolivia (public/data/bolivia-contorno.geojson): un cuadrado basta para el doble.
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[-60, -16], [-59, -16], [-59, -15], [-60, -16]]] } }],
  }))));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeCesium(options: { failViewer?: boolean } = {}) {
  const destroy = vi.fn();
  const poses: Pose[] = [];
  const moveLeft = vi.fn();
  const moveDown = vi.fn();
  const lookAt = vi.fn((point: { point: number[] }, hpr: Pose["hpr"]) => {
    poses.push({ point: point.point, hpr: { heading: hpr.heading, pitch: hpr.pitch, range: hpr.range } });
  });
  const requestRender = vi.fn();
  const resize = vi.fn();
  const pick = vi.fn<(position: unknown) => unknown>(() => undefined);
  const entities: Array<Record<string, unknown>> = [];
  const removed: Array<Record<string, unknown>> = [];
  const credits: unknown[] = [];
  const layers: Array<Record<string, unknown>> = [];
  const removedLayers: unknown[] = [];
  const viewerOptions: unknown[] = [];
  const viewers: FakeViewer[] = [];
  const cesium = {
    Ion: { defaultAccessToken: "sin-cambiar" },
    Viewer: vi.fn(function (this: Record<string, unknown>, _el: Element, opts: unknown) {
      if (options.failViewer) throw new Error("WebGL no disponible");
      viewerOptions.push(opts);
      this.camera = { lookAt, lookAtTransform: vi.fn(), moveLeft, moveDown, frustum: { fov: Math.PI / 3 } };
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
        remove: vi.fn((e: Record<string, unknown>) => removed.push(e)),
      };
      this.creditDisplay = { addStaticCredit: vi.fn((c: unknown) => credits.push(c)) };
      this.imageryLayers = {
        add: vi.fn((layer: Record<string, unknown>) => layers.push(layer)),
        remove: vi.fn((layer: unknown) => removedLayers.push(layer)),
      };
      this.resize = resize;
      this.canvas = { getBoundingClientRect: () => ({ left: 10, top: 20 }), clientWidth: 1440, clientHeight: 900 };
      this.destroy = destroy;
      this.isDestroyed = () => false;
      viewers.push(this as unknown as FakeViewer);
    }),
    ImageryLayer: {
      fromProviderAsync: vi.fn((provider: unknown, options?: { alpha?: number }) => ({
        provider,
        alpha: options?.alpha,
        readyEvent: { addEventListener: vi.fn() },
        errorEvent: { addEventListener: vi.fn() },
      })),
    },
    SingleTileImageryProvider: { fromUrl: vi.fn(async (url: string, options: unknown) => ({ single: url, options })) },
    Rectangle: { fromDegrees: vi.fn((...degrees: number[]) => ({ rectangle: degrees })) },
    IonImageryProvider: { fromAssetId: vi.fn(async (id: number) => ({ ionImagery: id })) },
    TileMapServiceImageryProvider: { fromUrl: vi.fn(async (url: string) => ({ tms: url })) },
    buildModuleUrl: vi.fn((path: string) => `/cesium/${path}`),
    CesiumTerrainProvider: { fromIonAssetId: vi.fn(async (id: number) => ({ ionTerrain: id })) },
    Terrain: vi.fn(function (this: Record<string, unknown>, promise: unknown) {
      this.promise = promise;
    }),
    Cartesian3: {
      fromDegrees: vi.fn((...degrees: number[]) => ({ point: degrees })),
      fromDegreesArray: vi.fn((flat: number[]) => ({ line: flat })),
    },
    Credit: vi.fn(function (this: Record<string, unknown>, html: string) {
      this.html = html;
    }),
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
  return { cesium: cesium as unknown as CesiumModule, raw: cesium, destroy, poses, pick, entities, removed, credits, layers, removedLayers, viewerOptions, viewers, resize, moveLeft, moveDown };
}

type Fake = ReturnType<typeof fakeCesium>;

function props(f: Fake, overrides: Partial<ComponentProps<typeof GlobeView>> = {}): ComponentProps<typeof GlobeView> {
  return {
    cesium: f.cesium,
    config: { mode: "no-ion" },
    label: "Globo",
    boliviaLabel: "Bolivia",
    zones: [],
    framing: { left: 0, right: 0, top: 0, bottom: 0 },
    progress: createProgressStore(),
    reducedMotion: false,
    onSelectSection: vi.fn(),
    onSelectZone: vi.fn(),
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

  it("centra la escena en la parte libre: a la derecha del panel en escritorio y encima en celular (#123)", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);
    expect(f.moveLeft).not.toHaveBeenCalled();
    expect(f.moveDown).not.toHaveBeenCalled();

    rerender(<GlobeView {...props(f, { framing: { left: 600, right: 0, top: 0, bottom: 0 } })} />);
    flush();
    expect(f.moveLeft).toHaveBeenCalled();
    expect(f.moveLeft.mock.calls.at(-1)?.[0]).toBeGreaterThan(0);

    rerender(<GlobeView {...props(f, { framing: { left: 0, right: 0, top: 0, bottom: 400 } })} />);
    flush();
    expect(f.moveDown).toHaveBeenCalled();
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

  it("pone el marcador de Bolivia y lo traduce con la interfaz (RNF-03)", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);
    const bolivia = f.entities[0] as { id: string; label: { text: unknown } };
    expect(bolivia.id).toBe("bolivia");

    rerender(<GlobeView {...props(f, { boliviaLabel: "Bolivia (en)" })} />);
    expect(bolivia.label.text).toMatchObject({ value: "Bolivia (en)" });
  });

  it("pone un punto por zona, visible solo al acercarse, con etiquetas alternadas para no taparse (#123)", () => {
    const f = fakeCesium();
    const zones = [
      { id: "sanignacio", label: "San Ignacio de Velasco", longitude: -60.81, latitude: -15.92 },
      { id: "chiquitania-oeste", label: "Chiquitanía oeste", longitude: -61.8, latitude: -15.75 },
    ];
    render(<GlobeView {...props(f, { zones })} />);

    type Punto = { id: string; show: boolean; label: { text: string; pixelOffset: { y: number } } };
    const puntos = f.entities.filter((e) => String(e.id).startsWith("zona-")) as unknown as Punto[];
    expect(puntos.map((p) => p.id)).toEqual(["zona-chiquitania-oeste", "zona-sanignacio"]); // ordenadas por longitud
    expect(puntos.map((p) => p.label.text)).toEqual(["Chiquitanía oeste", "San Ignacio de Velasco"]);
    expect(puntos[0]?.label.pixelOffset.y).toBeLessThan(0);
    expect(puntos[1]?.label.pixelOffset.y).toBeGreaterThan(0);
    // Antes de llegar a Bolivia se ve su marcador y no las zonas.
    const bolivia = f.entities[0] as unknown as Punto;
    expect(bolivia.show).toBe(true);
    expect(puntos.every((p) => !p.show)).toBe(true);
  });

  it("al llegar a Bolivia las zonas relevan al marcador de Bolivia, y al volver se invierte (#125)", () => {
    const f = fakeCesium();
    const progress = createProgressStore();
    const zones = [{ id: "beni-norte", label: "Beni norte", longitude: -65.57, latitude: -11.99 }];
    render(<GlobeView {...props(f, { progress, zones })} />);
    const bolivia = f.entities[0] as { show: boolean };
    const punto = f.entities.find((e) => e.id === "zona-beni-norte") as { show: boolean };

    progress.set(2);
    expect(bolivia.show).toBe(false);
    expect(punto.show).toBe(true);

    progress.set(0.4);
    expect(bolivia.show).toBe(true);
    expect(punto.show).toBe(false);
  });

  it("las zonas que llegan después (o cambian de idioma) reemplazan los puntos anteriores", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);
    const zona = { id: "beni-norte", label: "Beni norte", longitude: -65.57, latitude: -11.99 };

    rerender(<GlobeView {...props(f, { zones: [zona] })} />);
    const primero = f.entities.find((e) => e.id === "zona-beni-norte");
    rerender(<GlobeView {...props(f, { zones: [{ ...zona, label: "North Beni" }] })} />);

    expect(f.removed).toContain(primero);
    expect((f.entities[f.entities.length - 1] as { label: { text: string } }).label.text).toBe("North Beni");
  });

  it("el clic en Bolivia lleva a su sección y en el punto de una zona abre la estación; sobre un panel, nada", () => {
    const f = fakeCesium();
    const onSelectSection = vi.fn();
    const onSelectZone = vi.fn();
    const zones = [{ id: "beni-norte", label: "Beni norte", longitude: -65.57, latitude: -11.99 }];
    const { getByRole } = render(
      <>
        <div data-globe-overlay=""><button type="button">Bolivia</button></div>
        <GlobeView {...props(f, { onSelectSection, onSelectZone, zones })} />
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

    f.pick.mockReturnValue({ id: f.entities.find((e) => e.id === "zona-beni-norte") });
    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectZone).toHaveBeenCalledWith("beni-norte");
  });

  it("dibuja el contorno de Bolivia pegado al relieve y muestra su crédito (RNF-11)", async () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);

    await waitFor(() => expect(f.credits).toHaveLength(1));
    const linea = f.entities.find((e) => "polyline" in e) as { polyline: { clampToGround: boolean; positions: unknown } };
    expect(linea.polyline.clampToGround).toBe(true);
    expect(linea.polyline.positions).toEqual({ line: [-60, -16, -59, -16, -59, -15, -60, -16] });
    expect(f.credits[0]).toMatchObject({ html: "geoBoundaries · GeoBolivia" });
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

  // RF-25, RF-08: zona abierta en el explorador.
  const beniNorte = { id: "beni-norte", longitude: -65.565, latitude: -11.985, range: 160_000 };
  const zonas = [
    { id: "beni-norte", label: "Beni norte", longitude: -65.565, latitude: -11.985 },
    { id: "sanignacio", label: "San Ignacio de Velasco", longitude: -60.81, latitude: -15.92 },
  ];
  const capa = {
    url: "http://backend/estaciones/beni-norte/views/20261018_cambio.webp",
    rectangle: [-65.805, -12.224, -65.326, -11.746] as const,
    opacity: 0.85,
    outline: [[-65.8, -11.746], [-65.326, -11.75], [-65.33, -12.224], [-65.805, -12.22]] as const,
  };

  it("al abrir una zona la cámara vuela hasta ella y se queda ahí aunque cambie el scroll (RF-25)", () => {
    const f = fakeCesium();
    const progress = createProgressStore(2);
    const { rerender } = render(<GlobeView {...props(f, { progress, zones: zonas })} />);
    flush(400);
    expect(lastPose(f).hpr.range).toBe(KEYFRAMES.bolivia.range);

    rerender(<GlobeView {...props(f, { progress, zones: zonas, focus: beniNorte })} />);
    flush(3);
    const enVuelo = lastPose(f).hpr.range;
    expect(enVuelo).toBeLessThan(KEYFRAMES.bolivia.range); // ya salió…
    expect(enVuelo).toBeGreaterThan(beniNorte.range); // …y todavía no llegó

    flush(400);
    const destino = zonePose(beniNorte);
    expect(lastPose(f)).toEqual({
      point: [destino.longitude, destino.latitude],
      hpr: { heading: destino.heading, pitch: destino.pitch, range: destino.range },
    });
    expect(frames.size).toBe(0);

    progress.set(1.2); // el scroll ya no manda mientras la zona esté abierta
    flush(400);
    expect(lastPose(f).hpr.range).toBe(beniNorte.range);
  });

  it("al cerrar la zona vuelve a la vista del recorrido; con movimiento reducido, sin vuelo (RNF-12)", () => {
    const f = fakeCesium();
    const progress = createProgressStore(2);
    const { rerender } = render(<GlobeView {...props(f, { progress, focus: beniNorte })} />);
    expect(lastPose(f).hpr.range).toBe(beniNorte.range); // enlace directo: empieza en la zona

    rerender(<GlobeView {...props(f, { progress, focus: null })} />);
    flush(400);
    expect(lastPose(f).hpr.range).toBe(KEYFRAMES.bolivia.range);

    rerender(<GlobeView {...props(f, { progress, focus: beniNorte, reducedMotion: true })} />);
    flush();
    expect(lastPose(f).hpr.range).toBe(beniNorte.range);
    expect(frames.size).toBe(0);
  });

  it("con una zona abierta se ven los puntos de las demás (para saltar entre ellas) pero no el suyo", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f, { zones: zonas })} />);
    const bolivia = f.entities[0] as { show: boolean };
    const punto = (id: string) => f.entities.find((e) => e.id === `zona-${id}`) as { show: boolean };
    expect(punto("sanignacio").show).toBe(false); // lejos de Bolivia todavía no hay puntos

    rerender(<GlobeView {...props(f, { zones: zonas, focus: beniNorte })} />);
    flush();
    expect(bolivia.show).toBe(false);
    expect(punto("sanignacio").show).toBe(true);
    expect(punto("beni-norte").show).toBe(false);
  });

  it("con una zona abierta el encuadre se desliza hasta la parte libre en lugar de saltar", () => {
    const f = fakeCesium();
    const zona = { progress: createProgressStore(2), focus: beniNorte };
    const { rerender } = render(<GlobeView {...props(f, { ...zona, framing: { left: 420, right: 300, top: 76, bottom: 0 } })} />);
    flush(400);

    // Se abre el detalle a la derecha: la escena tiene que irse a la izquierda (la cámara, a la derecha).
    rerender(<GlobeView {...props(f, { ...zona, framing: { left: 0, right: 600, top: 76, bottom: 0 } })} />);
    flush();
    const primero = f.moveLeft.mock.calls.at(-1)?.[0] as number;
    flush(400);
    const final = f.moveLeft.mock.calls.at(-1)?.[0] as number;
    expect(final).toBeLessThan(0);
    expect(primero).toBeGreaterThan(final); // el primer fotograma todavía no llegó
    expect(frames.size).toBe(0);
  });

  it("extiende la imagen de radar de la zona sobre el relieve, con el contorno de su caja (RF-08)", async () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f, { focus: beniNorte, overlay: capa })} />);

    expect(f.layers).toHaveLength(1);
    expect(f.layers[0]?.alpha).toBe(0.85);
    await expect(f.layers[0]?.provider).resolves.toEqual({
      single: capa.url,
      options: { rectangle: { rectangle: [-65.805, -12.224, -65.326, -11.746] } },
    });
    const contorno = f.entities.find((e) => (e.polyline as { clampToGround?: boolean } | undefined)?.clampToGround
      && ((e.polyline as { positions: { line: number[] } }).positions.line.length === 10)) as Record<string, unknown>;
    expect((contorno.polyline as { positions: { line: number[] } }).positions.line).toEqual(
      [-65.8, -11.746, -65.326, -11.75, -65.33, -12.224, -65.805, -12.22, -65.8, -11.746],
    );

    // Solo la opacidad: la misma capa, sin volver a pedir la imagen.
    rerender(<GlobeView {...props(f, { focus: beniNorte, overlay: { ...capa, opacity: 0.4 } })} />);
    expect(f.layers).toHaveLength(1);
    expect(f.layers[0]?.alpha).toBe(0.4);

    // Otra fecha u otra capa de la misma zona: llega la imagen nueva y el contorno se conserva. La anterior se queda
    // hasta que la nueva está lista, para que la línea de tiempo no parpadee.
    rerender(<GlobeView {...props(f, { focus: beniNorte, overlay: { ...capa, url: `${capa.url}?base` } })} />);
    expect(f.layers).toHaveLength(2);
    expect(f.removedLayers).toEqual([]);
    expect(f.removed).not.toContain(contorno);
    const lista = (f.layers[1]?.readyEvent as { addEventListener: ReturnType<typeof vi.fn> }).addEventListener.mock.calls[0]?.[0] as () => void;
    lista();
    await waitFor(() => expect(f.removedLayers).toEqual([f.layers[0]]));

    // Al cerrar la zona no queda ni la imagen ni el contorno.
    rerender(<GlobeView {...props(f, { focus: null, overlay: null })} />);
    expect(f.removedLayers).toEqual([f.layers[0], f.layers[1]]);
    expect(f.removed).toContain(contorno);
  });
});
