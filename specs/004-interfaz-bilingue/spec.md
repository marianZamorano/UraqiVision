# Feature Specification: Interfaz bilingüe, panel, estados, descargas y páginas de respaldo

**Feature Branch**: `feat/43-spec-interfaz-bilingue`
**Feature Directory**: `specs/004-interfaz-bilingue`
**Created**: 2026-11-14
**Status**: Draft
**Módulo (§19)**: M-INTERFAZ, con Angie y Marian como responsables y Mimi como revisora
**Issue**: #43 · **Prompt SDD**: P-INTERFAZ-01
**Input**: prompt P-INTERFAZ-01 de `sdd/m-interfaz.md`, con los ajustes que pidió `guardian-alcance`.

> Fuente de verdad: `docs/UraqiVisionDocumentoMaestrov1.1.pdf`. Cada requisito conserva su identificador
> del documento. Lo que el documento no fija se marca como **propuesta**, y lo que depende de §29 como
> **pendiente (DP-xx)**.

## Clarifications

### Session 2026-11-14

- Q: Cuando el resultado de calidad publicado marca el control de datos válidos (CQ-05) como
  limitado, ¿qué hace la web? → A: La vista pasa al estado «datos limitados» y cada cifra afectada
  lleva la marca «limitada». Si el control no viene publicado, se muestra «control de calidad no
  reportado» con su motivo (RN-13), sin marcar la cifra como limitada y sin ocultarla.
- Q: Si no hubo imagen Sentinel-2 válida, ¿qué muestra el panel en la validación? → A: La marca
  «validación limitada», la alternativa usada tal como viene publicada en la validación (focos de calor
  VC-02 y revisión visual VC-05) con enlace al método, y las métricas frente a Sentinel-2 como «no
  reportadas» con su motivo (RN-13).
- Q: ¿Qué términos entran en el glosario de la web? → A: Todos los términos de §30 del documento (21 a
  fecha de hoy), con su definición, en español e inglés. Si el sitio usa otro término técnico que no
  está en §30, se propone al equipo para añadirlo a §30 (§1, §28) antes de incluirlo.
- Q: ¿Qué créditos llevan el PNG del mapa y el CSV de hectáreas? → A: Nombre del sitio y de la
  estación; fechas de adquisición en hora de Bolivia; fecha de generación y versión de los datos según
  el manifiesto; fecha de descarga; cita de NISAR según su guía de citación (RN-11) y de FIRMS o
  Sentinel-2 cuando aparezcan; licencia CC BY 4.0 (RNF-11). La URL del sitio queda pendiente de DP-06.
- Q: ¿Cómo se formatean fechas y cifras en cada idioma? → A: Según el idioma y en hora de Bolivia
  (UTC−04). **Propuesta**: RN-07 solo fija «hora de Bolivia»; el formato concreto es decisión de diseño.
  - En español: «14 nov 2026, 10:32 (hora de Bolivia, UTC−04)», con coma decimal y punto de miles
    («1.234,5 ha»).
  - En inglés: «Nov 14, 2026, 10:32 (Bolivia time, UTC−04)», con punto decimal y coma de miles
    («1,234.5 ha»).
  - La fecha UTC original se ve en la fuente.
  - El CSV descargado usa siempre punto decimal y fechas ISO 8601 en UTC.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender una estación en un solo panel (Priority: P1)

Una gestora de un área protegida abre la estación San Ignacio de Velasco. Quiere ver en un solo lugar
qué periodo y qué órbita se analizaron, con qué polarización, cuántas hectáreas cambiaron (con su
rango), qué parte del área tenía datos válidos, cómo se validó el resultado, qué advertencias hay y
qué hipótesis explican el cambio. Cada cifra tiene que llevar su fuente para poder citarla.

**Why this priority**: el panel es el lugar donde se responden las dos preguntas del producto (dónde y
cuándo quemó, y si fue quema o desmonte). Sin él, la estación no comunica nada (RF-33, HU-05).

**Independent Test**: con los archivos publicados de una estación, el panel muestra todos los campos
de RF-33 en ambos idiomas, y cada cifra coincide con su archivo de origen.

