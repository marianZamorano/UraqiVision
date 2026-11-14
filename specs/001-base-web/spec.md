# Feature Specification: Base web navegable y confiable

**Feature Branch**: `[001-base-web]`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Crear la base web común de UraqiVision con el recorrido principal, lectura validada de los archivos publicados, estados honestos, cambio de idioma, accesibilidad, movimiento reducido, rendimiento y protección de credenciales."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recorrer UraqiVision de principio a fin (Priority: P1)

Una persona que llega por primera vez puede avanzar desde la portada hacia el explorador, abrir el análisis de
una estación y llegar a las páginas de Método y Acerca de. Cada destino tiene una dirección propia y utilizable,
aunque el contenido especializado de otra área todavía no esté construido.

**Why this priority**: El recorrido de §20.1 es el esqueleto que necesitan M-GLOBO, M-MAPA, M-ATLAS y
M-INTERFAZ para trabajar sin crear aplicaciones paralelas.

**Independent Test**: Se puede probar comenzando en la portada, activando cada enlace principal y comprobando
que se alcanza el destino correcto, se puede volver atrás y nunca aparece una pantalla vacía o una ruta rota.

**Acceptance Scenarios**:

1. **Given** una persona en la portada, **When** activa «Explorar Bolivia», **Then** llega al explorador mediante
   una dirección propia que puede recargarse y compartirse.
2. **Given** una estación seleccionada en el explorador, **When** activa «Analizar», **Then** llega al análisis
   de esa estación sin perder su identificador territorial.
3. **Given** cualquier pantalla del recorrido, **When** abre Método o Acerca de, **Then** llega a una página real
   y puede regresar al punto anterior.
4. **Given** que el contenido de un área aún no está implementado, **When** se abre su destino, **Then** se
   muestra un estado explícito y accesible en vez de una pantalla vacía o un error de navegación.

---

### User Story 2 - Abrir datos publicados sin conclusiones engañosas (Priority: P1)

Una persona abre un departamento o una estación y la web comprueba los archivos publicados antes de mostrar
sus datos. La vista comunica si está cargando, disponible, limitada, sin datos, incompatible o con error, sin
convertir ausencias en ceros ni presentar ejemplos como resultados reales.

**Why this priority**: RF-34, RN-04 y RN-13 son condiciones de confianza del producto. Las demás áreas deben
recibir una única interpretación de los datos y de sus estados.

**Independent Test**: Se puede probar con juegos de datos completos, incompletos, incompatibles, inválidos,
ausentes y de ejemplo; cada uno debe producir el estado y mensaje esperados sin bloquear la navegación.

**Acceptance Scenarios**:

1. **Given** una estación con archivos publicados válidos, **When** termina su lectura, **Then** la vista pasa de
   «cargando» a «resultado disponible» y entrega los datos a la pantalla solicitante.
2. **Given** una publicación marcada con limitaciones, **When** se abre, **Then** la vista muestra «datos
   limitados», conserva el motivo publicado y no completa valores por inferencia.
3. **Given** un valor ausente o no calculado, **When** se presenta su estado, **Then** aparece «no reportada» o
   «sin datos» con el motivo y nunca el número cero (RN-13).
4. **Given** fechas que no pueden compararse, **When** se solicita la vista, **Then** aparece «fecha
   incompatible» con una explicación y no se fabrica una comparación.
5. **Given** un archivo inaccesible, inválido o dañado, **When** falla su lectura o validación, **Then** aparece
   «error» con una acción de reintento que vuelve a ejecutar la solicitud.
6. **Given** datos creados solo para desarrollar o demostrar la interfaz, **When** se muestran, **Then** quedan
   identificados de forma visible como ejemplo o demo y no como evidencia real (RN-04).

---

### User Story 3 - Usar toda la base en español o inglés (Priority: P2)

Una persona puede alternar entre español e inglés desde cualquier destino sin recargar la aplicación. La
navegación, los estados, los mensajes de error y las etiquetas de datos cambian juntos y no quedan textos
mezclados.

**Why this priority**: El bilingüismo completo es un requisito transversal (RF-20, RNF-03) y debe existir antes
de que cada área agregue sus propios textos.

**Independent Test**: Se recorren todos los destinos y los seis estados en ambos idiomas, alternando el idioma
en cada punto y comprobando que la ubicación y el contexto se conservan.

**Acceptance Scenarios**:

