// Portada (001 T019, RF-01): enlace «Explorar Bolivia» sin cargar el globo (RNF-01). Textos traducidos (RNF-03).
import { useTranslation } from "react-i18next";
import { Link } from "../app/router";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="page page--hero">
      <div className="panel panel--hero">
        <p className="eyebrow">{t("app.title")}</p>
        <h1>{t("pages.home.headline")}</h1>
        <p>{t("pages.home.description")}</p>
        <div className="cta-row">
          <Link to="/explore" className="button-primary">
            {t("pages.home.cta")}
          </Link>
          <Link to="/method" className="button-secondary">
            {t("app.method")}
          </Link>
        </div>
      </div>
    </section>
  );
}
