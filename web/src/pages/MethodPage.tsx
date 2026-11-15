// Método (001 T022). Textos provisionales: el contenido definitivo es de M-INTERFAZ (RF-15). Traducidos (RNF-03).
import { useTranslation } from "react-i18next";

export function MethodPage() {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="panel">
        <h1>{t("pages.method.title")}</h1>
        <p>{t("pages.method.description")}</p>
        <ul className="info-list">
          <li>{t("pages.method.provenance")}</li>
          <li>{t("pages.method.date")}</li>
          <li>{t("pages.method.absence")}</li>
        </ul>
      </div>
    </section>
  );
}
