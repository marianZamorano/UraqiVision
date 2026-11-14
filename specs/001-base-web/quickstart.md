# Quickstart de implementación: 001-base-web

Este documento describe la futura implementación; ejecutar solo después de crear `tasks.md` y respetar las
compuertas del plan.

## 1. Prerrequisitos

- Node 20 o superior, Git y dependencias del repositorio instaladas.
- Rama de issue creada desde `dev`, P-PROY-05 aprobado y contratos acordados con M-PUBLICACIÓN.
- DP-07 está cerrada: ion es preferido, pero la ruta sin ion y el fallback 2D siguen siendo obligatorios.

## 2. Entorno local

El `.env.example` de la **raíz** del repositorio declara sin valor (AGENTS.md §6, decisión del issue #82):

```dotenv
VITE_CESIUM_ION_TOKEN=
```

Crear el `.env` de la raíz con `npm run env:sync` y completar el valor localmente; Vite lo lee de la raíz con
`envDir`. No existe `web/.env`. No pegar el valor en terminal compartida, issue, PR, prompt, captura
o documentación. Vite lo hará visible: solo sirve el token público restringido, nunca una clave privada.

## 3. Orden de construcción

1. Shell, rutas y diccionarios es/en.
2. Tipos, validadores y máquina RF-34 con pruebas primero.
3. Portada y destinos vacíos pero reales.
4. Lectura, cancelación y caché.
5. Lista textual/2D accesible.
6. CesiumJS diferido con ion restringido y respaldos sin ion/2D.
7. Pruebas de recorrido, seguridad y rendimiento.
8. (Fuera de esta feature) Cliente Insight de M-INTERFAZ sobre el contrato de `contracts/insight.ts`.

## 4. Verificación mínima

```powershell
npm run sdd:validar
npm run ai:check
```

En `web/`, cuando exista: `npm test`, `npm run build` y `npm run test:e2e`. Además, inspeccionar el bundle,
medir portada a 10 Mbps, bloquear ion/WebGL y recorrer todo con teclado y movimiento reducido.

## 5. Resultado esperado

- Cinco rutas recargables y seis estados RF-34 bilingües.
- Datos inválidos controlados y ausencia distinta de cero.
- Cero recursos del globo desde portada.
- Funcionamiento sin ion y, si se habilita, solo assets/URLs autorizados.
