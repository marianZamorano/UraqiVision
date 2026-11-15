// #115, #121, #123 (RF-02, RF-25, RF-29, RF-30, DP-07, RNF-06, RNF-11, RNF-12): globo 3D con CesiumJS como fondo
// fijo y transparente del recorrido del explorador. Recibe el módulo ya cargado de forma diferida (la portada no lo
// descarga, RNF-01). Con ion: World Terrain (asset 1) e imágenes Bing (asset 2); sin ion: NaturalEarthII.
// - Visor limpio: sin widgets ni controles de ratón. La cámara la mueven solo el scroll (cameraPath.ts, con
//   aceleración y amortiguación), la navegación por secciones y el clic en los marcadores. Con movimiento reducido
//   salta a la vista de la sección activa, sin interpolación (RNF-12).
// - Fondo: el contenedor no recibe eventos (no bloquea el desplazamiento); el clic en un marcador se detecta desde
//   el documento, salvo sobre contenido interactivo o paneles ([data-globe-overlay]).
// - Zonas con datos (#123): un punto por zona publicada al acercarse a Bolivia; el clic abre la zona (RF-29).
//   Contorno de Bolivia sobre el relieve (boliviaOutline.ts).
// - Zona abierta (RF-25, RF-08): la cámara vuela hasta ella (cameraPath.ts: flightPose), su imagen de radar se
//   extiende sobre el relieve con el contorno de su caja, y el encuadre se desliza hacia la parte libre de la
//   pantalla cuando se abre o se cierra su detalle. Con movimiento reducido, todo salta sin animación (RNF-12).
// - Amanecer sutil: luz solar real a una hora fija (globeConfig.ts), con el brillo cálido solo en el horizonte de la
//   atmósfera; sin cielo, Sol ni Luna dibujados. Las imágenes de satélite no se recolorean: son datos.
// - Modelos glTF locales opcionales (localModels.ts). Los créditos los muestra el visor y son clicables (RNF-11).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { BOLIVIA_OUTLINE_CREDIT, loadBoliviaOutline } from "./boliviaOutline";
import {
  dampFraming,
  dampPose,
  flightDuration,
  flightPose,
  framingShift,
  portraitZoom,
  poseAt,
  poseDistance,
  sameFraming,
  zonePose,
  ZONES_FROM_PROGRESS,
  type CameraPose,
  type GlobeFocus,
  type GlobeFraming,
  type TourSection,
} from "./cameraPath";
import { BOLIVIA_CENTER, SUNRISE_TIME_ISO, type GlobeConfig } from "./globeConfig";
import { addLocalModels, ORBITAL_MODELS } from "./localModels";
import type { ProgressStore } from "./scrollProgress";
import "./globe.css";

export type CesiumModule = typeof import("cesium");
type Viewer = InstanceType<CesiumModule["Viewer"]>;
type Entity = InstanceType<CesiumModule["Entity"]>;
type ImageryLayer = InstanceType<CesiumModule["ImageryLayer"]>;

/** Zona con datos en el globo (#123), ya con su nombre en el idioma activo. */
export type ZonePoint = { id: string; label: string; longitude: number; latitude: number };

/**
 * Imagen de radar de la zona abierta, extendida sobre el relieve (RF-08). `rectangle` es `[oeste, sur, este, norte]`
 * en grados: el rectángulo que contiene a la imagen (la grilla del radar es UTM, así que en las esquinas puede
 * desviarse unos cientos de metros; el mapa de análisis 2D usa las 4 esquinas exactas). `outline` son esas 4
 * esquinas publicadas, para dibujar el contorno exacto de la caja.
 */
export type GlobeOverlay = {
  url: string;
  rectangle: readonly [number, number, number, number];
  opacity: number;
  outline: ReadonlyArray<readonly [number, number]>;
};

