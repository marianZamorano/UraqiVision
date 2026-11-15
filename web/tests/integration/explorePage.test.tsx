import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute } from '../../src/app/router'
import { changeLanguage } from '../../src/i18n'
import { ExplorePage } from '../../src/pages/ExplorePage'

const globe = vi.hoisted(() => ({
  webgl: false,
  loadCesium: vi.fn<() => Promise<unknown>>(),
  viewerFails: false,
  // Ubicaciones publicadas que devolvería el backend (#123, #125); vacías por defecto, como sin backend.
  locations: [] as Array<{ stationId: string; label: { es: string; en: string }; longitude: number; latitude: number }>,
  // Con backend: las zonas tienen archivos publicados y su estación en la forma del contrato.
  published: false,
}))

vi.mock('../../src/data/publicationRepository', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/publicationRepository')>()
  return {
    ...original,
    listStationLocations: async () => globe.locations,
    stationFilesBase: (id: string) => (globe.published ? `http://backend/estaciones/${id}` : original.stationFilesBase(id)),
    fetchStation: (id: string, signal?: AbortSignal) => (globe.published
      ? Promise.resolve({
          stationId: id,
          departmentId: 'beni',
          label: { es: 'Beni norte', en: 'North Beni' },
          evidenceMode: 'REAL' as const,
          area: { value: 21406, unit: 'ha', source: 'NISAR L2 GCOV PROVISIONAL', status: 'limited' as const },
          orbit: '089A',
          periods: [{ name: 'serie útil' }],
          provenance: { source: 'NISAR', publishedAt: '2026-11-15T00:00:00Z', version: 'beta' },
          summary: { es: 'Resumen.', en: 'Summary.' },
        })
      : original.fetchStation(id, signal)),
  }
})

// El detalle real (respuesta paso a paso, gráfico) se prueba en el navegador: aquí basta saber que se pide y que
// sus botones «ver en el mapa» cambian la imagen del globo.
vi.mock('../../src/features/zone/ZoneDetail', () => ({
  default: ({ base, onSee }: { base: string; onSee: (vista: string, fecha?: string) => void }) => (
    <div>
      <p>detalle de {base}</p>
      <button type="button" onClick={() => onSee('base')}>ver lo normal</button>
    </div>
  ),
}))

