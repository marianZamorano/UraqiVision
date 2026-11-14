export interface IonProviderState {
  enabled: boolean
  mode: 'ion' | 'textual'
  reason?: string
}

export function resolveIonProvider(token?: string): IonProviderState {
  const normalizedToken = String(token ?? '').trim()

  if (!normalizedToken) {
    return {
      enabled: false,
      mode: 'textual',
      reason: 'No ion token configured for the optional globe provider.',
    }
  }

  return {
    enabled: true,
    mode: 'ion',
  }
}
