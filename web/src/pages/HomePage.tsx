import { Link } from '../app/router'
import type { Language } from '../contracts/view-state'
import { getDictionary } from '../i18n'

type HomePageProps = {
  lang: Language
}

export function HomePage({ lang }: HomePageProps) {
  const dict = getDictionary(lang)

  return (
    <section className="page page--hero">
      <div className="panel panel--hero">
        <p className="eyebrow">{dict.app.title}</p>
        <h1>{dict.pages.home.headline}</h1>
        <p>{dict.pages.home.description}</p>
        <div className="cta-row">
          <Link to="/explore" className="button-primary">
            {dict.pages.home.cta}
          </Link>
          <Link to="/method" className="button-secondary">
            {dict.app.method}
          </Link>
        </div>
      </div>
    </section>
  )
}
