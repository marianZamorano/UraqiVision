---
name: react-component-architecture
description: "Estandar de arquitectura de componentes React + TypeScript: composicion, props, estado, custom hooks y ubicacion de archivos. Usar al crear o refactorizar componentes, hooks o estructura de carpetas del frontend."
---

# Arquitectura de componentes React

## Cuando aplicar

- Crear, refactorizar o eliminar componentes (`.tsx`).
- Definir props, estado local o custom hooks (`.ts`/`.tsx` con `use*`).
- Decidir donde vive una pieza nueva dentro de `src/`.

## Reglas

1. Un componente por archivo; el nombre del archivo = nombre del componente
   en PascalCase (`ChapterCard.tsx`).
2. Componentes funcionales puros: sin clases, sin efectos ocultos en el render.
3. Props tipadas con `interface Props` exportada; nunca `any`; los eventos
   siguen `React.SyntheticEvent` o tipos DOM concretos.
4. Presentacionales (sin estado) en `src/components/`; con estado/negocio en
   `src/features/<feature>/`; ambos reciben datos por props, no importan APIs.
5. Logica reutilizable en custom hooks (`src/hooks/useChapters.ts`): toda
   logica que un componente no debe conocer (fetch, storage, media queries).
6. Composicion antes que configuracion: preferir `children`/props-slot a
   booleanos que esconden ramas de render (`showX`, `isY`).
7. Listas con `key` estable (id del servidor), nunca el indice.
8. Derivar valores calculados en render (variables), no en `useEffect` + estado.
9. `useEffect` solo para sincronizar con sistemas externos (red, timers,
   DOM); jamás para "actualizar estado que deriva de props/estado".
10. Estilos con CSS Modules o tokens del design system; sin estilos inline
    salvo valores dinámicos calculados.

## Ejemplo

```tsx
interface ChapterCardProps {
  title: string;
  memberCount: number;
  onSelect: (id: string) => void;
}

export function ChapterCard({ title, memberCount, onSelect }: ChapterCardProps) {
  return (
    <button type="button" className={styles.card} onClick={() => onSelect(title)}>
      <h3>{title}</h3>
      <span>{memberCount} miembros</span>
    </button>
  );
}
```

## Errores comunes

- Estado duplicado de datos que ya viven en el servidor (staleness).
- `useEffect` con deps incompletas => renders perdidos o bucles.
- Componentes de 500+ lineas => partir en presentacional + contenedor + hook.

## Checklist

- [ ] Nombre de archivo = nombre del componente (PascalCase).
- [ ] Props tipadas, sin `any`, con valores por defecto destructurados.
- [ ] Sin logica de red dentro de componentes presentacionales.
- [ ] Listas con `key` estable y `useEffect` justificado.
