import type { Language } from '../contracts/view-state'
import { getDictionary } from '../i18n'

type AboutPageProps = {
  lang: Language
}

export function AboutPage({ lang }: AboutPageProps) {
  const dict = getDictionary(lang)

  return (
    <section className="page">
      <div className="panel">
        <h1>{dict.pages.about.title}</h1>
        <p>{dict.pages.about.description}</p>
        <p>
          La base web cumple con trazabilidad, accesibilidad, rendimiento y honestidad de datos para el
          recorrido principal de UraqiVision.
        </p>
      </div>
    </section>
  )
}
