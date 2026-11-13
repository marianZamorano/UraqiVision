// Estado de los issues según el avance de sus PR. Funciones puras (sin red); lo aplica ai/scripts/estado-issues.mjs.
//
// GitHub solo cierra issues con "Closes #N" al fusionar en la rama por defecto (main). Aquí el issue se cierra
// al fusionar en dev (decisión del equipo, 13 nov 2026) y las etiquetas siguen el recorrido aunque esté cerrado:
//   PR abierta hacia dev      → estado: en revisión            (solo issues abiertos)
//   fusionada en dev          → estado: en dev, y el issue se cierra
//   fusionada en qa           → estado: en preproducción       (aunque el issue esté cerrado)
//   fusionada en main         → estado: en producción          (aunque el issue esté cerrado; lo cierra si seguía abierto)
//   PR cerrada sin fusionar   → se quita estado: en revisión

export const ETIQUETAS = Object.freeze({
  revision: { nombre: 'estado: en revisión', color: 'fbca04', descripcion: 'Tiene una PR abierta hacia dev' },
  dev: { nombre: 'estado: en dev', color: '1d76db', descripcion: 'Fusionado en dev (integración)' },
  qa: { nombre: 'estado: en preproducción', color: '5319e7', descripcion: 'Fusionado en qa (preproducción)' },
  main: { nombre: 'estado: en producción', color: '0e8a16', descripcion: 'Fusionado en main (producción)' },
});
const NOMBRES = Object.values(ETIQUETAS).map((e) => e.nombre);

/**
 * evento: { accion: 'opened'|'reopened'|'closed', fusionada: boolean, base: 'dev'|'qa'|'main', pr: número }
 * Devuelve { etiqueta: nombre|null, quitar: [nombres], cerrar: boolean, comentario: texto|null } o null si no hay cambio.
 */
export function transicion({ accion, fusionada, base, pr }) {
  if (!['dev', 'qa', 'main'].includes(base)) return null;
  if ((accion === 'opened' || accion === 'reopened') && base === 'dev') {
    return { etiqueta: ETIQUETAS.revision.nombre, quitar: [], cerrar: false, comentario: null };
  }
  if (accion !== 'closed') return null;
  if (!fusionada) {
    return base === 'dev' ? { etiqueta: null, quitar: [ETIQUETAS.revision.nombre], cerrar: false, comentario: null } : null;
  }
  const destino = ETIQUETAS[base];
  const texto = {
    dev: `Integrado en \`dev\` con la PR #${pr}. Se cierra el issue; la etiqueta de estado seguirá su paso a preproducción y producción.`,
    qa: `En preproducción: llegó a \`qa\` con la PR #${pr}.`,
    main: `En producción: llegó a \`main\` con la PR #${pr}.`,
  }[base];
  return { etiqueta: destino.nombre, quitar: NOMBRES.filter((n) => n !== destino.nombre), cerrar: base === 'dev' || base === 'main', comentario: texto };
}

const REF = /(?:^|[\s(,:])#(\d+)\b|\bGH-(\d+)\b|\/issues\/(\d+)\b/gi;

/** Números referenciados en textos (descripción de la PR y mensajes de commit), sin repetir y ordenados. */
export function extraerIssues(textos) {
  const numeros = new Set();
  for (const t of textos) for (const m of String(t ?? '').matchAll(REF)) numeros.add(Number(m[1] ?? m[2] ?? m[3]));
  return [...numeros].sort((a, b) => a - b);
}

/**
 * Issues que la PR declara en su título o descripción: solo los que van tras una palabra clave
 * (Closes, Fixes, Resolves, Refs), para no confundir menciones en texto libre ("detecta el issue #1").
 * Acepta listas: "Refs #3, #5 y #7".
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

/**
 * ¿Se modifica este issue? Las fusiones (dev, qa, main) actualizan también issues cerrados, para que la etiqueta
 * siga el recorrido hasta producción. Marcar o desmarcar "en revisión" solo aplica a issues abiertos.
 */
export function debeActualizar(issueAbierto, t) {
  if (!t) return false;
  const esFusion = [ETIQUETAS.dev.nombre, ETIQUETAS.qa.nombre, ETIQUETAS.main.nombre].includes(t.etiqueta);
  return esFusion || issueAbierto;
}