**Acceptance Scenarios**:

1. **Given** una estación con resultado disponible, **When** la persona abre su análisis, **Then** el
   panel muestra periodo, órbita, polarización, hectáreas con su rango inferior y superior, porcentaje
   de datos válidos, validación, advertencias, hipótesis y un enlace al método (RF-33, RN-06).
2. **Given** cualquier cifra del panel, **When** la persona la consulta, **Then** ve su fuente, su fecha
   y su método, con enlace a la página de método (RN-03, HU-05).
3. **Given** las fechas de adquisición publicadas en UTC, **When** se muestran, **Then** aparecen en hora
   de Bolivia y se indica la zona horaria (RN-07).
4. **Given** hipótesis sobre la causa del cambio, **When** se muestran, **Then** se presentan como
   hipótesis con su fuente, nunca como certeza. Las clases de parche son cuatro: compatible con quema,
   compatible con pérdida previa de estructura, evidencia ambigua y datos insuficientes (RN-05 para la regla de las hipótesis; las clases salen de §11.2 y MC-06).
5. **Given** que no hubo imagen óptica válida para validar, **When** se muestra la validación, **Then**
   el panel dice «validación limitada» y nombra la alternativa usada (RF-11).
6. **Given** una métrica que no se pudo calcular, **When** el panel la muestra, **Then** aparece como
   «no reportada» junto con su motivo, nunca como 0 (RN-13).

---

### User Story 2 - Saber siempre en qué estado está la vista (Priority: P1)

Cualquier persona que abre una estación, cambia de fecha o pierde la conexión ve siempre un mensaje
que explica qué pasa y qué puede hacer. Nunca encuentra una pantalla vacía ni un cero engañoso.

**Why this priority**: RF-34 y RN-13 son reglas de honestidad (principio II de la constitución). Además,
el mapa y el globo reutilizan estos mismos estados.

**Independent Test**: se simula cada uno de los seis estados con archivos de prueba y se comprueba que
cada uno tiene su mensaje en ambos idiomas, que el de error ofrece reintentar y que ninguno muestra
ceros en lugar de datos ausentes.

**Acceptance Scenarios**:

1. **Given** que los datos se están cargando, **When** la vista espera, **Then** muestra el estado
   «cargando» y no deja la pantalla vacía (RF-34).
2. **Given** datos completos, **When** terminan de cargar, **Then** muestra «resultado disponible».
3. **Given** que el control de datos válidos publicado marca la cifra como limitada, **When** se muestra,
   **Then** el estado es «datos limitados» y la cifra lleva esa marca. La web no calcula ningún umbral
   propio: muestra la marca que trae el resultado de calidad publicado (CQ-05, RF-37).
4. **Given** que no hay datos para la estación o la fecha, **When** se abre la vista, **Then** muestra
   «sin datos» con su motivo y nunca un cero (RF-34, RN-13).
5. **Given** que la fecha elegida no es compatible (otra órbita o sin par), **When** se elige, **Then**
   muestra «fecha incompatible» y explica por qué.
6. **Given** un fallo al cargar, **When** ocurre, **Then** muestra «error» con un botón para reintentar
   que se puede usar con el teclado.

---

### User Story 3 - Leer todo en mi idioma y entender los términos de radar (Priority: P2)

Un visitante extranjero cambia la web al inglés y lo lee todo en inglés sin que la página se recargue.
Una ciudadana sin formación en radar pasa el cursor por «retrodispersión» (o la toca en el celular) y
lee una definición breve.

**Why this priority**: RNF-03 exige el 100 % de los textos en ambos idiomas, y el glosario hace la web
comprensible para el público general (RF-19, RF-20, HU-06; HU-03 en lo que toca al glosario).

**Independent Test**: se cambia de idioma en cada pantalla y se comprueba que ningún texto queda en el
otro idioma y que la vista, la estación y la fecha no se pierden. Cada término marcado del glosario se
abre con el ratón, con el tacto y con el teclado.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla, **When** la persona cambia de idioma, **Then** todos los textos cambian
   sin recargar y la vista conserva la estación, la fecha y la capa que tenía (RF-20, RNF-03).
