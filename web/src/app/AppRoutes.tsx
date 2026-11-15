// T023 (001-base-web): conecta las cinco rutas de §20.1 con sus destinos (FR-001, FR-002). El explorador es un
// módulo diferido: la portada no descarga su código ni CesiumJS (RNF-01).
import { lazy } from "react";
import type { Language } from "../contracts/view-state";
import { AboutPage } from "../pages/AboutPage";
import { HomePage } from "../pages/HomePage";
import { MethodPage } from "../pages/MethodPage";
import { StationPage } from "../pages/StationPage";
import type { RouteLocation } from "./routeState";

const ExplorePage = lazy(async () => {
  const module = await import("../pages/ExplorePage");
  return { default: module.ExplorePage };
});

type AppRoutesProps = {
  location: RouteLocation | null;
  lang: Language;
};

export function AppRoutes({ location, lang }: AppRoutesProps) {
  switch (location?.route) {
    case "explore":
      return <ExplorePage lang={lang} />;
    case "station":
      return <StationPage lang={lang} stationId={location.stationId} />;
    case "method":
      return <MethodPage />;
    case "about":
      return <AboutPage />;
    default:
      return <HomePage />;
  }
}

/** Clave de traducción del nombre de cada destino (título del documento y anuncio del cambio de página). */
export const ROUTE_TITLE_KEYS = {
  home: "app.home",
  explore: "app.exploreNav",
  station: "pages.station.title",
  method: "app.method",
  about: "app.about",
} as const;
