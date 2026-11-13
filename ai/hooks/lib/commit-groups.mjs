// Agrupa cambios por tema para proponer commits pequeños y coherentes. Funciones puras (sin git).
// Lo usan el hook commit-msg (detecta commits grandes y pregunta) y ai/scripts/dividir-commits.mjs.

// Umbral: se pregunta si el commit mezcla 3 o más grupos, o 2 grupos con 8 o más archivos.
// Un commit de un solo grupo nunca se considera grande, aunque tenga muchos archivos.
export const UMBRAL = Object.freeze({ minGrupos: 3, gruposConMuchosArchivos: 2, muchosArchivos: 8 });

// Orden = orden sugerido de los commits (primero lo que otros cambios necesitan).
// [clave, patrón, tipo por defecto, descripción]
export const REGLAS = [
  ['deps', /^(package(-lock)?\.json|commitlint\.config\.mjs)$/, 'build', 'dependencias y herramientas de validación'],
  ['repo', /^\.git(ignore|attributes)$/, 'chore', 'configuración del repositorio'],
  ['guardas', /^(ai\/hooks\/|\.githooks\/|\.opencode\/plugins\/)/, 'feat', 'guardas y hooks'],
  ['skills', /^\.(agents|claude)\/skills\//, 'feat', 'skills'],
  ['agentes', /^(ai\/agents\/|\.(claude|gemini|codex|opencode)\/agents\/)/, 'feat', 'subagentes'],
  ['ai', /^(ai\/|\.mcp\.json$|opencode\.json$|\.claude\/|\.gemini\/|\.codex\/)/, 'chore', 'configuración de los asistentes'],
  ['ci', /^\.github\//, 'ci', 'GitHub (workflows y plantillas)'],
  ['specs', /^(specs\/|\.specify\/)/, 'docs', 'especificaciones de Spec Kit'],
  ['docs', /^(docs\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|README\.md$)/, 'docs', 'documentación'],
];

/** Clave del grupo de un archivo: la primera regla que coincide, o la carpeta de primer nivel. */
export function grupoDe(path) {
  const p = String(path).replace(/\\/g, '/');
  for (const [clave, re] of REGLAS) if (re.test(p)) return clave;
  return p.includes('/') ? p.split('/')[0] : 'raiz';
}

/**
 * entries: [{ status: 'A'|'M'|'D'|'R'|'??', path }] → grupos ordenados:
 * [{ clave, tipo, descripcion, archivos: [{status, path}] }]
 */
export function agrupar(entries) {
  const mapa = new Map();
  for (const e of entries) {
    const clave = grupoDe(e.path);
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(e);
  }
  const orden = REGLAS.map(([c]) => c);
  const pos = (c) => (orden.includes(c) ? orden.indexOf(c) : orden.length);
  return [...mapa.entries()]
    .sort(([a], [b]) => pos(a) - pos(b) || a.localeCompare(b))
    .map(([clave, archivos]) => {
      const regla = REGLAS.find(([c]) => c === clave);
      return { clave, tipo: regla?.[2] ?? 'chore', descripcion: regla?.[3] ?? `cambios en ${clave}`, archivos };
    });
}

export function esGrande(grupos) {
  const total = grupos.reduce((n, g) => n + g.archivos.length, 0);
  return grupos.length >= UMBRAL.minGrupos || (grupos.length >= UMBRAL.gruposConMuchosArchivos && total >= UMBRAL.muchosArchivos);
}

const esNuevo = (s) => s === 'A' || s === '??';

/** Mensaje sugerido (Conventional Commits) para un grupo. Es un borrador: revisa tipo y descripción. */
export function mensajeSugerido(grupo, issue) {
  const nuevos = grupo.archivos.filter((a) => esNuevo(a.status)).length;
  const todos = grupo.archivos.length;
  const verbo = nuevos === todos ? 'agregar' : nuevos === 0 ? 'actualizar' : 'agregar y actualizar';
  const tipo = nuevos > 0 || ['docs', 'ci', 'build', 'chore'].includes(grupo.tipo) ? grupo.tipo : 'refactor';
  const ref = issue ? ` #${issue}` : ' #N';
  const alcance = grupo.clave === tipo ? '' : `(${grupo.clave})`; // evita "docs(docs)" o "ci(ci)"
  return `${tipo}${alcance}: ${verbo} ${grupo.descripcion}${ref}`.slice(0, 100);
}

/** Texto legible de la propuesta. */
export function describirPlan(grupos, issue) {
  const total = grupos.reduce((n, g) => n + g.archivos.length, 0);
  const lineas = [`${total} archivo(s) en ${grupos.length} grupo(s). División propuesta:`];
  grupos.forEach((g, i) => {
    lineas.push(`  ${i + 1}. ${mensajeSugerido(g, issue)}  (${g.archivos.length} archivo(s))`);
    for (const a of g.archivos.slice(0, 4)) lineas.push(`       ${a.status.padEnd(2)} ${a.path}`);
    if (g.archivos.length > 4) lineas.push(`       … y ${g.archivos.length - 4} más`);
  });
  return lineas.join('\n');
}

/** Parsea `git diff --cached --name-status` (M\tpath, A\tpath, R100\tviejo\tnuevo). */
export function parseNameStatus(texto) {
  return String(texto).split('\n').filter(Boolean).map((l) => {
    const partes = l.split('\t');
    return { status: partes[0][0], path: partes[partes.length - 1] };
  });
}

/** Parsea `git status --porcelain=v1 -uall` con core.quotepath=false (XY path, XY viejo -> nuevo). */
export function parsePorcelain(texto) {
  return String(texto).split('\n').filter((l) => l.length > 3).map((l) => {
    const xy = l.slice(0, 2);
    const path = l.slice(3).split(' -> ').pop().replace(/^"|"$/g, '');
    const status = xy === '??' ? '??' : (xy[0] !== ' ' ? xy[0] : xy[1]);
    return { status, path };
  });
}
