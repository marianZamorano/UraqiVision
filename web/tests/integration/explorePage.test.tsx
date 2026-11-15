import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeLanguage } from '../../src/i18n'
import { ExplorePage } from '../../src/pages/ExplorePage'

const globe = vi.hoisted(() => ({
  webgl: false,
  loadCesium: vi.fn<() => Promise<unknown>>(),
  viewerFails: false,
}))

// jsdom no tiene WebGL: el visor real se prueba en tests/unit/GlobeView.test.tsx y en el navegador (E2E).
vi.mock('../../src/features/globe/GlobeView', () => ({
  GlobeView: ({ label, reducedMotion, onSelectSection, onSelectZone, onReady, onError }: {
    label: string
    reducedMotion: boolean
    onSelectSection: (section: string) => void
    onSelectZone: (stationId: string) => void
    onReady: () => void
    onError: () => void
  }) => {
    useEffect(() => {
      if (globe.viewerFails) onError()
      else onReady()
    }, [onReady, onError])
    // El doble expone un «clic» en el marcador de Bolivia y en el punto de una zona.
    return (
      <div role="region" aria-label={label} data-reduced={String(reducedMotion)}>
        <button type="button" onClick={() => onSelectSection('bolivia')}>marcador Bolivia</button>
        <button type="button" onClick={() => onSelectZone('beni-norte')}>punto de zona</button>
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

// #121, #123 (RF-25, RF-29, RNF-03, RNF-04, RNF-12): recorrido por secciones; el scroll, la navegación y los
// marcadores lo guían, y el punto de una zona abre directamente su estación.
describe('ExplorePage tour (#121, #123)', () => {
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    scrollIntoView.mockReset()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  async function renderReadyGlobe(lang: 'es' | 'en' = 'es') {
    globe.webgl = true
    globe.loadCesium.mockResolvedValue({})
    await renderExplore(lang)
    await screen.findByRole('region', { name: lang === 'es' ? 'Globo 3D de Bolivia' : '3D globe of Bolivia' })
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  }

  it('shows three sections in order, from the whole Earth to Bolivia with its areas', async () => {
    await renderReadyGlobe('es')

    expect(screen.getByRole('heading', { level: 1, name: 'Explorador' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Los incendios de 2026', 'Elige una zona',
    ])
    expect(screen.getByText(/desplázate para viajar hasta bolivia/i)).toBeInTheDocument()
  })

  it('every figure comes with its source (§4.2)', async () => {
    await renderReadyGlobe('es')
    expect(screen.getByText(/1,25 millones de hectáreas/)).toBeInTheDocument()
    expect(screen.getByText('Fuente: Viceministerio de Defensa Civil, vía Correo del Sur (27 oct 2026).')).toBeInTheDocument()
    expect(screen.getByText(/735 de 2\.835/)).toBeInTheDocument()
    expect(screen.getByText('Fuente: SIMB, vía eju.tv (21 jul 2026).')).toBeInTheDocument()
  })

  it('the Bolivia section lists the areas (keyboard alternative to the points) and explains when there are no points', async () => {
    await renderReadyGlobe('es')
    const bolivia = screen.getByRole('heading', { name: 'Elige una zona' }).closest('section') as HTMLElement

    expect(within(bolivia).getAllByRole('list', { name: /estaciones disponibles/i }).length).toBeGreaterThan(0)
    // Sin backend (pruebas) no hay ubicaciones publicadas: se explica y queda la lista.
    expect(within(bolivia).getByText(/las zonas aparecen como puntos en el globo/i)).toBeInTheDocument()
  })

  it('the keyboard-operable section nav marks the active step and scrolls smoothly to a section', async () => {
    await renderReadyGlobe('es')
    const nav = screen.getByRole('navigation', { name: 'Secciones del recorrido' })
    const buttons = within(nav).getAllByRole('button')

    expect(buttons.map((b) => b.textContent)).toEqual(['La Tierra', 'Sudamérica', 'Bolivia'])
    // jsdom no maqueta (todas las secciones miden 0): solo se comprueba que haya exactamente un paso activo.
    expect(buttons.filter((b) => b.getAttribute('aria-current') === 'step')).toHaveLength(1)

    fireEvent.click(within(nav).getByRole('button', { name: 'Bolivia' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Elige una zona' }).closest('section'))
  })

  it('clicking Bolivia on the globe goes to its section; clicking an area point opens that station directly', async () => {
    window.history.replaceState(null, '', '/explore')
    await renderReadyGlobe('es')

    fireEvent.click(screen.getByRole('button', { name: 'marcador Bolivia' }))
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Elige una zona' }).closest('section'))

    fireEvent.click(screen.getByRole('button', { name: 'punto de zona' }))
    expect(window.location.pathname).toBe('/station/beni-norte')
    window.history.replaceState(null, '', '/')
  })

  it('with reduced motion the jump to a section is instant (RNF-12)', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    try {
      await renderReadyGlobe('es')
      expect(screen.getByRole('region', { name: 'Globo 3D de Bolivia' })).toHaveAttribute('data-reduced', 'true')
      fireEvent.click(screen.getByRole('button', { name: 'marcador Bolivia' }))
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' })
    } finally {
      window.matchMedia = matchMedia
    }
  })

  it('is bilingual, sources included', async () => {
    await renderReadyGlobe('en')
    expect(screen.getByRole('navigation', { name: 'Tour sections' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Choose an area' })).toBeInTheDocument()
    expect(screen.getByText('Source: SIMB, via eju.tv (21 Jul 2026).')).toBeInTheDocument()
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
