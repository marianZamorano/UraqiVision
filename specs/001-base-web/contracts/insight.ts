/** §21.1: solicitud y respuesta normativas. */
export interface InsightRequest { station_id: string; question: string; lang: "es" | "en" }
export interface InsightResponse {
  answer: string;
  /** §21.1: lista de secciones citadas. */
  citations: string[];
  /** §21.1: "ia" o "plantilla". */
  source: "ia" | "plantilla";
  /** Propuesta de diseño; acordar con M-INSIGHT antes de estabilizarla. */
  limitations?: string[];
  /** Propuesta de diseño; RN-05 exige fuente cuando hay hipótesis. */
  causal_claim?: "not-claimed" | "hypothesis-with-source";
}
export interface InsightError {
  code: "invalid-request" | "station-not-found" | "rate-limited" | "upstream-error";
  message: string; retryable: boolean;
}
/** POST /api/insight, application/json, sin claves de IA en el navegador.
 *  El cliente pertenece a M-INTERFAZ; esta base solo conserva el contrato. */
export type InsightResult =
  | { ok: true; status: 200; data: InsightResponse }
  | { ok: false; status: number; error: InsightError };
