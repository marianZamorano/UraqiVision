import type { ViewState } from '../contracts/view-state'

type ViewStatePresenterProps<T> = {
  state: ViewState<T>
  onRetry?: () => void
}

export function ViewStatePresenter<T>({ state, onRetry }: ViewStatePresenterProps<T>) {
  const statusLabel =
    state.status === 'available'
      ? 'result'
      : state.status === 'limited'
        ? 'limited'
        : state.status === 'no-data'
          ? 'no-data'
          : state.status === 'incompatible-date'
            ? 'incompatible-date'
            : state.status === 'error'
              ? 'error'
              : 'loading'

  return (
    <section className="view-state" aria-live="polite" aria-atomic="true">
      <p className="view-state__label">{statusLabel}</p>
      <h2>{state.message}</h2>
      {state.status !== 'loading' && 'reason' in state && state.reason ? <p>{state.reason}</p> : null}
      {state.status === 'error' && state.retry ? (
        <button type="button" onClick={state.retry || onRetry} className="button-primary">
          {state.language === 'es' ? 'Reintentar' : 'Retry'}
        </button>
      ) : null}
    </section>
  )
}
