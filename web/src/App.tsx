import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import type { Language } from './contracts/view-state'
import { getPreferredLanguage } from './i18n'
import { AboutPage } from './pages/AboutPage'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { MethodPage } from './pages/MethodPage'
import { StationPage } from './pages/StationPage'

function App() {
  const [lang, setLang] = useState<Language>(getPreferredLanguage)

  useEffect(() => {
    localStorage.setItem('uraqivision-lang', lang)
  }, [lang])

  return (
    <AppShell lang={lang} onChangeLanguage={setLang}>
      <Routes>
        <Route path="/" element={<HomePage lang={lang} />} />
        <Route path="/explore" element={<ExplorePage lang={lang} />} />
        <Route path="/station/:stationId" element={<StationPage lang={lang} />} />
        <Route path="/method" element={<MethodPage lang={lang} />} />
        <Route path="/about" element={<AboutPage lang={lang} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
