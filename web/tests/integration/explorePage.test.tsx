import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { changeLanguage } from '../../src/i18n'
import { ExplorePage } from '../../src/pages/ExplorePage'

const globe = vi.hoisted(() => ({
  webgl: false,
  loadCesium: vi.fn<() => Promise<unknown>>(),
  viewerFails: false,
}))

// jsdom no tiene WebGL: el visor real se prueba en tests/unit/GlobeView.test.tsx y en el navegador (E2E).
vi.mock('../../src/features/globe/GlobeView', () => ({
  GlobeView: ({ label, flight, reducedMotion, onSelectBolivia, onReady, onError }: {
    label: string
    flight: { target: string; seq: number }
    reducedMotion: boolean
    onSelectBolivia: () => void
    onReady: () => void
    onError: () => void
  }) => {
    useEffect(() => {
      if (globe.viewerFails) onError()
      else onReady()
    }, [onReady, onError])
    // El doble expone el destino pedido y un «clic en el marcador de Bolivia».
    return (
      <div role="region" aria-label={label} data-target={flight.target} data-seq={flight.seq} data-reduced={String(reducedMotion)}>
        <button type="button" onClick={onSelectBolivia}>marcador</button>
      </div>
    )
  },
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
  globe.viewerFails = false
  globe.loadCesium.mockReset()
  await changeLanguage('es')
})

// #115: el globo aparece con WebGL; si el visor falla, queda la lista textual (RF-30).
describe('ExplorePage globe (#115)', () => {
  it('shows the 3D globe once Cesium is loaded', async () => {
    globe.webgl = true
    globe.loadCesium.mockResolvedValue({})

    await renderExplore('es')

    expect(await screen.findByRole('region', { name: 'Globo 3D de Bolivia' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })

  it('falls back to the textual list when the viewer cannot be created', async () => {
    globe.webgl = true
    globe.viewerFails = true
    globe.loadCesium.mockResolvedValue({})

    await renderExplore('es')

    expect(await screen.findByText(/no se pudo cargar el globo 3d/i)).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('region', { name: 'Globo 3D de Bolivia' })).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: /estaciones disponibles/i })).toBeInTheDocument()
  })
})

// #115 (RF-25, RF-28, RNF-03, RNF-12): se entra viendo la Tierra; el clic en Bolivia o los botones piden el vuelo.
describe('ExplorePage entry from the whole Earth (#115)', () => {
  async function renderReadyGlobe(lang: 'es' | 'en' = 'es') {
    globe.webgl = true
    globe.loadCesium.mockResolvedValue({})
    await renderExplore(lang)
    // Los controles aparecen cuando el visor avisa que está listo.
    await screen.findByRole('button', { name: lang === 'es' ? 'Ir a Bolivia' : 'Go to Bolivia' })
    return screen.getByRole('region', { name: lang === 'es' ? 'Globo 3D de Bolivia' : '3D globe of Bolivia' })
  }

  it('starts on the whole Earth with a hint and a keyboard-operable «Ir a Bolivia» button', async () => {
    const region = await renderReadyGlobe('es')

    expect(region).toHaveAttribute('data-target', 'earth')
    expect(region).toHaveAttribute('data-seq', '0')
    expect(screen.getByText(/haz clic en bolivia/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir a Bolivia' }))

    expect(region).toHaveAttribute('data-target', 'bolivia')
    expect(region).toHaveAttribute('data-seq', '1')
    expect(screen.getByText('Vista del globo: Bolivia encuadrada')).toHaveAttribute('aria-live', 'polite')
  })

  it('clicking Bolivia on the globe flies there; then offers «Volver a Bolivia» and «Ver la Tierra entera»', async () => {
    const region = await renderReadyGlobe('es')

    fireEvent.click(screen.getByRole('button', { name: 'marcador' }))
    expect(region).toHaveAttribute('data-target', 'bolivia')
    expect(screen.queryByText(/haz clic en bolivia/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Volver a Bolivia' }))
    expect(region).toHaveAttribute('data-seq', '2')

    fireEvent.click(screen.getByRole('button', { name: 'Ver la Tierra entera' }))
    expect(region).toHaveAttribute('data-target', 'earth')
    expect(screen.getByRole('button', { name: 'Ir a Bolivia' })).toBeInTheDocument()
  })

  it('offers the controls in English too', async () => {
    await renderReadyGlobe('en')
    expect(screen.getByRole('button', { name: 'Go to Bolivia' })).toBeInTheDocument()
    expect(screen.getByText(/click bolivia on the globe/i)).toBeInTheDocument()
  })
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
