// T029 (001-base-web): presentador bilingüe de los estados de RF-34, del modo de evidencia (RN-04) y de las
// ausencias (RN-13). Traduce al pintar: el estado solo guarda claves (FR-013, FR-014). Los cambios se anuncian en
// una región viva educada sin mover el foco; el error, como alerta. 004 (M-INTERFAZ) extiende sus mensajes y foco.
import { useTranslation } from "react-i18next";
import type { EvidenceMode, ReportableValue, ViewState } from "../contracts/view-state";
import { formatearHectareas } from "../features/interface/formato/formato";
import { useLanguage } from "../i18n";

type ViewStatePresenterProps<T> = {
  state: ViewState<T>;
};

/** Pinta los estados sin resultado (cargando, limitado, sin datos, fecha incompatible y error). */
export function ViewStatePresenter<T>({ state }: ViewStatePresenterProps<T>) {
  const { t } = useTranslation();
  const detail = "reason" in state ? state.reason : null;

  return (
    <section className="view-state" role="status" aria-live="polite" aria-atomic="true">
      <p className="view-state__label">{t(`states.label.${state.kind}`)}</p>
      <h2>{t(`states.message.${state.kind}`)}</h2>
      {state.kind === "error" ? (
        <>
          <p role="alert">{t(state.message)}</p>
          <button type="button" onClick={state.retry} className="button-primary">
            {t("states.retry")}
          </button>
        </>
      ) : detail ? (
        <p>{t(detail)}</p>
      ) : null}
    </section>
  );
}

/** Modo de evidencia visible: DEMO nunca se presenta como resultado (RN-04). */
export function EvidenceBadge({ mode }: { mode: EvidenceMode }) {
  const { t } = useTranslation();

  return (
    <p className={`evidence-badge evidence-badge--${mode.toLowerCase()}`}>
      <span>{t("evidence.label")}: </span>
      <strong>{mode}</strong>
      {mode === "DEMO" ? <span> {t("evidence.demoNotice")}</span> : null}
    </p>
  );
}

/** Valor publicado: si falta, «no reportada» con su motivo; nunca se sustituye por cero (RN-13). */
export function ReportableValueText({ value }: { value: ReportableValue<number> }) {
  const { t } = useTranslation();
  const lang = useLanguage();

  if (value.value === null || value.status === "not-reported") {
    return (
      <span className="reportable reportable--absent">
        {t("values.notReported")}
        {value.reason ? ` — ${value.reason}` : null}
      </span>
    );
  }

  const number = value.unit === "ha" ? formatearHectareas(value.value, lang) : String(value.value);
  return <span className="reportable">{value.unit ? `${number} ${value.unit}` : number}</span>;
}
