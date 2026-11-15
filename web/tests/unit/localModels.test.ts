// #121 (DP-07, RNF-11): modelos glTF/GLB locales; nunca de ion ni de otro dominio, siempre con crédito.
import { describe, expect, it, vi } from "vitest";
import type { CesiumModule } from "../../src/features/globe/GlobeView";
import { addLocalModels, isLocalModelUrl, ORBITAL_MODELS, type LocalModel } from "../../src/features/globe/localModels";

function fake(options: { failUrl?: string } = {}) {
  const add = vi.fn();
  const requestRender = vi.fn();
  const fromGltfAsync = vi.fn(async (o: { url: string }) => {
    if (o.url === options.failUrl) throw new Error("no carga");
    return { model: o.url };
  });
  const C = {
    Model: { fromGltfAsync },
    Transforms: { eastNorthUpToFixedFrame: vi.fn((p: unknown) => ({ enu: p })) },
    Cartesian3: { fromDegrees: vi.fn((...d: number[]) => ({ point: d })) },
  } as unknown as CesiumModule;
  const viewer = { isDestroyed: () => false, scene: { primitives: { add }, requestRender } } as never;
  return { C, viewer, add, fromGltfAsync, requestRender };
}

const model = (over: Partial<LocalModel> = {}): LocalModel => ({
  id: "satelite", url: "/models/satelite.glb", longitude: -63, latitude: -16, height: 700_000, credit: "Autor (CC BY 4.0)", ...over,
});

describe("localModels", () => {
  it("la lista empieza vacía hasta que el equipo apruebe un modelo con licencia", () => {
    expect(ORBITAL_MODELS).toEqual([]);
  });

  it("solo acepta rutas locales bajo /models/ con extensión glb o gltf", () => {
    expect(isLocalModelUrl("/models/satelite.glb")).toBe(true);
    expect(isLocalModelUrl("/models/nisar_v2.gltf")).toBe(true);
    expect(isLocalModelUrl("https://assets.ion.cesium.com/1234/model.glb")).toBe(false);
    expect(isLocalModelUrl("//cdn.example.com/models/a.glb")).toBe(false);
    expect(isLocalModelUrl("/models/../secreto.glb")).toBe(false);
    expect(isLocalModelUrl("/models/a.obj")).toBe(false);
    expect(isLocalModelUrl("models/a.glb")).toBe(false);
  });

  it("carga los modelos válidos con su crédito y omite los que no lo son o fallan", async () => {
    const f = fake({ failUrl: "/models/roto.glb" });
    const added = await addLocalModels(f.C, f.viewer, [
      model(),
      model({ id: "externo", url: "https://example.com/a.glb" }),
      model({ id: "sin-credito", url: "/models/b.glb", credit: " " }),
      model({ id: "roto", url: "/models/roto.glb" }),
    ]);

    expect(added).toBe(1);
    expect(f.fromGltfAsync).toHaveBeenCalledTimes(2);
    expect(f.fromGltfAsync).toHaveBeenCalledWith(expect.objectContaining({ url: "/models/satelite.glb", credit: "Autor (CC BY 4.0)" }));
    expect(f.add).toHaveBeenCalledWith({ model: "/models/satelite.glb" });
    expect(f.requestRender).toHaveBeenCalled();
  });

  it("sin modelos no toca la escena", async () => {
    const f = fake();
    expect(await addLocalModels(f.C, f.viewer, [])).toBe(0);
    expect(f.add).not.toHaveBeenCalled();
    expect(f.requestRender).not.toHaveBeenCalled();
  });
});
