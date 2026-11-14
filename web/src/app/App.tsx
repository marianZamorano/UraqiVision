// Shell y rutas de la base web (001 T016, T023): cinco rutas de §20.1 sobre el adaptador de History API (T013).
// El explorador es un módulo diferido: la portada no descarga su código ni CesiumJS (RNF-01).
import { Suspense, lazy, useEffect, useState } from "react";
import type { Language } from "../contracts/view-state";
import { getPreferredLanguage } from "../i18n";
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
  const [lang, setLang] = useState<Language>(getPreferredLanguage);
  const location = useRoute();

  useEffect(() => {
    localStorage.setItem("uraqivision-lang", lang);
  }, [lang]);

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
      page = <MethodPage lang={lang} />;
      break;
    case "about":
      page = <AboutPage lang={lang} />;
      break;
    default:
      page = <HomePage lang={lang} />;
  }

  return (
    <AppShell lang={lang} onChangeLanguage={setLang}>
      <Suspense fallback={<div aria-live="polite">Loading…</div>}>{page}</Suspense>
    </AppShell>
  );
}
