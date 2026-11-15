// Aplicación (001 T016, T023): shell, región de anuncios y rutas sobre el adaptador de History API (T013).
// El idioma lo gestiona i18n (T015): cambiarlo no recarga ni cambia la ruta (RF-20).
import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../i18n";
import { AppRoutes } from "./AppRoutes";
import { AppShell } from "./AppShell";
import { navigate, useRoute } from "./router";
import { useRouteFocus } from "./useRouteFocus";

export default function App() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const location = useRoute();
  const announcement = useRouteFocus(location);

  // Una ruta desconocida vuelve a la portada sin dejar la URL inválida en el historial.
  useEffect(() => {
    if (!location) navigate("/", { replace: true });
  }, [location]);

  return (
    <AppShell announcement={announcement}>
      <Suspense fallback={<div aria-live="polite">{t("app.loadingPage")}</div>}>
        <AppRoutes location={location} lang={lang} />
      </Suspense>
    </AppShell>
  );
}
