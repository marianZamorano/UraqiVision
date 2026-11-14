import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

function renderExplore(lang: 'es' | 'en' = 'es') {
  return render(<ExplorePage lang={lang} />)
}

afterEach(() => {
  globe.webgl = false
  globe.loadCesium.mockReset()
})

// RF-30, RNF-03, RNF-04: respaldo textual anunciado y bilingüe.
describe('ExplorePage globe fallback', () => {
  it('announces the textual fallback and never requests Cesium without WebGL', () => {
    renderExplore('es')

    expect(screen.getByRole('status')).toHaveTextContent(/webgl no disponible/i)
    expect(screen.getByRole('list', { name: /estaciones disponibles/i })).toBeInTheDocument()
    expect(globe.loadCesium).not.toHaveBeenCalled()
  })

  it('switches to the textual fallback when Cesium fails to load', async () => {
    globe.webgl = true
    globe.loadCesium.mockRejectedValue(new Error('chunk failed'))

    renderExplore('en')

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
    expect(globe.loadCesium).toHaveBeenCalledTimes(1)
  })

  it('shows no fallback notice while Cesium loads correctly', async () => {
    globe.webgl = true
    globe.loadCesium.mockResolvedValue({})

    renderExplore('es')

    await vi.waitFor(() => expect(globe.loadCesium).toHaveBeenCalled())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
