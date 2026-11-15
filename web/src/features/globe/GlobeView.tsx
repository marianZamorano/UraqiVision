// #115, #121 (RF-02, RF-25, RF-30, DP-07, RNF-06, RNF-11, RNF-12): globo 3D con CesiumJS como fondo fijo y
// transparente del recorrido del explorador. Recibe el módulo ya cargado de forma diferida (la portada no lo
// descarga, RNF-01). Con ion: World Terrain (asset 1) e imágenes Bing (asset 2); sin ion: NaturalEarthII.
// - Visor limpio: sin widgets ni controles de ratón. La cámara la mueven solo el scroll (cameraPath.ts, con
//   aceleración y amortiguación), la navegación por secciones y el clic en los marcadores. Con movimiento reducido
//   salta a la vista de la sección activa, sin interpolación (RNF-12).
// - Fondo: el contenedor no recibe eventos (no bloquea el desplazamiento); el clic en un marcador se detecta desde
//   el documento, salvo sobre contenido interactivo o paneles ([data-globe-overlay]).
// - Amanecer sutil: luz solar real a una hora fija (globeConfig.ts), con el brillo cálido solo en el horizonte de la
//   atmósfera; sin cielo, Sol ni Luna dibujados. Las imágenes de satélite no se recolorean: son datos.
// - Modelos glTF locales opcionales (localModels.ts). Los créditos los muestra el visor y son clicables (RNF-11).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { dampPose, poseAt, poseDistance, type CameraPose, type TourSection } from "./cameraPath";
import { BOLIVIA_CENTER, SAN_IGNACIO_CENTER, SUNRISE_TIME_ISO, type GlobeConfig } from "./globeConfig";
import { addLocalModels, ORBITAL_MODELS } from "./localModels";
import type { ProgressStore } from "./scrollProgress";
import "./globe.css";

export type CesiumModule = typeof import("cesium");
type Viewer = InstanceType<CesiumModule["Viewer"]>;
type Entity = InstanceType<CesiumModule["Entity"]>;

export type MarkerLabels = { bolivia: string; station: string };

type GlobeViewProps = {
  cesium: CesiumModule;
  config: GlobeConfig;
  label: string;
  /** Textos de los marcadores en el idioma activo (RNF-03). */
  markerLabels: MarkerLabels;
  /** Progreso del recorrido (scroll); el globo lo lee en cada fotograma. */
  progress: ProgressStore;
  reducedMotion: boolean;
  onSelectSection: (section: TourSection) => void;
  onReady: () => void;
  onError: () => void;
};

/** Contenido que tapa al globo: un clic ahí nunca se interpreta como clic en el globo. */
const OVERLAY_SELECTOR = "a, button, input, select, textarea, label, summary, [role='button'], [data-globe-overlay], .topbar";

/** Distancia de la cámara (m) a la que el marcador de Bolivia cede su lugar al de la estación. */
const MARKER_SWAP_DISTANCE = 2_800_000;

/** Cuándo la cámara ya llegó: por debajo de esto se deja de dibujar (requestRenderMode). */
const ARRIVED = 1e-4;

/** Color de un token de diseño (§20.2): los colores no se escriben a mano en los componentes. */
function tokenColor(C: CesiumModule, element: Element, token: string, fallback: InstanceType<CesiumModule["Color"]>) {
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  return (value && C.Color.fromCssColorString(value)) || fallback;
}

/** Amanecer sutil (#121): luz del Sol a una hora fija y atmósfera iluminada por él; fondo transparente. */
function applySunrise(C: CesiumModule, viewer: Viewer, element: Element) {
  const scene = viewer.scene;
  scene.backgroundColor = C.Color.TRANSPARENT;
  viewer.clock.currentTime = C.JulianDate.fromIso8601(SUNRISE_TIME_ISO);
  viewer.clock.shouldAnimate = false;
  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  scene.globe.enableLighting = true;
  scene.globe.dynamicAtmosphereLighting = true;
  scene.globe.dynamicAtmosphereLightingFromSun = true;
  // La sombra del día y la noche se ve a escala continental y se desvanece al acercarse a la estación.
  scene.globe.lightingFadeOutDistance = 4_000_000;
  scene.globe.lightingFadeInDistance = 12_000_000;
  scene.globe.baseColor = tokenColor(C, element, "--paleta-azul-electrico", C.Color.BLUE); // mientras llegan las imágenes
  scene.screenSpaceCameraController.enableInputs = false;
}

function marker(
  C: CesiumModule,
  element: Element,
  id: string,
  [longitude, latitude]: readonly [number, number],
  text: string,
  visibleBetween: [number, number],
) {
  const visible = new C.DistanceDisplayCondition(visibleBetween[0], visibleBetween[1]);
  return {
    id,
    position: C.Cartesian3.fromDegrees(longitude, latitude),
    point: {
      pixelSize: 14,
      color: tokenColor(C, element, "--color-acento", C.Color.WHITE),
      outlineColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
      outlineWidth: 2,
      heightReference: C.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: visible,
    },
    label: {
      text,
      font: "600 18px system-ui, sans-serif",
      fillColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
      outlineColor: tokenColor(C, element, "--paleta-negro-azulado", C.Color.BLACK),
      outlineWidth: 4,
      style: C.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new C.Cartesian2(0, -26),
      heightReference: C.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: visible,
    },
  };
}

