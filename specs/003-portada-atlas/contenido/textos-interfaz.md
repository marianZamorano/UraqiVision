# Textos de interfaz de la portada y el atlas (RF-01, RF-03, RNF-03): borrador

- **Estado:** borrador para revisar (revisan Marian y Joaco, §19). Issue #77, tareas T011 y T018.
- **Destino:** cuando exista la base web (`specs/001-base-web`), estos textos se pasan a `es.json` y `en.json`.
- **Claves:** propuestas y provisionales; la estructura final la fija la implementación sobre 001.
- **Variables:** se escriben `{{así}}`; su valor sale del archivo de contenido del atlas o de lo publicado.
- **Reutilizadas de la spec 004 (no se duplican):** `marca.noReportada` y `marca.noReportadaMotivo` («No
  reportada» / "Not reported") de `specs/004-interfaz-bilingue/contenido/textos-interfaz.md`.
- **Textos de la portada** (`home.problema`, `home.nisar`, `home.uso`, `home.imagen`): en `portada.md`, con
  su respaldo.

## 1. Portada (RF-01, §20.1)

| Clave propuesta | Español | English |
|---|---|---|
| `home.explorar` | Explorar Bolivia | Explore Bolivia |
| `home.imagenPendiente` | Imagen pendiente | Image pending |
| `home.cifraFuente` | Fuente: {{fuente}} · Fecha: {{fecha}} · Método: {{metodo}} | Source: {{fuente}} · Date: {{fecha}} · Method: {{metodo}} |
| `home.metodoNoReportado` | Método no reportado por la fuente | Method not reported by the source |

## 2. Lista de departamentos y estaciones (RNF-04, FR-018)

| Clave propuesta | Español | English |
|---|---|---|
| `atlas.lista.titulo` | Departamentos y estaciones | Departments and stations |
| `atlas.lista.ayuda` | Elige un departamento para abrir su ficha. | Choose a department to open its profile. |
| `atlas.lista.globoNoDisponible` | El globo no está disponible; puedes usar esta lista. | The globe is not available; you can use this list. |

## 3. Estado de cada departamento (FR-010, FR-010a)

Siempre etiqueta de texto + icono; el color nunca es la única señal (RNF-04).

| Clave propuesta | Español | English |
|---|---|---|
| `atlas.estado.estacion` | Estación | Station |
| `atlas.estado.ficha` | Ficha | Profile |
| `atlas.sinEstacion` | Sin estación disponible | No station available |
| `atlas.irEstacion` | Ver la estación {{estacion}} | Open the {{estacion}} station |

## 4. Ficha (RF-03, FR-008, FR-009, FR-013)

| Clave propuesta | Español | English |
|---|---|---|
| `atlas.ficha.fenomeno` | Fenómeno | Phenomenon |
| `atlas.ficha.escenas` | Escenas NISAR | NISAR scenes |
| `atlas.ficha.escenasOrigen` | Consulta al catálogo CMR de la NASA del {{fecha}}, colección {{coleccion}}, periodo {{periodo}} | NASA CMR catalog query of {{fecha}}, {{coleccion}} collection, period {{periodo}} |
| `atlas.ficha.fuentes` | Fuentes | Sources |
| `atlas.ficha.fuenteEnVerificacion` | Fuente en verificación | Source being verified |
| `atlas.ficha.consultado` | Consultado el {{fecha}} | Accessed on {{fecha}} |
| `atlas.ficha.contexto` | Contexto, no resultado del radar | Context, not a radar result |
| `atlas.ficha.lugarDestacado` | Lugar destacado | Highlighted place |
| `atlas.ficha.cerrar` | Cerrar la ficha | Close profile |

## Pendientes

- Insight desde las fichas: pendiente de consulta con Mimi (FR-023); no hay textos para eso.
- Formato de fechas y cifras: el que fijó la spec 004 (aclaración 5 de Marian); aquí no se repite.
