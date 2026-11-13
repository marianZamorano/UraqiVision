---
name: frontend-data-fetching
description: Estándar de carga de datos en la web de UraqiVision, es decir los archivos estáticos publicados de cada estación y la llamada a Insight, con estados de la vista, caché, cancelación, tiempos de espera y peso (RF-34, RF-36, RNF-01, RNF-02). Usar al crear hooks de datos o pantallas que cargan vistas, GeoJSON, CSV o JSON.
---

# Carga de datos en la web

Adaptada de la skill homónima de chapterCoreIEEE para una arquitectura **estática primero** (§17). Los tipos
y la capa de servicios están en la skill `typed-api-integration`.

## Cuándo aplicar

- Crear o modificar un hook o función que lea archivos de una estación o llame a `/api/insight`.
- Añadir los estados de la vista a una pantalla que carga datos.

## Reglas

1. **Hooks reutilizables** (`useStation`, `useHectares`, `useScars`, propuesta) en lugar de `useEffect` +
   `fetch` repetido en cada componente.
2. **Los seis estados de RF-34**: cargando, resultado disponible, datos limitados, sin datos, fecha
   incompatible y error con reintento. Ninguna pantalla en blanco.
3. **Los archivos publicados no cambian durante la sesión**: cachéalos en memoria por estación y fecha; no
   los vuelvas a descargar al cambiar de pestaña o volver del análisis al globo (RF-29).
4. **Una fecha, todo sincronizado** (RF-36): al cambiar la fecha se cancelan las cargas de la fecha anterior
   (`AbortController`) para que no llegue una imagen vieja después de la nueva.
5. **Tiempo de espera** en cada carga: un archivo que no llega deja la vista en «error con reintento», no un
   spinner infinito.
6. **Carga diferida y peso**: CesiumJS solo al entrar al explorador (RNF-01); las vistas WebP de una fecha
   solo cuando se piden; respeta el presupuesto de 40 MB por estación (RNF-02).
7. **Comprueba `res.ok`** antes de leer el cuerpo; un 404 no es un archivo vacío.
8. **Nada sensible en `import.meta.env.VITE_*`**: Vite lo expone en el bundle (RNF-06).
9. Insight: una pregunta a la vez, con límite de longitud y de preguntas (RNF-07, valores en DP-04);
   si falla, se muestra la plantilla (RF-18).

## Errores comunes

- `res.json()` sin revisar `res.ok` → un error se muestra como dato.
- Convertir un campo ausente en `0` al parsear un CSV (RN-13).
- Mostrar la imagen de una fecha con las hectáreas de otra por no cancelar cargas viejas.

## Checklist

- [ ] Datos cargados con hooks reutilizables y caché por estación y fecha.
- [ ] Los seis estados de RF-34 implementados y probados (PS-04).
- [ ] Cargas viejas canceladas al cambiar de fecha.
- [ ] Tiempos de espera y reintento.
- [ ] Ningún secreto en el cliente.
