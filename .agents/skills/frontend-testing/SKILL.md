---
name: frontend-testing
description: "Estandar de pruebas del frontend con Vitest y React Testing Library: queries accesibles, mocking de red, hooks y cobertura. Usar al escribir o revisar pruebas de componentes, hooks, formularios y guardas por rol."
---

# Testing del frontend (Vitest + React Testing Library)

## Cuando aplicar

- Crear la prueba de un componente, hook, formulario o flujo de usuario.
- Corregir un bug: primero la prueba que lo reproduce, luego el fix.
- Antes de un PR de una pantalla con logica (directorio de contactos,
  formularios dinamicos, dashboard de KPIs, guardas por rol).

## Reglas

1. Probar **comportamiento visible**, no implementacion: usar queries por rol o
   texto accesible (`getByRole`, `getByLabelText`) en lugar de
   `container.querySelector` o selectores CSS.
2. Un test = un comportamiento; los nombres de `describe`/`it` se escriben en el
   lenguaje del usuario ("muestra el estado vacio cuando no hay contactos").
3. Mockear la red en el borde (el cliente HTTP o `fetch`), nunca el componente
   ni el hook bajo prueba.
4. Cubrir los cuatro estados de toda vista de datos: carga, error, vacio y exito.
5. Logica sin UI (hooks, utilidades): `renderHook` + `act`; no montar el DOM
   cuando no aporta nada.
6. Formularios: probar validacion (entrada invalida -> mensaje con
   `role="alert"`), el envio correcto y el error del servidor.
7. La accesibilidad es una asercion gratis: `getByRole("button", { name: /enviar/i })`
   falla si el control no tiene nombre accesible.
8. Determinismo: sin fechas, hora ni aleatoriedad reales (`vi.useFakeTimers`,
   datos fijos); limpiar los mocks en `afterEach`.
9. Cobertura como guia, no como meta: el objetivo es cubrir caminos de negocio y
   errores, no llegar al 100%.

## Ejemplo

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContactsTable } from "./ContactsTable";

describe("ContactsTable", () => {
  it("muestra el estado vacio cuando no hay contactos", () => {
    render(<ContactsTable contacts={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/sin contactos/i);
  });

  it("lista los contactos por nombre y empresa", () => {
    render(<ContactsTable contacts={[contacto]} />);
    expect(screen.getByRole("row", { name: /ana perez/i })).toBeInTheDocument();
  });
});
```

## Errores comunes

- Probar detalles de implementacion (estado interno, clases) => tests fragiles
  que no detectan bugs reales.
- Ignorar los avisos de `act(...)` => actualizaciones de estado sin control.
- Mockear el propio modulo bajo prueba => el test pasa aunque la logica este rota.
- Tests que dependen del orden entre si => fallan al correr uno solo.

## Checklist

- [ ] Queries por rol o texto accesible, no por CSS.
- [ ] Estados carga/error/vacio/exito cubiertos.
- [ ] Red mockeada en el borde y mocks limpiados en `afterEach`.
- [ ] Los formularios validan entrada y anuncian errores.
- [ ] `npm test` en verde antes del PR.
