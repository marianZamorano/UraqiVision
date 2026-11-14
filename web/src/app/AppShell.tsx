import { NavLink } from 'react-router-dom'
import type { Language } from '../contracts/view-state'
import { getDictionary } from '../i18n'

type AppShellProps = {
  lang: Language
  onChangeLanguage: (next: Language) => void
  children: React.ReactNode
}

export function AppShell({ lang, onChangeLanguage, children }: AppShellProps) {
  const dict = getDictionary(lang)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">U</span>
          <div>
            <strong>{dict.app.title}</strong>
            <small>{dict.app.subtitle}</small>
          </div>
        </div>

        <nav aria-label="Main navigation" className="main-nav">
          <NavLink to="/" end>{dict.app.home}</NavLink>
          <NavLink to="/explore">{dict.app.exploreNav}</NavLink>
          <NavLink to="/method">{dict.app.method}</NavLink>
          <NavLink to="/about">{dict.app.about}</NavLink>
        </nav>

        <button
          type="button"
          className="language-switcher"
          onClick={() => onChangeLanguage(lang === 'es' ? 'en' : 'es')}
          aria-label={dict.app.changeLanguage}
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
      </header>

      <main className="page-shell">{children}</main>
    </div>
  )
}
