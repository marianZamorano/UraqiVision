import { useEffect, useState } from 'react'
import { Link } from '../app/router'
import { serializeRoute } from '../app/routeState'
import type { Language } from '../contracts/view-state'
import { demoStations, listStations, type StationSummary } from '../data/publicationRepository'
import { useTranslation } from 'react-i18next'
import { GlobeAttribution } from '../features/globe/GlobeAttribution'
import { hasWebGLSupport, resolveGlobeProvider } from '../features/globe/GlobeProvider'
import { resolveFallbackProvider } from '../features/globe/fallbackProvider'
import { readPublicIonToken } from '../features/globe/ionProvider'
import { loadCesiumModule, loadGlobeModule } from '../features/globe/lazyGlobe'

type ExplorePageProps = {
  lang: Language
}

type CesiumModule = Awaited<ReturnType<typeof loadCesiumModule>>

export function ExplorePage({ lang }: ExplorePageProps) {
  const { t } = useTranslation()
  // RNF-01, RF-30: CesiumJS solo se pide aquí y nunca sin WebGL.
  const [decision] = useState(() => resolveGlobeProvider({
    token: readPublicIonToken(),
    webglAvailable: hasWebGLSupport(),
  }))
  // T020: estado explícito del globo; «loading» solo existe si hay WebGL y CesiumJS aún se descarga.
  const [globeLoad, setGlobeLoad] = useState<'loading' | 'ready' | 'failed'>('loading')
  const loadFailed = globeLoad === 'failed'
  // Versión beta (#110): estaciones del endpoint del backend, si está configurado, más los ejemplos DEMO.
  const [stations, setStations] = useState<StationSummary[]>(() => Object.values(demoStations))

  useEffect(() => {
    const controller = new AbortController()
    void listStations(controller.signal).then((list) => {
      if (!controller.signal.aborted) setStations(list)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (decision.mode === 'textual') {
      return
    }

    let active = true
    void loadGlobeModule<CesiumModule | null>(loadCesiumModule, null).then((module) => {
      if (active) {
        setGlobeLoad(module === null ? 'failed' : 'ready')
      }
    })

    return () => {
      active = false
    }
  }, [decision.mode])

  const fallback = resolveFallbackProvider(decision, loadFailed)
  const fallbackMessage = fallback.reason === 'webgl-unavailable'
    ? t('pages.explore.fallbackWebglUnavailable')
    : t('pages.explore.fallbackLoadFailed')

  return (
    <section className="page">
      <div className="panel">
        <h1>{t('pages.explore.title')}</h1>
        <p>{t('pages.explore.description')}</p>

        {fallback.active ? (
          <p role="status">{fallbackMessage}</p>
        ) : globeLoad === 'loading' ? (
          <p role="status">{t('pages.explore.globeLoading')}</p>
        ) : null}

        <ul className="station-list" aria-label={t('pages.explore.stationListLabel')}>
          {stations.map((station) => (
            <li key={station.stationId}>
              <Link to={serializeRoute({ route: 'station', stationId: station.stationId })}>
                {station.label[lang]}
              </Link>
            </li>
          ))}
        </ul>

        <GlobeAttribution
          description={t('pages.explore.globeAttribution')}
          linkLabel={t('pages.explore.globeAttributionLink')}
        />
      </div>
    </section>
  )
}
