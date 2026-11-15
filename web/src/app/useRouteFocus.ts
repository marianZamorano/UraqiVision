// T016 y T039 (001-base-web): al cambiar de página se actualiza el título, se anuncia el destino en la región de
// anuncios del shell y el foco pasa al contenido principal, sin animar el desplazamiento si la persona pidió
// movimiento reducido (RNF-04, RNF-12). En la carga inicial solo se fija el título: no se anuncia ni se mueve el foco.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROUTE_TITLE_KEYS } from "./AppRoutes";
import type { RouteLocation } from "./routeState";
import { useReducedMotion } from "./useReducedMotion";

export const MAIN_CONTENT_ID = "contenido";

/** Devuelve el texto que la región de anuncios debe leer ("" hasta la primera navegación). */
export function useRouteFocus(location: RouteLocation | null): string {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const route = location?.route ?? "home";
  // La zona abierta dentro del explorador (?station=) no cambia de página: solo la ruta de estación cuenta su id.
  const path = `${route}:${route === "station" ? (location?.stationId ?? "") : ""}`;
  const page = t(ROUTE_TITLE_KEYS[route]);

  // Ajuste de estado al cambiar la ruta, durante el render (patrón recomendado por React, sin efecto).
  const [firstPath] = useState(path);
  const [hasNavigated, setHasNavigated] = useState(false);
  if (!hasNavigated && path !== firstPath) setHasNavigated(true);

  useEffect(() => {
    document.title = `${page} · ${t("app.title")}`;
  }, [page, t]);

  const previousPath = useRef(path);
  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [path, reducedMotion]);

  return hasNavigated ? t("app.navigatedTo", { page }) : "";
}
