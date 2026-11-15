import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../app/router'
import type { Language, PublishedStation, ViewState } from '../contracts/view-state'
import { createLoadingState, createPublishedStationState, createErrorState } from '../data/viewState'
import { fetchStation } from '../data/publicationRepository'
import { ViewStatePresenter } from '../app/ViewStatePresenter'

type StationPageProps = {
  stationId?: string
  lang: Language
}

export function StationPage({ lang, stationId }: StationPageProps) {
  const { t } = useTranslation()
  // El idioma no dispara una nueva carga: cambiarlo solo traduce la vista (FR-013, FR-014).
  const langRef = useRef(lang)
  useEffect(() => {
    langRef.current = lang
  }, [lang])
  const [state, setState] = useState<ViewState<PublishedStation>>(createLoadingState(lang))

  const loadStation = useCallback(
    async (nextStationId: string) => {
      const controller = new AbortController()
      const language = langRef.current
      setState(createLoadingState(language))

      try {
        const station = await fetchStation(nextStationId, controller.signal)
        setState(createPublishedStationState(station, language))
      } catch (error) {
        const message =
          error instanceof Error && error.name === 'AbortError'
            ? language === 'es'
              ? 'Solicitud cancelada'
              : 'Request cancelled'
            : 'No se pudo cargar la estación.'

        setState(createErrorState(language, message, () => {
          if (nextStationId) {
            void loadStation(nextStationId)
          }
        }))
      }
    },
    [],
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
        language: langRef.current,
        message: langRef.current === 'es' ? 'Sin estación' : 'No station',
        reason: 'No station id.',
      })
      return
    }

    void loadStation(stationId)
  }, [loadStation, stationId])

  if (state.status === 'available' && state.data) {
    const station = state.data

    return (
      <section className="page">
        <div className="panel">
          <p className="eyebrow">{t('pages.station.title')}</p>
          <h1>{station.label[lang]}</h1>
          <p>{station.summary[lang]}</p>

          <dl className="meta-grid">
            <div>
              <dt>{t('pages.station.evidence')}</dt>
              <dd>{station.evidenceMode}</dd>
            </div>
            <div>
              <dt>{t('pages.station.orbit')}</dt>
              <dd>{station.orbit}</dd>
            </div>
            <div>
              <dt>{t('pages.station.source')}</dt>
              <dd>{station.provenance.source}</dd>
            </div>
          </dl>

          <div className="station-actions">
            <Link className="button-primary" to="/explore">
              {t('pages.station.back')}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return <ViewStatePresenter state={state} onRetry={retry} />
}
