# Feature Specification: Portada y fichas del atlas de los nueve departamentos

**Feature Branch**: `feat/52-spec-portada-atlas`
**Feature Directory**: `specs/003-portada-atlas`
**Created**: 2026-11-14
**Status**: Draft
**Módulo (§19)**: M-ATLAS, con Angie y Marian como responsables (según el reparto de #46, lo ejecuta Angie) y
Joaco como revisor
**Issue**: #52 (P-ATLAS-01) y #55 (P-ATLAS-02, aclaraciones) · **Prompt SDD**: P-ATLAS-01, P-ATLAS-02
**Input**: prompt P-ATLAS-01 de `sdd/m-atlas.md`, con los ajustes que pidió `guardian-alcance`; aclarado con
P-ATLAS-02.

> Fuente de verdad: `docs/UraqiVisionDocumentoMaestrov1.0.pdf`. Cada requisito conserva su identificador
> del documento. Lo que el documento no fija se marca como **propuesta**; lo que falta verificar, como
> **pendiente**; y lo que depende de §29, como **pendiente (DP-xx)**. Ninguna fuente se inventa (§28).

## Clarifications

### Session 2026-11-14

Aclaraciones de P-ATLAS-02 (issue #55), respondidas por Angie.

- Q: ¿Qué imagen usará la portada para comparar radar y óptica con humo (FR-005)? → A: Las imágenes las
  aporta el equipo, con su fuente y licencia; el asistente no las busca ni las genera. Hasta recibirlas, el
  espacio de la imagen muestra «imagen pendiente». La imagen se integra solo si trae fuente, licencia y texto
  alternativo en ambos idiomas; si alguna se generara con IA, se aplica RN-12, y ninguna imagen de ejemplo se
  presenta como dato NISAR (RN-04).
- Q: ¿Adónde lleva el botón «Explorar Bolivia» de la portada (RF-01)? → A: Al explorador, que muestra el
  globo (M-GLOBO, Joaco) junto con la lista textual de departamentos y estaciones siempre disponible. Si el
  globo no está disponible o no carga, se ve la lista sola y las fichas se siguen abriendo en un clic.
- Q: ¿Qué ve la persona en la ficha de un departamento sin fuente verificada (Pando, La Paz, Tarija,
  Chuquisaca), y quién consigue esa fuente (FR-009)? → A: La ficha sigue visible con su fenómeno y escenas, y
  en Fuentes muestra el aviso «Fuente en verificación». Angie y Marian (responsables de M-ATLAS) verifican la
  fuente, que el equipo registra en §31 antes de mostrarla.
- Q: ¿Qué pasa con Insight en las fichas de los departamentos sin estación (FR-023)? → A: Queda pendiente.
  La contradicción entre CU-02 (ficha → Insight) y §8.1/RF-16 (Insight acotado a la estación abierta) se
  consulta al equipo con Mimi (M-INSIGHT); la spec no define Insight en las fichas hasta entonces.
- Q: ¿Cómo distingue la persona, a simple vista, un departamento con estación de uno que solo tiene ficha? →
  A: Con una etiqueta de texto «Estación» o «Ficha» (en inglés, «Station» o «Profile») más un icono, en la
  lista y en la ficha; el color solo acompaña y nunca es la única señal (RNF-04).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender de qué trata el sitio y entrar al atlas (Priority: P1)

Una persona que llega por primera vez (ciudadana, gestora de un área protegida, docente) lee en la portada,
en menos de un minuto, cuál es el problema, qué es NISAR y cómo se usa la web, y con un solo clic en
«Explorar Bolivia» llega al atlas (RF-01, §20.1, CU-02).

**Why this priority**: es la puerta de entrada de todo el recorrido (§20.1) y la primera lámina de la demo;
sin ella no hay forma de llegar al atlas ni a la estación.

**Independent Test**: abrir la portada en escritorio y en celular, cronometrar la lectura del texto y pulsar
«Explorar Bolivia»: se llega al atlas en un clic, y todas las cifras visibles muestran fuente y fecha.

**Acceptance Scenarios**:

1. **Given** una persona que nunca usó el sitio, **When** abre la portada, **Then** ve una frase del problema,
   una explicación breve de qué es NISAR y de cómo usar la web, una imagen radar frente a una óptica con humo y
   el botón «Explorar Bolivia» (§20.1).
2. **Given** la portada abierta, **When** la persona pulsa «Explorar Bolivia», **Then** llega al atlas en un
   solo clic (criterio de aceptación de RF-01).
3. **Given** una cifra del problema en la portada (por ejemplo, hectáreas afectadas o focos de calor),
   **When** se muestra, **Then** lleva su fuente y su fecha (RN-03), tomadas de §4.2 del documento.
4. **Given** la portada, **When** se carga, **Then** no espera al globo 3D: el explorador se carga solo al
   entrar a él (RNF-01).
5. **Given** la portada en inglés, **When** se lee, **Then** todo el texto, la imagen (texto alternativo) y el
   botón están en inglés (RNF-03).

---

### User Story 2 - Leer la ficha de mi departamento aunque no haya estación (Priority: P1)

Una persona de cualquiera de los nueve departamentos abre la ficha de su departamento y ve qué fenómeno se
observa, cuántas escenas NISAR hay, de qué fuentes sale la información y si el departamento tiene estación o
es solo una ficha (RF-03, HU-07, §10.4).

**Why this priority**: el atlas es el objetivo OE3 del MVP y la forma en que quien no vive en Santa Cruz
encuentra algo propio en el sitio (HU-07).

**Independent Test**: abrir las nueve fichas; cada una muestra fenómeno, escenas, fuentes y estado con los
valores de §10.4, y los ocho departamentos sin estación dicen «sin estación disponible».

**Acceptance Scenarios**:

1. **Given** la ficha de La Paz, **When** se abre, **Then** muestra el fenómeno («Glaciares de la Cordillera
   Real»), las escenas NISAR (39) y sus fuentes (criterio de HU-07).
2. **Given** un departamento sin estación (los ocho distintos de Santa Cruz), **When** se abre su ficha,
   **Then** dice «sin estación disponible» (RF-03).
3. **Given** la ficha de Santa Cruz, **When** se abre, **Then** indica que tiene estación (San Ignacio de
   Velasco) y ofrece entrar a ella.
4. **Given** la ficha de Cochabamba, **When** se abre, **Then** presenta Tunari (Parque Nacional Tunari) como
   ficha, con sus escenas y fuentes, y no como estación (§11.3, §8.2).
5. **Given** el número de escenas de una ficha, **When** se muestra, **Then** indica que sale de la consulta al
   catálogo CMR de la NASA del 12 de noviembre de 2026, colección PROVISIONAL (RN-03, §10.2).
6. **Given** una ficha que menciona causas de un fenómeno (por ejemplo, chaqueos o desmonte), **When** se lee,
   **Then** las causas aparecen como hipótesis o contexto con su fuente, nunca como certeza ni como resultado
   del radar (RN-04, RN-05).

---

### User Story 3 - Encontrar un departamento sin usar el globo (Priority: P2)

Una persona que navega con teclado o lector de pantalla, o cuyo dispositivo no muestra bien el globo,
encuentra los nueve departamentos y las estaciones en una lista textual y abre cualquier ficha desde ahí
(RNF-04).

**Why this priority**: RNF-04 exige una alternativa textual al globo; sin ella el atlas no es accesible.

**Independent Test**: recorrer la lista solo con teclado, con foco visible, y abrir cada una de las nueve
fichas sin tocar el globo.

**Acceptance Scenarios**:

1. **Given** el atlas, **When** la persona usa solo el teclado, **Then** puede llegar a la lista de
   departamentos y estaciones, recorrerla con foco visible y abrir cualquier ficha (RNF-04).
2. **Given** un lector de pantalla, **When** recorre la lista, **Then** anuncia el nombre de cada departamento
   y si tiene estación o es ficha.

---

### User Story 4 - Saber de dónde sale cada dato de la ficha (Priority: P2)

Quien prepara un informe o una clase quiere saber de dónde sale cada afirmación de una ficha: cada una lleva
su fuente con fecha de consulta, y lo que todavía no tiene fuente verificada se dice abiertamente (RN-03,
RF-03, §28).

**Why this priority**: el rigor es lo que distingue al sitio; una ficha sin fuente no cumple RF-03.

**Independent Test**: revisar cada afirmación de las nueve fichas contra §10.4 y §31 del documento: toda
afirmación visible tiene fuente con fecha, o está marcada como pendiente.

**Acceptance Scenarios**:

1. **Given** una afirmación de una ficha, **When** se muestra, **Then** enlaza a su fuente con la fecha de
   consulta (RN-03).
2. **Given** un departamento cuya fuente todavía no está verificada en §31 (ver la tabla de fichas),
   **When** se abre su ficha, **Then** se ven el fenómeno y las escenas, y en Fuentes el aviso «Fuente en
   verificación»; no se publica una fuente inventada y no se da por cumplido el criterio de RF-03 para ese
   departamento.
3. **Given** una mención a datos NISAR, **When** se cita, **Then** sigue la guía de uso y citación de datos de
   la NASA (RN-11).

---

### User Story 5 - Ver qué cambia cada mes por región (Priority: P4, Plus)

Si sobra tiempo, el atlas muestra un calendario de la superficie: qué cambia en cada mes por región
(quemas, lluvias), con sus fuentes (RF-04, Plus).

**Why this priority**: es Plus en el documento; solo se hace si el MVP está terminado.

**Independent Test**: el calendario muestra para cada región y mes el fenómeno con su fuente.

**Acceptance Scenarios**:

1. **Given** el calendario, **When** se consulta un mes, **Then** cada fenómeno mostrado tiene fuente
   (criterio de aceptación de RF-04).

---

### Edge Cases

- **Fuente pendiente**: un departamento sin fuente verificada en §31 (hoy Pando, La Paz, Tarija y Chuquisaca)
  se muestra con su fenómeno y escenas, y en Fuentes con el aviso «Fuente en verificación»; nunca con una
  fuente inventada ni oculto.
- **Rango de escenas**: Santa Cruz tiene «54–55» escenas en §10.4; se muestra el rango tal cual, sin
  redondear ni elegir un valor.
- **Sin dato**: si un campo de una ficha no tiene valor publicado, se muestra «no reportado» con el motivo,
  nunca un cero ni un campo vacío (RN-13).
- **Pronósticos**: si una ficha cita un pronóstico de SENAMHI, se presenta como contexto de la fuente, nunca
  como pronóstico del sitio (RN-10).
- **Imagen generada con IA**: si la imagen de la portada se genera con IA, lleva marca de agua y ningún logo
  ni marca de la NASA (RN-12).
- **Globo no disponible**: si el globo no carga o aún no existe, «Explorar Bolivia» lleva igual al explorador
  y se ve la lista textual sola; ninguna ficha queda inaccesible (FR-003, FR-018).
- **Movimiento reducido**: si la portada o el atlas tienen animaciones, respetan la preferencia del sistema
  de reducir movimiento (RNF-12).
- **Pantalla pequeña**: en el celular, la portada y las fichas se leen sin desplazamiento horizontal
  (RNF-05).
- **Cambio de idioma**: al cambiar de idioma con una ficha abierta, la misma ficha sigue abierta en el otro
  idioma (RNF-03; el selector de idioma es de la spec 004, RF-20).

## Requirements *(mandatory)*

### Functional Requirements

**Portada (RF-01, §20.1)**

- **FR-001**: La portada DEBE explicar el problema, qué es NISAR y cómo usar la web en un texto que se lea en
  menos de un minuto (RF-01).
- **FR-002**: La portada DEBE mostrar una frase del problema, una imagen radar frente a una óptica con humo y
  el botón «Explorar Bolivia» (§20.1).
- **FR-003**: El botón «Explorar Bolivia» DEBE llevar al atlas en un solo clic (criterio de RF-01): al
  explorador con el globo (M-GLOBO) y la lista textual de FR-018 siempre disponible. Si el globo no está
  disponible o no carga, el destino muestra la lista sola, desde la que se abre cualquier ficha.
- **FR-004**: Cada cifra de la portada DEBE mostrar su fuente y su fecha (RN-03), y DEBE salir de §4.2 del
  documento o de otra fuente verificada.
- **FR-005**: La imagen radar frente a óptica DEBE tener fuente, licencia y texto alternativo en ambos
  idiomas. Las imágenes las aporta el equipo (aclaración del 2026-11-14); mientras no lleguen, el espacio
  muestra «imagen pendiente». Una imagen sin fuente o licencia NO DEBE publicarse. Si se genera con IA, se
  aplica RN-12, y ninguna imagen de ejemplo se presenta como dato NISAR (RN-04).
- **FR-006**: La portada DEBE cargar en menos de 3 s en una conexión de 10 Mbps sin cargar el globo 3D, que
  se carga solo al entrar al explorador (RNF-01).

**Fichas de departamento (RF-03, §10.4)**

- **FR-007**: El atlas DEBE ofrecer una ficha para cada uno de los nueve departamentos de Bolivia (RF-03).
- **FR-008**: Cada ficha DEBE mostrar fenómeno, escenas NISAR, fuentes y estado (estación o ficha), con los
  valores de §10.4 copiados literalmente (ver la tabla de fichas) (RF-03).
- **FR-009**: Cada ficha DEBE tener al menos una fuente verificada para cumplir RF-03. Una ficha sin fuente
  verificada DEBE seguir visible, con su fenómeno y escenas, y mostrar en Fuentes el aviso «Fuente en
  verificación» (en inglés, «Source being verified»); NO DEBE publicar una fuente inventada (§28). Angie y
  Marian (responsables de M-ATLAS) verifican la fuente, que se registra en §31 antes de mostrarla.
- **FR-010**: Los departamentos sin estación DEBEN decir «sin estación disponible» (RF-03).
- **FR-010a**: En la lista y en cada ficha, el estado DEBE mostrarse con una etiqueta de texto «Estación» o
  «Ficha» (en inglés, «Station» o «Profile») y un icono; el color NO DEBE ser la única señal (RNF-04).
- **FR-011**: La ficha de Santa Cruz DEBE indicar que tiene estación (San Ignacio de Velasco) y llevar a ella.
- **FR-012**: La ficha de Cochabamba DEBE presentar el Parque Nacional Tunari como ficha, con sus escenas y
  fuentes, y no como estación (§11.3, §8.2).
- **FR-013**: El número de escenas DEBE indicar su origen: consulta al catálogo CMR de la NASA del 12 de
  noviembre de 2026, colección PROVISIONAL, periodo del 17 de junio al 12 de noviembre de 2026 (§10.2, RN-03).
- **FR-014**: Los fenómenos de las fichas DEBEN presentarse como contexto con su fuente, no como resultados
  del radar (RN-04); y sus causas, como hipótesis con fuente, nunca como certeza (RN-05).
- **FR-015**: Las citas de datos NISAR DEBEN seguir la guía de uso y citación de datos de la NASA (RN-11).
- **FR-016**: Ningún contenido generado con IA DEBE usar logos ni marcas de la NASA; las imágenes generadas con
  IA DEBEN llevar marca de agua (RN-12).
- **FR-017**: Un campo sin valor DEBE mostrarse como «no reportado» con su motivo, nunca como cero (RN-13).

**Navegación y accesibilidad (RNF-03, RNF-04, RNF-05, RNF-12)**

- **FR-018**: El atlas DEBE ofrecer una lista textual de los nueve departamentos y de las estaciones como
  alternativa al globo, desde la que se abre cualquier ficha (RNF-04).
- **FR-019**: La portada, la lista y las fichas DEBEN poder usarse por completo con teclado y foco visible,
  con contraste WCAG 2.2 AA y textos alternativos (RNF-04).
- **FR-020**: El 100 % de los textos de la portada y de las fichas DEBE existir en español y en inglés
  (RNF-03).
- **FR-021**: La portada y las fichas DEBEN ser usables en el celular (RNF-05) y respetar la preferencia de
  reducir movimiento (RNF-12).

**Plus**

- **FR-022** *(Plus, RF-04)*: Si sobra tiempo, el atlas PUEDE mostrar un calendario de la superficie con lo
  que cambia en cada mes por región, cada fenómeno con su fuente.

**Dependencias externas (no se especifican aquí)**

- **FR-023**: Desde una ficha, CU-02 continúa con «pregunta a Insight» (RF-16). Insight es de M-INSIGHT
  (repositorio `UraqiVisionBack`) y su interfaz se especifica fuera de esta feature. **Pendiente (consulta al
  equipo)**: CU-02 pide Insight desde cualquier ficha, pero §8.1 y RF-16 lo acotan a la estación abierta, y
  solo Santa Cruz tiene estación. Hasta que el equipo lo resuelva con Mimi (M-INSIGHT), esta spec no define
  Insight en las fichas.
- **FR-024**: Abrir una ficha al elegir un departamento en el globo (§20.1, RF-02) es de M-GLOBO (Joaco); esta
  spec define el contenido de la ficha, no el globo.

### Tabla de fichas (valores literales de §10.4)

| Departamento | Fenómeno en la ficha | Escenas NISAR | Fuente que nombra §10.4 | Referencia verificada en §31 | Estado |
|---|---|---|---|---|---|
| Santa Cruz | Chaqueos, desmonte y recuperación del bosque | 54–55 | FAN, ABT, SENAMHI | FAN (2023); ABT (2026), boletín 222; SENAMHI (2026), pronóstico de focos de calor | Estación |
| Cochabamba | Incendios en el Parque Tunari | 18 | Gobernación (prensa), SENAMHI | Correo del Sur (2026, 20 de julio), dato de la Gobernación (§4.2); Los Tiempos (2026, 10 de julio) es relación **propuesta** por el equipo | Ficha |
| Beni | Inundación y humedales de Moxos | 29 | SENAMHI; Ovando et al. (2016) | Ovando et al. (2016); SENAMHI (2026), pronóstico hidrológico | Ficha |
| Pando | Deforestación amazónica | 26 | MAAP | **Pendiente**: MAAP no está en §31 | Ficha |
| La Paz | Glaciares de la Cordillera Real | 39 | Monitoreo del Zongo desde 1991 (IRD e IHH-UMSA) | **Pendiente**: el monitoreo del Zongo no está en §31; Rabatel et al. (2013) está en §31, pero su relación con la ficha es **propuesta** por el equipo | Ficha |
| Oruro | Desecamiento del lago Poopó | 37 | SENAMHI; Satgé et al. (2017) | Satgé et al. (2017) | Ficha |
| Potosí | Salar de Uyuni como superficie de referencia | 55 | Fricker et al. (2005) | Fricker et al. (2005) | Ficha |
| Tarija | Incendios del valle central (jul 2026) | 29 | SENAMHI (prensa) | **Pendiente**: la nota de prensa no está en §31 | Ficha |
| Chuquisaca | Contexto general | 27 | Fuentes nacionales | **Pendiente**: «Fuentes nacionales» no es una fuente concreta | Ficha |

Hoy cumplen el criterio «al menos una fuente» de RF-03 cinco de nueve fichas (Santa Cruz, Cochabamba, Beni,
Oruro y Potosí). Las otras cuatro se muestran con el aviso «Fuente en verificación» hasta que Angie y Marian
verifiquen una fuente y el equipo la registre en §31.

### Key Entities *(include if feature involves data)*

- **Ficha de departamento**: departamento (nombre es/en), fenómeno (es/en), número de escenas NISAR (valor o
  rango), fuentes, estado (estación o ficha), estación asociada si la hay, y Tunari como ficha dentro de
  Cochabamba.
- **Fuente**: autor u organismo, año, título, enlace, fecha de consulta y si está verificada en §31 o
  pendiente.
- **Conteo de escenas**: valor o rango, colección (PROVISIONAL), fecha de la consulta al catálogo CMR y
  periodo consultado (§10.2).
- **Contenido de la portada**: frase del problema, explicación de NISAR y de uso, cifras con fuente y fecha,
  imagen radar frente a óptica (con fuente, licencia y texto alternativo) y el botón «Explorar Bolivia», todo
  en es/en.
- **Límites departamentales**: la geometría de los nueve departamentos con fuente, fecha y versión, común a
  todo el sitio (§17.3); los publica el backend y la web solo los lee.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona nueva lee el texto de la portada en menos de un minuto y llega al atlas en un clic
  (RF-01).
- **SC-002**: La portada carga en menos de 3 s en una conexión de 10 Mbps (RNF-01).
- **SC-003**: Las nueve fichas muestran fenómeno, escenas, fuentes y estado con los valores de §10.4, sin
  diferencias (RF-03).
- **SC-004**: Las nueve fichas tienen al menos una fuente verificada (RF-03). Hoy 5 de 9; las otras cuatro
  quedan como pendientes visibles, nunca con una fuente inventada.
- **SC-005**: El 100 % de los textos de la portada y de las fichas existe en español y en inglés, sin textos
  sin traducir (RNF-03, HU-06).
- **SC-006**: Toda la portada, la lista y las fichas se recorren solo con teclado, con foco visible, y pasan la
  revisión de accesibilidad WCAG 2.2 AA (RNF-04, PS-07).
- **SC-007**: El 100 % de las cifras de la portada y de las fichas muestran fuente y fecha (RN-03).
- **SC-008**: Una persona de La Paz encuentra la ficha de su departamento y ve fenómeno, escenas y fuentes
  (HU-07).

## Assumptions

- La feature reutiliza la aplicación base de `specs/001-base-web` (P-PROY-02 a P-PROY-06, de Joaco), que aún
  no existe; por eso el plan (P-ATLAS-03) espera a esa base.
- Los conteos de escenas de §10.4 son los de §10.2 («las fichas del atlas usan los mismos conteos») y se
  muestran tal cual, sin recalcularlos.
- Las cifras de la portada salen de §4.2, con la fuente y la fecha que da el documento.
- Las referencias de §31 se citan con la fecha de consulta del 12 de noviembre de 2026 que da el documento,
  igual que en el borrador de Acerca de de la spec 004.
- **Propuesta**: la lista textual de departamentos y estaciones vive en el atlas (M-ATLAS), tal como indica el
  prompt P-ATLAS-03; el globo (M-GLOBO) abre las mismas fichas.
- El selector de idioma, los estados de la vista y la página de método son de la spec 004 (M-INTERFAZ); esta
  spec solo exige que la portada y las fichas los respeten.
- Fuera de alcance: la estación de Tunari y las inundaciones del Beni 2026–2027 (§8.2), los pronósticos propios
  (RN-10) y cualquier procesamiento de datos (la web solo lee lo publicado, §17).
