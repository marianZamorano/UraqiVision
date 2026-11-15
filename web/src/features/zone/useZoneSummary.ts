// Carga de la ficha de la zona abierta en el explorador: pocos archivos y livianos (RNF-01). Cambiar de zona aborta
// la solicitud anterior y una respuesta tardía se descarta; el estado de carga se deriva al pintar (como
// useStationView), sin setState síncrono dentro del efecto.
import { useEffect, useMemo, useState } from "react";
import { cargarResumenZona, type ResumenZona } from "../map/stationFiles";

export type ZoneSummaryState =
  | { kind: "none" } // zona sin archivos publicados (ejemplo DEMO o sin backend)
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; data: ResumenZona };

export function useZoneSummary(base: string | null): ZoneSummaryState {
  const [settled, setSettled] = useState<{ base: string; data: ResumenZona | null } | null>(null);

  useEffect(() => {
    if (!base) return;
    const controller = new AbortController();
    cargarResumenZona(base, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ base, data });
      },
      () => {
        if (!controller.signal.aborted) setSettled({ base, data: null });
      },
    );
    return () => controller.abort();
  }, [base]);

  return useMemo<ZoneSummaryState>(() => {
    if (!base) return { kind: "none" };
    if (!settled || settled.base !== base) return { kind: "loading" };
    return settled.data ? { kind: "ready", data: settled.data } : { kind: "error" };
  }, [base, settled]);
}
