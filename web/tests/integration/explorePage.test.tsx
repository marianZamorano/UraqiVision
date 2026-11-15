import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { changeLanguage } from '../../src/i18n'
import { ExplorePage } from '../../src/pages/ExplorePage'

const globe = vi.hoisted(() => ({
  webgl: false,
  loadCesium: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('../../src/features/globe/GlobeProvider', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/features/globe/GlobeProvider')>()
  return { ...original, hasWebGLSupport: () => globe.webgl }
})

vi.mock('../../src/features/globe/lazyGlobe', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/features/globe/lazyGlobe')>()
  return { ...original, loadCesiumModule: globe.loadCesium }
})

// El idioma de los textos lo decide i18n (T015); `lang` solo elige los nombres de los datos publicados.
async function renderExplore(lang: 'es' | 'en' = 'es') {
  await changeLanguage(lang)
  return render(<ExplorePage lang={lang} />)
}

afterEach(async () => {
  globe.webgl = false
  globe.loadCesium.mockReset()
  await changeLanguage('es')
})

// RF-30, RNF-03, RNF-04: respaldo textual anunciado y bilingüe.
describe('ExplorePage globe fallback', () => {
  it('announces the textual fallback and never requests Cesium without WebGL', async () => {
    await renderExplore('es')

    expect(screen.getByRole('status')).toHaveTextContent(/webgl no disponible/i)
    expect(screen.getByRole('list', { name: /estaciones disponibles/i })).toBeInTheDocument()
    expect(globe.loadCesium).not.toHaveBeenCalled()
  })

  it('switches to the textual fallback when Cesium fails to load', async () => {
    globe.webgl = true
    globe.loadCesium.mockRejectedValue(new Error('chunk failed'))

    await renderExplore('en')

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
    expect(globe.loadCesium).toHaveBeenCalledTimes(1)
  })

  // T020: estado explícito del explorador mientras se descarga CesiumJS (FR-003: ningún destino mudo).
  it('announces that the 3D globe is being prepared while Cesium downloads, then clears it', async () => {
    globe.webgl = true
    let finish: (value: unknown) => void = () => {}
    globe.loadCesium.mockReturnValue(new Promise((resolve) => { finish = resolve }))

    await renderExplore('es')

    expect(screen.getByRole('status')).toHaveTextContent(/preparando el globo 3d/i)
    await act(async () => finish({}))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })
})
