// uraqi: vivo — lo carga el visor por nombre
type GlobeAttributionProps = {
  description: string
  linkLabel: string
}

export function GlobeAttribution({ description, linkLabel }: GlobeAttributionProps) {
  return (
    <p aria-live="polite">
      {description}
      {' '}
      <a href="/cesium/attribution.txt" target="_blank" rel="noreferrer">
        {linkLabel}
      </a>
      .
    </p>
  )
}
