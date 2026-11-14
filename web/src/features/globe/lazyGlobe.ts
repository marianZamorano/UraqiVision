// uraqi: vivo — lo carga el visor por nombre
export type GlobeModuleLoader<T> = () => Promise<T>

export async function loadGlobeModule<T>(loader: GlobeModuleLoader<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  }
  catch {
    return fallback
  }
}