2. **Given** cifras y fechas, **When** cambia el idioma, **Then** usan el formato de ese idioma (separador
   decimal y formato de fecha) sin cambiar su valor (RN-07).
3. **Given** un término de radar marcado, **When** la persona pasa el cursor, lo toca o llega a él con el
   teclado, **Then** ve su definición en el idioma activo y la puede cerrar con Escape, con un botón
   «cerrar» o tocando fuera. Al cerrarla, el foco vuelve al término (RF-19, RNF-04).
4. **Given** todos los términos de radar que usa el sitio, **When** se revisa el glosario, **Then** cada
   uno tiene su definición en los dos idiomas (RF-19).

---

### User Story 4 - Descargar cifras y datos para mis informes (Priority: P2)

Un guardaparque descarga la serie de hectáreas en una tabla y una imagen del mapa que tiene en
pantalla, con fecha, fuente y créditos, para usarlas en su informe. Un analista descarga los datos de
la estación tal como se publicaron.

**Why this priority**: HU-02 y la reutilización de los resultados (RF-21, RF-22, OE6).

**Independent Test**: se descargan la tabla y la imagen y se comprueba que llevan fecha, fuente y
créditos, y que las cifras de la tabla coinciden con las publicadas. Se descargan los datos de la
estación y se comprueba que son idénticos byte a byte a los publicados.

**Acceptance Scenarios**:

1. **Given** la serie de hectáreas publicada, **When** la persona descarga la tabla, **Then** el archivo
   trae fecha, hectáreas, rango inferior y superior y fuente, y además fecha de descarga y créditos. Las
   cifras coinciden con las publicadas (RF-21, HU-02, RN-06).
2. **Given** el mapa que se ve en pantalla, **When** la persona descarga la imagen, **Then** la imagen
   incluye fecha, fuente y créditos (RF-21).
3. **Given** los archivos de cambio, cicatrices y manifiesto de la estación, **When** la persona los
   descarga, **Then** recibe exactamente los archivos publicados, sin transformarlos. Su formato, su
   georreferenciación y su licencia los define M-PUBLICACIÓN (RF-22).
4. **Given** un archivo publicado que falta, **When** se intenta descargar, **Then** el botón explica que
   no está disponible y su motivo, en lugar de fallar en silencio (RN-13).

---

### User Story 5 - Saber de dónde sale todo: fuente y calidad, método y Acerca de (Priority: P3)

Un funcionario quiere respaldar las cifras: ve qué escenas se usaron, de qué órbita y fecha, con qué
producto, madurez y versión, cómo se validó y cuándo se generó el resultado. Lee el método, los
límites y quién hizo el proyecto, con licencias y citas de datos.

**Why this priority**: es el respaldo de todo lo anterior (RF-37, RF-15, RF-24, OE6). Va después porque
depende de contenido que se redacta en paralelo.

**Independent Test**: los campos de «fuente y calidad» coinciden uno a uno con el manifiesto y el
resultado de calidad publicados. Las páginas de método y Acerca de están completas en los dos idiomas y
se puede llegar a ellas desde todo el sitio.

**Acceptance Scenarios**:

1. **Given** una estación, **When** la persona abre «fuente y calidad», **Then** ve las escenas usadas,
   las fechas, la órbita, el producto y su madurez, el CRID, la fuente de validación y la fecha de
   generación, y todo coincide con lo publicado (RF-37).
2. **Given** la página de método, **When** se abre desde una estación, **Then** explica el pipeline, los
   parámetros, la versión de los datos, los límites y la madurez del producto (PROVISIONAL) (RF-15,
   RN-08).
3. **Given** la página Acerca de, **When** se abre desde cualquier pantalla, **Then** muestra el equipo y
   sus roles, las licencias (código MIT; textos y datos derivados CC BY 4.0), las fuentes y las citas de
   datos de NISAR, FIRMS y las fuentes bolivianas según sus guías (RF-24, RN-11, RNF-11).
