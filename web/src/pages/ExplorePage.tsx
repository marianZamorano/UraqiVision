import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, navigate } from '../app/router'
import { serializeRoute } from '../app/routeState'
import { useReducedMotion } from '../app/useReducedMotion'
import type { Language } from '../contracts/view-state'
import {
  demoStations,
  listStationLocations,
  listStations,
  stationFilesBase,
  usesPublishedApi,
  type StationLocation,
  type StationSummary,
} from '../data/publicationRepository'
import { useTranslation } from 'react-i18next'
import { GlobeAttribution } from '../features/globe/GlobeAttribution'
import { hasWebGLSupport, resolveGlobeProvider } from '../features/globe/GlobeProvider'
import { GlobeView, type CesiumModule, type GlobeOverlay, type ZonePoint } from '../features/globe/GlobeView'
import {
  DEFAULT_ZONE_RANGE,
  NO_FRAMING,
  TOUR_SECTIONS,
  zoneRange,
  type GlobeFocus,
  type GlobeFraming,
  type TourSection,
} from '../features/globe/cameraPath'
import { resolveFallbackProvider } from '../features/globe/fallbackProvider'
import { globeConfigFor } from '../features/globe/globeConfig'
import { readPublicIonToken } from '../features/globe/ionProvider'
import { loadCesiumModule, loadGlobeModule } from '../features/globe/lazyGlobe'
import { useTourProgress } from '../features/globe/scrollProgress'
import { rectanguloDe } from '../features/map/stationFiles'
import { ZoneLayer, type ZoneCovered } from '../features/zone/ZoneLayer'
import { viewFor, type GlobeLayerChoice } from '../features/zone/globeLayers'
import { useZoneSummary } from '../features/zone/useZoneSummary'

/** Separación (px) entre la escena del globo y la navegación del recorrido. */
const NAV_MARGIN = 48

/** Sección del recorrido donde viven las zonas. */
const BOLIVIA_INDEX = TOUR_SECTIONS.indexOf('bolivia')
const DEFAULT_LAYER: GlobeLayerChoice = { layer: 'cambio' }

type ExplorePageProps = {
  lang: Language
  /** Zona abierta, de la URL (`/explore?station=…`, RF-29). */
  stationId?: string
}

