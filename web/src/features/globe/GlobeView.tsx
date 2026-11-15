// #115 (RF-02, RF-25, RF-28, RF-30, DP-07, RNF-06, RNF-11, RNF-12): globo 3D con CesiumJS como fondo fijo y
// transparente del explorador. Recibe el módulo ya cargado de forma diferida (la portada no lo descarga, RNF-01).
// Con ion: World Terrain (asset 1) e imágenes Bing (asset 2); sin ion: NaturalEarthII incluida en CesiumJS.
// - Fondo: el contenedor no recibe eventos (no bloquea el desplazamiento); el clic en el marcador «Bolivia» se
//   detecta desde el documento, salvo sobre contenido interactivo o el panel ([data-globe-overlay]).
// - Entrada desde la Tierra entera (decisión de Joaco, 14 nov 2026; RF-02 pide iniciar con Bolivia encuadrada, se
//   avisa al equipo). El vuelo respeta el movimiento reducido (RNF-12).
// - Sin cielo ni Sol ni Luna, atmósfera en tonos fríos y sin iluminación solar: el planeta flota sobre el fondo
//   estrellado de la página. Las imágenes de satélite no se recolorean: son datos.
// - Los créditos de los proveedores los muestra el propio visor y siguen siendo clicables (RNF-11).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { BOLIVIA_CENTER, BOLIVIA_RECTANGLE, EARTH_VIEW, FLIGHT_SECONDS, type GlobeConfig, type GlobeFlight, type GlobeTarget } from "./globeConfig";
import "./globe.css";

export type CesiumModule = typeof import("cesium");
type Viewer = InstanceType<CesiumModule["Viewer"]>;
type Entity = InstanceType<CesiumModule["Entity"]>;

type GlobeViewProps = {
  cesium: CesiumModule;
  config: GlobeConfig;
  label: string;
  /** Texto del marcador de Bolivia en el idioma activo (RNF-03). */
  boliviaLabel: string;
  flight: GlobeFlight;
  reducedMotion: boolean;
  onSelectBolivia: () => void;
  onReady: () => void;
  onError: () => void;
};

/** Contenido que tapa al globo: un clic ahí nunca se interpreta como clic en el globo. */
const OVERLAY_SELECTOR = "a, button, input, select, textarea, label, summary, [role='button'], [data-globe-overlay], .topbar";

/** Color de un token de diseño (§20.2): los colores no se escriben a mano en los componentes. */
function tokenColor(C: CesiumModule, element: Element, token: string, fallback: InstanceType<CesiumModule["Color"]>) {
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  return (value && C.Color.fromCssColorString(value)) || fallback;
}

function destinationFor(C: CesiumModule, target: GlobeTarget) {
  return target === "bolivia"
    ? C.Rectangle.fromDegrees(...BOLIVIA_RECTANGLE)
    : C.Cartesian3.fromDegrees(EARTH_VIEW.longitude, EARTH_VIEW.latitude, EARTH_VIEW.height);
}

/** Atmósfera fría y sin efectos cálidos (Sol, Luna, atardecer en el terminador). */
function applyColdLook(C: CesiumModule, viewer: Viewer, element: Element) {
  const scene = viewer.scene;
  scene.backgroundColor = C.Color.TRANSPARENT;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.hueShift = 0.02;
    scene.skyAtmosphere.saturationShift = -0.2;
    scene.skyAtmosphere.brightnessShift = 0.15;
  }
  scene.globe.enableLighting = false;
  scene.globe.dynamicAtmosphereLighting = false;
  scene.globe.baseColor = tokenColor(C, element, "--paleta-azul-electrico", C.Color.BLUE); // visible mientras llegan las imágenes
}

