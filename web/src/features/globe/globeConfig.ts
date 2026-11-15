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

/** Vista de entrada (#115): la Tierra entera con Bolivia al frente. Altura de la cámara en metros. */
export const EARTH_VIEW = { longitude: BOLIVIA_CENTER[0], latitude: BOLIVIA_CENTER[1], height: 20_000_000 } as const;

/** Duración del vuelo de cámara (RF-25); con movimiento reducido el cambio es instantáneo (RNF-12). */
export const FLIGHT_SECONDS = 2.5;

/** Destino de la cámara del globo: la Tierra entera o Bolivia encuadrada. */
export type GlobeTarget = "earth" | "bolivia";

/** Pedido de vuelo: `seq` cambia en cada pedido, así «Volver a Bolivia» funciona aunque ya se esté en Bolivia. */
export type GlobeFlight = { target: GlobeTarget; seq: number };