export function ExplorePage({ lang, stationId }: ExplorePageProps) {
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
  // RF-25, RF-29: el clic en el punto de una zona la abre aquí mismo, sin cambiar de página: la cámara vuela hasta
  // ella y sus paneles van sobre el globo. La zona abierta vive en la URL, así «atrás» la cierra.
  const openZone = useCallback((id: string) => {
    navigate(serializeRoute({ route: 'explore', stationId: id }))
  }, [])
  const closeZone = useCallback(() => {
    navigate(serializeRoute({ route: 'explore' }))
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

  // Zona abierta: solo con el globo a la vista y si la zona tiene ubicación publicada.
  const zone = showGlobe && stationId ? zones.find((z) => z.id === stationId) ?? null : null
  const zoneId = zone?.id ?? null
  const zoneIndex = zone ? zones.indexOf(zone) : -1
  const zoneBase = zone ? stationFilesBase(zone.id) : null
  const summary = useZoneSummary(zoneBase)
  const [choice, setChoice] = useState<GlobeLayerChoice>(DEFAULT_LAYER)
  const [opacity, setOpacity] = useState(0.85)
  const [detail, setDetail] = useState(false)
  const [covered, setCovered] = useState<ZoneCovered | null>(null)
  // Al cambiar de zona, la capa vuelve al cambio medido; al cerrarla, se cierra también su detalle (ajuste de estado
  // durante el render, sin efecto).
  const [shownZone, setShownZone] = useState<string | null>(null)
  if (zoneId !== shownZone) {
    setShownZone(zoneId)
    setChoice(DEFAULT_LAYER)
    if (!zoneId) {
      setDetail(false)
      setCovered(null)
    }
  }
  const onCovered = useCallback((next: ZoneCovered) => {
    setCovered((c) => (c && c.left === next.left && c.right === next.right && c.bottom === next.bottom ? c : next))
  }, [])

  // RF-25: a dónde vuela la cámara. La distancia sale de la caja publicada de la zona en cuanto se conoce.
  const zoneBbox = summary.kind === 'ready' ? summary.data.estacion.area.bbox_lonlat : null
  const focus = useMemo<GlobeFocus | null>(
    () => (zone
      ? { id: zone.id, longitude: zone.longitude, latitude: zone.latitude, range: zoneBbox ? zoneRange(zoneBbox) : DEFAULT_ZONE_RANGE }
      : null),
    [zone, zoneBbox],
  )
  // RF-08: la imagen de radar elegida, extendida sobre el relieve, con el contorno exacto de su caja.
  const overlay = useMemo<GlobeOverlay | null>(() => {
    if (!zoneBase || summary.kind !== 'ready') return null
    const vistas = summary.data.vistas
    const view = viewFor(vistas, choice)
    if (!view) return null
    const corners = view.esquinas_lonlat ?? vistas.esquinas_lonlat
    return { url: `${zoneBase}/${view.archivo}`, rectangle: rectanguloDe(corners), opacity, outline: corners }
  }, [zoneBase, summary, choice, opacity])

  // La zona se ve desde la sección de Bolivia: un enlace directo salta ahí; salir de ella con el scroll la cierra.
  const zoneAtBolivia = useRef(false)
  useEffect(() => {
    if (!zoneId) {
      zoneAtBolivia.current = false
      return
    }
    if (active === BOLIVIA_INDEX) {
      zoneAtBolivia.current = true
    } else if (zoneAtBolivia.current) {
      closeZone()
    } else {
      const section = sectionRefs.current[BOLIVIA_INDEX]
      if (typeof section?.scrollIntoView === 'function') section.scrollIntoView({ behavior: 'auto', block: 'center' })
    }
  }, [zoneId, active, closeZone])

  // #125: con los puntos en el globo, el panel de Bolivia sobra; queda solo para el teclado (aparece con el foco).
  const boliviaOnDemand = showGlobe && zones.length > 0

  // #123: la escena del globo se centra en la parte de la pantalla que no tapan la cabecera, la navegación del
  // recorrido y el panel de la sección activa (a la izquierda en escritorio, abajo en celular y tableta).
  const navRef = useRef<HTMLElement | null>(null)
  const [framing, setFraming] = useState<GlobeFraming>(NO_FRAMING)
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
      if (zoneId) {
        // Con una zona abierta mandan sus paneles (ZoneLayer mide cuánto tapan); mientras no lo informan, nada.
        if (!covered) return
        const next: GlobeFraming = { left: covered.left, right: covered.right, top: Math.max(0, Math.round(header)), bottom: covered.bottom }
        setFraming((f) =>
          f.left === next.left && f.right === next.right && f.top === next.top && f.bottom === next.bottom ? f : next,
        )
        return
      }
      const panel = panelRefs.current[active]
      if (!panel) return
      const rect = panel.getBoundingClientRect()
      const desktop = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 769px)').matches
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
  }, [active, boliviaOnDemand, zoneId, covered])

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
          focus={focus}
          overlay={overlay}
          onSelectSection={goTo}
          onSelectZone={openZone}
          onReady={onGlobeReady}
          onError={onGlobeError}
        />
      ) : null}

      {zone ? (
        <ZoneLayer
          lang={lang}
          stationId={zone.id}
          name={zone.label}
          departamento={stations.find((st) => st.stationId === zone.id)?.departamento ?? null}
          base={zoneBase}
          summary={summary}
          choice={choice}
          onChoice={setChoice}
          opacity={opacity}
          onOpacity={setOpacity}
          detail={detail}
          onDetail={setDetail}
          onClose={closeZone}
          onPrevious={zones.length > 1 ? () => openZone((zones[(zoneIndex - 1 + zones.length) % zones.length] as ZonePoint).id) : undefined}
          onNext={zones.length > 1 ? () => openZone((zones[(zoneIndex + 1) % zones.length] as ZonePoint).id) : undefined}
          onCovered={onCovered}
        />
      ) : null}

      <div className={['explore-tour', showGlobe ? 'explore-tour--globe' : '', zone ? 'explore-tour--zone' : ''].filter(Boolean).join(' ')}>
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
                            {/* Con su punto en el globo, la zona se abre aquí mismo; sin él, en su página (RF-29, RF-30). */}
                            <Link
                              to={serializeRoute({
                                route: showGlobe && zones.some((z) => z.id === station.stationId) ? 'explore' : 'station',
                                stationId: station.stationId,
                              })}
                            >
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
