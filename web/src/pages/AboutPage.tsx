// Acerca de (001 T022). Textos provisionales: el contenido definitivo es de M-INTERFAZ (RF-24). Traducidos (RNF-03).
import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="panel">
        <h1>{t("pages.about.title")}</h1>
        <p>{t("pages.about.description")}</p>
        <p>{t("pages.about.scope")}</p>
      </div>
    </section>
  );
}
