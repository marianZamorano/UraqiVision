// T011 y T030 (001-base-web): carga de una estación con control de la solicitud vigente (RF-34, FR-022).
// Cada solicitud tiene una clave (estación + intento). Cambiar de estación, reintentar o desmontar aborta la anterior,
// y una respuesta que llega tarde se descarta porque su clave ya no es la vigente. El estado de carga se deriva al
// pintar, sin setState síncrono dentro del efecto. El idioma no forma parte de la clave: cambiarlo no recarga.
import { useCallback, useEffect, useState } from "react";
import type { PublishedStation, ViewState } from "../contracts/view-state";
import { fetchStation } from "./publicationRepository";
import { availableState, loadingState, noDataState, viewStateFromError } from "./viewState";

type Settled = { key: string; view: ViewState<PublishedStation> };

export function useStationView(stationId: string | undefined): {
  view: ViewState<PublishedStation>;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const key = `${stationId ?? ""}:${attempt}`;

  useEffect(() => {
    if (!stationId) return;
    const controller = new AbortController();

    fetchStation(stationId, controller.signal).then(
      (station) => {
        if (!controller.signal.aborted) setSettled({ key, view: availableState(station, station.evidenceMode) });
      },
      (error: unknown) => {
        const view = viewStateFromError(error, retry);
        if (view && !controller.signal.aborted) setSettled({ key, view });
      },
    );

    return () => controller.abort();
  }, [stationId, key, retry]);

  if (!stationId) return { view: noDataState("states.reason.no-station-id"), retry };
  return { view: settled?.key === key ? settled.view : loadingState(key), retry };
}
