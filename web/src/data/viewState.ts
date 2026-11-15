// T011 (001-base-web): transiciones puras de la máquina de los seis estados de RF-34 (FR-007 a FR-010).
// Los motivos son claves de traducción (`states.reason.*`); el presentador los traduce al pintar.
import type { EvidenceMode, ViewState } from "../contracts/view-state";
import { StationNotFoundError } from "./publicationRepository";

export function loadingState(requestId: string): ViewState<never> {
  return { kind: "loading", requestId };
}

export function availableState<T>(data: T, evidenceMode: EvidenceMode): ViewState<T> {
  return { kind: "available", data, evidenceMode };
}

export function noDataState(reason: string): ViewState<never> {
  return { kind: "no-data", reason };
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Convierte un fallo de carga en estado. Una cancelación devuelve `null`: esa respuesta ya no es la vigente y
 * se descarta. Una estación sin publicación es «sin datos», nunca un cero (RN-13).
 */
export function viewStateFromError(error: unknown, retry: () => void): ViewState<never> | null {
  if (isAbort(error)) return null;
  if (error instanceof StationNotFoundError) return noDataState("states.reason.station-not-found");
  return { kind: "error", message: "states.reason.load-failed", retry };
}
