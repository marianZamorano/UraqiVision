// Shell de la aplicación (001 T016, T039): enlace para saltar al contenido, marca, navegación principal (solo Inicio y
// Explorador, alineada a la derecha junto al idioma; #129, #131), selector de idioma y región de anuncios del cambio de
// página. Método y Acerca de quedan solo por su ruta (/method, /about), por decisión del equipo (#131). Todo traducido (RNF-03) y operable con teclado (RNF-04).
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
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="uv-orbita" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0" stopColor="var(--paleta-hielo)" />
                  <stop offset="0.5" stopColor="var(--paleta-violeta)" />
                  <stop offset="1" stopColor="var(--paleta-azul-electrico)" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="6.5" stroke="url(#uv-orbita)" strokeWidth="1.6" />
              <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-28 12 12)" stroke="url(#uv-orbita)" strokeWidth="1.1" opacity="0.8" />
              <circle cx="20.2" cy="7.4" r="1.4" fill="var(--paleta-hielo)" />
            </svg>
          </span>
          <strong>{t("app.title")}</strong>
        </div>

        <nav aria-label={t("app.mainNavigation")} className="main-nav">
          <NavLink to="/" end>{t("app.home")}</NavLink>
          <NavLink to="/explore">{t("app.exploreNav")}</NavLink>
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
