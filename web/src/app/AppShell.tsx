import { NavLink } from './router'
import './shell.css'
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
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="uv-orbita" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0" stopColor="var(--paleta-hielo)" />
                  <stop offset="0.5" stopColor="var(--paleta-violeta)" />
                  <stop offset="1" stopColor="var(--paleta-azul-electrico)" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="6.5" stroke="url(#uv-orbita)" strokeWidth="1.6" />
              <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-28 12 12)" stroke="url(#uv-orbita)" strokeWidth="1.1" opacity="0.8" />
              <circle cx="20.2" cy="7.4" r="1.4" fill="var(--paleta-hielo)" />
            </svg>
          </span>
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

      <main id="contenido" className="page-shell">{children}</main>
    </div>
  )
}
