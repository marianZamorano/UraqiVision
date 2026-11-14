import type { Language } from '../contracts/view-state'
import { getDictionary } from '../i18n'

type MethodPageProps = {
  lang: Language
}

export function MethodPage({ lang }: MethodPageProps) {
  const dict = getDictionary(lang)

  return (
    <section className="page">
      <div className="panel">
        <h1>{dict.pages.method.title}</h1>
        <p>{dict.pages.method.description}</p>
        <ul className="info-list">
          <li>Procedencia: origen de la publicación y gránulos.</li>
          <li>Fecha: UTC preservada para comparación en hora local.</li>
          <li>Ausencia: nunca se normaliza a cero.</li>
        </ul>
      </div>
    </section>
  )
}
