# Casos de prueba de la parte de Marian (spec 004): borrador

- **Estado:** borrador para revisar (revisa Mimi, §19). Sirve para hacer TDD cuando exista la base web.
- **Alcance:** panel, estados, glosario, idioma, fuente y calidad y Acerca de. Método y descargas son
  de Angie (reparto de #42) y no están aquí.
- **Trazabilidad:** cada caso cita su FR o SC de `spec.md` y su PS (§23.3).
- **Datos de prueba:** son archivos de prueba que imitan la estructura de §17.3. Viven **solo en las
  pruebas** y nunca se muestran como resultados (RN-04).
- **Nivel:** U = unitaria o de componente (Vitest), E2E = recorrido en el navegador (Playwright),
  M = revisión manual.

## 1. Panel de la estación (RF-33)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-01 | Estación con todos los archivos | Se abre el panel | Muestra periodo, órbita, polarización, hectáreas con rango, datos válidos, validación, advertencias, hipótesis y enlace al método | FR-001 | U |
| CP-02 | `hectares.csv` con valor 1234,5 y rango 1100–1300 | Se muestra en es y en en | «1.234,5 ha (rango: 1.100–1.300 ha)» / «1,234.5 ha (range: 1,100–1,300 ha)», con el mismo valor | FR-003, FR-013 | U |
| CP-03 | Hectáreas sin rango publicado | Se abre el panel | Muestra «Rango no reportado» con el motivo, nunca un rango inventado ni 0 | FR-003, FR-009 | U |
| CP-04 | Cualquier cifra del panel | Se inspecciona | Muestra fuente, fecha y método, con enlace a la página de método | FR-002 | U |
| CP-05 | Adquisición 2026-11-14T03:30Z | Se muestra | En hora de Bolivia (13 nov, 23:30, UTC−04); la fecha UTC está en la fuente | FR-004, RN-07 | U |
| CP-06 | Hipótesis publicadas | Se muestran | Llevan la etiqueta de hipótesis y su fuente; la clase es una de las cuatro de RN-05 | FR-005 | U |
| CP-07 | `validation.json` sin Sentinel-2 válida | Se abre el panel | «Validación limitada», la alternativa publicada y las métricas como «no reportadas» con su motivo | FR-006 | U |
| CP-08 | Porcentaje de datos válidos publicado | Se muestra | Aparece tal cual, sin recalcular (pendiente de DP-03) | FR-007 | U |

## 2. Estados de la vista (RF-34, RN-13)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-10 | Carga en curso | Se abre la vista | Estado «cargando»; nunca una pantalla vacía | FR-008 | U |
| CP-11 | Datos completos | Termina la carga | Estado «resultado disponible» | FR-008 | U |
| CP-12 | `quality.json` marca CQ-05 como limitado | Termina la carga | Estado «datos limitados» y la marca «limitada» en cada cifra afectada | FR-010 | U |
| CP-13 | `quality.json` sin el control CQ-05 | Termina la carga | «Control de calidad no reportado» con el motivo; la cifra no se marca ni se oculta | FR-010 | U |
| CP-14 | Falta un archivo de la estación | Se abre la vista | «Sin datos» con el motivo; ningún campo muestra 0 | FR-008, FR-009 | U |
| CP-15 | Fecha de otra órbita | Se elige | «Fecha incompatible» con el motivo | FR-008 | U |
| CP-16 | Fallo de red | Se carga | «Error» con el botón «Reintentar», que funciona con el teclado | FR-008 | U |
| CP-17 | Se pulsa «Reintentar» y la carga funciona | Termina | El foco queda en el contenido cargado | FR-008a | U |
| CP-18 | Se pulsa «Reintentar» y la carga vuelve a fallar | Termina | El foco queda en el mensaje de error | FR-008a | U |
| CP-19 | Cualquier cambio de estado | Ocurre | Se anuncia al lector de pantalla sin mover el foco; el error se anuncia de inmediato | FR-008a | U, M |
| CP-20 | Toda la suite de estados | Se buscan ceros | Ningún dato ausente se muestra como 0 | SC-002 | U |

## 3. Idioma (RF-20, RNF-03)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-30 | Vista en español con estación, fecha y capa elegidas | Se cambia a inglés | Todos los textos cambian sin recargar; la estación, la fecha y la capa se conservan | FR-012, SC-007 | E2E |
| CP-31 | Cambio de idioma | Ocurre | El idioma declarado de la página cambia; el foco sigue en el selector | FR-012a | U |
| CP-32 | `es.json` y `en.json` | Se comparan | Tienen las mismas claves y ninguna vacía (100 %) | SC-001 | U |
| CP-33 | Recorrido completo en inglés | Se recorre | Ningún texto queda en español | SC-001, HU-06 | E2E |
| CP-34 | Carga en curso | Se cambia de idioma | La carga continúa y el mensaje de estado sale en el idioma nuevo | Casos límite | U |

## 4. Glosario (RF-19)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-40 | Los 21 términos de §30 | Se revisa el glosario | Cada uno tiene su definición en es y en | FR-014, SC-008 | U |
| CP-41 | Término marcado | Se pasa el cursor, se toca o se enfoca con el teclado | Se abre la definición en el idioma activo | FR-014 | U |
| CP-42 | Definición abierta | Escape, botón «cerrar» (≥ 24 px) o toque fuera | Se cierra y el foco vuelve al término | FR-014a | U |
| CP-43 | Definición abierta con el cursor encima | Se espera | No desaparece sola (WCAG 1.4.13) | FR-014a | U |
| CP-44 | Tocar un término | Ocurre | La página no cambia | FR-014a | U |

## 5. Fuente y calidad y Acerca de (RF-37, RF-24)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-50 | `manifest.json` y `quality.json` | Se abre «Fuente y calidad» | Escenas, fechas, órbita, producto y madurez, CRID, fuente de validación y fecha de generación coinciden campo a campo | FR-019, SC-003 | U |
| CP-51 | Cualquier pantalla | Se busca el enlace a Acerca de | Existe y lleva a una página completa en es y en | FR-021 | E2E |
| CP-52 | Página Acerca de | Se revisa | Equipo y roles, licencias (MIT y CC BY 4.0), fuentes y citas de datos; sin logos de la NASA en contenido generado con IA | FR-021, FR-022 | M |

## 6. Accesibilidad, celular y movimiento (RNF-04, RNF-05, RNF-12; PS-07)

| ID | Given | When | Then | Traza | Nivel |
|---|---|---|---|---|---|
| CP-60 | Cada pantalla y cada estado | Revisión automática de accesibilidad | 0 violaciones serias o críticas | SC-006 | E2E |
| CP-61 | Panel y estados | Se recorren solo con el teclado | Todo se puede usar con el foco visible y sin quedar tapado | FR-023, SC-006 | E2E, M |
| CP-62 | Marcas «limitada», «no reportada» y «validación limitada» | Se revisan | Cumplen el contraste de componentes y no dependen solo del color | FR-023 | M |
| CP-63 | 320 px de ancho y 200 % de zoom | Se abren el panel y el glosario | Sin desplazamiento horizontal ni pérdida de información | SC-009 | E2E |
| CP-64 | Preferencia de movimiento reducido activa | Se recorren los estados | No hay animaciones; «cargando» se sigue percibiendo con un indicador estático | FR-024, SC-010 | U, E2E |

## Pendientes

- **CP-08** depende de DP-03.
- **CP-52** depende de DP-02 (declaración de IA) y de la cita oficial de NISAR (RN-11).
- **CP-60** necesita fijar en el plan (P-INTERFAZ-03) la herramienta de revisión automática.
