import { Link } from 'react-router-dom'
import type { Language } from '../contracts/view-state'
import { demoStations } from '../data/publicationRepository'
import { getDictionary } from '../i18n'

type ExplorePageProps = {
  lang: Language
}

export function ExplorePage({ lang }: ExplorePageProps) {
  const dict = getDictionary(lang)

  return (
    <section className="page">
      <div className="panel">
        <h1>{dict.pages.explore.title}</h1>
        <p>{dict.pages.explore.description}</p>

        <ul className="station-list" aria-label="Lista de estaciones disponibles">
          {Object.values(demoStations).map((station) => (
            <li key={station.stationId}>
              <Link to={`/station/${station.stationId}`}>
                {station.label[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
