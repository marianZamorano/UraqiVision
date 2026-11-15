// Zona abierta en el explorador (RF-25, RF-29): la ficha resumen, el control del radar y la línea de tiempo que van
// sobre el globo.
// - Todo sale de lo publicado (§17.3): la web no calcula cifras (RF-09, RF-37). Las hectáreas van con su rango
//   (RN-06), las clases son hipótesis «compatible con…» (RN-05), el modo de evidencia va visible (RN-04) y un dato
//   ausente nunca se muestra como cero (RN-13): en la línea base no hay cifra, se dice que todavía no se mide.
// - Poco texto: la cifra, el gráfico y la imagen cuentan la historia; lo demás queda plegado o en el detalle.
// - Textos en es.json/en.json (RNF-03); controles reales y operables con teclado (RNF-04).
import { useEffect, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { ReportableValueText, ViewStatePresenter } from "../../app/ViewStatePresenter";
import type { Language } from "../../contracts/view-state";
import { useStationView } from "../../data/useStationView";
import { formatearHectareas } from "../interface/formato/formato";
import { CLASES, type IndiceVistas, type ResumenZona, type StationRaw } from "../map/stationFiles";
import { availableLayers, isDated, legendOf, timelineDates, viewFor, type GlobeLayerChoice } from "./globeLayers";
import type { ZoneSummaryState } from "./useZoneSummary";

const numero = (texto: string | undefined) => {
  const n = Number(texto);
  return texto !== undefined && texto !== "" && Number.isFinite(n) ? n : null;
};

/** Hectáreas por fecha con su rango: barras mínimas, sin ejes; resalta la fecha que se está viendo en el globo. */
function Trend({ rows, lang, current }: { rows: Record<string, string>[]; lang: Language; current: string | null }) {
  const { t } = useTranslation();
  // Una fila sin valor no se dibuja como cero (RN-13): se omite.
  const points = rows.flatMap((r) => {
    const value = numero(r.hectareas);
    return r.fecha && value !== null ? [{ date: r.fecha, value, min: numero(r.rango_inferior), max: numero(r.rango_superior) }] : [];
  });
  const first = points[0];
  const last = points[points.length - 1];
  const top = Math.max(...points.map((p) => p.max ?? p.value));
  if (!first || !last || points.length < 2 || !(top > 0)) return null;
  const W = 240;
  const H = 48;
  const step = W / points.length;
  const bar = Math.min(18, step * 0.55);
  const y = (value: number) => H - (value / top) * (H - 4);
  return (
    <figure className="zone-trend">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t("zone.trendLabel", {
          from: first.date, a: formatearHectareas(first.value, lang), to: last.date, b: formatearHectareas(last.value, lang),
        })}
      >
        {points.map((p, i) => {
          const x = i * step + step / 2;
          // Lo que todavía no había ocurrido en la fecha elegida va atenuado.
          const later = current !== null && p.date > current;
          return (
            <g key={p.date} data-later={later || undefined} data-current={p.date === current || undefined}>
              <rect className="zone-trend__bar" x={x - bar / 2} y={y(p.value)} width={bar} height={H - y(p.value)} />
              {p.min !== null && p.max !== null ? <line className="zone-trend__range" x1={x} x2={x} y1={y(p.max)} y2={y(p.min)} /> : null}
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{first.date}</span>
        <span>{t("zone.trend")}</span>
        <span>{last.date}</span>
      </figcaption>
    </figure>
  );
}

/** Los parches por clase (RN-05): hipótesis con su superficie publicada, nunca una causa confirmada. */
function Classes({ data, lang }: { data: ResumenZona; lang: Language }) {
  const { t } = useTranslation();
  const rows = data.estacion.resumen_clases_ha ?? [];
  const total = rows.reduce((sum, r) => sum + r.ha, 0);
  if (!rows.length || !(total > 0)) return <p className="zone-note">{t("values.notReported")}</p>;
  const color: Record<string, string> = Object.fromEntries(CLASES.map((k) => [k.id, k.color]));
  return (
    <>
      <div className="zone-classes__bar" aria-hidden="true">
        {rows.map((r) => (r.ha > 0 ? <span key={r.clase} style={{ width: `${(r.ha / total) * 100}%`, background: color[r.clase] }} /> : null))}
      </div>
      <ul className="zone-classes">
        {rows.map((r) => (
          <li key={r.clase}>
            <span className="zone-swatch" style={{ background: color[r.clase] }} aria-hidden="true" />
            <span>{t(`stationMap.class.${r.clase}`)}</span>
            <strong>{formatearHectareas(r.ha, lang)} ha</strong>
          </li>
        ))}
      </ul>
      <p className="zone-note">{t("zone.classesNote")}</p>
    </>
  );
}

type ZoneCardProps = {
  stationId: string;
  name: string;
  departamento: string | null;
  lang: Language;
  summary: ZoneSummaryState;
  /** Fecha que se está viendo en el globo (línea de tiempo); null si la capa no lleva fecha: vale la última. */
  date: string | null;
  /** Con el detalle abierto la ficha se retira (sigue montada para la transición). */
  hidden: boolean;
  /** Solo las zonas con archivos publicados tienen detalle. */
  canOpenDetail: boolean;
  cardRef: Ref<HTMLElement>;
  headingRef: Ref<HTMLHeadingElement>;
  moreRef: Ref<HTMLButtonElement>;
  onMore: () => void;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function ZoneCard(props: ZoneCardProps) {
  const { stationId, name, departamento, lang, summary, date, hidden, canOpenDetail } = props;
  const { t } = useTranslation();
  const { view } = useStationView(stationId);
  const [question, setQuestion] = useState<"where" | "what">("where");
  const data = summary.kind === "ready" ? summary.data : null;
  const estado = data?.estacion.estado;
  const eyebrow = [departamento, estado ? t(`zone.status.${estado}`, { defaultValue: estado }) : null].filter(Boolean).join(" · ");

  // La cifra sigue a la línea de tiempo: la fila publicada de esa fecha. Antes de la primera medición (línea base)
  // no hay cifra, y eso se dice: nunca se muestra un cero (RN-13).
  const rows = data?.hect ?? [];
  const firstMeasured = rows[0]?.fecha;
  const beforeMeasuring = date !== null && firstMeasured !== undefined && date < firstMeasured;
  const row = beforeMeasuring ? undefined : rows.find((r) => r.fecha === date) ?? rows[rows.length - 1];
  const hectareas = numero(row?.hectareas);
  const min = numero(row?.rango_inferior);
  const max = numero(row?.rango_superior);
  const baseline = data?.estacion.linea_base?.fechas ?? [];
  const usable = data?.estacion.fechas.filter((f) => f.estado === "ok").length;
  const orbita = data?.estacion.orbita;
  const limits = (data?.estacion.limites ?? []).map((code) => t(`limits.${code}`, { start: baseline[baseline.length - 1] ?? "" }));

  return (
    <section
      ref={props.cardRef}
      className="zone-card zone-glass"
      data-globe-overlay=""
      data-hidden={hidden || undefined}
      inert={hidden}
      aria-hidden={hidden || undefined}
      aria-labelledby="zone-title"
    >
      <header className="zone-head">
        <p className="tour-eyebrow">{eyebrow || t("zone.eyebrow")}</p>
        <div className="zone-head__actions">
          {props.onPrevious ? (
            <button type="button" className="zone-icon" aria-label={t("zone.previous")} title={t("zone.previous")} onClick={props.onPrevious}>‹</button>
          ) : null}
          {props.onNext ? (
            <button type="button" className="zone-icon" aria-label={t("zone.next")} title={t("zone.next")} onClick={props.onNext}>›</button>
          ) : null}
          <button type="button" className="zone-icon" aria-label={t("zone.close")} title={t("zone.close")} onClick={props.onClose}>×</button>
        </div>
      </header>
      <h2 id="zone-title" tabIndex={-1} ref={props.headingRef}>{name}</h2>

      {view.kind !== "available" ? (
        <ViewStatePresenter state={view} />
      ) : (
        <>
          {/* RN-04: el modo de evidencia siempre a la vista; DEMO nunca pasa por resultado. */}
          <p className={`zone-chip zone-chip--${view.evidenceMode.toLowerCase()}`}>
            <span className="visually-hidden">{t("evidence.label")}: </span>
            <strong>{view.evidenceMode}</strong>
            {view.evidenceMode === "DEMO" ? <span> · {t("evidence.demoNotice")}</span> : null}
          </p>

          <div className="zone-tabs" role="group" aria-label={t("zone.questions")}>
            {(["where", "what"] as const).map((q) => (
              <button key={q} type="button" aria-pressed={question === q} onClick={() => setQuestion(q)}>
                {t(`zone.q.${q}`)}
              </button>
            ))}
          </div>

          {summary.kind === "loading" ? <p role="status">{t("zone.loading")}</p> : null}
          {summary.kind === "error" ? <p role="alert">{t("zone.error")}</p> : null}

          {question === "where" ? (
            <div className="zone-answer" aria-live="polite">
              {beforeMeasuring ? (
                <>
                  <p className="zone-figure zone-figure--none" aria-hidden="true">—</p>
                  <p className="zone-what">{t("zone.noChangeYet")}</p>
                </>
              ) : (
                <>
                  <p className="zone-figure">
                    {hectareas !== null ? (
                      <>
                        {formatearHectareas(hectareas, lang)} <span>ha</span>
                      </>
                    ) : (
                      <ReportableValueText value={view.data.area} />
                    )}
                  </p>
                  {min !== null && max !== null ? (
                    <p className="zone-range">{t("zone.range", { min: formatearHectareas(min, lang), max: formatearHectareas(max, lang) })}</p>
                  ) : null}
                  {row?.fecha ? <p className="zone-what">{t("zone.headline", { date: row.fecha })}</p> : null}
                  {row?.confirmada === "no" ? <p className="zone-note">{t("zone.unconfirmed")}</p> : null}
                </>
              )}
              {data ? <Trend rows={rows} lang={lang} current={date} /> : null}
            </div>
          ) : (
            <div className="zone-answer">{data ? <Classes data={data} lang={lang} /> : null}</div>
          )}

          {data ? (
            <dl className="zone-facts">
              <div>
                <dt>{t("zone.facts.dates")}</dt>
                <dd>{usable}</dd>
              </div>
              <div>
                <dt>{t("zone.facts.baseline")}</dt>
                <dd>{baseline.length || t("values.notReported")}</dd>
              </div>
              <div>
                <dt>{t("zone.facts.orbit")}</dt>
                <dd>{orbita ? `${String(orbita.track).padStart(3, "0")}${orbita.direccion}` : t("values.notReported")}</dd>
              </div>
            </dl>
          ) : null}

          {limits.length ? (
            <details className="zone-limits">
              <summary>{t("zone.limits", { n: limits.length })}</summary>
              <ul>{limits.map((text) => <li key={text}>{text}</li>)}</ul>
            </details>
          ) : null}

          {canOpenDetail ? (
            <button type="button" className="button-primary zone-more" ref={props.moreRef} onClick={props.onMore}>
              {t("zone.more")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

type LayerControlProps = {
  vistas: IndiceVistas;
  choice: GlobeLayerChoice;
  onChoice: (choice: GlobeLayerChoice) => void;
  opacity: number;
  onOpacity: (opacity: number) => void;
};

/** Qué imagen de radar se extiende sobre el globo (RF-08) y con qué opacidad. La fecha va en la línea de tiempo. */
export function RadarControl({ vistas, choice, onChoice, opacity, onOpacity }: LayerControlProps) {
  const { t } = useTranslation();
  const layers = availableLayers(vistas);
  if (!layers.length) return null;
  const pct = Math.round(opacity * 100);
  return (
    <div className="zone-radar__body">
      <div className="zone-buttons" role="group" aria-label={t("zone.radar.layer")}>
        {layers.map((layer) => (
          <button key={layer} type="button" aria-pressed={layer === choice.layer} title={t(`view.${layer}`)} onClick={() => onChoice({ layer, date: choice.date })}>
            {t(`zone.radar.layers.${layer}`)}
          </button>
        ))}
      </div>
      <label className="zone-opacity">
        <span>{t("zone.radar.opacity", { pct })}</span>
        <input type="range" min={20} max={100} step={5} value={pct} onChange={(event) => onOpacity(Number(event.target.value) / 100)} />
      </label>
    </div>
  );
}

/** Cada cuánto avanza la reproducción: lo justo para que la imagen de cada fecha llegue y se vea. */
const PLAY_STEP_MS = 1300;

type ZoneTimelineProps = {
  estacion: StationRaw;
  vistas: IndiceVistas;
  choice: GlobeLayerChoice;
  onChoice: (choice: GlobeLayerChoice) => void;
  timelineRef: Ref<HTMLElement>;
};

/**
 * Línea de tiempo de la zona (RF-06, RF-08): al deslizarla, el globo muestra cada fecha de la serie, de la primera a
 * la última. En la línea base se ve el radar de esa fecha (todavía no hay cambio que medir); después, el cambio
 * medido. Lleva la leyenda de colores de lo que se está viendo y marca el hueco sin datos (RN-13).
 */
export function ZoneTimeline({ estacion, vistas, choice, onChoice, timelineRef }: ZoneTimelineProps) {
  const { t } = useTranslation();
  const dates = timelineDates(vistas);
  const last = dates.length - 1;
  const shown = viewFor(vistas, choice);
  const dated = isDated(choice.layer);
  const at = dated && shown?.fecha ? dates.indexOf(shown.fecha) : -1;
  const index = at >= 0 ? at : last;
  const date = dates[index];
  const [playing, setPlaying] = useState(false);

  // Deslizar siempre muestra algo que cambia con la fecha: desde «lo normal» o «óptico» se pasa al cambio.
  const layer = dated ? choice.layer : "cambio";
  const go = (i: number) => onChoice({ layer, date: dates[i] });

  // Reproducción: avanza una fecha por paso y se detiene sola en la última.
  const nextDate = dates[index + 1];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (nextDate === undefined) setPlaying(false);
      else onChoice({ layer, date: nextDate });
    }, PLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, nextDate, layer, onChoice]);

  if (!date || dates.length < 2) return null;

  const role = estacion.fechas.find((f) => f.fecha === date)?.rol;
  const tag = !dated
    ? t(`zone.radar.layers.${choice.layer}`)
    : role === "linea_base"
      ? t("zone.timeline.baseline")
      : shown?.capa === "cambio" ? t("zone.timeline.change") : t("zone.timeline.radar");
  const legend = legendOf(shown);
  // El hueco sin datos queda entre dos fechas de la serie: se marca en la pista.
  const [gapFrom, gapTo] = estacion.hueco_datos;
  const gapAfter = dates.findIndex((d, i) => d < gapFrom && (dates[i + 1] ?? "") > gapTo);

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // Desde el final (o desde una capa sin fecha) la reproducción empieza en la primera fecha.
    if (index >= last || !dated) go(0);
    setPlaying(true);
  };

  return (
    <section className="zone-timeline zone-glass" ref={timelineRef} data-globe-overlay="" aria-label={t("zone.timeline.title")}>
      <button
        type="button"
        className="zone-icon zone-timeline__play"
        aria-label={playing ? t("zone.timeline.pause") : t("zone.timeline.play")}
        title={playing ? t("zone.timeline.pause") : t("zone.timeline.play")}
        onClick={toggle}
      >
        <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
      </button>

      <div className="zone-timeline__main">
        <p className="zone-timeline__now" aria-live="polite">
          <strong>{dated ? date : tag}</strong>
          {dated ? <span className="zone-timeline__tag" data-baseline={role === "linea_base" || undefined}>{tag}</span> : null}
          <span className="zone-timeline__count">{index + 1} / {dates.length}</span>
        </p>
        <div className="zone-timeline__track" data-idle={!dated || undefined}>
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={index}
            aria-label={t("zone.timeline.slider")}
            aria-valuetext={`${date} · ${tag}`}
            onChange={(event) => {
              setPlaying(false);
              go(Number(event.target.value));
            }}
          />
          <div className="zone-timeline__dots" aria-hidden="true">
            {dates.map((d, i) => (
              <span
                key={d}
                data-baseline={estacion.fechas.find((f) => f.fecha === d)?.rol === "linea_base" || undefined}
                data-past={i <= index || undefined}
              />
            ))}
            {gapAfter >= 0 ? (
              <i className="zone-timeline__gap" style={{ left: `${((gapAfter + 0.5) / last) * 100}%` }} title={t("zone.timeline.gap", { from: gapFrom, to: gapTo })} />
            ) : null}
          </div>
        </div>
        <p className="zone-timeline__ends">
          <span>{dates[0]}</span>
          {gapAfter >= 0 ? <span className="zone-timeline__gapnote">{t("zone.timeline.gap", { from: gapFrom, to: gapTo })}</span> : null}
          <span>{dates[last]}</span>
        </p>
      </div>

      <div className="zone-legend zone-timeline__legend">
        <span className="zone-legend__bar" aria-hidden="true" style={{ background: `linear-gradient(90deg, ${vistas.paletas[legend.palette].join(", ")})` }} />
        <span className="zone-legend__ends">
          {legend.ends.map((key) => <span key={key}>{t(key)}</span>)}
        </span>
        <span className="zone-note">{t("zone.radar.noData")}</span>
      </div>
    </section>
  );
}