1. **Given** cualquier destino en español, **When** la persona elige inglés, **Then** todos los textos de la
   base cambian sin recargar ni alterar el destino abierto.
2. **Given** un estado de carga, limitación, ausencia, incompatibilidad o error, **When** cambia el idioma,
   **Then** el estado y su motivo se muestran completamente en el idioma elegido.
3. **Given** que una persona navega a otro destino, **When** llega a él, **Then** se conserva el idioma elegido.

---

### User Story 4 - Navegar con teclado y movimiento reducido (Priority: P2)

Una persona que usa teclado, lector de pantalla o la preferencia del sistema para reducir movimiento puede
recorrer las mismas rutas y comprender los mismos estados que quien utiliza mouse o animaciones.

**Why this priority**: La base debe impedir que cada módulo resuelva accesibilidad de manera incompatible y
debe cumplir RNF-04 y RNF-12 desde el inicio.

**Independent Test**: Sin utilizar mouse, se recorre la navegación completa, se cambia de idioma y se activa un
reintento; luego se repite con movimiento reducido y se comprueba que toda transición sigue siendo comprensible.

**Acceptance Scenarios**:

1. **Given** la aplicación abierta, **When** una persona navega solo con teclado, **Then** alcanza y activa todas
   las acciones en un orden lógico y siempre identifica el foco visible.
2. **Given** un cambio de estado, **When** ocurre, **Then** las tecnologías de asistencia reciben un anuncio con
   la prioridad apropiada sin mover el foco inesperadamente.
3. **Given** la preferencia de movimiento reducido activa, **When** cambia de destino o estado, **Then** el cambio
   ocurre sin animación no esencial y sigue siendo perceptible mediante texto u otro indicador estático.
4. **Given** que el explorador especializado aún no está disponible o no puede usarse, **When** una persona
   necesita localizar una región, **Then** dispone de una alternativa textual navegable por teclado.

---

### User Story 5 - Entrar rápido y sin exponer credenciales (Priority: P3)

Una persona puede leer y utilizar la portada en una conexión limitada sin esperar a que se carguen las piezas
pesadas del explorador. Ninguna credencial privada queda accesible desde la aplicación entregada.

**Why this priority**: RNF-01 protege la primera impresión y RNF-06 evita que la base propague un patrón de
seguridad incorrecto a todos los módulos.

**Independent Test**: Se mide la portada bajo una conexión de 10 Mbps sin visitar el explorador y se inspecciona
el producto entregado para confirmar que no contiene credenciales privadas.

**Acceptance Scenarios**:

1. **Given** una conexión de 10 Mbps y una visita nueva, **When** se abre la portada, **Then** su contenido útil
   está disponible en menos de tres segundos sin cargar por anticipado el explorador especializado.
2. **Given** que una persona permanece en la portada, **When** termina la carga inicial, **Then** no se han
   solicitado recursos exclusivos del globo o del mapa de análisis.
3. **Given** una versión lista para entregar, **When** se inspeccionan sus archivos públicos y su historial,
   **Then** no aparece ninguna credencial privada (RNF-06).

### Edge Cases

- Una dirección de estación contiene un identificador inexistente, vacío o con caracteres no admitidos.
- `atlas/departments.geojson` no está disponible, está vacío, no puede validarse o carece de procedencia.
- La carpeta de una estación existe, pero falta uno o más archivos esperados de §17.3.
- Un archivo tiene formato válido, pero su versión, estación, órbita o periodo no coincide con los demás.
- Una carga termina después de que la persona cambió de estación o abandonó el destino; la respuesta anterior
  no debe reemplazar el contexto nuevo.
- La red se interrumpe durante la carga y vuelve antes o después de que la persona active «Reintentar».
- El contenido localizado de un dato existe en un idioma, pero falta en el otro.
- El almacenamiento de preferencias no está disponible; la aplicación sigue siendo utilizable y adopta un
  idioma predeterminado documentado.
- El texto aumenta al 200 % o la pantalla tiene 320 px de ancho; navegación, foco y mensajes siguen disponibles
  sin ocultar acciones esenciales.
- La preferencia de movimiento reducido cambia mientras la aplicación está abierta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (§20.1)**: La base MUST ofrecer destinos reales y recargables para portada, explorador, análisis de
  una estación, Método y Acerca de.
- **FR-002 (§20.1)**: La navegación MUST permitir avanzar y regresar entre los destinos sin perder el idioma ni
  el identificador territorial que corresponda.
