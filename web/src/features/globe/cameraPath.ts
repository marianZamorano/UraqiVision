// #121 (RF-02, RF-25, RNF-12): trayectoria de la cámara del recorrido del explorador. Funciones puras: la pose de la
// cámara para un progreso de scroll continuo (0 = primera sección, n-1 = última), con aceleración suave entre
// secciones, y la amortiguación que la hace llegar sin saltos. GlobeView solo aplica el resultado.
import { BOLIVIA_CENTER, SAN_IGNACIO_CENTER } from "./globeConfig";

/** Cámara mirando a un punto del suelo: grados, metros de distancia, rumbo e inclinación en grados. */
export type CameraPose = {
  longitude: number;
  latitude: number;
  range: number;
  heading: number;
  pitch: number;
};

/** Secciones del recorrido, en orden de scroll. */
export const TOUR_SECTIONS = ["earth", "southAmerica", "bolivia", "station"] as const;
export type TourSection = (typeof TOUR_SECTIONS)[number];

/**
 * Vista de cada sección (propuesta de diseño). La Tierra entera con Bolivia al frente → Sudamérica → Bolivia →
 * el recorte de San Ignacio, inclinado para dar profundidad.
 */
export const KEYFRAMES: Record<TourSection, CameraPose> = {
  earth: { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], range: 20_000_000, heading: 0, pitch: -90 },
  southAmerica: { longitude: -61, latitude: -19, range: 8_000_000, heading: 0, pitch: -88 },
  bolivia: { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], range: 2_400_000, heading: 0, pitch: -82 },
  station: { longitude: SAN_IGNACIO_CENTER[0], latitude: SAN_IGNACIO_CENTER[1], range: 170_000, heading: 12, pitch: -52 },
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
