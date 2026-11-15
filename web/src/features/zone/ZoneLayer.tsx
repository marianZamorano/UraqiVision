// Zona abierta en el explorador (RF-25, RF-29): los paneles que van sobre el globo sin cambiar de página.
// - Resumen: la ficha a la izquierda, el control del radar a la derecha y la línea de tiempo abajo.
// - «Más información»: la ficha y el control se retiran y el detalle entra por la derecha; el explorador recibe
//   cuánto tapa cada borde (`onCovered`) y el globo desliza la zona hacia la parte libre de la pantalla. La línea de
//   tiempo se queda, corrida al espacio libre: es el control del mapa.
// - En celular y tableta la ficha y el detalle son hojas inferiores: el globo queda arriba.
// - Va en un nodo al FINAL de <body> (como el globo va al principio): ningún ancestro con transform lo desplaza y
//   queda por encima del recorrido y por debajo de la cabecera. Lleva `data-globe-overlay` para que un clic en un
//   panel nunca se lea como clic en el globo.
// - Teclado (RNF-04): Escape cierra el detalle y, sin detalle, la zona; el foco pasa al título del panel que se abre
//   y vuelve al botón «Más información» al cerrar el detalle.
import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link } from "../../app/router";
import { serializeRoute } from "../../app/routeState";
import type { Language } from "../../contracts/view-state";
import type { VistaMapa } from "../map/Respuesta";
import { isDated, viewFor, type GlobeLayerChoice } from "./globeLayers";
import { RadarControl, ZoneCard, ZoneTimeline } from "./ZonePanels";
import type { ZoneSummaryState } from "./useZoneSummary";
import "./zone.css";

// El detalle (respuesta paso a paso, gráfico, parches) solo se descarga al pedir «Más información» (RNF-01).
const ZoneDetail = lazy(() => import("./ZoneDetail"));

/** Cuánto tapan los paneles cada borde de la pantalla, en píxeles. */
export type ZoneCovered = { left: number; right: number; bottom: number };

type ZoneLayerProps = {
  lang: Language;
  stationId: string;
  name: string;
  departamento: string | null;
  /** Carpeta de archivos publicados de la zona, o null si no tiene (ejemplo DEMO o sin backend). */
  base: string | null;
  summary: ZoneSummaryState;
  choice: GlobeLayerChoice;
  onChoice: (choice: GlobeLayerChoice) => void;
  opacity: number;
  onOpacity: (opacity: number) => void;
  detail: boolean;
  onDetail: (open: boolean) => void;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onCovered: (covered: ZoneCovered) => void;
};

const isDesktop = () => typeof window.matchMedia !== "function" || window.matchMedia("(min-width: 769px)").matches;

