import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Link } from '../app/router'
import type { Language, PublishedStation, ViewState } from '../contracts/view-state'
import { createLoadingState, createPublishedStationState, createErrorState } from '../data/viewState'
import { fetchStation, stationFilesBase } from '../data/publicationRepository'

// PROTOTIPO LOCAL: el mapa (MapLibre) se carga solo en la página de estación (RNF-01).
const StationMap = lazy(() => import('../features/map/StationMap'))
import { ViewStatePresenter } from '../app/ViewStatePresenter'
import { getDictionary } from '../i18n'

type StationPageProps = {
  stationId?: string
  lang: Language
}

export function StationPage({ lang, stationId }: StationPageProps) {
  const dict = getDictionary(lang)
  const [state, setState] = useState<ViewState<PublishedStation>>(createLoadingState(lang))

  const loadStation = useCallback(
    async (nextStationId: string) => {
      const controller = new AbortController()
      setState(createLoadingState(lang))

      try {
        const station = await fetchStation(nextStationId, controller.signal)
        setState(createPublishedStationState(station, lang))
      } catch (error) {
        const message =
          error instanceof Error && error.name === 'AbortError'
            ? lang === 'es'
              ? 'Solicitud cancelada'
              : 'Request cancelled'
            : 'No se pudo cargar la estación.'

        setState(createErrorState(lang, message, () => {
          if (nextStationId) {
            void loadStation(nextStationId)
          }
        }))
      }
    },
    [lang],
  )

  const retry = useCallback(() => {
    if (!stationId) {
      return
    }

    void loadStation(stationId)
  }, [loadStation, stationId])

  useEffect(() => {
    if (!stationId) {
      setState({
        status: 'no-data',
        language: lang,
        message: lang === 'es' ? 'Sin estación' : 'No station',
        reason: 'No station id.',
      })
      return
    }

    void loadStation(stationId)
  }, [lang, loadStation, stationId])

  if (state.status === 'available' && state.data) {
    const station = state.data
    const filesBase = stationFilesBase(station.stationId)

    return (
      <section className="page">
        <div className="panel">
          <p className="eyebrow">{dict.pages.station.title}</p>
          <h1>{station.label[lang]}</h1>
          <p>{station.summary[lang]}</p>

          <dl className="meta-grid">
            <div>
              <dt>Evidence</dt>
              <dd>{station.evidenceMode}</dd>
            </div>
            <div>
              <dt>Orbit</dt>
              <dd>{station.orbit}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{station.provenance.source}</dd>
            </div>
          </dl>

          <div className="station-actions">
            <Link className="button-primary" to="/explore">
              {lang === 'es' ? 'Volver al explorador' : 'Back to explorer'}
            </Link>
          </div>
        </div>
        {filesBase ? (
          <Suspense fallback={<p role="status">{lang === 'es' ? 'Cargando mapa…' : 'Loading map…'}</p>}>
            <StationMap base={filesBase} lang={lang} />
          </Suspense>
        ) : null}
      </section>
    )
  }

  return <ViewStatePresenter state={state} onRetry={retry} />
}
