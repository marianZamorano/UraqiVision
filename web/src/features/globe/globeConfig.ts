// #115 (RF-02, DP-07, RNF-06): configuración del globo según el proveedor elegido, como GlobeProviderConfig de
// specs/001-base-web/contracts/view-state.ts. El token público solo viaja en modo ion y con los assets aprobados.
import { ION_IMAGERY_ASSET_ID, ION_TERRAIN_ASSET_ID } from "./ionProvider";

export type GlobeConfig =
  | { mode: "ion"; terrainAssetId: typeof ION_TERRAIN_ASSET_ID; imageryAssetId: typeof ION_IMAGERY_ASSET_ID; publicToken: string }
  | { mode: "no-ion" };

/** Encuadre aproximado de Bolivia en grados: oeste, sur, este, norte (vista inicial, sin animación). */
export const BOLIVIA_RECTANGLE = [-69.7, -22.95, -57.4, -9.6] as const;

export function globeConfigFor(mode: "ion" | "no-ion", token: string): GlobeConfig {
  const publicToken = token.trim();
  if (mode === "ion" && publicToken) {
    return { mode: "ion", terrainAssetId: ION_TERRAIN_ASSET_ID, imageryAssetId: ION_IMAGERY_ASSET_ID, publicToken };
  }
  return { mode: "no-ion" };
}

/** Centro del encuadre de Bolivia (derivado de BOLIVIA_RECTANGLE): ahí va el marcador «Bolivia» del globo. */
export const BOLIVIA_CENTER = [
  (BOLIVIA_RECTANGLE[0] + BOLIVIA_RECTANGLE[2]) / 2,
  (BOLIVIA_RECTANGLE[1] + BOLIVIA_RECTANGLE[3]) / 2,
] as const;

/**
 * Hora fija del amanecer cinematográfico (#121): ~07:30 de hora solar en Bolivia (11:30 UTC). El Sol ya ilumina
 * Bolivia y la línea entre el día y la noche cruza el Pacífico, con el brillo cálido en el horizonte. El reloj
 * no avanza: la luz no cambia mientras se navega.
 */
export const SUNRISE_TIME_ISO = "2026-09-01T11:30:00Z";
