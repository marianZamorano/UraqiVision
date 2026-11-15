// T013 (001-base-web): estado territorial en la URL para las cinco rutas de §20.1 (FR-001, FR-002, RF-29).
// El idioma no va en la URL: vive en contexto persistible (research.md §2).
import type { RouteName, RouteState } from "../contracts/view-state";

export type RouteLocation = Omit<RouteState, "lang">;

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PERIOD = /^[A-Za-z0-9-]{1,32}$/;

const STATIC_ROUTES: Record<string, RouteName> = {
  "/": "home",
  "/explore": "explore",
  "/method": "method",
  "/about": "about",
};

const STATIC_PATHS: Record<Exclude<RouteName, "station">, string> = {
  home: "/",
  explore: "/explore",
  method: "/method",
  about: "/about",
};

/** Convierte una URL en un estado de ruta validado, o `null` si la ruta no existe o es inválida. */
export function parseRoute(pathname: string, search = ""): RouteLocation | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let location: RouteLocation | null = null;

  const staticRoute = STATIC_ROUTES[path];
  if (staticRoute) {
    location = { route: staticRoute };
  } else {
    const match = /^\/station\/([^/]+)$/.exec(path);
    const stationId = match?.[1];
    if (stationId && ID.test(stationId)) location = { route: "station", stationId };
  }

  if (!location) return null;

  const params = new URLSearchParams(search);
  const departmentId = params.get("department");
  const period = params.get("period");
  // RF-29: la zona abierta en el explorador va en la URL (?station=), para que «atrás» la cierre y el enlace se
  // pueda compartir; al volver del mapa de análisis, el globo conserva la selección.
  const zone = params.get("station");
  if (location.route === "explore" && zone && ID.test(zone)) location.stationId = zone;
  if (departmentId && ID.test(departmentId)) location.departmentId = departmentId;
  if (period && PERIOD.test(period)) location.period = period;

  return location;
}

/** Convierte un estado de ruta en una URL recargable con orden de parámetros estable. */
export function serializeRoute(location: RouteLocation): string {
  let path: string;
  if (location.route === "station") {
    if (!location.stationId || !ID.test(location.stationId)) {
      throw new Error("La ruta de estación necesita un stationId válido.");
    }
    path = `/station/${location.stationId}`;
  } else {
    path = STATIC_PATHS[location.route];
  }

  const params = new URLSearchParams();
  if (location.route === "explore" && location.stationId && ID.test(location.stationId)) params.set("station", location.stationId);
  if (location.departmentId && ID.test(location.departmentId)) params.set("department", location.departmentId);
  if (location.period && PERIOD.test(location.period)) params.set("period", location.period);
  const query = params.toString();

  return query ? `${path}?${query}` : path;
}
