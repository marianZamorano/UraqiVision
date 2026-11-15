/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CESIUM_ION_TOKEN?: string
  /** Versión beta (#110): base del endpoint local de estaciones del backend (p. ej. http://127.0.0.1:8787/api). */
  readonly VITE_PUBLISHED_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
