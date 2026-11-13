# Playbook de pruebas flaky

1. **Confirmar**: ejecutar la suite N veces (≥ 3) sin cambios de código y comparar con `flaky-detect.mjs`.
2. **Clasificar la causa** (de más a menos frecuente):

| Causa | Señal | Corrección |
|---|---|---|
| Espera por tiempo fijo | `sleep`/`setTimeout`, gran dispersión de duración | Esperar por condición o aserción web-first |
| Estado compartido / orden | Falla solo en suite completa o en paralelo | Aislar datos, reset por prueba, quitar dependencias de orden |
| Datos no deterministas | Fechas, aleatorios, UUID, orden de resultados sin `ORDER BY` | Fijar reloj/semilla, ordenar explícitamente |
| Recursos externos | Red, servicios de terceros | Mock en la frontera + contract test |
| Concurrencia real | Condiciones de carrera en el código | Es un **defecto del producto**: reportarlo |
| Entorno/infra | Solo en CI, recursos limitados | Revisar límites, timeouts de CI, versiones |

3. **Contener**: cuarentena etiquetada (`@flaky`) con ticket y responsable; nunca borrar ni reintentar a ciegas.
4. **Corregir** con `systematic-debugging` (causa raíz antes que síntoma).
5. **Verificar**: 10 ejecuciones consecutivas en verde antes de sacar de cuarentena.
