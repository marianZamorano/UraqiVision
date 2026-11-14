# Contratos de M-ATLAS (003-portada-atlas)

| Contrato | Qué es | Estado |
|---|---|---|
| `atlas-content.ts` | Forma del archivo de contenido de la portada y las fichas (data-model.md) | **Propuesta de diseño** (#63) |
| `specs/001-base-web/contracts/published-data.ts` | `DepartmentsGeoJson`, `StationDocument`, `ReportableValue` | De 001 (Joaco); se reutiliza sin cambios |
| `specs/001-base-web/contracts/view-state.ts` | `RouteState` (`department`, `station`) y estados RF-34 | De 001; se reutiliza sin cambios |

- El contenido de las fichas no es un archivo de §17.3: no cambia el contrato con el backend.
- El nombre del campo de identificador de departamento sigue al contrato de 001, que hoy tiene una diferencia
  entre su `data-model.md` y su `published-data.ts` (research.md, R3). Se resuelve en 001.
