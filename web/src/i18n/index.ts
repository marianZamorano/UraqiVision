import type { Language } from '../contracts/view-state'

export const dictionaries = {
  es: {
    app: {
      title: 'UraqiVision',
      subtitle: 'Base web de la observación y validación de estaciones.',
      explore: 'Explorar Bolivia',
      changeLanguage: 'Cambiar idioma',
      home: 'Inicio',
      method: 'Método',
      about: 'Acerca de',
      exploreNav: 'Explorador',
      stationDetail: 'Estación',
    },
    pages: {
      home: {
        headline: 'Base web del proyecto UraqiVision',
        description: 'Recorrido principal, estados honestos y rutas reales para la validación de publicaciones estáticas.',
        cta: 'Explorar Bolivia',
      },
      explore: {
        title: 'Explorador',
        description: 'Seleccione una estación pública para abrir su análisis o detalle.',
        globeAttribution: 'La experiencia 3D conserva una alternativa textual y reconoce el proveedor visual.',
        globeAttributionLink: 'Atribución de Cesium',
        stationListLabel: 'Estaciones disponibles',
        fallbackWebglUnavailable:
          'Este navegador no puede mostrar el globo 3D (WebGL no disponible). Usa la lista de estaciones para explorar.',
        fallbackLoadFailed: 'No se pudo cargar el globo 3D. Usa la lista de estaciones para explorar.',
      },
      method: {
        title: 'Método',
        description: 'La web solo lee archivos publicados y presenta su provenance, método y rango.',
      },
      about: {
        title: 'Acerca de',
        description: 'UraqiVision es una base web estática con principios de trazabilidad, accesibilidad y rigor científico.',
      },
      station: {
        title: 'Estación',
        summary: 'Resumen',
      },
    },
    states: {
      loading: 'Cargando publicación…',
      available: 'Resultado disponible',
      limited: 'Datos limitados',
      noData: 'Sin datos',
      incompatibleDate: 'Fecha incompatible',
      error: 'Error en la publicación',
      retry: 'Reintentar',
    },
  },
  en: {
    app: {
      title: 'UraqiVision',
      subtitle: 'Web base for station observation and validation.',
      explore: 'Explore Bolivia',
      changeLanguage: 'Change language',
      home: 'Home',
      method: 'Method',
      about: 'About',
      exploreNav: 'Explorer',
      stationDetail: 'Station',
    },
    pages: {
      home: {
        headline: 'UraqiVision web base',
        description: 'Main route, honest states and real paths for static publication validation.',
        cta: 'Explore Bolivia',
      },
      explore: {
        title: 'Explorer',
        description: 'Select a public station to open its analysis or detail view.',
        globeAttribution: 'The 3D experience keeps a textual alternative and credits its visual provider.',
        globeAttributionLink: 'Cesium attribution',
        stationListLabel: 'Available stations',
        fallbackWebglUnavailable:
          'This browser cannot display the 3D globe (WebGL unavailable). Use the station list to explore.',
        fallbackLoadFailed: 'The 3D globe could not be loaded. Use the station list to explore.',
      },
      method: {
        title: 'Method',
        description: 'The web only reads published files and presents their provenance, method and range.',
      },
      about: {
        title: 'About',
        description: 'UraqiVision is a static web base built on traceability, accessibility and scientific rigor.',
      },
      station: {
        title: 'Station',
        summary: 'Summary',
      },
    },
    states: {
      loading: 'Loading publication…',
      available: 'Result available',
      limited: 'Limited data',
      noData: 'No data',
      incompatibleDate: 'Incompatible date',
      error: 'Publication error',
      retry: 'Retry',
    },
  },
} as const

export function getDictionary(language: Language) {
  return dictionaries[language]
}

export function getPreferredLanguage(): Language {
  const stored = localStorage.getItem('uraqivision-lang')
  if (stored === 'es' || stored === 'en') {
    return stored
  }
  return 'es'
}
