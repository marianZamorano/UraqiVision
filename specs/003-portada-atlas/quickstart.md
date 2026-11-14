# Quickstart: validar la portada y las fichas del atlas

Guía de validación de 003-portada-atlas. Requiere la base de 001 implementada y verificada (P-PROY-07) y los
comandos de `specs/001-base-web/quickstart.md`; este archivo no repite su instalación.

## Escenarios

| # | Escenario | Cómo se comprueba | Resultado esperado | Requisito |
|---|---|---|---|---|
| 1 | Portada en escritorio y a 320 px | Abrir `/` | Frase del problema, NISAR y uso, cifras con fuente y fecha, imagen o «imagen pendiente», botón «Explorar Bolivia» | RF-01, FR-001 a FR-005 |
| 2 | Un clic al atlas | Pulsar «Explorar Bolivia» | Se abre `/explore` con la lista textual (y el globo si carga) | RF-01, FR-003 |
| 3 | Portada sin globo | Prueba de red de 001 en `/` | Cero solicitudes del globo; portada útil < 3 s a 10 Mbps | RNF-01, FR-006 |
| 4 | Ficha de La Paz | Abrirla desde la lista | Fenómeno, 39 escenas con origen CMR, «Fuente en verificación», «Ficha», «sin estación disponible» | HU-07, FR-009, FR-010 |
| 5 | Ficha de Santa Cruz | Abrirla | «Estación», escenas «54–55», fuentes de §31, enlace a la estación o «no reportada» | FR-011, R7 |
| 6 | Tunari | Abrir Cochabamba | Tunari como ficha dentro de Cochabamba, nunca como estación | FR-012 |
| 7 | Solo teclado | Recorrer lista y fichas | Foco visible, todo operable | RNF-04, PS-07 |
| 8 | Inglés | Cambiar idioma con una ficha abierta | Misma ficha, todo en inglés | RNF-03 |
| 9 | Sin globo | Simular fallo del globo | La lista sola; las fichas se abren igual | FR-003, FR-018 |
| 10 | Contenido válido | Pruebas unitarias del validador | 9 fichas; §10.4 literal; cada afirmación con fuente o aviso | data-model.md |

## Comandos

Los de 001 (Vitest y Playwright); las pruebas de M-ATLAS viven en `web/tests/unit` y `web/tests/e2e`
(estructura de 001). Revisión de fuentes con la skill `rigor-y-fuentes`.
