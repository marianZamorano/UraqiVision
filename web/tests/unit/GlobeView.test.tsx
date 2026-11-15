// #115 (RF-02, RF-25, RF-30, DP-07, RNF-06, RNF-12): el visor del globo con un doble de CesiumJS (jsdom no tiene WebGL).
import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { GlobeView, type CesiumModule } from "../../src/features/globe/GlobeView";
import { EARTH_VIEW, FLIGHT_SECONDS, type GlobeFlight } from "../../src/features/globe/globeConfig";

type Handler = (event: Record<string, unknown>) => void;

function fakeCesium(options: { failViewer?: boolean } = {}) {
  const destroy = vi.fn();
  const setView = vi.fn();
  const flyTo = vi.fn();
  const cancelFlight = vi.fn();
  const requestRender = vi.fn();
  const resize = vi.fn();
  const scenes: Array<Record<string, unknown>> = [];
  const pick = vi.fn<(position: unknown) => unknown>(() => undefined);
  const actions = new Map<string, Handler>();
  const entities: Array<Record<string, unknown>> = [];
  const viewerOptions: unknown[] = [];
  const cesium = {
    Ion: { defaultAccessToken: "sin-cambiar" },
    Viewer: vi.fn(function (this: Record<string, unknown>, _el: Element, opts: unknown) {
      if (options.failViewer) throw new Error("WebGL no disponible");
      viewerOptions.push(opts);
      this.camera = { setView, flyTo, cancelFlight };
      this.scene = {
        pick, requestRender,
        sun: { show: true }, moon: { show: true },
        skyAtmosphere: { hueShift: 0, saturationShift: 0, brightnessShift: 0 },
        globe: { enableLighting: true, dynamicAtmosphereLighting: true, baseColor: "azul" },
      };
      scenes.push(this.scene as Record<string, unknown>);
      this.resize = resize;
      this.canvas = { getBoundingClientRect: () => ({ left: 10, top: 20 }) };
      this.entities = {
        add: vi.fn((entity: Record<string, unknown>) => {
          entities.push(entity);
          return entity;
        }),
      };
      this.screenSpaceEventHandler = {
        setInputAction: vi.fn((fn: Handler, type: string) => actions.set(type, fn)),
        removeInputAction: vi.fn((type: string) => actions.delete(type)),
      };
      this.destroy = destroy;
      this.isDestroyed = () => false;
    }),
    ImageryLayer: { fromProviderAsync: vi.fn((provider: unknown) => ({ provider })) },
    IonImageryProvider: { fromAssetId: vi.fn(async (id: number) => ({ ionImagery: id })) },
    TileMapServiceImageryProvider: { fromUrl: vi.fn(async (url: string) => ({ tms: url })) },
    buildModuleUrl: vi.fn((path: string) => `/cesium/${path}`),
    CesiumTerrainProvider: { fromIonAssetId: vi.fn(async (id: number) => ({ ionTerrain: id })) },
    Terrain: vi.fn(function (this: Record<string, unknown>, promise: unknown) {
      this.promise = promise;
    }),
    Rectangle: { fromDegrees: vi.fn((...degrees: number[]) => ({ rectangle: degrees })) },
    Cartesian3: { fromDegrees: vi.fn((...degrees: number[]) => ({ point: degrees })) },
    Cartesian2: vi.fn(function (this: Record<string, unknown>, x: number, y: number) {
      this.x = x;
      this.y = y;
    }),
    Color: { WHITE: "blanco", BLACK: "negro", BLUE: "azul", TRANSPARENT: "transparente", fromCssColorString: vi.fn((css: string) => css) },
    ConstantProperty: vi.fn(function (this: Record<string, unknown>, value: unknown) {
      this.value = value;
    }),
    LabelStyle: { FILL_AND_OUTLINE: "relleno-y-borde" },
    HeightReference: { CLAMP_TO_GROUND: "pegado-al-suelo" },
    ScreenSpaceEventType: { LEFT_CLICK: "clic", LEFT_DOUBLE_CLICK: "doble-clic", MOUSE_MOVE: "mover" },
  };
  return {
    cesium: cesium as unknown as CesiumModule,
    raw: cesium,
    destroy, setView, flyTo, cancelFlight, pick, actions, entities, viewerOptions, resize, scenes,
  };
}

