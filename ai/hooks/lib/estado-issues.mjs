// Estado de los issues según el avance de sus PR, issues de promoción, rama y PR automáticas al crear un issue,
// y protección contra cambios manuales. Funciones puras (sin red); las aplican los scripts de ai/scripts/.
//
// PR hacia dev (trabajo):
//   abierta en borrador        → estado: en progreso
//   abierta o lista            → estado: en revisión
//   fusionada                  → estado: en dev, y el issue se cierra (PR aceptada = issue cerrado)
//   cerrada sin fusionar       → se quitan en progreso / en revisión
// PR hacia qa o main (promoción): tiene su propio issue de promoción. Al fusionarla, solo si cumplió TODAS las
// condiciones de aprobación (todos los colaboradores excepto el autor, sobre el último commit):
//   qa → estado: en preproducción; main → estado: en producción (también en issues ya cerrados),
//   y se cierra el issue de promoción. Sin aprobación completa no cambia ningún estado.
// GitHub solo cierra issues con "Closes #N" al fusionar en la rama por defecto (main); por eso lo hace este flujo.

export const ETIQUETAS = Object.freeze({
  progreso: { nombre: 'estado: en progreso', color: 'c5def5', descripcion: 'Tiene una PR en borrador hacia dev' },
  revision: { nombre: 'estado: en revisión', color: 'fbca04', descripcion: 'Tiene una PR lista para revisión' },
  dev: { nombre: 'estado: en dev', color: '1d76db', descripcion: 'PR aceptada: fusionado en dev (integración)' },
  qa: { nombre: 'estado: en preproducción', color: '5319e7', descripcion: 'Fusionado en qa (preproducción) con aprobación completa' },
  main: { nombre: 'estado: en producción', color: '0e8a16', descripcion: 'Fusionado en main (producción) con aprobación completa' },
});
export const OTRAS = Object.freeze({
  promocion: { nombre: 'promoción', color: 'd4c5f9', descripcion: 'Issue de una PR de promoción dev → qa o qa → main' },
  incompleta: { nombre: 'aprobación incompleta', color: 'b60205', descripcion: 'Se fusionó sin todas las aprobaciones exigidas' },
});
export const PREFIJO_ESTADO = 'estado: ';
const NOMBRES = Object.values(ETIQUETAS).map((e) => e.nombre);
const ACEPTADOS = [ETIQUETAS.dev.nombre, ETIQUETAS.qa.nombre, ETIQUETAS.main.nombre];
const EN_CURSO = [ETIQUETAS.progreso.nombre, ETIQUETAS.revision.nombre];

export const esPromocion = (base) => base === 'qa' || base === 'main';

/**
 * evento: { accion, fusionada, base, pr, borrador }
 * accion: opened | reopened | ready_for_review | converted_to_draft | closed
 * Devuelve { etiqueta, quitar, cerrar, comentario } o null. Para qa/main, quien llama debe comprobar antes que la
 * PR cumplió la aprobación completa (requiereAprobacionCompleta).
 */
export function transicion({ accion, fusionada, base, pr, borrador = false }) {
  if (!['dev', 'qa', 'main'].includes(base)) return null;
  const a = (e) => ({ etiqueta: e.nombre, quitar: NOMBRES.filter((n) => n !== e.nombre && EN_CURSO.includes(n)), cerrar: false, comentario: null });
  if (base === 'dev') {
    if (accion === 'opened' || accion === 'reopened') return a(borrador ? ETIQUETAS.progreso : ETIQUETAS.revision);
    if (accion === 'ready_for_review') return a(ETIQUETAS.revision);
    if (accion === 'converted_to_draft') return a(ETIQUETAS.progreso);
  }
  if (accion !== 'closed') return null;
  if (!fusionada) return base === 'dev' ? { etiqueta: null, quitar: EN_CURSO, cerrar: false, comentario: null } : null;
  const destino = ETIQUETAS[base];
  const texto = {
    dev: `PR #${pr} aceptada: integrado en \`dev\`. Se cierra el issue; la etiqueta de estado seguirá su paso a preproducción y producción.`,
    qa: `En preproducción: llegó a \`qa\` con la PR #${pr}, con la aprobación completa.`,
    main: `En producción: llegó a \`main\` con la PR #${pr}, con la aprobación completa.`,
  }[base];
  return { etiqueta: destino.nombre, quitar: NOMBRES.filter((n) => n !== destino.nombre), cerrar: base === 'dev' || base === 'main', comentario: texto };
}

export const requiereAprobacionCompleta = (base) => esPromocion(base);

/** ¿Se modifica este issue? Las fusiones actualizan también issues cerrados; el resto, solo abiertos. */
export function debeActualizar(issueAbierto, t) {
  if (!t) return false;
  return ACEPTADOS.includes(t.etiqueta) || issueAbierto;
}

// ------------------------------------------------------------------ Referencias

