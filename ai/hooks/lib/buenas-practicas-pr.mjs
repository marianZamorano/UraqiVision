// Buenas prácticas de las PR hacia dev, qa y main. Funciones puras (sin red); las aplica
// ai/scripts/buenas-practicas-pr.mjs en el workflow "Buenas prácticas de PR".

export const TIPOS = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const RE_TITULO_TRABAJO = new RegExp(`^(${TIPOS.join('|')})(\\([a-z0-9-]+\\))?!?: \\S`);
const RE_TITULO_PROMOCION = /^Promoci[oó]n (dev|qa) (→|->) (qa|main)\b/;
const RE_RAMA = new RegExp(`^(${TIPOS.join('|')})/(\\d+)-[a-z0-9]+(-[a-z0-9]+)*$`);
const PLACEHOLDER = /^\s*(-\s*)?(\(completar\))?\s*$/i;

// Umbral de tamaño para avisar en PR de trabajo (sin contar archivos generados ni lockfiles).
export const UMBRAL_TAMANO = Object.freeze({ lineas: 800, archivos: 40 });
const TAMANOS = [['XS', 10], ['S', 100], ['M', 400], ['L', 800], ['XL', Infinity]];

export const esPromocion = (base) => base === 'qa' || base === 'main';

/** Archivos generados o de dependencias, que no cuentan para el tamaño de la PR. */
export function esGenerado(ruta) {
  return /^\.(claude|gemini|codex|opencode)\//.test(ruta) || /(^|\/)package-lock\.json$/.test(ruta) || ruta === 'opencode.json' || ruta === '.mcp.json';
}

export function tamano(lineas) {
  return TAMANOS.find(([, max]) => lineas <= max)[0];
}

/** Secciones "## Título" de la descripción → { titulo: contenido sin comentarios HTML }. */
export function secciones(cuerpo) {
  const mapa = {};
  let actual = null;
  for (const linea of String(cuerpo ?? '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(linea);
    if (m) {
      actual = m[1].toLowerCase();
      mapa[actual] = mapa[actual] ?? '';
    } else if (actual) mapa[actual] += `${linea}\n`;
  }
  return mapa;
}

const vacia = (texto) => String(texto ?? '').split('\n').every((l) => PLACEHOLDER.test(l));

/**
 * pr: { titulo, cuerpo, head, base, borrador, mergeable, mergeableState }
 * archivos: [{ filename, additions, deletions }]
 * issues: Map número → { esPR: boolean } con los issues referenciados que existen (los que no, faltan)
 * referencias: { cierra: [n], todas: [n] } (de la descripción)
 * Devuelve { errores, avisos, etiquetas, lineas }.
 */
export function evaluarPR({ pr, archivos = [], issues = new Map(), referencias = { cierra: [], todas: [] } }) {
  const errores = [];
  const avisos = [];
  const promo = esPromocion(pr.base);

  if (promo) {
    if (!RE_TITULO_PROMOCION.test(pr.titulo)) errores.push(`Título de promoción: debe empezar con «Promoción ${pr.head} → ${pr.base}: …».`);
  } else if (!RE_TITULO_TRABAJO.test(pr.titulo)) {
    errores.push(`Título: usa Conventional Commits, «tipo(alcance): descripción» (tipos: ${TIPOS.join(', ')}).`);
  }

  if (!promo) {
    const m = RE_RAMA.exec(pr.head);
    if (!m) errores.push(`Rama «${pr.head}»: debe ser tipo/N-descripcion en minúsculas (por ejemplo feat/12-deslizador).`);
    else if (!referencias.cierra.includes(Number(m[2]))) errores.push(`La rama es del issue #${m[2]}, pero la PR no lo cierra: agrega «Closes #${m[2]}».`);
  }

  if (pr.borrador) {
    avisos.push('La PR está en borrador: la descripción completa se exige al marcarla como lista para revisión.');
  } else {
    const s = secciones(pr.cuerpo);
    for (const nombre of ['issues', 'qué cambia', 'cómo se verificó']) {
      if (!(nombre in s)) errores.push(`Descripción: falta la sección «## ${nombre[0].toUpperCase()}${nombre.slice(1)}» (usa la plantilla de PR).`);
      else if (nombre !== 'issues' && vacia(s[nombre])) errores.push(`Descripción: completa la sección «${nombre}» (no puede quedar vacía ni con «(completar)»).`);
    }
  }

  for (const n of referencias.todas) {
    const i = issues.get(n);
    if (!i) errores.push(`La referencia #${n} no corresponde a ningún issue del repositorio.`);
    else if (i.esPR) errores.push(`#${n} es una PR, no un issue: referencia el issue que resuelve.`);
  }

  if (pr.mergeable === false || pr.mergeableState === 'dirty') errores.push(`Hay conflictos con \`${pr.base}\`: actualiza la rama y resuélvelos.`);
  else if (pr.mergeableState === 'behind') avisos.push(`La rama está desactualizada respecto de \`${pr.base}\`: conviene actualizarla antes de fusionar.`);

  const propios = archivos.filter((a) => !esGenerado(a.filename));
  const lineas = propios.reduce((n, a) => n + (a.additions ?? 0) + (a.deletions ?? 0), 0);
  if (!promo && (lineas > UMBRAL_TAMANO.lineas || propios.length > UMBRAL_TAMANO.archivos)) {
    avisos.push(`PR grande (${lineas} líneas en ${propios.length} archivos, sin contar generados): considera dividirla en PR más pequeñas.`);
  }

  const tipo = promo ? null : (RE_TITULO_TRABAJO.exec(pr.titulo) ?? [])[1];
  const etiquetas = [promo ? 'promoción' : tipo ? `tipo: ${tipo}` : null, `tamaño: ${tamano(lineas)}`].filter(Boolean);
  return { errores, avisos, etiquetas, lineas };
}

/** Issues que la PR cierra (solo Closes, Fixes o Resolves; acepta listas). */
export function extraerCierres(texto) {
  const numeros = new Set();
  const re = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[\s:]*((?:#\d+(?:[\s,]+(?:y\s+|and\s+)?)?)+)/gi;
  for (const m of String(texto ?? '').matchAll(re)) for (const n of m[1].matchAll(/#(\d+)/g)) numeros.add(Number(n[1]));
  return [...numeros].sort((a, b) => a - b);
}

/** Pares base ← origen permitidos para crear una PR. */
export function prPermitida(base, head) {
  if (!base) return { ok: false, motivo: 'Indica el destino con --base: sin él, gh apunta a main (la rama por defecto).' };
  if (base === 'dev') return ['dev', 'qa', 'main'].includes(head) ? { ok: false, motivo: `Hacia dev solo se abren PR desde ramas de trabajo, no desde ${head}.` } : { ok: true };
  if (base === 'qa') return head === 'dev' ? { ok: true } : { ok: false, motivo: 'Hacia qa solo se abre la promoción desde dev.' };
  if (base === 'main') return head === 'qa' ? { ok: true } : { ok: false, motivo: 'Hacia main solo se abre la promoción desde qa.' };
  return { ok: false, motivo: `Destino «${base}» no permitido: las PR van a dev, qa o main.` };
}
