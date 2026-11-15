// #121 (RF-02, RF-25, RNF-12): trayectoria de la cámara del recorrido del explorador. Funciones puras: la pose de la
// cámara para un progreso de scroll continuo (0 = primera sección, n-1 = última), con aceleración suave entre
// secciones, y la amortiguación que la hace llegar sin saltos. GlobeView solo aplica el resultado.
import { BOLIVIA_CENTER } from "./globeConfig";

/** Cámara mirando a un punto del suelo: grados, metros de distancia, rumbo e inclinación en grados. */
export type CameraPose = {
  longitude: number;
  latitude: number;
  range: number;
  heading: number;
  pitch: number;
};

/** Secciones del recorrido, en orden de scroll. */
export const TOUR_SECTIONS = ["earth", "southAmerica", "bolivia"] as const;
export type TourSection = (typeof TOUR_SECTIONS)[number];

/**
 * Vista de cada sección (propuesta de diseño): la Tierra entera con Bolivia al frente → Sudamérica → Bolivia, donde
 * aparecen las zonas con datos (#123). Bolivia va un poco inclinada para dar profundidad.
 */
export const KEYFRAMES: Record<TourSection, CameraPose> = {
  earth: { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], range: 20_000_000, heading: 0, pitch: -90 },
  southAmerica: { longitude: -61, latitude: -19, range: 8_000_000, heading: 0, pitch: -88 },
  bolivia: { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], range: 2_900_000, heading: 0, pitch: -75 },
};

const POSES = TOUR_SECTIONS.map((section) => KEYFRAMES[section]);
const LAST = POSES.length - 1;

/** Aceleración y frenado suaves (ease-in-out cúbica). */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** La distancia se interpola en escala logarítmica: el acercamiento se siente constante a cualquier altura. */
const lerpLog = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
/** El rumbo gira por el camino más corto. */
function lerpAngle(a: number, b: number, t: number) {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return a + delta * t;
}

function mix(a: CameraPose, b: CameraPose, t: number): CameraPose {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  return {
    longitude: lerp(a.longitude, b.longitude, t),
    latitude: lerp(a.latitude, b.latitude, t),
    range: lerpLog(a.range, b.range, t),
    heading: lerpAngle(a.heading, b.heading, t),
    pitch: lerp(a.pitch, b.pitch, t),
  };
}

/** Pose para un progreso continuo; fuera del rango se queda en la primera o la última sección. */
export function poseAt(progress: number): CameraPose {
  const p = Number.isFinite(progress) ? Math.min(LAST, Math.max(0, progress)) : 0;
  const i = Math.min(LAST - 1, Math.floor(p));
  const from = POSES[i];
  const to = POSES[i + 1];
  if (!from || !to) return { ...KEYFRAMES.earth };
  return mix(from, to, easeInOutCubic(p - i));
}

/**
 * Acerca la pose actual a la de destino con amortiguación exponencial (independiente de los fps): el scroll a
 * saltos de la rueda se convierte en un movimiento continuo. `tau` es el tiempo de respuesta en segundos.
 */
export function dampPose(current: CameraPose, target: CameraPose, dtSeconds: number, tau = 0.35): CameraPose {
  const t = 1 - Math.exp(-Math.max(0, dtSeconds) / tau);
  return mix(current, target, t);
}

/** Diferencia entre dos poses, para saber cuándo la cámara llegó y se puede dejar de dibujar. */
export function poseDistance(a: CameraPose, b: CameraPose): number {
  return Math.max(
    Math.abs(a.longitude - b.longitude),
    Math.abs(a.latitude - b.latitude),
    Math.abs(Math.log(a.range / b.range)),
    Math.abs(lerpAngle(a.heading, b.heading, 1) - a.heading) / 10,
    Math.abs(a.pitch - b.pitch) / 10,
  );
}

/**
 * Parte de la pantalla tapada por el contenido en cada borde, en píxeles: la cabecera arriba, la navegación del
 * recorrido a la derecha y el panel a la izquierda (escritorio) o abajo (celular).
 */
export type GlobeFraming = { left: number; right: number; top: number; bottom: number };

export const NO_FRAMING: GlobeFraming = { left: 0, right: 0, top: 0, bottom: 0 };

/**
 * Cuánto mover la cámara (en metros) para que lo que mira quede centrado en la parte libre de la pantalla (#123): en
 * horizontal, la mitad de la diferencia entre lo tapado a la izquierda y a la derecha (positivo: la cámara va a la
 * izquierda y la escena se ve más a la derecha); en vertical, la mitad de la diferencia entre lo tapado abajo y
 * arriba (positivo: la cámara baja y la escena sube). `fov` es el de CesiumJS: horizontal si la pantalla es más
 * ancha que alta y vertical si no.
 */
export function framingShift(
  range: number,
  fov: number,
  width: number,
  height: number,
  framing: GlobeFraming,
): { left: number; down: number } {
  if (!(width > 0) || !(height > 0) || !(range > 0) || !(fov > 0)) return { left: 0, down: 0 };
  const fovX = width >= height ? fov : 2 * Math.atan(Math.tan(fov / 2) * (width / height));
  const metersPerPixel = (2 * range * Math.tan(fovX / 2)) / width;
  const side = (value: number) => Math.max(0, value);
  return {
    left: ((side(framing.left) - side(framing.right)) / 2) * metersPerPixel,
    down: ((side(framing.bottom) - side(framing.top)) / 2) * metersPerPixel,
  };
}

