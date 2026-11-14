// uraqi: vivo — lo carga el visor por nombre
export interface IonProviderState {
  enabled: boolean
  mode: 'ion' | 'no-ion'
  reason?: string
}

export const ION_TERRAIN_ASSET_ID = 1
export const ION_IMAGERY_ASSET_ID = 2

export function resolveIonProvider(token?: string): IonProviderState {
  const normalizedToken = String(token ?? '').trim()

  if (!normalizedToken) {
    return {
      enabled: false,
      mode: 'no-ion',
      reason: 'No ion token configured for the optional globe provider.',
    }
  }

  return {
    enabled: true,
    mode: 'ion',
  }
}

export function readPublicIonToken(
  env: { readonly VITE_CESIUM_ION_TOKEN?: string } = import.meta.env,
): string {
  return String(env.VITE_CESIUM_ION_TOKEN ?? '').trim()
}
