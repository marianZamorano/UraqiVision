import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Language, PublishedStation, ViewState } from '../contracts/view-state'
import { createLoadingState, createPublishedStationState, createErrorState } from '../data/viewState'
import { fetchStation } from '../data/publicationRepository'
import { ViewStatePresenter } from '../app/ViewStatePresenter'
import { getDictionary } from '../i18n'

type StationPageProps = {
  lang: Language
}

export function StationPage({ lang }: StationPageProps) {
  const { stationId } = useParams()
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
      </section>
    )
  }

  return <ViewStatePresenter state={state} onRetry={retry} />
}
