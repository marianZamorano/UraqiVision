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
  bolivia: { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], range: 2_700_000, heading: 0, pitch: -75 },
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
