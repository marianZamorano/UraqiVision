// #121 (DP-07, RNF-06, RNF-11): modelos 3D glTF/GLB adicionales para el escenario del globo. Solo archivos servidos
// por el propio sitio (web/public/models/), nunca de Cesium ion: el token público solo puede usar los assets 1 y 2.
// Cada modelo lleva su crédito, que el visor muestra junto a los demás. La lista empieza vacía: un modelo se agrega
// solo cuando el equipo lo aprueba con su licencia.
import type { CesiumModule } from "./GlobeView";

export type LocalModel = {
  id: string;
  /** Ruta local: /models/<nombre>.glb o .gltf */
  url: string;
  longitude: number;
  latitude: number;
  /** Altura en metros sobre el elipsoide (órbita, por ejemplo). */
  height: number;
  scale?: number;
  /** Autor y licencia del modelo (RNF-11). */
  credit: string;
};

/** Modelos aprobados por el equipo. Vacía hasta tener uno con licencia compatible. */
export const ORBITAL_MODELS: readonly LocalModel[] = [];

const LOCAL_MODEL_URL = /^\/models\/[a-z0-9][a-z0-9._-]*\.(glb|gltf)$/i;

/** Solo rutas locales bajo /models/, sin protocolo, dominio ni «..». */
export function isLocalModelUrl(url: string): boolean {
  return LOCAL_MODEL_URL.test(url) && !url.includes("..");
}

type Viewer = InstanceType<CesiumModule["Viewer"]>;

/** Carga los modelos válidos en la escena; uno que falla no impide los demás. Devuelve cuántos se agregaron. */
export async function addLocalModels(C: CesiumModule, viewer: Viewer, models: readonly LocalModel[]): Promise<number> {
  let added = 0;
  for (const model of models) {
    if (!isLocalModelUrl(model.url) || !model.credit.trim()) continue;
    try {
      const primitive = await C.Model.fromGltfAsync({
        url: model.url,
        modelMatrix: C.Transforms.eastNorthUpToFixedFrame(
          C.Cartesian3.fromDegrees(model.longitude, model.latitude, model.height),
        ),
        scale: model.scale ?? 1,
        credit: model.credit,
      });
      if (viewer.isDestroyed()) return added;
      viewer.scene.primitives.add(primitive);
      added += 1;
    } catch {
      // Un modelo que no carga se omite: el globo sigue funcionando sin él.
    }
  }
  if (added > 0 && !viewer.isDestroyed()) viewer.scene.requestRender();
  return added;
}