/**
 * En una pantalla vertical (celular) el ancho visible es mucho menor: la cámara se aleja en proporción para que
 * Bolivia quepa a lo ancho (#125). En pantallas apaisadas no cambia nada.
 */
export function portraitZoom(width: number, height: number): number {
  if (!(width > 0) || !(height > 0) || width >= height) return 1;
  return Math.min(2, Math.max(1, (height / width) * 0.7));
}

/** Sin corrimiento pendiente: por debajo de medio píxel el encuadre ya llegó. */
const FRAMING_ARRIVED = 0.5;

/**
 * Acerca el encuadre actual al de destino con la misma amortiguación de la cámara: al abrir o cerrar el detalle de
 * una zona, la escena se desliza hacia la parte libre de la pantalla en lugar de saltar.
 */
export function dampFraming(current: GlobeFraming, target: GlobeFraming, dtSeconds: number, tau = 0.28): GlobeFraming {
  const t = 1 - Math.exp(-Math.max(0, dtSeconds) / tau);
  const side = (a: number, b: number) => (Math.abs(b - a) <= FRAMING_ARRIVED ? b : a + (b - a) * t);
  return {
    left: side(current.left, target.left),
    right: side(current.right, target.right),
    top: side(current.top, target.top),
    bottom: side(current.bottom, target.bottom),
  };
}

export function sameFraming(a: GlobeFraming, b: GlobeFraming): boolean {
  return a.left === b.left && a.right === b.right && a.top === b.top && a.bottom === b.bottom;
}

/** Zona abierta en el explorador (RF-25): a dónde vuela la cámara y desde qué distancia la mira. */
export type GlobeFocus = { id: string; longitude: number; latitude: number; range: number };

/** Distancia de cámara mientras todavía no se conoce la caja de la zona (las cajas publicadas miden ~50 km). */
export const DEFAULT_ZONE_RANGE = 160_000;

/** Cuántas veces el lado de la caja de una zona se aleja la cámara: la caja ocupa cerca de la mitad del espacio libre. */
export const ZONE_RANGE_FACTOR = 3.2;
const ZONE_RANGE_MIN = 40_000;
const ZONE_RANGE_MAX = 900_000;
const METERS_PER_DEGREE = 111_320;

/** Distancia de cámara para ver entera una caja `[oeste, sur, este, norte]` en grados. */
export function zoneRange(bbox: readonly [number, number, number, number]): number {
  const [west, south, east, north] = bbox;
  const midLatitude = ((south + north) / 2) * (Math.PI / 180);
  const width = Math.abs(east - west) * METERS_PER_DEGREE * Math.cos(midLatitude);
  const height = Math.abs(north - south) * METERS_PER_DEGREE;
  const side = Math.max(width, height);
  if (!Number.isFinite(side) || side <= 0) return ZONE_RANGE_MIN * ZONE_RANGE_FACTOR;
  return Math.min(ZONE_RANGE_MAX, Math.max(ZONE_RANGE_MIN, side * ZONE_RANGE_FACTOR));
}

/** Vista de una zona: casi cenital (la imagen de radar se lee de frente) con una inclinación leve para dar relieve. */
export function zonePose(focus: GlobeFocus): CameraPose {
  return { longitude: focus.longitude, latitude: focus.latitude, range: focus.range, heading: 0, pitch: -82 };
}

/** Distancia sobre el suelo entre los puntos que miran dos poses, en metros (haversine). */
export function groundDistance(a: CameraPose, b: CameraPose): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Vuelo entre dos vistas (RF-25) para `t` de 0 a 1: aceleración y frenado suaves y, si el destino queda lejos para
 * la altura a la que se vuela (de una zona a otra), la cámara se eleva a mitad de camino para que se vea el
 * trayecto. En los extremos devuelve exactamente la vista de origen y la de destino.
 */
export function flightPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const e = easeInOutCubic(t);
  const pose = mix(from, to, e);
  if (e <= 0 || e >= 1) return pose;
  const lift = groundDistance(from, to) * 1.2 * Math.sin(Math.PI * e);
  return { ...pose, range: Math.hypot(pose.range, lift) };
}

/** Duración del vuelo en segundos: más largo cuanto más cambia la altura o más lejos queda el destino. */
export function flightDuration(from: CameraPose, to: CameraPose): number {
  const zoom = Math.abs(Math.log(from.range / to.range));
  const travel = groundDistance(from, to) / Math.max(from.range, to.range);
  return Math.min(2.6, 1.1 + 0.3 * zoom + 0.25 * Math.min(4, travel));
}

/** Desde qué punto del recorrido se ven las zonas en lugar del marcador de Bolivia (a medio camino de Bolivia). */
export const ZONES_FROM_PROGRESS = TOUR_SECTIONS.indexOf("bolivia") - 0.5;