export function ZoneLayer(props: ZoneLayerProps) {
  const { lang, stationId, name, departamento, base, summary, choice, onChoice, opacity, onOpacity, detail, onDetail, onClose, onCovered } = props;
  const { t } = useTranslation();
  const [host] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    document.body.append(host);
    return () => host.remove();
  }, [host]);

  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const radarRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  // El detalle se monta la primera vez que se pide para esta zona y se queda montado mientras se retira.
  const [detailFor, setDetailFor] = useState<string | null>(null);
  if (detail && detailFor !== stationId) setDetailFor(stationId);

  const vistas = summary.kind === "ready" ? summary.data.vistas : null;
  const estacion = summary.kind === "ready" ? summary.data.estacion : null;
  // Fecha que se está viendo en el globo: la ficha muestra la cifra publicada de esa fecha.
  const shownDate = vistas && isDated(choice.layer) ? viewFor(vistas, choice)?.fecha ?? null : null;
  const estado = summary.kind === "ready" ? summary.data.estacion.estado : null;
  const eyebrow = [departamento, estado ? t(`zone.status.${estado}`, { defaultValue: estado }) : null].filter(Boolean).join(" · ");

  // Escape: primero el detalle, después la zona.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (detail) onDetail(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail, onDetail, onClose]);

  // Foco: al abrir una zona, a su título; al abrir el detalle, al suyo; al cerrarlo, de vuelta al botón.
  const hadDetail = useRef(false);
  useEffect(() => {
    if (detail) detailHeadingRef.current?.focus({ preventScroll: true });
    else if (hadDetail.current) moreRef.current?.focus({ preventScroll: true });
    else headingRef.current?.focus({ preventScroll: true });
    hadDetail.current = detail;
  }, [detail, stationId]);

  // Qué parte de la pantalla tapan los paneles. Se mide con offset* (no con el rectángulo dibujado) para que las
  // transiciones de entrada y salida no cambien la medida: el globo va directo a su sitio final.
  useLayoutEffect(() => {
    const measure = () => {
      const header = document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;
      layerRef.current?.style.setProperty("--zone-top", `${Math.max(0, Math.round(header))}px`);
      const card = cardRef.current;
      const radar = radarRef.current;
      const panel = detailRef.current;
      const timeline = timelineRef.current;
      if (isDesktop()) {
        const left = detail ? 0 : card ? card.offsetLeft + card.offsetWidth : 0;
        const detailWidth = detail ? panel?.offsetWidth ?? 0 : 0;
        // La línea de tiempo va abajo, entre la ficha (o el borde) y el detalle (o el borde).
        layerRef.current?.style.setProperty("--zone-left", `${left}px`);
        layerRef.current?.style.setProperty("--zone-right", `${detailWidth}px`);
        onCovered({
          left,
          right: detail ? detailWidth : radar ? Math.max(0, window.innerWidth - radar.offsetLeft) : 0,
          bottom: timeline ? Math.max(0, window.innerHeight - timeline.offsetTop) : 0,
        });
      } else {
        onCovered({ left: 0, right: 0, bottom: (detail ? panel : sheetRef.current)?.offsetHeight ?? 0 });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    for (const element of [cardRef.current, radarRef.current, detailRef.current, sheetRef.current, timelineRef.current]) {
      if (element && observer) observer.observe(element);
    }
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [detail, vistas, onCovered]);

  // Los pasos del detalle llevan «ver en el mapa»: aquí el mapa es el globo.
  const see = (vista: VistaMapa, fecha?: string) => {
    if (vista === "validated") return;
    onChoice({ layer: vista, date: fecha });
  };

  return createPortal(
    <div className="zone-layer" ref={layerRef} style={{ "--zone-top": "0px" } as CSSProperties}>
      <div className="zone-sheet" ref={sheetRef} data-hidden={detail || undefined}>
        <ZoneCard
          stationId={stationId}
          name={name}
          departamento={departamento}
          lang={lang}
          summary={summary}
          date={shownDate}
          hidden={detail}
          canOpenDetail={base !== null}
          cardRef={cardRef}
          headingRef={headingRef}
          moreRef={moreRef}
          onMore={() => onDetail(true)}
          onClose={onClose}
          onPrevious={props.onPrevious}
          onNext={props.onNext}
        />
        {vistas ? (
          <section
            className="zone-radar zone-glass"
            ref={radarRef}
            data-globe-overlay=""
            data-hidden={detail || undefined}
            inert={detail}
            aria-hidden={detail || undefined}
            aria-labelledby="zone-radar-title"
          >
            <h3 id="zone-radar-title" className="tour-eyebrow">{t("zone.radar.title")}</h3>
            <RadarControl vistas={vistas} choice={choice} onChoice={onChoice} opacity={opacity} onOpacity={onOpacity} />
          </section>
        ) : null}
        {vistas && estacion ? (
          <ZoneTimeline key={stationId} estacion={estacion} vistas={vistas} choice={choice} onChoice={onChoice} timelineRef={timelineRef} />
        ) : null}
      </div>

      <aside
        className="zone-detail zone-glass"
        ref={detailRef}
        data-globe-overlay=""
        data-open={detail || undefined}
        inert={!detail}
        aria-hidden={!detail || undefined}
        aria-labelledby="zone-detail-title"
      >
        <header className="zone-head">
          <div>
            <p className="tour-eyebrow">{eyebrow || t("zone.eyebrow")}</p>
            <h2 id="zone-detail-title" tabIndex={-1} ref={detailHeadingRef}>{name}</h2>
          </div>
          <div className="zone-head__actions">
            <button type="button" className="zone-icon" aria-label={t("zone.detail.close")} title={t("zone.detail.close")} onClick={() => onDetail(false)}>×</button>
          </div>
        </header>

        {base && detailFor === stationId ? (
          <Suspense fallback={<p role="status">{t("zone.loading")}</p>}>
            <ZoneDetail base={base} lang={lang} onSee={see} />
          </Suspense>
        ) : null}

        <p className="zone-detail__full">
          <Link className="button-secondary" to={serializeRoute({ route: "station", stationId })}>
            {t("zone.detail.fullMap")}
          </Link>
          <span className="zone-note">{t("zone.detail.fullMapNote")}</span>
        </p>
      </aside>
    </div>,
    host,
  );
}
