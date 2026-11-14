import { useEffect, useState } from 'react'
import { Link } from '../app/router'
import { serializeRoute } from '../app/routeState'
import type { Language } from '../contracts/view-state'
import { demoStations } from '../data/publicationRepository'
import { getDictionary } from '../i18n'
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
  const dict = getDictionary(lang)
  // RNF-01, RF-30: CesiumJS solo se pide aquí y nunca sin WebGL.
  const [decision] = useState(() => resolveGlobeProvider({
    token: readPublicIonToken(),
    webglAvailable: hasWebGLSupport(),
  }))
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (decision.mode === 'textual') {
      return
    }

    let active = true
    void loadGlobeModule<CesiumModule | null>(loadCesiumModule, null).then((module) => {
      if (active && module === null) {
        setLoadFailed(true)
      }
    })

    return () => {
      active = false
    }
  }, [decision.mode])

  const fallback = resolveFallbackProvider(decision, loadFailed)
  const fallbackMessage = fallback.reason === 'webgl-unavailable'
    ? dict.pages.explore.fallbackWebglUnavailable
    : dict.pages.explore.fallbackLoadFailed

  return (
    <section className="page">
      <div className="panel">
        <h1>{dict.pages.explore.title}</h1>
        <p>{dict.pages.explore.description}</p>

        {fallback.active ? <p role="status">{fallbackMessage}</p> : null}

        <ul className="station-list" aria-label={dict.pages.explore.stationListLabel}>
          {Object.values(demoStations).map((station) => (
            <li key={station.stationId}>
              <Link to={serializeRoute({ route: 'station', stationId: station.stationId })}>
                {station.label[lang]}
              </Link>
            </li>
          ))}
        </ul>

        <GlobeAttribution
          description={dict.pages.explore.globeAttribution}
          linkLabel={dict.pages.explore.globeAttributionLink}
        />
      </div>
    </section>
  )
}
