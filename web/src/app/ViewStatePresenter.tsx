import { useTranslation } from 'react-i18next'
import type { ViewState } from '../contracts/view-state'

type ViewStatePresenterProps<T> = {
  state: ViewState<T>
  onRetry?: () => void
}

export function ViewStatePresenter<T>({ state, onRetry }: ViewStatePresenterProps<T>) {
  const { t } = useTranslation()
  const statusLabel = t(`states.label.${state.status}`)

  return (
    <section className="view-state" aria-live="polite" aria-atomic="true">
      <p className="view-state__label">{statusLabel}</p>
      <h2>{state.message}</h2>
      {state.status !== 'loading' && 'reason' in state && state.reason ? <p>{state.reason}</p> : null}
      {state.status === 'error' && state.retry ? (
        <button type="button" onClick={state.retry || onRetry} className="button-primary">
          {t('states.retry')}
        </button>
      ) : null}
    </section>
  )
}
