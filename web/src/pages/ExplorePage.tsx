import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, navigate } from '../app/router'
import { serializeRoute } from '../app/routeState'
import { useReducedMotion } from '../app/useReducedMotion'
import type { Language } from '../contracts/view-state'
import {
  demoStations,
  listStationLocations,
  listStations,
  usesPublishedApi,
  type StationLocation,
  type StationSummary,
} from '../data/publicationRepository'
import { useTranslation } from 'react-i18next'
import { GlobeAttribution } from '../features/globe/GlobeAttribution'
import { hasWebGLSupport, resolveGlobeProvider } from '../features/globe/GlobeProvider'
import { GlobeView, type CesiumModule, type ZonePoint } from '../features/globe/GlobeView'
import { NO_FRAMING, TOUR_SECTIONS, type GlobeFraming, type TourSection } from '../features/globe/cameraPath'
import { resolveFallbackProvider } from '../features/globe/fallbackProvider'
import { globeConfigFor } from '../features/globe/globeConfig'
import { readPublicIonToken } from '../features/globe/ionProvider'
import { loadCesiumModule, loadGlobeModule } from '../features/globe/lazyGlobe'
import { useTourProgress } from '../features/globe/scrollProgress'

/** Separación (px) entre la escena del globo y la navegación del recorrido. */
const NAV_MARGIN = 48

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

  // #121 (RF-25, RNF-12): recorrido por secciones; el scroll mueve la cámara del globo.
  const reducedMotion = useReducedMotion()
  const sectionRefs = useRef<Array<HTMLElement | null>>([])
  const panelRefs = useRef<Array<HTMLElement | null>>([])
  const { store: progress, active } = useTourProgress(sectionRefs)
  const goTo = useCallback((section: TourSection) => {
    const element = sectionRefs.current[TOUR_SECTIONS.indexOf(section)]
    element?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }, [reducedMotion])
  // #123 (RF-29): el clic en el punto de una zona abre directamente su estación.
  const openStation = useCallback((stationId: string) => {
    navigate(serializeRoute({ route: 'station', stationId }))
  }, [])

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

  // #123: ubicación de cada zona publicada (centro de su caja en station.json); las DEMO no tienen punto.
  const [locations, setLocations] = useState<StationLocation[]>([])
  useEffect(() => {
    const controller = new AbortController()
    listStationLocations(stations, controller.signal).then((list) => {
      if (!controller.signal.aborted) setLocations(list)
    }, () => undefined)
    return () => controller.abort()
  }, [stations])
  const zones = useMemo<ZonePoint[]>(
    () => locations.map((l) => ({ id: l.stationId, label: l.label[lang], longitude: l.longitude, latitude: l.latitude })),
    [locations, lang],
  )

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
  // #125: con los puntos en el globo, el panel de Bolivia sobra; queda solo para el teclado (aparece con el foco).
  const boliviaOnDemand = showGlobe && zones.length > 0

  // #123: la escena del globo se centra en la parte de la pantalla que no tapan la cabecera, la navegación del
  // recorrido y el panel de la sección activa (a la izquierda en escritorio, abajo en celular y tableta).
  const navRef = useRef<HTMLElement | null>(null)
  const [framing, setFraming] = useState<GlobeFraming>(NO_FRAMING)
  useEffect(() => {
    const measure = () => {
      const panel = panelRefs.current[active]
      if (!panel) return
      const rect = panel.getBoundingClientRect()
      const desktop = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 769px)').matches
      const header = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
      const nav = navRef.current?.querySelector('ol')?.getBoundingClientRect()
      const next: GlobeFraming = {
        left: desktop ? Math.round(rect.right) : 0,
        // Margen extra para que los puntos del globo nunca queden pegados a la navegación (#125).
        right: nav && nav.width > 0 ? Math.round(window.innerWidth - nav.left + NAV_MARGIN) : 0,
        top: Math.max(0, Math.round(header)),
        bottom: desktop ? 0 : Math.round(rect.height),
      }
      setFraming((f) =>
        f.left === next.left && f.right === next.right && f.top === next.top && f.bottom === next.bottom ? f : next,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    document.addEventListener('focusin', measure)
    document.addEventListener('focusout', measure)
    return () => {
      window.removeEventListener('resize', measure)
      document.removeEventListener('focusin', measure)
      document.removeEventListener('focusout', measure)
    }
  }, [active, boliviaOnDemand])

  return (
    <>
      {/* Globo como fondo fijo del explorador (#115): detrás del contenido y sin bloquear el desplazamiento. */}
      {showGlobe ? (
        <GlobeView
          cesium={cesium}
          config={config}
          label={t('pages.explore.globeLabel')}
          boliviaLabel={t('pages.explore.boliviaMarker')}
          zones={zones}
          framing={framing}
          progress={progress}
          reducedMotion={reducedMotion}
          onSelectSection={goTo}
          onSelectZone={openStation}
          onReady={onGlobeReady}
          onError={onGlobeError}
        />
      ) : null}

      <div className={showGlobe ? 'explore-tour explore-tour--globe' : 'explore-tour'}>
        <nav className="tour-nav" aria-label={t('pages.explore.tour.nav')} data-globe-overlay="" ref={navRef}>
          <ol>
            {TOUR_SECTIONS.map((section, i) => (
              <li key={section}>
                <button
                  type="button"
                  aria-current={active === i ? 'step' : undefined}
                  title={t(`pages.explore.tour.${section}.nav`)}
                  onClick={() => goTo(section)}
                >
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
            <div
              className={section === 'bolivia' && boliviaOnDemand ? 'tour-panel tour-panel--on-demand' : 'tour-panel'}
              data-globe-overlay=""
              ref={(element) => {
                panelRefs.current[i] = element
              }}
            >
              <p className="tour-eyebrow">{t(`pages.explore.tour.${section}.eyebrow`)}</p>
              {section === 'earth' ? (
                <h1 id="tour-earth">{t('pages.explore.title')}</h1>
              ) : (
                <h2 id={`tour-${section}`}>{t(`pages.explore.tour.${section}.title`)}</h2>
              )}
              <p className="tour-lead">{t(`pages.explore.tour.${section}.body`)}</p>
              {section === 'southAmerica' ? (
                <>
                  <p className="tour-source">{t('pages.explore.tour.southAmerica.source')}</p>
                  <p className="tour-lead tour-lead--second">{t('pages.explore.tour.southAmerica.fact2')}</p>
                  <p className="tour-source">{t('pages.explore.tour.southAmerica.source2')}</p>
                </>
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
                  <GlobeAttribution
                    description={t('pages.explore.globeAttribution')}
                    linkLabel={t('pages.explore.globeAttributionLink')}
                  />
                </>
              ) : null}

              {section === 'bolivia' ? (
                <>
                  {showGlobe && zones.length === 0 ? (
                    <p className="tour-hint">{t('pages.explore.tour.bolivia.noZones')}</p>
                  ) : null}
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
                </>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
