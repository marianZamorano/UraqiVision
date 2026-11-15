# Evidencia de la base web (001 T048 y T049)

**Hecho verificado** el 14 nov 2026 (hora de Bolivia), sobre `dev` en `a0d9531` (PR #112), con Windows 11,
Node 22.20.0, Vite 8.3.8 y Chromium de Playwright 1.65.1.

## T048 · Portada a 10 Mbps, 320 px y movimiento reducido (RNF-01, RNF-05, RNF-12)

Prueba: [`home-budget.spec.ts`](home-budget.spec.ts). Limita la red con Chrome DevTools Protocol a 10 Mbps de
bajada, sin caché, en una ventana de 320 × 640 con `prefers-reduced-motion: reduce`, y falla si la carga supera 3 s.

**Supuesto** (RNF-01 no lo fija): 40 ms de ida y vuelta y 5 Mbps de subida.

| Corrida | `load` | `DOMContentLoaded` | Transferido | Cesium pedido |
|---|---|---|---|---|
| 1 | 269 ms | 268 ms | 92 KB | no |
| 2 | 241 ms | 241 ms | 92 KB | no |
| 3 | 224 ms | 224 ms | 92 KB | no |

**Control** (para comprobar que el límite de red se aplica): la misma prueba a 0,5 Mbps dio `load` = 1689 ms con los
mismos 92 KB, coherente con 92 KB × 8 / 0,5 Mbps ≈ 1,5 s.

**Resultado:** RNF-01 se cumple con margen (≈ 0,25 s frente a 3 s). La portada no pide CesiumJS. El bundle inicial
es de 291,8 kB (92,5 kB comprimido); CesiumJS (4,9 MB), el mapa beta de MapLibre (1,4 MB) y el inglés (2,6 kB) se
descargan solo al usarse.

## T049 · Pruebas, build y arranque (PS-04, PS-09)

| Comando (en `web/`) | Resultado |
|---|---|
| `npm test` | 22 archivos, 136/136 pruebas |
| `npm run build` | correcto (`tsc --noEmit` estricto y `vite build`) |
| `npx vite preview --host 127.0.0.1 --port 5181` | arranca y sirve la aplicación |

Respuestas de la vista previa:

| Ruta | Respuesta |
|---|---|
| `/`, `/explore`, `/station/tarija`, `/method` | 200, `text/html` (la misma app: las rutas profundas se pueden recargar) |
| `/cesium/LICENSE.md` | 200, `text/markdown`, 55 679 B |
| `/cesium/attribution.txt` | 200, `text/plain`, 376 B |

En Windows, el puerto 4173 puede estar reservado por Hyper-V: `PLAYWRIGHT_PORT=5180 npm run test:e2e`.

## Pendiente (no decidido aquí)

- **DP-06 (hospedaje):** las rutas profundas recargables dependen de que el servidor devuelva `index.html` para
  cualquier ruta (como hace `vite preview`). El hospedaje que se elija debe hacer lo mismo.
- La ruta absoluta `/cesium` supone que el sitio se sirve desde la raíz del dominio (también depende de DP-06).