4. **Given** contenido generado con IA en la página, **When** se muestra, **Then** no usa logos ni marcas
   de la NASA, y las imágenes generadas con IA llevan marca de agua (RN-12).

---

### User Story 5b - Usar el panel y las descargas en el celular, en campo (Priority: P2)

Un guardaparque consulta la estación desde su celular, al aire libre. Lee el panel sin desplazarse en
horizontal, abre el glosario tocando y descarga la tabla y la imagen.

**Why this priority**: RNF-05 exige que en el celular los paneles se puedan usar, y §20.2 pide contraste
para leer en celular al aire libre.

**Independent Test**: con 320 px de ancho y con 200 % de zoom, se recorren el panel, los estados, el
glosario y las descargas en Safari de iOS y Chrome de Android (las dos últimas versiones).

**Acceptance Scenarios**:

1. **Given** una pantalla de 320 px de ancho o con 200 % de zoom, **When** se abre el panel, **Then** todo
   se lee y se usa sin desplazamiento horizontal y sin perder información (RNF-05, WCAG 1.4.10).
2. **Given** el celular, **When** la persona descarga la tabla o la imagen, **Then** la descarga funciona
   en Safari de iOS y Chrome de Android (RF-21, RNF-05).
3. **Given** uso al aire libre, **When** se ve el panel, **Then** el texto y las marcas cumplen el
   contraste de §20.2. **Propuesta al equipo**: el umbral de contraste para uso al aire libre (el
   documento no lo fija; como mínimo, el de WCAG 2.2 AA).

---

### User Story 6 - Compartir e imprimir (Priority: P4, Plus)

*Solo si sobra tiempo (§13).* Una persona copia un enlace que abre la misma estación con la misma
fecha y vista (RF-23), o imprime la ficha de la estación con el mapa, las cifras, las fuentes y los
límites (RF-31).

**Independent Test**: el enlace abierto en otra pestaña reproduce la vista, y la vista de impresión
incluye el mapa, las cifras, las fuentes y los límites.

---

### Edge Cases

- Una estación con un archivo publicado que falta o está dañado muestra «error» o «sin datos» con su
  motivo. Nunca muestra la pantalla vacía ni pone 0 en el campo que falta (RN-13).
- Si se cambia de idioma mientras se carga, la carga sigue y el mensaje de estado sale en el idioma
  nuevo.
- Las hectáreas sin rango publicado muestran la cifra marcada como «rango no reportado», con su motivo
  (RN-06, RN-13).
- Una fecha de adquisición cerca de la medianoche UTC puede caer en otro día en hora de Bolivia. Se
  muestra el día en hora de Bolivia y la fecha UTC queda disponible en la fuente (RN-07).
- En el celular, el glosario se abre al tocar (no hay cursor) y el panel se puede leer sin desplazarse
  en horizontal (RNF-05).
- Con la preferencia de movimiento reducido activa, los cambios de estado y la apertura del glosario no
  tienen animaciones (RNF-12).
- Si una descarga falla a mitad de camino, la persona ve el error y puede reintentarla.

## Requirements *(mandatory)*

### Functional Requirements

**Panel de la estación**

- **FR-001 (RF-33)**: El sistema MUST reunir en un solo panel, en los dos idiomas, el periodo, la
  órbita, la polarización, las hectáreas con su rango, el porcentaje de datos válidos, la validación,
  las advertencias, las hipótesis y un enlace al método.
- **FR-002 (RN-03, HU-05)**: Cada cifra MUST mostrar su fuente, su fecha y su método, y enlazar a la
  página de método.
- **FR-003 (RN-06)**: Las hectáreas MUST mostrarse siempre con su rango de sensibilidad.
- **FR-004 (RN-07)**: Las fechas de adquisición MUST mostrarse en hora de Bolivia (UTC−04), con la
  zona indicada. La fecha UTC original se ve en la fuente.
- **FR-005 (RN-05; §11.2, MC-06)**: Las causas MUST presentarse como hipótesis con fuente (RN-05), usando las
  cuatro clases de parche de §11.2 y MC-06.