const REF = /(?:^|[\s(,:])#(\d+)\b|\bGH-(\d+)\b|\/issues\/(\d+)\b/gi;

/** Números referenciados en mensajes de commit (cada commit cita su issue), sin repetir y ordenados. */
export function extraerIssues(textos) {
  const numeros = new Set();
  for (const t of textos) for (const m of String(t ?? '').matchAll(REF)) numeros.add(Number(m[1] ?? m[2] ?? m[3]));
  return [...numeros].sort((a, b) => a - b);
}

/**
 * Issues que la PR declara en su título o descripción: solo los que van tras una palabra clave
 * (Closes, Fixes, Resolves, Refs), para no confundir menciones en texto libre. Acepta listas: "Refs #3, #5 y #7".
 */
export function extraerIssuesDePR(texto) {
  const numeros = new Set();
  const re = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\b[\s:]*((?:#\d+(?:[\s,]+(?:y\s+|and\s+)?)?)+)/gi;
  for (const m of String(texto ?? '').matchAll(re)) for (const n of m[1].matchAll(/#(\d+)/g)) numeros.add(Number(n[1]));
  return [...numeros].sort((a, b) => a - b);
}

/** Commits que cuentan para la trazabilidad: sin los de merge (p. ej. "Merge pull request #2 from …"). */
export function commitsDeTrabajo(commits) {
  return commits.filter((c) => (c.parents?.length ?? 1) < 2 && !/^Merge (pull request|branch) /.test(c.commit?.message ?? ''));
}

// ------------------------------------------------------------------ Issues de promoción

export const marcadorPromocion = (pr) => `<!-- uraqi-promocion pr=${pr} -->`;
export function leerMarcadorPromocion(cuerpo) {
  const m = /<!-- uraqi-promocion pr=(\d+) -->/.exec(String(cuerpo ?? ''));
  return m ? Number(m[1]) : null;
}

export function issueDePromocion({ pr, head, base, titulo, url, issues }) {
  const entorno = base === 'qa' ? 'preproducción' : 'producción';
  return {
    title: `[Promoción] ${head} → ${base}: ${titulo}`.slice(0, 200),
    body: [
      marcadorPromocion(pr),
      `Promoción de \`${head}\` a \`${base}\` (${entorno}) con la PR #${pr}: ${url}`,
      '',
      '### Issues incluidos',
      issues.length ? issues.map((n) => `- Refs #${n}`).join('\n') : '- (ninguno detectado en los commits)',
      '',
      '### Condición para cerrar',
      `Todos los colaboradores excepto el autor deben aprobar el último commit de la PR #${pr}. Al fusionarla con la`,
      `aprobación completa, este issue se cierra solo y los issues incluidos pasan a \`estado: en ${entorno}\`.`,
      'No cambies su estado a mano: la automatización lo revierte.',
    ].join('\n'),
  };
}

// ------------------------------------------------------------------ Rama y PR automáticas al crear un issue

export function esIssueDeTrabajo(issue) {
  if (issue.pull_request) return false;
  const etiquetas = (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
  return !etiquetas.includes(OTRAS.promocion.nombre) && !/^\[Promoci[oó]n\]/i.test(issue.title ?? '');
}

export function tipoDeIssue(issue) {
  const etiquetas = (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name).toLowerCase());
  return etiquetas.includes('defecto') || /^\[Defecto\]/i.test(issue.title ?? '') ? 'fix' : 'feat';
}

/** Título limpio: sin el prefijo de plantilla ([Tarea], [Defecto]). */
export const tituloLimpio = (titulo) => String(titulo ?? '').replace(/^\s*\[[^\]]+\]\s*/, '').trim();

/** Slug ASCII en minúsculas, hasta 40 caracteres sin cortar palabras. */
export function slug(texto) {
  const base = tituloLimpio(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base.length <= 40) return base || 'trabajo';
  const corto = base.slice(0, 40);
  return corto.includes('-') ? corto.slice(0, corto.lastIndexOf('-')) : corto;
}

export const ramaDeIssue = (issue) => `${tipoDeIssue(issue)}/${issue.number}-${slug(issue.title)}`;

// ------------------------------------------------------------------ Protección contra cambios manuales

/**
 * evento: { accion: closed|reopened|labeled|unlabeled, esBot, etiqueta (la del evento), etiquetasIssue,
 *           esIssuePromocion, promocionAprobada }
 * Devuelve { revertir: 'reabrir'|'cerrar'|'quitar-etiqueta'|'poner-etiqueta', etiqueta?, comentario } o null.
 */
export function proteccion({ accion, esBot, etiqueta, etiquetasIssue = [], esIssuePromocion = false, promocionAprobada = false }) {
  if (esBot) return null;
  if ((accion === 'labeled' || accion === 'unlabeled') && String(etiqueta).startsWith(PREFIJO_ESTADO)) {
    return {
      revertir: accion === 'labeled' ? 'quitar-etiqueta' : 'poner-etiqueta',
      etiqueta,
      comentario: `Las etiquetas \`${PREFIJO_ESTADO}…\` las asigna solo la automatización según las PR; se revirtió el cambio manual de «${etiqueta}».`,
    };
  }
  if (accion === 'closed') {
    if (esIssuePromocion && !promocionAprobada) {
      return { revertir: 'reabrir', comentario: 'Este issue de promoción se cierra solo cuando su PR se fusiona con la aprobación completa (todos los colaboradores excepto el autor). Se reabrió.' };
    }
    if (!esIssuePromocion && etiquetasIssue.some((e) => EN_CURSO.includes(e))) {
      return { revertir: 'reabrir', comentario: 'Este issue tiene una PR en curso y se cierra solo cuando la PR se acepta. Si el trabajo se descarta, cierra la PR. Se reabrió.' };
    }
  }
  if (accion === 'reopened' && etiquetasIssue.some((e) => ACEPTADOS.includes(e))) {
    return { revertir: 'cerrar', comentario: 'Su PR ya fue aceptada, así que este issue permanece cerrado. Si hay un problema nuevo, abre un issue con la plantilla Defecto.' };
  }
  return null;
}
