# Contratos propuestos de 001-base-web

Interfaces TypeScript de diseño; no son implementación ni cambian el backend. `published-data.ts` incluye el
contenido mínimo de §17.3; todo campo adicional está rotulado como **propuesta de diseño** y se acuerda con
M-PUBLICACIÓN antes de estabilizarlo. `insight.ts` conserva `answer`, `citations` (lista de secciones) y
`source` de §21.1; el cliente Insight pertenece a M-INTERFAZ y no se implementa aquí.

- `published-data.ts`: atlas y archivos de estación.
- `insight.ts`: contrato del único endpoint externo, sin cliente en esta feature.
- `view-state.ts`: estado, navegación y proveedor visual.

REAL/DEMO es explícito, las fechas son UTC, la ausencia difiere de cero y no se atribuyen causas sin evidencia.