- **FR-006 (RF-33; muestra el contenido de RF-11, VC-02 y VC-05 que publica M-VALIDACIÓN)**: Si la estación no tuvo imagen óptica válida para validar, el panel
  MUST decir «validación limitada», nombrar la alternativa usada tal como se publica (focos de calor y
  revisión visual) con enlace al método, y mostrar las métricas frente a la referencia óptica como «no
  reportadas» con su motivo (RN-13).
- **FR-007 (RF-33, DP-03)**: El panel MUST mostrar el porcentaje de datos válidos tal como se publica.
  **Pendiente (DP-03)**: su significado exacto depende de qué codifica la capa de máscara. Hasta que se
  resuelva, la web no interpreta ni recalcula ese valor.

**Estados de la vista**

- **FR-008 (RF-34)**: Toda vista que carga datos MUST estar siempre en uno de estos seis estados:
  cargando, resultado disponible, datos limitados, sin datos, fecha incompatible o error con reintento.
  Cada estado tiene su mensaje en los dos idiomas.
- **FR-008a (RF-34, RNF-04)**: Los cambios de estado MUST anunciarse a los lectores de pantalla sin
  mover el foco (WCAG 4.1.3).
  - El error se anuncia de inmediato.
  - El fin o el fallo de una descarga también se anuncian.
  - Tras pulsar «reintentar», el foco MUST quedar en el contenido cargado o, si vuelve a fallar, en el
    mensaje de error. Nunca se pierde.
- **FR-009 (RN-13)**: Una métrica ausente MUST mostrarse como «no reportada» junto con su motivo. Ningún
  dato ausente se muestra como 0.
- **FR-010 (CQ-05, RF-37)**: El estado «datos limitados» MUST salir de la marca publicada en el resultado
  de calidad. La web no define ni calcula umbrales propios. Con esa marca, la vista pasa a «datos
  limitados» y cada cifra afectada lleva la marca «limitada». Si el control no viene publicado, se
  muestra «control de calidad no reportado» con su motivo, sin marcar ni ocultar la cifra (RN-13).
- **FR-011 (RF-34)**: Los estados MUST poder reutilizarse en el mapa (M-MAPA) y en el globo (M-GLOBO).

**Idioma y glosario**

- **FR-012 (RF-20, RNF-03)**: La persona MUST poder alternar entre español e inglés sin recargar, sin
  perder la vista actual y con el 100 % de los textos traducidos.
- **FR-012a (RF-20, RNF-04)**: Al cambiar de idioma:
  - el idioma declarado de la página MUST cambiar con él (WCAG 3.1.1);
  - el foco MUST quedarse en el selector de idioma;
  - el selector MUST tener un nombre accesible e indicar el idioma activo.
- **FR-013 (RN-07, RF-20)**: Las cifras y fechas MUST formatearse según el idioma activo y sin cambiar
  su valor:
  - Español: «14 nov 2026, 10:32 (hora de Bolivia, UTC−04)» y «1.234,5 ha».
  - Inglés: «Nov 14, 2026, 10:32 (Bolivia time, UTC−04)» y «1,234.5 ha».
  - El CSV descargado no depende del idioma: usa punto decimal y fechas ISO 8601 en UTC, para que se
    pueda reutilizar.
- **FR-014 (RF-19)**: El glosario MUST incluir todos los términos de §30, con la definición del
  documento en los dos idiomas. Cualquier otro término técnico que use el sitio se propone antes al
  equipo para añadirlo a §30. Cada término marcado se abre al pasar el cursor, al tocar o con el
  teclado.
- **FR-014a (RF-19, RNF-04)**: El término MUST ser un control con nombre accesible que no cambia de
  página. Su definición:
  - se cierra con Escape, con un botón «cerrar» de al menos 24 × 24 px o al tocar fuera;
  - no desaparece mientras el cursor está sobre ella ni sin que la persona la cierre (WCAG 1.4.13).

  Al cerrarla, el foco vuelve al término.

**Descargas**

