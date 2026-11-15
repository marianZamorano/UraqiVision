// Shell de la aplicación (001 T016, T039): enlace para saltar al contenido, marca, navegación principal, selector
// de idioma y región de anuncios del cambio de página. Todo traducido (RNF-03) y operable con teclado (RNF-04).
import type { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLink } from "./router";
import { MAIN_CONTENT_ID } from "./useRouteFocus";
import "./shell.css";

type AppShellProps = {
  children: ReactNode;
  announcement?: string;
};

function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
  // Sin cambiar la URL (el hash no es una ruta): el foco pasa al <main>.
  event.preventDefault();
  document.getElementById(MAIN_CONTENT_ID)?.focus();
}

export function AppShell({ children, announcement = "" }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <a className="skip-link" href={`#${MAIN_CONTENT_ID}`} onClick={skipToContent}>
        {t("app.skipToContent")}
      </a>

      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">U</span>
          <div>
            <strong>{t("app.title")}</strong>
            <small>{t("app.subtitle")}</small>
          </div>
        </div>

        <nav aria-label={t("app.mainNavigation")} className="main-nav">
          <NavLink to="/" end>{t("app.home")}</NavLink>
          <NavLink to="/explore">{t("app.exploreNav")}</NavLink>
          <NavLink to="/method">{t("app.method")}</NavLink>
          <NavLink to="/about">{t("app.about")}</NavLink>
        </nav>

        <LanguageSwitcher />
      </header>

      <main id={MAIN_CONTENT_ID} className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
