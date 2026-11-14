import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import type { Language } from './contracts/view-state'
import { getPreferredLanguage } from './i18n'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { MethodPage } from './pages/MethodPage'
import { StationPage } from './pages/StationPage'

const ExplorePage = lazy(async () => {
  const module = await import('./pages/ExplorePage')
  return { default: module.ExplorePage }
})

function App() {
  const [lang, setLang] = useState<Language>(getPreferredLanguage)

  useEffect(() => {
    localStorage.setItem('uraqivision-lang', lang)
  }, [lang])

  return (
    <AppShell lang={lang} onChangeLanguage={setLang}>
      <Suspense fallback={<div aria-live="polite">Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/explore" element={<ExplorePage lang={lang} />} />
          <Route path="/station/:stationId" element={<StationPage lang={lang} />} />
          <Route path="/method" element={<MethodPage lang={lang} />} />
          <Route path="/about" element={<AboutPage lang={lang} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

export default App