type Fake = ReturnType<typeof fakeCesium>;
const earth: GlobeFlight = { target: "earth", seq: 0 };

function props(f: Fake, overrides: Partial<ComponentProps<typeof GlobeView>> = {}): ComponentProps<typeof GlobeView> {
  return {
    cesium: f.cesium,
    config: { mode: "no-ion" },
    label: "Globo",
    boliviaLabel: "Bolivia",
    flight: earth,
    reducedMotion: false,
    onSelectBolivia: vi.fn(),
    onReady: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

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
    expect(f.raw.CesiumTerrainProvider.fromIonAssetId).not.toHaveBeenCalled();
    expect(f.raw.TileMapServiceImageryProvider.fromUrl).toHaveBeenCalledWith("/cesium/Assets/Textures/NaturalEarthII");
  });

  it("crea un visor sencillo y entra viendo la Tierra entera, sin animación", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);

    expect(f.viewerOptions[0]).toMatchObject({
      geocoder: false, baseLayerPicker: false, timeline: false, animation: false,
      sceneModePicker: false, navigationHelpButton: false, infoBox: false, selectionIndicator: false,
      requestRenderMode: true,
    });
    expect(f.setView).toHaveBeenCalledTimes(1);
    expect(f.setView.mock.calls[0]?.[0]).toEqual({ destination: { point: [EARTH_VIEW.longitude, EARTH_VIEW.latitude, EARTH_VIEW.height] } });
    expect(f.flyTo).not.toHaveBeenCalled();
  });

  it("pone un marcador «Bolivia» en el globo y lo traduce con la interfaz (RNF-03)", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);

    const marker = f.entities[0] as { id: string; label: { text: unknown } };
    expect(marker.id).toBe("bolivia");
    expect(marker.label.text).toMatchObject({ value: "Bolivia" });

    rerender(<GlobeView {...props(f, { boliviaLabel: "Bolivia (en)" })} />);
    expect(marker.label.text).toMatchObject({ value: "Bolivia (en)" });
  });

  it("un clic en la página sobre el marcador pide ir a Bolivia; en otro lugar o sobre el panel, no (RF-25)", () => {
    const f = fakeCesium();
    const onSelectBolivia = vi.fn();
    const { getByRole } = render(
      <>
        <div data-globe-overlay=""><button type="button">Ir a Bolivia</button></div>
        <GlobeView {...props(f, { onSelectBolivia })} />
      </>,
    );

    f.pick.mockReturnValue(undefined);
    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectBolivia).not.toHaveBeenCalled();

    f.pick.mockReturnValue({ id: f.entities[0] });
    fireEvent.click(getByRole("button", { name: "Ir a Bolivia" }));
    expect(onSelectBolivia).not.toHaveBeenCalled();

    fireEvent.click(document.body, { clientX: 50, clientY: 60 });
    expect(onSelectBolivia).toHaveBeenCalledTimes(1);
    // Coordenadas del documento convertidas a las del lienzo.
    expect(f.pick).toHaveBeenLastCalledWith({ x: 40, y: 40 });
  });

  it("deja de escuchar los clics al salir del explorador", () => {
    const f = fakeCesium();
    const onSelectBolivia = vi.fn();
    const { unmount } = render(<GlobeView {...props(f, { onSelectBolivia })} />);
    unmount();
    f.pick.mockReturnValue({ id: f.entities[0] });
    fireEvent.click(document.body);
    expect(onSelectBolivia).not.toHaveBeenCalled();
  });

  it("fondo transparente, sin cielo, Sol ni Luna, atmósfera fría y sin iluminación solar", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);

    expect(f.viewerOptions[0]).toMatchObject({
      skyBox: false, homeButton: false, fullscreenButton: false, contextOptions: { webgl: { alpha: true } },
    });
    const scene = f.scenes[0] as {
      backgroundColor: unknown; sun: { show: boolean }; moon: { show: boolean };
      globe: { enableLighting: boolean; dynamicAtmosphereLighting: boolean };
      skyAtmosphere: { saturationShift: number; brightnessShift: number };
    };
    expect(scene.backgroundColor).toBe("transparente");
    expect(scene.sun.show).toBe(false);
    expect(scene.moon.show).toBe(false);
    expect(scene.globe.enableLighting).toBe(false);
    expect(scene.globe.dynamicAtmosphereLighting).toBe(false);
    expect(scene.skyAtmosphere.saturationShift).toBeLessThan(0);
    expect(scene.skyAtmosphere.brightnessShift).toBeGreaterThan(0);
  });

  it("recalcula el tamaño del lienzo al montar y al cambiar la ventana", () => {
    const f = fakeCesium();
    render(<GlobeView {...props(f)} />);
    expect(f.resize).toHaveBeenCalledTimes(1);
    fireEvent(window, new Event("resize"));
    expect(f.resize).toHaveBeenCalledTimes(2);
  });

  it("el globo es un fondo montado al principio de <body>, antes que la aplicación, y se retira al salir", () => {
    const f = fakeCesium();
    const { unmount } = render(<GlobeView {...props(f)} />);
    const globe = document.getElementById("cesiumContainer");
    expect(globe?.parentElement?.parentElement).toBe(document.body);
    expect(document.body.firstElementChild).toBe(globe?.parentElement);
    unmount();
    expect(document.getElementById("cesiumContainer")).toBeNull();
  });

  it("cada pedido de vuelo lleva la cámara a Bolivia con animación", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f)} />);

    rerender(<GlobeView {...props(f, { flight: { target: "bolivia", seq: 1 } })} />);
    expect(f.flyTo).toHaveBeenCalledWith({ destination: { rectangle: [-69.7, -22.95, -57.4, -9.6] }, duration: FLIGHT_SECONDS });

    // «Volver a Bolivia»: mismo destino, pedido nuevo.
    rerender(<GlobeView {...props(f, { flight: { target: "bolivia", seq: 2 } })} />);
    expect(f.flyTo).toHaveBeenCalledTimes(2);
    // Un render sin pedido nuevo no vuelve a volar.
    rerender(<GlobeView {...props(f, { flight: { target: "bolivia", seq: 2 }, label: "Otro" })} />);
    expect(f.flyTo).toHaveBeenCalledTimes(2);
  });

  it("con movimiento reducido el cambio es instantáneo (RNF-12)", () => {
    const f = fakeCesium();
    const { rerender } = render(<GlobeView {...props(f, { reducedMotion: true })} />);

    rerender(<GlobeView {...props(f, { reducedMotion: true, flight: { target: "bolivia", seq: 1 } })} />);
    expect(f.flyTo).not.toHaveBeenCalled();
    expect(f.setView).toHaveBeenLastCalledWith({ destination: { rectangle: [-69.7, -22.95, -57.4, -9.6] } });
  });

  it("destruye el visor al salir del explorador", () => {
    const f = fakeCesium();
    const { unmount } = render(<GlobeView {...props(f)} />);
    unmount();
    expect(f.destroy).toHaveBeenCalledTimes(1);
  });

  it("si el visor no se puede crear avisa para usar el respaldo textual (RF-30)", () => {
    const f = fakeCesium({ failViewer: true });
    const onError = vi.fn();
    render(<GlobeView {...props(f, { onError })} />);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("el contenedor del globo tiene un nombre accesible", () => {
    const f = fakeCesium();
    const { getByRole } = render(<GlobeView {...props(f, { label: "Globo 3D de Bolivia" })} />);
    expect(getByRole("region", { name: "Globo 3D de Bolivia" })).toBeInTheDocument();
  });
});