- **FR-003 (§20.1, RF-34)**: Un destino cuyo contenido especializado todavía no exista MUST mostrar un estado
  explícito y accesible; nunca una pantalla vacía ni una ruta rota.
- **FR-004 (§17.3)**: La base MUST poder solicitar y comprobar la estructura publicada de una estación:
  `station.json`, `manifest.json`, `change.tif`, las vistas por fecha, `scars.geojson`, `hectares.csv`,
  `validation.json`, `quality.json` y `footprints.geojson`.
- **FR-005 (§17.3)**: La base MUST poder solicitar y comprobar `atlas/departments.geojson`, incluidos los datos
  necesarios para identificar su fuente, fecha y versión.
- **FR-006 (§17.3, §28)**: Los contratos de datos MUST distinguir campos obligatorios, opcionales y ausentes y
  rechazar contenido incompatible antes de entregarlo a una vista. Estos contratos siguen siendo una propuesta
  de diseño hasta su acuerdo con M-PUBLICACIÓN.
- **FR-007 (RF-34)**: Toda vista que solicite datos MUST estar siempre en exactamente uno de estos estados:
  cargando, resultado disponible, datos limitados, sin datos, fecha incompatible o error con reintento.
- **FR-008 (RF-34)**: Cada estado MUST tener un mensaje visible en ambos idiomas; «error» MUST ofrecer una acción
  de reintento y ningún estado MUST dejar la pantalla vacía.
- **FR-009 (RF-34, RNF-04)**: Los cambios de estado MUST comunicarse a tecnologías de asistencia sin retirar el
  foco de la acción que la persona está usando. Los errores urgentes se anuncian de inmediato; los demás cambios,
  sin interrumpir innecesariamente.
- **FR-010 (RN-13)**: Un valor ausente o no calculado MUST conservarse como ausencia y mostrarse como «no
  reportada» o «sin datos» con su motivo; MUST NOT transformarse en cero.
- **FR-011 (RN-04)**: Todo juego de datos de ejemplo, prueba o demostración MUST portar una marca inequívoca y
  visible que impida interpretarlo como resultado real.
- **FR-012 (RN-03, RN-07)**: La base MUST conservar junto con los datos su procedencia, fecha y método disponibles,
  y MUST preservar las fechas de adquisición en UTC para que las áreas puedan presentarlas en hora de Bolivia.
- **FR-013 (RF-20, RNF-03)**: La persona MUST poder alternar español e inglés sin recargar, manteniendo el destino,
  estado y selección actuales.
- **FR-014 (RF-20, RNF-03)**: El 100 % de la navegación, estados, errores, acciones y contenido base MUST existir
  en español e inglés; la ausencia de una traducción MUST detectarse antes de entregar la aplicación.
- **FR-015 (RNF-04)**: Todas las acciones de la base MUST poder alcanzarse y activarse con teclado, en orden lógico
  y con foco visible.
- **FR-016 (RNF-04)**: El explorador MUST disponer de una alternativa textual para departamentos y estaciones,
  aunque la visualización especializada todavía no se haya cargado o no pueda utilizarse.
- **FR-017 (RNF-12)**: Las transiciones y los indicadores MUST respetar la preferencia del sistema para reducir
  movimiento, sin depender exclusivamente de animaciones para comunicar estado.
- **FR-018 (RNF-01)**: La portada MUST ofrecer contenido útil en menos de tres segundos con una conexión de
  10 Mbps y MUST posponer los recursos exclusivos del explorador hasta que la persona entre en él.
- **FR-019 (RNF-06)**: Ninguna credencial privada del proveedor de IA, de datos o de infraestructura MUST formar
  parte de los archivos públicos, del historial del proyecto ni del producto entregado al navegador.
- **FR-020 (§8.2)**: La base MUST NOT incorporar cuentas de usuario, alertas, áreas dibujadas por la persona,
  bases de datos, colas ni procesamiento científico en tiempo real.
- **FR-021 (§17, §28)**: La base MUST mostrar únicamente archivos ya publicados y MUST NOT recalcular, completar
  o reinterpretar resultados científicos.
- **FR-022 (RF-34)**: Una respuesta tardía de una selección anterior MUST NOT reemplazar los datos o el estado de
  la selección vigente.

### Key Entities *(include if feature involves data)*