export function GlobeView(props: GlobeViewProps) {
  const { cesium, config, label, markerLabels, reducedMotion } = props;
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | undefined>(undefined);
  const markersRef = useRef<Partial<Record<TourSection, Entity>>>({});
  const wakeRef = useRef<() => void>(() => undefined);
  // Lo que el visor necesita leer sin recrearse: callbacks, progreso, movimiento reducido y textos.
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
        navigationInstructionsInitiallyVisible: false,
        homeButton: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        projectionPicker: false,
        skyBox: false,
        contextOptions: { webgl: { alpha: true } },
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });
      const v = viewer;
      applySunrise(C, v, element);

      // Cámara: mira a un punto del suelo con rumbo, inclinación y distancia, y luego se suelta del punto.
      const applyPose = (pose: CameraPose) => {
        v.camera.lookAt(
          C.Cartesian3.fromDegrees(pose.longitude, pose.latitude),
          new C.HeadingPitchRange(C.Math.toRadians(pose.heading), C.Math.toRadians(pose.pitch), pose.range),
        );
        v.camera.lookAtTransform(C.Matrix4.IDENTITY);
      };
      const targetPose = () => {
        const p = latest.current.progress.get();
        return poseAt(latest.current.reducedMotion ? Math.round(p) : p);
      };
      let current = targetPose();
      applyPose(current);

      // Bucle de fotogramas solo mientras la cámara se mueve; se despierta con cada cambio de progreso.
      let frame = 0;
      let last = 0;
      const tick = (now: number) => {
        frame = 0;
        if (v.isDestroyed()) return;
        const target = targetPose();
        if (latest.current.reducedMotion) current = target;
        else current = dampPose(current, target, last ? Math.min((now - last) / 1000, 0.1) : 1 / 60);
        const arrived = poseDistance(current, target) <= ARRIVED;
        if (arrived) current = target; // encaja exacto al llegar
        last = arrived ? 0 : now;
        applyPose(current);
        v.scene.requestRender();
        if (!arrived) frame = requestAnimationFrame(tick);
      };
      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };
      wakeRef.current = wake;
      cleanups.push(latest.current.progress.subscribe(wake));
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        wakeRef.current = () => undefined;
      });

      // Marcadores: Bolivia de lejos y San Ignacio de Velasco al acercarse; se relevan a la misma distancia para no
      // superponerse (en la sección de Bolivia ya se ve la estación, que es su título).
      markersRef.current = {
        bolivia: v.entities.add(
          marker(C, element, "bolivia", BOLIVIA_CENTER, latest.current.markerLabels.bolivia, [MARKER_SWAP_DISTANCE, Number.POSITIVE_INFINITY]),
        ),
        station: v.entities.add(
          marker(C, element, "station", SAN_IGNACIO_CENTER, latest.current.markerLabels.station, [0, MARKER_SWAP_DISTANCE]),
        ),
      };

      // El contenedor no recibe eventos (fondo): el clic y el puntero se leen del documento (RF-25).
      const sectionAt = (event: MouseEvent): TourSection | null => {
        const target = event.target;
        if (target instanceof Element && target.closest(OVERLAY_SELECTOR)) return null;
        const rect = v.canvas.getBoundingClientRect();
        const picked: unknown = v.scene.pick(new C.Cartesian2(event.clientX - rect.left, event.clientY - rect.top));
        const entity = typeof picked === "object" && picked !== null ? (picked as { id?: unknown }).id : undefined;
        if (entity && entity === markersRef.current.bolivia) return "bolivia";
        if (entity && entity === markersRef.current.station) return "station";
        return null;
      };
      const onClick = (event: MouseEvent) => {
        const section = sectionAt(event);
        if (section) latest.current.onSelectSection(section);
      };
      let pointerFrame = 0;
      const onMove = (event: MouseEvent) => {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = requestAnimationFrame(() => {
          document.documentElement.classList.toggle("globe-pointer", sectionAt(event) !== null);
        });
      };
      document.addEventListener("click", onClick);
      document.addEventListener("mousemove", onMove);
      cleanups.push(() => {
        document.removeEventListener("click", onClick);
        document.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(pointerFrame);
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

      void addLocalModels(C, v, ORBITAL_MODELS);

      viewerRef.current = v;
      latest.current.onReady();
    } catch {
      latest.current.onError();
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      viewerRef.current = undefined;
      markersRef.current = {};
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
    // El visor solo se recrea si cambia el módulo, el modo o el token (no en cada render). Los assets de ion son fijos
    // (1 y 2, DP-07), así que `config` no hace falta como dependencia.
  }, [cesium, mode, token]);

  // Si el movimiento reducido cambia a mitad del recorrido, la cámara se recoloca (RNF-12).
  useEffect(() => {
    wakeRef.current();
  }, [reducedMotion]);

  // Los marcadores cambian de idioma con la interfaz (RNF-03).
  useEffect(() => {
    const { bolivia, station } = markersRef.current;
    if (bolivia?.label) bolivia.label.text = new cesium.ConstantProperty(markerLabels.bolivia);
    if (station?.label) station.label.text = new cesium.ConstantProperty(markerLabels.station);
    viewerRef.current?.scene.requestRender();
  }, [cesium, markerLabels.bolivia, markerLabels.station]);

  return createPortal(
    <div ref={container} id="cesiumContainer" className="globe-view" role="region" aria-label={label} />,
    host,
  );
}