// jsdom no tiene WebGL: el visor real se prueba en tests/unit/GlobeView.test.tsx y en el navegador (E2E).
vi.mock('../../src/features/globe/GlobeView', () => ({
  GlobeView: ({ label, reducedMotion, focus, overlay, framing, onSelectSection, onSelectZone, onReady, onError }: {
    label: string
    reducedMotion: boolean
    focus?: { id: string; range: number } | null
    overlay?: { url: string; opacity: number } | null
    framing: { left: number; right: number }
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
      <div
        role="region"
        aria-label={label}
        data-reduced={String(reducedMotion)}
        data-focus={focus?.id ?? ''}
        data-overlay={overlay?.url ?? ''}
        data-framing={`${framing.left},${framing.right}`}
      >
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
  globe.published = false
  globe.locations = []
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

  it('with points on the globe the Bolivia panel is hidden until the keyboard reaches it (#125)', async () => {
    globe.locations = [{ stationId: 'santa-cruz', label: { es: 'Santa Cruz', en: 'Santa Cruz' }, longitude: -63, latitude: -17 }]
    await renderReadyGlobe('es')
    const heading = screen.getByRole('heading', { name: 'Elige una zona' })
    const panel = heading.closest('.tour-panel') as HTMLElement

    await waitFor(() => expect(panel).toHaveClass('tour-panel--on-demand'))
    // Los enlaces siguen en la página (alternativa por teclado) y la pista de «sin puntos» ya no aparece.
    // La zona con punto se abre en el explorador; la que no lo tiene, en su página (RF-29, RF-30).
    expect(within(panel).getByRole('link', { name: 'Santa Cruz' })).toHaveAttribute('href', '/explore?station=santa-cruz')
    expect(within(panel).getByRole('link', { name: 'Tarija' })).toHaveAttribute('href', '/station/tarija')
    expect(within(panel).queryByText(/las zonas aparecen como puntos/i)).not.toBeInTheDocument()
  })

  it('without points the Bolivia panel stays visible (#125)', async () => {
    await renderReadyGlobe('es')
    const panel = screen.getByRole('heading', { name: 'Elige una zona' }).closest('.tour-panel') as HTMLElement
    expect(panel).not.toHaveClass('tour-panel--on-demand')
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

  it('clicking Bolivia on the globe goes to its section; clicking an area point opens it without leaving the explorer', async () => {
    window.history.replaceState(null, '', '/explore')
    await renderReadyGlobe('es')

    fireEvent.click(screen.getByRole('button', { name: 'marcador Bolivia' }))
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Elige una zona' }).closest('section'))

    fireEvent.click(screen.getByRole('button', { name: 'punto de zona' }))
    expect(`${window.location.pathname}${window.location.search}`).toBe('/explore?station=beni-norte')
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

// RF-25, RF-29, RF-08: la zona se abre dentro del explorador (ficha y radar sobre el globo) y «Más información»
// trae el detalle a un costado sin cambiar de página.
describe('ExplorePage open area (RF-25, RF-29)', () => {
  const station = {
    id: 'beni-norte',
    estado: 'publicada_con_limites',
    area: { bbox_lonlat: [-65.8, -12.22, -65.33, -11.75] },
    orbita: { track: 89, direccion: 'A', frame: 172, coleccion: 'provisional', crid: ['P05023'] },
    fechas: [
      { fecha: '2026-07-26', estado: 'ok', correlacion_ref: 0.94, rol: 'linea_base' },
      { fecha: '2026-10-06', estado: 'ok', correlacion_ref: 0.9, rol: null },
      { fecha: '2026-10-18', estado: 'ok', correlacion_ref: 0.9, rol: 'objetivo' },
      { fecha: '2026-06-08', estado: 'desplazada', correlacion_ref: 0.03, rol: null },
    ],
    hueco_datos: ['2026-07-27', '2026-08-10'],
    hipotesis: [],
    limites: ['quemado_antes_de_la_serie', 'producto_provisional'],
    linea_base: { fechas: ['2026-07-26'] },
    resumen_clases_ha: [
      { clase: 'compatible_quema', ha: 17478.2 },
      { clase: 'perdida_previa', ha: 5149.1 },
      { clase: 'ambigua', ha: 5962.5 },
      { clase: 'insuficiente', ha: 874.2 },
    ],
  }
  const views = {
    esquinas_lonlat: [[-65.8, -11.746], [-65.326, -11.75], [-65.33, -12.224], [-65.805, -12.22]],
    paletas: { radar: ['#000000', '#ffffff'], cambio: ['#8c2d04', '#f7f7f7', '#1d4f85'], optico: ['#1d6b3a', '#f7f7f7', '#7a3a10'] },
    vistas: [
      { archivo: 'views/20260726_hv.webp', fecha: '2026-07-26', capa: 'hv' },
      { archivo: 'views/20261006_hv.webp', fecha: '2026-10-06', capa: 'hv' },
      { archivo: 'views/20261018_hv.webp', fecha: '2026-10-18', capa: 'hv' },
      { archivo: 'views/20261006_cambio.webp', fecha: '2026-10-06', capa: 'cambio' },
      { archivo: 'views/20261018_cambio.webp', fecha: '2026-10-18', capa: 'cambio' },
      { archivo: 'views/base.webp', fecha: null, capa: 'base' },
    ],
  }
  const csv = [
    'fecha,hectareas,rango_inferior,rango_superior,confirmada,fuente,metodo',
    '2026-10-06,19617.5,13685.9,27306.6,si,"NISAR L2 GCOV PROVISIONAL (NASA/ISRO, ASF)",Caída sostenida de HV',
    '2026-10-18,21406.0,15176.7,29464.7,no,"NISAR L2 GCOV PROVISIONAL (NASA/ISRO, ASF)",Caída sostenida de HV',
  ].join('\n')

  function Routed() {
    const location = useRoute()
    return <ExplorePage lang="es" stationId={location?.route === 'explore' ? location.stationId : undefined} />
  }
  const url = () => `${window.location.pathname}${window.location.search}`
  const globeRegion = () => screen.getByRole('region', { name: 'Globo 3D de Bolivia' })

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    globe.webgl = true
    globe.published = true
    globe.loadCesium.mockResolvedValue({})
    globe.locations = [
      { stationId: 'beni-norte', label: { es: 'Beni norte', en: 'North Beni' }, longitude: -65.565, latitude: -11.985 },
      { stationId: 'sanignacio', label: { es: 'San Ignacio de Velasco', en: 'San Ignacio de Velasco' }, longitude: -60.81, latitude: -15.92 },
    ]
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const target = String(input)
      if (target.endsWith('/station.json')) return new Response(JSON.stringify(station))
      if (target.endsWith('/views/index.json')) return new Response(JSON.stringify(views))
      if (target.endsWith('/hectares.csv')) return new Response(csv)
      return new Response('', { status: 404 })
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  async function openBeniNorte() {
    window.history.replaceState(null, '', '/explore')
    await changeLanguage('es')
    render(<Routed />)
    await screen.findByRole('region', { name: 'Globo 3D de Bolivia' })
    fireEvent.click(await screen.findByRole('button', { name: 'punto de zona' }))
    return screen.findByRole('heading', { level: 2, name: 'Beni norte' })
  }

  it('opens the area in place: the camera flies to it, its card shows the published figures with their range and the radar lies on the globe', async () => {
    const title = await openBeniNorte()
    const card = title.closest('section') as HTMLElement

    expect(url()).toBe('/explore?station=beni-norte')
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-focus', 'beni-norte'))
    // RN-04 y RN-06: modo de evidencia a la vista y hectáreas con su rango de sensibilidad, tal como se publicaron.
    expect(within(card).getByText('REAL')).toBeInTheDocument()
    expect(await within(card).findByText('21.406,0')).toBeInTheDocument()
    expect(within(card).getByText('Rango: 15.176,7 – 29.464,7 ha')).toBeInTheDocument()
    expect(within(card).getByText(/aún sin confirmar/i)).toBeInTheDocument()
    expect(within(card).getByText('Publicada con límites')).toBeInTheDocument()
    // Fechas útiles: las tres sanas; la desplazada no cuenta.
    expect(within(card).getByText('fechas útiles').nextElementSibling).toHaveTextContent('3')
    // RF-08: sobre el globo va el cambio de la fecha más reciente.
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-overlay', 'http://backend/estaciones/beni-norte/views/20261018_cambio.webp'))
  })

  it('the second question shows the four classes as hypotheses, and another layer changes the image on the globe', async () => {
    const title = await openBeniNorte()
    const card = title.closest('section') as HTMLElement
    await within(card).findByText('21.406,0')

    fireEvent.click(within(card).getByRole('button', { name: '¿Quema o desmonte?' }))
    expect(within(card).getByText('Compatible con quema').nextElementSibling).toHaveTextContent('17.478,2 ha')
    expect(within(card).getByText(/hipótesis, no causas confirmadas/i)).toBeInTheDocument()

    const radar = screen.getByRole('heading', { name: 'Radar sobre el globo' }).closest('section') as HTMLElement
    fireEvent.click(within(radar).getByRole('button', { name: 'Lo normal' }))
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-overlay', 'http://backend/estaciones/beni-norte/views/base.webp'))
  })

  it('sliding the timeline shows each date from the first to the last: the image and the published figure follow it', async () => {
    const title = await openBeniNorte()
    const card = title.closest('section') as HTMLElement
    await within(card).findByText('21.406,0')
    const timeline = screen.getByRole('region', { name: 'Línea de tiempo' })
    const slider = within(timeline).getByRole('slider', { name: 'Fecha de la imagen' })
    // Empieza en la última fecha de la serie.
    expect(slider).toHaveValue('2')
    expect(within(timeline).getByText('2026-10-18', { selector: 'strong' })).toBeInTheDocument()
    expect(within(timeline).getByText('cambio medido')).toBeInTheDocument()

    // Una fecha anterior: el cambio y las hectáreas publicadas de ESA fecha, con su rango (RN-06).
    fireEvent.change(slider, { target: { value: '1' } })
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-overlay', 'http://backend/estaciones/beni-norte/views/20261006_cambio.webp'))
    expect(within(card).getByText('19.617,5')).toBeInTheDocument()
    expect(within(card).getByText('Rango: 13.685,9 – 27.306,6 ha')).toBeInTheDocument()
    expect(within(card).queryByText(/aún sin confirmar/i)).not.toBeInTheDocument()

    // La primera fecha es línea base: se ve el radar de ese día y no hay cifra (RN-13: nunca un cero).
    fireEvent.change(slider, { target: { value: '0' } })
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-overlay', 'http://backend/estaciones/beni-norte/views/20260726_hv.webp'))
    expect(within(timeline).getByText('línea base')).toBeInTheDocument()
    expect(within(card).getByText('Línea base: aquí todavía no se mide cambio.')).toBeInTheDocument()
    expect(card.querySelector('.zone-figure')?.textContent).toBe('—')
    // El hueco sin datos queda dicho en la línea de tiempo.
    expect(within(timeline).getByText('Sin datos del 2026-07-27 al 2026-08-10')).toBeInTheDocument()
  })

  it('the play button runs the series from the first date and stops by itself at the last', async () => {
    const title = await openBeniNorte()
    await within(title.closest('section') as HTMLElement).findByText('21.406,0')
    const timeline = screen.getByRole('region', { name: 'Línea de tiempo' })
    const slider = within(timeline).getByRole('slider', { name: 'Fecha de la imagen' })

    vi.useFakeTimers()
    try {
      fireEvent.click(within(timeline).getByRole('button', { name: 'Reproducir desde la primera fecha' }))
      expect(slider).toHaveValue('0') // desde el final vuelve a la primera fecha
      expect(within(timeline).getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(1400) })
      expect(slider).toHaveValue('1')
      await act(async () => { await vi.advanceTimersByTimeAsync(1400) })
      expect(slider).toHaveValue('2')
      await act(async () => { await vi.advanceTimersByTimeAsync(1400) })
      expect(within(timeline).getByRole('button', { name: 'Reproducir desde la primera fecha' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('"More information" brings the detail in from the side, retires the card, and Escape undoes each step', async () => {
    const title = await openBeniNorte()
    const card = title.closest('section') as HTMLElement
    const detail = document.querySelector('.zone-detail') as HTMLElement
    expect(detail).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(await within(card).findByRole('button', { name: 'Más información' }))
    expect(await within(detail).findByText('detalle de http://backend/estaciones/beni-norte')).toBeInTheDocument()
    expect(detail).not.toHaveAttribute('aria-hidden')
    expect(card).toHaveAttribute('aria-hidden', 'true')
    expect(url()).toBe('/explore?station=beni-norte') // sin cambiar de página
    // El mapa de análisis completo queda a un clic (RF-29).
    expect(within(detail).getByRole('link', { name: 'Abrir el mapa de análisis completo' })).toHaveAttribute('href', '/station/beni-norte')

    // Los pasos del detalle cambian la imagen sobre el globo.
    fireEvent.click(within(detail).getByRole('button', { name: 'ver lo normal' }))
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-overlay', 'http://backend/estaciones/beni-norte/views/base.webp'))

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(card).not.toHaveAttribute('aria-hidden'))
    expect(detail).toHaveAttribute('aria-hidden', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(url()).toBe('/explore'))
    expect(screen.queryByRole('heading', { level: 2, name: 'Beni norte' })).not.toBeInTheDocument()
    expect(globeRegion()).toHaveAttribute('data-focus', '')
    expect(globeRegion()).toHaveAttribute('data-overlay', '')
  })

  it('"next area" jumps to the neighbouring area and the browser back button returns', async () => {
    await openBeniNorte()
    fireEvent.click(screen.getByRole('button', { name: 'Zona siguiente' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'San Ignacio de Velasco' })).toBeInTheDocument()
    expect(url()).toBe('/explore?station=sanignacio')
    await waitFor(() => expect(globeRegion()).toHaveAttribute('data-focus', 'sanignacio'))

    await act(async () => {
      window.history.back()
      await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    })
    expect(await screen.findByRole('heading', { level: 2, name: 'Beni norte' })).toBeInTheDocument()
  })

  it('an unknown area in the link is ignored: the tour stays as it was', async () => {
    window.history.replaceState(null, '', '/explore?station=no-existe')
    await changeLanguage('es')
    render(<Routed />)
    await screen.findByRole('region', { name: 'Globo 3D de Bolivia' })
    await screen.findByRole('button', { name: 'punto de zona' })
    expect(document.querySelector('.zone-card')).toBeNull()
    expect(globeRegion()).toHaveAttribute('data-focus', '')
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
