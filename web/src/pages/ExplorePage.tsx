import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '../app/router'
import { serializeRoute } from '../app/routeState'
import { useReducedMotion } from '../app/useReducedMotion'
import type { Language } from '../contracts/view-state'
import { demoStations, listStations, usesPublishedApi, type StationSummary } from '../data/publicationRepository'
import { useTranslation } from 'react-i18next'
import { GlobeAttribution } from '../features/globe/GlobeAttribution'
import { hasWebGLSupport, resolveGlobeProvider } from '../features/globe/GlobeProvider'
import { GlobeView, type CesiumModule } from '../features/globe/GlobeView'
import { TOUR_SECTIONS, type TourSection } from '../features/globe/cameraPath'
import { resolveFallbackProvider } from '../features/globe/fallbackProvider'
import { globeConfigFor } from '../features/globe/globeConfig'
import { readPublicIonToken } from '../features/globe/ionProvider'
import { loadCesiumModule, loadGlobeModule } from '../features/globe/lazyGlobe'
import { useTourProgress } from '../features/globe/scrollProgress'

type ExplorePageProps = {
  lang: Language
}

/** Secciones con un dato y su fuente (§4.2 del documento maestro). */
const SOURCED: ReadonlySet<TourSection> = new Set(['southAmerica', 'bolivia'])

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

  // #121 (RF-25, RNF-12): recorrido por secciones; el scroll mueve la cámara del globo.
  const reducedMotion = useReducedMotion()
  const sectionRefs = useRef<Array<HTMLElement | null>>([])
  const { store: progress, active } = useTourProgress(sectionRefs)
  const goTo = useCallback((section: TourSection) => {
    const element = sectionRefs.current[TOUR_SECTIONS.indexOf(section)]
    element?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [reducedMotion])
  const markerLabels = useMemo(
    () => ({ bolivia: t('pages.explore.boliviaMarker'), station: t('pages.explore.stationMarker') }),
    [t],
  )

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
          markerLabels={markerLabels}
          progress={progress}
          reducedMotion={reducedMotion}
          onSelectSection={goTo}
          onReady={onGlobeReady}
          onError={onGlobeError}
        />
      ) : null}

      <div className={showGlobe ? 'explore-tour explore-tour--globe' : 'explore-tour'}>
        <nav className="tour-nav" aria-label={t('pages.explore.tour.nav')} data-globe-overlay="">
          <ol>
            {TOUR_SECTIONS.map((section, i) => (
              <li key={section}>
                <button type="button" aria-current={active === i ? 'step' : undefined} onClick={() => goTo(section)}>
                  <span className="tour-nav__dot" aria-hidden="true" />
                  <span className="tour-nav__label">{t(`pages.explore.tour.${section}.nav`)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {TOUR_SECTIONS.map((section, i) => (
          <section
            key={section}
            ref={(element) => {
              sectionRefs.current[i] = element
            }}
            className={`tour-section tour-section--${section}`}
            aria-labelledby={`tour-${section}`}
          >
            <div className="tour-panel" data-globe-overlay="">
              <p className="tour-eyebrow">{t(`pages.explore.tour.${section}.eyebrow`)}</p>
              {section === 'earth' ? (
                <h1 id="tour-earth">{t('pages.explore.title')}</h1>
              ) : (
                <h2 id={`tour-${section}`}>{t(`pages.explore.tour.${section}.title`)}</h2>
              )}
              <p className="tour-lead">{t(`pages.explore.tour.${section}.body`)}</p>
              {SOURCED.has(section) ? (
                <p className="tour-source">{t(`pages.explore.tour.${section}.source`)}</p>
              ) : null}

              {section === 'earth' ? (
                <>
                  {fallback.active ? (
                    <p role="status">{fallbackMessage}</p>
                  ) : globeLoad === 'loading' ? (
                    <p role="status">{t('pages.explore.globeLoading')}</p>
                  ) : (
                    <p className="tour-hint">{t('pages.explore.tour.hint')}</p>
                  )}
                </>
              ) : null}

              {section === 'station' ? (
                <>
                  <ul className="tour-questions">
                    <li>{t('pages.explore.tour.station.q1')}</li>
                    <li>{t('pages.explore.tour.station.q2')}</li>
                  </ul>
                  <p>{t('pages.explore.description')}</p>
                  {grupos.map((grupo) => (
                    <section key={grupo.departamento ?? 'sin-departamento'} aria-label={grupo.departamento ?? t('pages.explore.stationListLabel')}>
                      {grupo.departamento ? <h3 className="station-group">{grupo.departamento}</h3> : null}
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
                </>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
