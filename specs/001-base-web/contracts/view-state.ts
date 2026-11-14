import type { EvidenceMode } from "./published-data";

export type ViewState<T> =
  | { kind: "loading"; requestId: string }
  | { kind: "available"; data: T; evidenceMode: EvidenceMode }
  | { kind: "limited"; data: T; evidenceMode: EvidenceMode; reason: string }
  | { kind: "no-data"; reason: string }
  | { kind: "incompatible-date"; reason: string; availablePeriods: string[] }
  | { kind: "error"; message: string; retry: () => void };

export interface RouteState {
  route: "home" | "explore" | "station" | "method" | "about"; lang: "es" | "en";
  departmentId?: string; stationId?: string; period?: string;
}

export interface GlobeProvider {
  readonly mode: "no-ion" | "ion" | "two-dimensional";
  initialize(container: HTMLElement): Promise<void>;
  flyToDepartment(departmentId: string, reducedMotion: boolean): Promise<void>;
  destroy(): void;
}

/** DP-07 cerrada: ion aprobado con token público restringido y respaldos obligatorios. */
export interface GlobeProviderConfig {
  mode: "no-ion" | "ion" | "two-dimensional";
  terrainAssetId?: 1; imageryAssetId?: 2; publicToken?: string;
}
