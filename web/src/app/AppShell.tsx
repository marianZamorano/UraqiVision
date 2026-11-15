// Shell de la aplicación (001 T016): marca, navegación principal y selector de idioma, todo traducido (RNF-03).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLink } from "./router";
import "./shell.css";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
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

      <main id="contenido" className="page-shell">{children}</main>
    </div>
  );
}
