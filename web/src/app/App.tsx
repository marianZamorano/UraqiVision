// Shell y rutas de la base web (001 T016, T023): cinco rutas de §20.1 sobre el adaptador de History API (T013).
// El explorador es un módulo diferido: la portada no descarga su código ni CesiumJS (RNF-01).
// El idioma lo gestiona i18n (T015): cambiarlo no recarga ni cambia la ruta (RF-20).
import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../i18n";
import { AboutPage } from "../pages/AboutPage";
import { HomePage } from "../pages/HomePage";
import { MethodPage } from "../pages/MethodPage";
import { StationPage } from "../pages/StationPage";
import { AppShell } from "./AppShell";
import { navigate, useRoute } from "./router";

const ExplorePage = lazy(async () => {
  const module = await import("../pages/ExplorePage");
  return { default: module.ExplorePage };
});

export default function App() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const location = useRoute();

  // Una ruta desconocida vuelve a la portada sin dejar la URL inválida en el historial.
  useEffect(() => {
    if (!location) navigate("/", { replace: true });
  }, [location]);

  let page;
  switch (location?.route) {
    case "explore":
      page = <ExplorePage lang={lang} />;
      break;
    case "station":
      page = <StationPage lang={lang} stationId={location.stationId} />;
      break;
    case "method":
      page = <MethodPage />;
      break;
    case "about":
      page = <AboutPage />;
      break;
    default:
      page = <HomePage />;
  }

  return (
    <AppShell>
      <Suspense fallback={<div aria-live="polite">{t("app.loadingPage")}</div>}>{page}</Suspense>
    </AppShell>
  );
}