type GlobeViewProps = {
  cesium: CesiumModule;
  config: GlobeConfig;
  label: string;
  /** Texto del marcador de Bolivia en el idioma activo (RNF-03). */
  boliviaLabel: string;
  /** Zonas publicadas con ubicación (#123). */
  zones: readonly ZonePoint[];
  /** Parte de la pantalla tapada por el panel: la escena se centra en el espacio libre. */
  framing: GlobeFraming;
  /** Progreso del recorrido (scroll); el globo lo lee en cada fotograma. */
  progress: ProgressStore;
  reducedMotion: boolean;
  onSelectSection: (section: TourSection) => void;
  /** Zona abierta: la cámara vuela hasta ella y se queda ahí hasta que se cierra (RF-25). */
  focus?: GlobeFocus | null;
  /** Imagen de radar de la zona abierta sobre el relieve (RF-08). */
  overlay?: GlobeOverlay | null;
  /** Clic en el punto de una zona: la abre. */
  onSelectZone: (stationId: string) => void;
  onReady: () => void;
  onError: () => void;
};

/** Contenido que tapa al globo: un clic ahí nunca se interpreta como clic en el globo. */
const OVERLAY_SELECTOR = "a, button, input, select, textarea, label, summary, [role='button'], [data-globe-overlay], .topbar";

/** Redibujos de cortesía tras cambiar la imagen o el contorno de la zona abierta. */
const SETTLE_RENDERS_MS = [120, 400, 1000, 2000];
/** Cuánto se conserva la imagen anterior después de que la nueva está lista (lo que tarda en dibujarse). */
const STALE_IMAGE_MS = 220;

