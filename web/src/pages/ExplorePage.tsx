import { useCallback, useEffect, useState } from 'react'
import { Link } from '../app/router'
import { serializeRoute } from '../app/routeState'
import { useReducedMotion } from '../app/useReducedMotion'
import type { Language } from '../contracts/view-state'
import { demoStations, listStations, usesPublishedApi, type StationSummary } from '../data/publicationRepository'
import { useTranslation } from 'react-i18next'
import { GlobeAttribution } from '../features/globe/GlobeAttribution'
import { hasWebGLSupport, resolveGlobeProvider } from '../features/globe/GlobeProvider'
import { GlobeView, type CesiumModule } from '../features/globe/GlobeView'
import { resolveFallbackProvider } from '../features/globe/fallbackProvider'
import { globeConfigFor, type GlobeFlight, type GlobeTarget } from '../features/globe/globeConfig'
import { readPublicIonToken } from '../features/globe/ionProvider'
import { loadCesiumModule, loadGlobeModule } from '../features/globe/lazyGlobe'

type ExplorePageProps = {
  lang: Language
}

export function ExplorePage({ lang }: ExplorePageProps) {
  const { t } = useTranslation()
  // RNF-01, RF-30: CesiumJS solo se pide aquí y nunca sin WebGL. La decisión y la configuración se fijan una vez.
  const [{ decision, config }] = useState(() => {
    const token = readPublicIonToken()
    const decision = resolveGlobeProvider({ token, webglAvailable: hasWebGLSupport() })
    return { decision, config: globeConfigFor(decision.mode === 'ion' ? 'ion' : 'no-ion', token) }
  })
  // T020 y #115: estado explícito del globo; «loading» mientras baja CesiumJS o se crea el visor.
  const [globeLoad, setGlobeLoad] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [cesium, setCesium] = useState<CesiumModule | null>(null)
  const loadFailed = globeLoad === 'failed'
  const onGlobeReady = useCallback(() => setGlobeLoad('ready'), [])
  const onGlobeError = useCallback(() => setGlobeLoad('failed'), [])
  // #115 (RF-25, RF-28, RNF-12): se entra viendo la Tierra entera; el clic en Bolivia o los botones piden un vuelo.
  const reducedMotion = useReducedMotion()
  const [flight, setFlight] = useState<GlobeFlight>({ target: 'earth', seq: 0 })
  const flyTo = useCallback((target: GlobeTarget) => setFlight((f) => ({ target, seq: f.seq + 1 })), [])
  const onSelectBolivia = useCallback(() => flyTo('bolivia'), [flyTo])
  const atBolivia = flight.target === 'bolivia'
  // Versión beta (#110): estaciones publicadas por el backend; los ejemplos DEMO solo si no hay backend (RN-04).
  // Con backend, la lista empieza vacía para no mostrar un instante ejemplos que después desaparecen.
  const [stations, setStations] = useState<StationSummary[]>(() => (usesPublishedApi ? [] : Object.values(demoStations)))

  useEffect(() => {
    const controller = new AbortController()
    listStations(controller.signal).then((list) => {
      if (!controller.signal.aborted) setStations(list)
    }, () => undefined)
    return () => controller.abort()
  }, [])

  // Agrupadas por departamento cuando el backend lo informa; los ejemplos DEMO van sin grupo.
  const grupos = stations.reduce<Array<{ departamento: string | null; items: StationSummary[] }>>((acc, st) => {
    const dep = st.departamento ?? null
    const grupo = acc.find((g) => g.departamento === dep)
    if (grupo) grupo.items.push(st)
    else acc.push({ departamento: dep, items: [st] })
    return acc
  }, [])

  useEffect(() => {
    if (decision.mode === 'textual') {
      return
    }

    let active = true
    void loadGlobeModule<CesiumModule | null>(loadCesiumModule, null).then((module) => {
      if (!active) return
      if (module === null) setGlobeLoad('failed')
      else setCesium(module)
    })

    return () => {
      active = false
    }
  }, [decision.mode])

  const fallback = resolveFallbackProvider(decision, loadFailed)
  const fallbackMessage = fallback.reason === 'webgl-unavailable'
    ? t('pages.explore.fallbackWebglUnavailable')
    : t('pages.explore.fallbackLoadFailed')
  const showGlobe = cesium !== null && !fallback.active

  return (
    <>
      {/* Globo como fondo fijo del explorador (#115): detrás del contenido y sin bloquear el desplazamiento. */}
      {showGlobe ? (
        <GlobeView
          cesium={cesium}
          config={config}
          label={t('pages.explore.globeLabel')}
          boliviaLabel={t('pages.explore.boliviaMarker')}
          flight={flight}
          reducedMotion={reducedMotion}
          onSelectBolivia={onSelectBolivia}
          onReady={onGlobeReady}
          onError={onGlobeError}
        />
      ) : null}

      <section className={showGlobe ? 'page explore-page explore-page--globe' : 'page explore-page'}>
        <div className="panel" data-globe-overlay="">
          <h1>{t('pages.explore.title')}</h1>
          <p>{t('pages.explore.description')}</p>

          {fallback.active ? (
            <p role="status">{fallbackMessage}</p>
          ) : globeLoad === 'loading' ? (
            <p role="status">{t('pages.explore.globeLoading')}</p>
          ) : null}

          {showGlobe && globeLoad === 'ready' ? (
            <div className="globe-controls">
              {atBolivia ? null : <p>{t('pages.explore.globeHint')}</p>}
              <button type="button" onClick={() => flyTo('bolivia')}>
                {atBolivia ? t('pages.explore.backToBolivia') : t('pages.explore.goToBolivia')}
              </button>
              {atBolivia ? (
                <button type="button" onClick={() => flyTo('earth')}>{t('pages.explore.viewEarth')}</button>
              ) : null}
            </div>
          ) : null}
          <p className="visually-hidden" aria-live="polite">
            {flight.seq > 0 ? t(atBolivia ? 'pages.explore.announceBolivia' : 'pages.explore.announceEarth') : ''}
          </p>

          {grupos.map((grupo) => (
            <section key={grupo.departamento ?? 'sin-departamento'} aria-label={grupo.departamento ?? t('pages.explore.stationListLabel')}>
              {grupo.departamento ? <h2 className="station-group">{grupo.departamento}</h2> : null}
              <ul className="station-list" aria-label={t('pages.explore.stationListLabel')}>
                {grupo.items.map((station) => (
                  <li key={station.stationId}>
                    <Link to={serializeRoute({ route: 'station', stationId: station.stationId })}>
                      {station.label[lang]}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <GlobeAttribution
            description={t('pages.explore.globeAttribution')}
            linkLabel={t('pages.explore.globeAttributionLink')}
          />
        </div>
      </section>
    </>
  )
}