- **FR-015 (RF-21, HU-02)**: La persona MUST poder descargar la serie de hectáreas como tabla, con fecha,
  hectáreas, rango inferior y superior, fuente y créditos, y con cifras idénticas a las publicadas.
- **FR-016 (RF-21)**: La persona MUST poder descargar una imagen del mapa que ve, con fecha, fuente y
  créditos.
  - La imagen MUST incluir la leyenda, las unidades, la órbita, la polarización y la trama de las zonas
    sin dato, según las reglas de visualización de §20.
  - Sus textos y créditos van en el idioma activo.
- **FR-016a (RF-21, RN-11, RNF-11)**: La tabla y la imagen descargadas MUST llevar:
  - el nombre del sitio y de la estación;
  - las fechas de adquisición en hora de Bolivia;
  - la fecha de generación y la versión de los datos (del manifiesto);
  - la fecha de descarga;
  - la cita de NISAR según su guía, y la de FIRMS o Sentinel-2 cuando aparezcan;
  - la licencia CC BY 4.0.

  **Pendiente (DP-06)**: la URL del sitio.
- **FR-017 (RF-22)**: La persona MUST poder descargar el archivo de cambio, el de cicatrices y el
  manifiesto de cada estación **tal como se publican**, sin transformarlos. El formato, la
  georreferenciación y la licencia de esos archivos son de M-PUBLICACIÓN (backend).
- **FR-018 (RN-13, RNF-04)**: Si un archivo descargable no existe, MUST mostrarse como no disponible
  con su motivo. El control MUST seguir siendo alcanzable con el teclado, y el lector de pantalla MUST
  leer el motivo junto al control.

**Fuente y calidad, método y Acerca de**

- **FR-019 (RF-37)**: Cada estación MUST tener una sección «fuente y calidad» con las escenas usadas, las
  fechas, la órbita, el producto y su madurez, el CRID, la fuente de validación y la fecha de
  generación, y todo MUST coincidir con el manifiesto y el resultado de calidad publicados.
- **FR-020 (RF-15, RN-08)**: El sitio MUST tener una página de método con el pipeline, los parámetros, la
  versión de los datos, los límites y la madurez del producto (PROVISIONAL), enlazada desde cada
  estación. RF-15 no tiene módulo asignado en §19. Se incluye aquí porque §25 la agenda para Angie y
  Marian, y según el reparto acordado en #42 la hace **Angie**. Si se muestran PROVISIONAL y VALIDATED,
  van como tramos separados (RN-02).
- **FR-021 (RF-24, RN-11, RNF-11)**: El sitio MUST tener una página Acerca de, enlazada desde todo el
  sitio, con el equipo y sus roles, las licencias, las fuentes y las citas de datos de NISAR, FIRMS y
  las fuentes bolivianas según sus guías. **Pendiente (DP-02)**: si la página debe incluir la
  declaración de uso de IA y en qué forma depende de las guías 2026 de Space Apps.
- **FR-022 (RN-12)**: El contenido generado con IA MUST NOT usar logos ni marcas de la NASA. Las
  imágenes generadas con IA MUST llevar marca de agua.

**Accesibilidad**

- **FR-023 (RNF-04)**: Todo lo anterior MUST poder usarse con el teclado, con el foco visible, con el
  contraste WCAG 2.2 AA y con textos alternativos. En particular:
  - El foco no queda tapado por paneles fijos (2.4.11).
  - Los objetivos táctiles miden al menos 24 × 24 px (2.5.8).
  - Las marcas «limitada», «no reportada» y «validación limitada» cumplen el contraste de componentes
    (1.4.11) y no dependen solo del color o de un ícono (1.4.1).
  - El texto alternativo de cada vista o imagen dice la fecha, la órbita, la polarización y qué
    muestra (§20.2).
- **FR-024 (RNF-12, PS-07)**: Las animaciones MUST respetar la preferencia del sistema de reducir
  movimiento. Con esa preferencia activa, el estado «cargando» se sigue percibiendo con un texto o un
  indicador estático, sin animación.

**Plus (solo si sobra tiempo, §13)**

- **FR-025 (RF-23, Plus)**: Un enlace directo MUST abrir un departamento o una estación con su fecha y
  su vista.
