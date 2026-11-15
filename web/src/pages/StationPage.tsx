// Página de estación (001 T021, T030): conserva el stationId de la ruta y carga su publicación sin recalcular ni
// completar datos (FR-021, RF-34). La carga cancela solicitudes viejas y no depende del idioma (useStationView).
import { useTranslation } from "react-i18next";
import { EvidenceBadge, ReportableValueText, ViewStatePresenter } from "../app/ViewStatePresenter";
import { Link } from "../app/router";
import type { Language } from "../contracts/view-state";
import { useStationView } from "../data/useStationView";

type StationPageProps = {
  stationId?: string;
  lang: Language;
};

export function StationPage({ lang, stationId }: StationPageProps) {
  const { t } = useTranslation();
  const { view } = useStationView(stationId);

  if (view.kind !== "available") return <ViewStatePresenter state={view} />;

  const station = view.data;
  return (
    <section className="page">
      <div className="panel">
        <p className="eyebrow">{t("pages.station.title")}</p>
        <h1>{station.label[lang]}</h1>
        <EvidenceBadge mode={view.evidenceMode} />
        <p>{station.summary[lang]}</p>

        <dl className="meta-grid">
          <div>
            <dt>{t("pages.station.area")}</dt>
            <dd>
              <ReportableValueText value={station.area} />
            </dd>
          </div>
          <div>
            <dt>{t("pages.station.orbit")}</dt>
            <dd>{station.orbit}</dd>
          </div>
          <div>
            <dt>{t("pages.station.source")}</dt>
            <dd>{station.provenance.source}</dd>
          </div>
        </dl>

        <div className="station-actions">
          <Link className="button-primary" to="/explore">
            {t("pages.station.back")}
          </Link>
        </div>
      </div>
    </section>
  );
}