/** Lo que hay de la zona abierta en el globo: su imagen, las anteriores que aún no se quitaron y el contorno. */
type OverlayShown = { image: string; layer: ImageryLayer | null; stale: ImageryLayer[]; box: string; outline: Entity | null };
const noOverlay = (): OverlayShown => ({ image: "", layer: null, stale: [], box: "", outline: null });

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
  // La sombra del día y la noche se ve a escala continental y se desvanece al acercarse a Bolivia.
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
  /** Desplazamiento vertical de la etiqueta en píxeles (negativo: encima del punto). */
  labelOffsetY = -26,
  show = true,
) {
  return {
    id,
    show,
    position: C.Cartesian3.fromDegrees(longitude, latitude),
    point: {
      pixelSize: 14,
      color: tokenColor(C, element, "--color-acento", C.Color.WHITE),
      outlineColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
      outlineWidth: 2,
      heightReference: C.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text,
      // Letra más chica en pantallas estrechas para que las zonas vecinas no se amontonen.
      font: `600 ${element.clientWidth < 600 ? 12 : 16}px system-ui, sans-serif`,
      fillColor: tokenColor(C, element, "--paleta-blanco", C.Color.WHITE),
      outlineColor: tokenColor(C, element, "--paleta-negro-azulado", C.Color.BLACK),
      outlineWidth: 4,
      style: C.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new C.Cartesian2(0, element.clientWidth < 600 ? Math.round(labelOffsetY * 0.75) : labelOffsetY),
      heightReference: C.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  };
}

/** ¿Ya se ven las zonas (al llegar a Bolivia) en lugar del marcador de Bolivia? */
const zonesVisible = (progress: number) => progress >= ZONES_FROM_PROGRESS;

export function GlobeView(props: GlobeViewProps) {
  const { cesium, config, label, boliviaLabel, zones, reducedMotion, framing, focus, overlay } = props;
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | undefined>(undefined);
  const boliviaRef = useRef<Entity | undefined>(undefined);
  /** Entidad de cada punto de zona → id de su estación, y la lista con la que se dibujaron. */
  const zoneEntities = useRef(new Map<Entity, string>());
  const zonesDrawn = useRef<readonly ZonePoint[] | null>(null);
  const wakeRef = useRef<() => void>(() => undefined);
  /** Imagen de radar y contorno de la zona abierta que hay ahora en el globo. */
  const overlayShown = useRef<OverlayShown>(noOverlay());
  // Lo que el visor necesita leer sin recrearse: callbacks, progreso, movimiento reducido, textos y zonas.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  /** ¿Se ve el punto de esta zona? Al llegar a Bolivia o con una zona abierta; la zona abierta no lleva punto. */
  const zoneShown = useRef((id: string) => {
    const open = latest.current.focus?.id ?? null;
    return (open !== null || zonesVisible(latest.current.progress.get())) && id !== open;
  });

  // El fondo vive en un nodo al PRINCIPIO de <body>: así ningún ancestro con transform (la animación de entrada de
  // <main>) lo desplaza, y todo lo que viene después en el documento (cabecera y contenido) se pinta por encima.
  const [host] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    document.body.prepend(host);
    return () => host.remove();
  }, [host]);

  /** Rehace los puntos de las zonas con las zonas vigentes (al crear el visor y cuando cambian). */
  const syncZones = useRef((list: readonly ZonePoint[]) => {
    const viewer = viewerRef.current;
    const element = container.current;
    if (!viewer || viewer.isDestroyed() || !element || zonesDrawn.current === list) return;
    zonesDrawn.current = list;
    for (const entity of zoneEntities.current.keys()) viewer.entities.remove(entity);
    const next = new Map<Entity, string>();
    // Etiquetas alternadas encima y debajo (por longitud) para que las zonas vecinas no se tapen.
    [...list]
      .sort((a, b) => a.longitude - b.longitude)
      .forEach((zone, i) => {
        const entity = viewer.entities.add(
          marker(cesium, element, `zona-${zone.id}`, [zone.longitude, zone.latitude], zone.label, i % 2 === 0 ? -26 : 30, zoneShown.current(zone.id)),
        );
        next.set(entity, zone.id);
      });
    zoneEntities.current = next;
    viewer.scene.requestRender();
  });

  /** Pone, cambia o quita la imagen de radar de la zona abierta y el contorno de su caja (RF-08). */
  const syncOverlay = useRef((next: GlobeOverlay | null | undefined) => {
    const viewer = viewerRef.current;
    const element = container.current;
    if (!viewer || viewer.isDestroyed() || !element) return;
    const C = cesium;
    const shown = overlayShown.current;
    const image = next ? `${next.url}|${next.rectangle.join(",")}` : "";
    const box = next ? next.outline.map((corner) => corner.join(",")).join(";") : "";
    // El contorno solo cambia con la zona: al cambiar de capa o de fecha dentro de la misma, se conserva.
    if (shown.box !== box) {
      if (shown.outline) viewer.entities.remove(shown.outline);
      shown.outline = null;
      shown.box = box;
      if (next && next.outline.length >= 3) {
        const ring = [...next.outline, next.outline[0] as readonly [number, number]].flatMap(([lon, lat]) => [lon, lat]);
        shown.outline = viewer.entities.add({
          polyline: {
            positions: C.Cartesian3.fromDegreesArray(ring),
            width: 2,
            material: tokenColor(C, element, "--paleta-hielo", C.Color.WHITE),
            clampToGround: true,
          },
        });
      }
    }
    if (shown.image !== image) {
      // La imagen anterior se queda hasta que la nueva esté lista: al recorrer la línea de tiempo no parpadea.
      if (shown.layer) shown.stale.push(shown.layer);
      shown.layer = null;
      shown.image = image;
      const dropStale = () => {
        if (viewer.isDestroyed()) return;
        for (const old of shown.stale.splice(0)) viewer.imageryLayers.remove(old, true);
        viewer.scene.requestRender();
      };
      if (next) {
        const [west, south, east, north] = next.rectangle;
        const layer = C.ImageryLayer.fromProviderAsync(
          C.SingleTileImageryProvider.fromUrl(next.url, { rectangle: C.Rectangle.fromDegrees(west, south, east, north) }),
          { alpha: next.opacity },
        );
        // Con requestRenderMode hay que pedir el dibujo cuando la imagen llega. Si entretanto se eligió otra, esta
        // ya es de las anteriores y la quitará la que la reemplazó.
        layer.readyEvent.addEventListener(() => {
          if (viewer.isDestroyed()) return;
          viewer.scene.requestRender();
          window.setTimeout(() => {
            if (shown.layer === layer) dropStale();
          }, STALE_IMAGE_MS);
        });
        // Si la imagen nueva no carga, no se deja la anterior haciéndose pasar por ella.
        layer.errorEvent.addEventListener(() => {
          if (shown.layer === layer) dropStale();
        });
        viewer.imageryLayers.add(layer);
        shown.layer = layer;
      } else {
        dropStale();
      }
    } else if (next && shown.layer) {
      shown.layer.alpha = next.opacity;
    }
    viewer.scene.requestRender();
    // El contorno pegado al relieve y la imagen se preparan en varios fotogramas: con requestRenderMode hay que
    // pedirlos, o lo anterior se queda dibujado hasta el próximo movimiento.
    for (const delay of SETTLE_RENDERS_MS) {
      window.setTimeout(() => {
        if (!viewer.isDestroyed()) viewer.scene.requestRender();
      }, delay);
    }
  });

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

      // Encuadre que se está aplicando: salta con el recorrido y se desliza con una zona abierta.
      let shownFraming = latest.current.framing;
      // Cámara: mira a un punto del suelo con rumbo, inclinación y distancia, se suelta del punto y se corre para que
      // la escena quede en la parte de la pantalla que no tapa el panel.
      const applyPose = (pose: CameraPose) => {
        const width = v.canvas.clientWidth;
        const height = v.canvas.clientHeight;
        const range = pose.range * portraitZoom(width, height);
        v.camera.lookAt(
          C.Cartesian3.fromDegrees(pose.longitude, pose.latitude),
          new C.HeadingPitchRange(C.Math.toRadians(pose.heading), C.Math.toRadians(pose.pitch), range),
        );
        v.camera.lookAtTransform(C.Matrix4.IDENTITY);
        const fov = (v.camera.frustum as { fov?: number }).fov ?? Math.PI / 3;
        const shift = framingShift(range, fov, width, height, shownFraming);
        if (shift.left) v.camera.moveLeft(shift.left);
        if (shift.down) v.camera.moveDown(shift.down);
      };
      // Vista de destino: la zona abierta (RF-25) o, sin ella, la del recorrido según el scroll.
      const targetPose = () => {
        const open = latest.current.focus;
        if (open) return zonePose(open);
        const p = latest.current.progress.get();
        return poseAt(latest.current.reducedMotion ? Math.round(p) : p);
      };
      let current = targetPose();
      applyPose(current);

      // Bucle de fotogramas solo mientras la cámara se mueve; se despierta con cada cambio de progreso o de zona.
      let frame = 0;
      let last = 0;
      let openId = latest.current.focus?.id ?? null;
      let flight: { from: CameraPose; start: number; duration: number } | null = null;
      const tick = (now: number) => {
        frame = 0;
        if (v.isDestroyed()) return;
        const target = targetPose();
        const reduced = latest.current.reducedMotion;
        const nextId = latest.current.focus?.id ?? null;
        if (nextId !== openId) {
          // Se abrió, se cambió o se cerró una zona: vuelo con aceleración suave en lugar de la amortiguación del scroll.
          openId = nextId;
          flight = reduced ? null : { from: current, start: now, duration: flightDuration(current, target) * 1000 };
        }
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
        const zoneMode = openId !== null || flight !== null;
        if (reduced) {
          current = target;
          flight = null;
        } else if (flight) {
          const t = (now - flight.start) / flight.duration;
          current = flightPose(flight.from, target, t);
          if (t >= 1) flight = null;
        } else {
          current = dampPose(current, target, dt);
        }
        const framingTarget = latest.current.framing;
        shownFraming = reduced || !zoneMode ? framingTarget : dampFraming(shownFraming, framingTarget, dt);
        const arrived = flight === null && poseDistance(current, target) <= ARRIVED && sameFraming(shownFraming, framingTarget);
        if (arrived) current = target; // encaja exacto al llegar
        last = arrived ? 0 : now;
        applyPose(current);
        v.scene.requestRender();
        if (!arrived) frame = requestAnimationFrame(tick);
      };
      // Relevo de marcadores: el de Bolivia antes de llegar; las zonas al llegar (#125) o con una zona abierta, que
      // no lleva punto (lo tapa su imagen).
      let markersKey: string | null = null;
      const updateMarkers = () => {
        const open = latest.current.focus?.id ?? null;
        const show = open !== null || zonesVisible(latest.current.progress.get());
        const key = `${show}|${open ?? ""}`;
        if (key === markersKey) return;
        markersKey = key;
        if (boliviaRef.current) boliviaRef.current.show = !show;
        for (const [entity, id] of zoneEntities.current) entity.show = zoneShown.current(id);
        v.scene.requestRender();
      };
      const wake = () => {
        updateMarkers();
        if (!frame) frame = requestAnimationFrame(tick);
      };
      wakeRef.current = wake;
      cleanups.push(latest.current.progress.subscribe(wake));
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        wakeRef.current = () => undefined;
      });

      // Marcador de Bolivia antes de llegar a Bolivia; al llegar cede su lugar a los puntos de las zonas.
      boliviaRef.current = v.entities.add(
        marker(C, element, "bolivia", BOLIVIA_CENTER, latest.current.boliviaLabel, -26, !zonesVisible(latest.current.progress.get())),
      );

      // Contorno de Bolivia sobre el relieve (#123), con su crédito (RNF-11). Si no carga, el globo sigue sin él.
      const outline = new AbortController();
      cleanups.push(() => outline.abort());
      loadBoliviaOutline(outline.signal).then((rings) => {
        if (v.isDestroyed() || rings.length === 0) return;
        const color = tokenColor(C, element, "--paleta-hielo", C.Color.WHITE);
        for (const ring of rings) {
          v.entities.add({
            polyline: { positions: C.Cartesian3.fromDegreesArray(ring), width: 2, material: color, clampToGround: true },
          });
        }
        v.creditDisplay.addStaticCredit(new C.Credit(BOLIVIA_OUTLINE_CREDIT));
        v.scene.requestRender();
      }, () => undefined);

      // El contenedor no recibe eventos (fondo): el clic y el puntero se leen del documento (RF-25).
      type Hit = { kind: "bolivia" } | { kind: "zone"; stationId: string };
      const hitAt = (event: MouseEvent): Hit | null => {
        const target = event.target;
        if (target instanceof Element && target.closest(OVERLAY_SELECTOR)) return null;
        const rect = v.canvas.getBoundingClientRect();
        const picked: unknown = v.scene.pick(new C.Cartesian2(event.clientX - rect.left, event.clientY - rect.top));
        const entity = typeof picked === "object" && picked !== null ? (picked as { id?: unknown }).id : undefined;
        if (!entity) return null;
        if (entity === boliviaRef.current) return { kind: "bolivia" };
        const stationId = zoneEntities.current.get(entity as Entity);
        return stationId ? { kind: "zone", stationId } : null;
      };
      const onClick = (event: MouseEvent) => {
        const hit = hitAt(event);
        if (hit?.kind === "bolivia") latest.current.onSelectSection("bolivia");
        else if (hit?.kind === "zone") latest.current.onSelectZone(hit.stationId);
      };
      let pointerFrame = 0;
      const onMove = (event: MouseEvent) => {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = requestAnimationFrame(() => {
          document.documentElement.classList.toggle("globe-pointer", hitAt(event) !== null);
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
      syncZones.current(latest.current.zones);
      syncOverlay.current(latest.current.overlay);
      latest.current.onReady();
    } catch {
      latest.current.onError();
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      viewerRef.current = undefined;
      boliviaRef.current = undefined;
      zoneEntities.current = new Map();
      zonesDrawn.current = null;
      overlayShown.current = noOverlay();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
    // El visor solo se recrea si cambia el módulo, el modo o el token (no en cada render). Los assets de ion son fijos
    // (1 y 2, DP-07), así que `config` no hace falta como dependencia.
  }, [cesium, mode, token]);

  // Si cambia el movimiento reducido, el espacio libre de la pantalla o la zona abierta, la cámara se recoloca
  // (RNF-12, RF-25).
  useEffect(() => {
    wakeRef.current();
  }, [reducedMotion, framing.left, framing.right, framing.top, framing.bottom, focus?.id, focus?.longitude, focus?.latitude, focus?.range]);

  // La imagen de radar llega después que el visor y cambia con la capa, la fecha y la opacidad.
  useEffect(() => {
    syncOverlay.current(overlay);
  }, [overlay]);

  // El marcador de Bolivia cambia de idioma con la interfaz (RNF-03).
  useEffect(() => {
    const bolivia = boliviaRef.current;
    if (bolivia?.label) bolivia.label.text = new cesium.ConstantProperty(boliviaLabel);
    viewerRef.current?.scene.requestRender();
  }, [cesium, boliviaLabel]);

  // Las zonas llegan después que el visor (vienen del backend) y cambian de idioma con la interfaz.
  useEffect(() => {
    syncZones.current(zones);
  }, [zones]);

  return createPortal(
    <div ref={container} id="cesiumContainer" className="globe-view" role="region" aria-label={label} />,
    host,
  );
}