- **Destino del recorrido**: pantalla identificable de portada, explorador, análisis de estación, Método o Acerca
  de; conserva idioma y, cuando aplica, la selección territorial.
- **Selección territorial**: departamento, estación y periodo actualmente elegidos; permite que las áreas
  compartan contexto sin mezclar resultados de territorios distintos.
- **Departamento publicado**: límite territorial y atributos de identificación, fuente, fecha y versión contenidos
  en `atlas/departments.geojson`.
- **Estación publicada**: conjunto de archivos de §17.3 asociado a un identificador de estación y a una versión de
  publicación; puede estar completo, limitado, ausente, incompatible o inválido.
- **Manifiesto de publicación**: procedencia de los gránulos y versión del procesamiento utilizada para producir
  una estación; respalda trazabilidad, no constituye un resultado calculado por la web.
- **Estado de la vista**: uno de los seis estados de RF-34, acompañado por mensaje, motivo, idioma y acción de
  reintento cuando corresponde.
- **Valor reportable**: dato que conserva valor o ausencia, unidad, fuente, fecha, método y cualquier marca de
  limitación; una ausencia nunca equivale a cero.
- **Preferencias de experiencia**: idioma y reducción de movimiento elegidos por la persona o indicados por su
  sistema, aplicables a todo el recorrido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (§20.1)**: El 100 % de los cinco destinos del recorrido puede abrirse directamente, recargarse y
  alcanzarse mediante navegación visible sin producir rutas rotas ni pantallas vacías.
- **SC-002 (RF-34)**: Los casos de prueba de los seis estados terminan en el estado y mensaje esperados; todos los
  casos de error ofrecen un reintento funcional.
- **SC-003 (RN-13)**: En el 100 % de los casos con valores ausentes o no calculados se muestra la ausencia y su
  motivo, y en ninguno aparece un cero sustituto.
- **SC-004 (RN-04)**: El 100 % de los datos de ejemplo o demostración incluidos para desarrollar se distingue de
  resultados reales antes de que una persona pueda interpretarlos.
- **SC-005 (RF-20, RNF-03)**: El recorrido completo, sus seis estados y todos sus mensajes pueden completarse en
  español y en inglés sin recargar ni encontrar texto base sin traducir.
- **SC-006 (RNF-04)**: Todas las acciones del recorrido pueden completarse solo con teclado, con foco visible y sin
  violaciones serias o críticas en una revisión de accesibilidad de cada destino y estado.
- **SC-007 (RNF-12)**: Con movimiento reducido activo, el 100 % de los cambios de destino y estado siguen siendo
  perceptibles y no ejecutan movimiento no esencial.
- **SC-008 (RNF-01)**: La portada ofrece contenido útil en menos de tres segundos bajo una conexión de 10 Mbps y
  no solicita recursos exclusivos del explorador antes de que la persona lo abra.
- **SC-009 (RNF-06)**: Las revisiones del producto público y del historial encuentran cero credenciales privadas.
- **SC-010 (§17.3)**: Todos los juegos de prueba incompletos, inválidos, incompatibles o inaccesibles producen un
  estado controlado y una explicación; ninguno bloquea el resto de la navegación.

## Assumptions

- La web es pública y no requiere cuentas, autenticación ni perfiles personales (§8.2).
- M-PUBLICACIÓN entrega archivos estáticos conforme a §17.3. Su estructura es una propuesta de diseño: cualquier
  cambio se acuerda con el backend y se registra antes de implementarse.
- M-GLOBO, M-MAPA, M-ATLAS y M-INTERFAZ aportan su contenido en SDD separados; esta feature entrega únicamente
  rutas, contexto, contratos comunes y comportamientos transversales.
- La decisión de hospedaje permanece fuera de esta feature mientras DP-06 no se cierre.
- DP-07 quedó cerrada en el documento maestro v1.1: Cesium ion usa World Terrain (asset 1) y Bing Maps Aerial
  (asset 2) con token público `assets:read` restringido. Ninguna credencial privada se expone y los respaldos sin
  ion y 2D mantienen el recorrido cuando la visualización especializada no está disponible.
- Si no puede recuperarse una preferencia previa de idioma, la base inicia en español y permite cambiar a inglés
  inmediatamente.
- Los estados y comportamientos transversales se coordinan con `specs/004-interfaz-bilingue/spec.md`; ante una
  diferencia, prevalecen el documento maestro y la decisión registrada por el equipo.