- **FR-026 (RF-31, Plus)**: La estación MUST tener una versión imprimible (o para guardar como PDF desde
  el navegador) con el mapa, las cifras, las fuentes y los límites.

### Key Entities *(include if feature involves data)*

Todo lo lee la web desde los archivos publicados (§17.3, propuesta de diseño). La web no los define ni
los recalcula.

- **Estación**: identificador, nombre en español e inglés, área, órbita usada, fechas, hipótesis y
  relato local (`station.json`).
- **Manifiesto**: gránulos usados (nombre, fecha, órbita, CRID, suma de verificación) y versión del
  pipeline (`manifest.json`).
- **Serie de hectáreas**: fecha, hectáreas, rango inferior y superior (`hectares.csv`).
- **Validación**: métricas frente a la referencia óptica y contexto de focos de calor
  (`validation.json`).
- **Resultado de calidad**: resultado de los controles CQ-01 a CQ-06, incluida la marca de datos
  limitados (`quality.json`).
- **Estado de la vista**: uno de los seis estados de RF-34, con su mensaje y, si corresponde, su motivo.
- **Término del glosario**: término y definición en los dos idiomas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (RNF-03, HU-06)**: El 100 % de los textos visibles existen en español y en inglés. Un recorrido
  completo en cada idioma no deja ningún texto en el otro idioma.
- **SC-002 (RF-34, RN-13)**: En el 100 % de los casos de prueba con datos ausentes, la vista muestra «no
  reportada» o «sin datos» con su motivo, y nunca un 0.
- **SC-003 (RF-37, RF-21)**: El 100 % de las cifras del panel, de «fuente y calidad» y de la tabla
  descargada coinciden con los archivos publicados.
- **SC-004 (RF-22)**: Los archivos de datos descargados son idénticos byte a byte a los publicados.
- **SC-005 (RF-33, HU-05)**: Una persona sin conocimientos de radar encuentra, en menos de 1 minuto, las
  hectáreas con su rango y la fuente de esa cifra a partir del panel.
- **SC-006 (RNF-04)**: Todas las acciones de esta feature se completan solo con el teclado. La revisión
  automática de accesibilidad da 0 violaciones serias o críticas en cada pantalla y estado, y la
  revisión manual cumple los criterios de FR-008a, FR-012a, FR-014a y FR-023.
- **SC-009 (RNF-05)**: El panel, los estados, el glosario y las descargas se usan sin desplazamiento
  horizontal a 320 px de ancho y con 200 % de zoom, en las dos últimas versiones de Safari de iOS y de
  Chrome de Android.
- **SC-010 (RNF-12, PS-07)**: Con la preferencia de reducir movimiento activa, una prueba confirma que no
  hay animaciones y que todos los estados se siguen percibiendo.
- **SC-007 (RF-20)**: Al cambiar de idioma no hay recarga y la vista (estación, fecha y capa) se conserva
  en el 100 % de las pantallas.
- **SC-008 (RF-19)**: El 100 % de los términos de §30, y de los que el equipo añada, tienen una
  entrada en el glosario en los dos idiomas.

## Assumptions

- Esta feature reutiliza la app base, la capa de datos y los contratos de `specs/001-base-web`
  (P-PROY-02 y P-PROY-03, de Joaco). Su implementación espera a P-PROY-07.
- La estructura de archivos de §17.3 es una propuesta de diseño del equipo. Si M-PUBLICACIÓN la cambia,
  esta spec se actualiza.
- El texto literal de la cita de NISAR (y de FIRMS y Sentinel-2) se toma de sus guías oficiales de
  citación (RN-11, §31). No se redacta de memoria.
- Fuera de alcance:
  - Insight (M-INSIGHT, backend; HU-03 solo se cubre aquí en lo que toca al glosario).
  - Todo lo de §8.2.
  - El control de capas (RF-35, M-MAPA de Joaco).
  - El contenido de las fichas y la portada (M-ATLAS).
  - El hospedaje (DP-06).
- DP-01 a DP-08 no se resuelven en esta spec.