export function GlobeView(props: GlobeViewProps) {
  const { cesium, config, label, boliviaLabel, flight, reducedMotion } = props;
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | undefined>(undefined);
  const markerRef = useRef<Entity | undefined>(undefined);
  const handledSeq = useRef<number | null>(null);
  // Lo que el visor necesita leer sin recrearse: callbacks, vuelo inicial y texto del marcador.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // El fondo vive en un nodo al PRINCIPIO de <body>: así ningún ancestro con transform (la animación de entrada de
  // <main>) lo desplaza, y todo lo que viene después en el documento (cabecera y contenido) se pinta por encima.
  const [host] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    document.body.prepend(host);
    return () => host.remove();
  }, [host]);

  const mode = config.mode;
  const token = config.mode === "ion" ? config.publicToken : "";

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let viewer: Viewer | undefined;
    const cleanups: Array<() => void> = [];

    try {
      const C = cesium;
      let terrain: InstanceType<CesiumModule["Terrain"]> | undefined;
      let baseLayer: ReturnType<CesiumModule["ImageryLayer"]["fromProviderAsync"]>;

      if (config.mode === "ion" && token) {
        C.Ion.defaultAccessToken = token; // token público restringido (DP-07); nunca se registra ni se muestra
        baseLayer = C.ImageryLayer.fromProviderAsync(C.IonImageryProvider.fromAssetId(config.imageryAssetId));
        terrain = new C.Terrain(C.CesiumTerrainProvider.fromIonAssetId(config.terrainAssetId));
      } else {
        baseLayer = C.ImageryLayer.fromProviderAsync(
          C.TileMapServiceImageryProvider.fromUrl(C.buildModuleUrl("Assets/Textures/NaturalEarthII")),
        );
      }

      viewer = new C.Viewer(element, {
        baseLayer,
        ...(terrain ? { terrain } : {}),
        geocoder: false,
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        homeButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        skyBox: false,
        contextOptions: { webgl: { alpha: true } },
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });
      const v = viewer;
      applyColdLook(C, v, element);

      // Vista inicial sin animación: la del pedido vigente (la Tierra entera al entrar).
      const initial = latest.current.flight;
      v.camera.setView({ destination: destinationFor(C, initial.target) });
      handledSeq.current = initial.seq;

      const marker = v.entities.add({
        id: "bolivia",
        position: C.Cartesian3.fromDegrees(BOLIVIA_CENTER[0], BOLIVIA_CENTER[1]),
        point: {
          pixelSize: 14,
          color: tokenColor(C, element, "--color-acento", C.Color.WHITE),
          outlineColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
          outlineWidth: 2,
          heightReference: C.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: latest.current.boliviaLabel,
          font: "600 18px system-ui, sans-serif",
          fillColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
          outlineColor: tokenColor(C, element, "--paleta-negro-azulado", C.Color.BLACK),
          outlineWidth: 4,
          style: C.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new C.Cartesian2(0, -26),
          heightReference: C.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      markerRef.current = marker;

      // El contenedor no recibe eventos (fondo): el clic y el puntero se leen del documento (RF-25).
      const isMarkerAt = (event: MouseEvent) => {
        const target = event.target;
        if (target instanceof Element && target.closest(OVERLAY_SELECTOR)) return false;
        const rect = v.canvas.getBoundingClientRect();
        const picked: unknown = v.scene.pick(new C.Cartesian2(event.clientX - rect.left, event.clientY - rect.top));
        return typeof picked === "object" && picked !== null && (picked as { id?: unknown }).id === marker;
      };
      const onClick = (event: MouseEvent) => {
        if (isMarkerAt(event)) latest.current.onSelectBolivia();
      };
      let frame = 0;
      const onMove = (event: MouseEvent) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          document.documentElement.classList.toggle("globe-pointer", isMarkerAt(event));
        });
      };
      document.addEventListener("click", onClick);
      document.addEventListener("mousemove", onMove);
      cleanups.push(() => {
        document.removeEventListener("click", onClick);
        document.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(frame);
        document.documentElement.classList.remove("globe-pointer");
      });

      // El lienzo recalcula su tamaño al montar, al cambiar la ventana y al cambiar el contenedor.
      const resize = () => {
        v.resize();
        v.scene.requestRender();
      };
      resize();
      window.addEventListener("resize", resize);
      cleanups.push(() => window.removeEventListener("resize", resize));
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        cleanups.push(() => observer.disconnect());
      }

      viewerRef.current = v;
      latest.current.onReady();
    } catch {
      latest.current.onError();
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      viewerRef.current = undefined;
      markerRef.current = undefined;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
    // El visor solo se recrea si cambia el módulo, el modo o el token (no en cada render). Los assets de ion son fijos
    // (1 y 2, DP-07), así que `config` no hace falta como dependencia.
  }, [cesium, mode, token]);

  // Vuelo pedido (RF-25): solo cuando llega un pedido nuevo; con movimiento reducido es instantáneo (RNF-12).
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || handledSeq.current === flight.seq) return;
    handledSeq.current = flight.seq;
    const destination = destinationFor(cesium, flight.target);
    viewer.camera.cancelFlight();
    if (reducedMotion) viewer.camera.setView({ destination });
    else viewer.camera.flyTo({ destination, duration: FLIGHT_SECONDS });
    viewer.scene.requestRender();
  }, [cesium, flight, reducedMotion]);

  // El marcador cambia de idioma con la interfaz (RNF-03).
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker?.label) return;
    marker.label.text = new cesium.ConstantProperty(boliviaLabel);
    viewerRef.current?.scene.requestRender();
  }, [cesium, boliviaLabel]);

  return createPortal(
    <div ref={container} id="cesiumContainer" className="globe-view" role="region" aria-label={label} />,
    host,
  );
}
