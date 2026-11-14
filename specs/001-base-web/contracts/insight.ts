/** §21.1: solicitud normativa; respuesta propuesta de diseño. */
export interface InsightRequest { station_id: string; question: string; lang: "es" | "en" }
export interface InsightCitation { source: string; acquired_at?: string; artifact?: string }
export interface InsightResponse {
  answer: string; citations: InsightCitation[]; limitations: string[];
  causal_claim: "not-claimed" | "hypothesis-with-source";
}
export interface InsightError {
  code: "invalid-request" | "station-not-found" | "rate-limited" | "upstream-error";
  message: string; retryable: boolean;
}
/** POST /api/insight, application/json, sin claves de IA en el navegador. */
export type InsightResult =
  | { ok: true; status: 200; data: InsightResponse }
  | { ok: false; status: number; error: InsightError };
