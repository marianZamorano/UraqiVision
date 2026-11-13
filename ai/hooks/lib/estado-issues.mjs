// Estado de los issues según el avance de sus PR. Funciones puras (sin red); lo aplica ai/scripts/estado-issues.mjs.
//
// GitHub solo cierra issues con "Closes #N" al fusionar en la rama por defecto (main). Este flujo actualiza el
// estado también en dev (integración) y qa (preproducción):
//   PR abierta hacia dev      → estado: en revisión
//   fusionada en dev          → estado: en dev
//   fusionada en qa           → estado: en preproducción
//   fusionada en main         → estado: en producción, y el issue se cierra
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
    dev: `Integrado en \`dev\` con la PR #${pr}.`,
    qa: `En preproducción: llegó a \`qa\` con la PR #${pr}.`,
    main: `En producción: llegó a \`main\` con la PR #${pr}. Se cierra el issue.`,
  }[base];
  return { etiqueta: destino.nombre, quitar: NOMBRES.filter((n) => n !== destino.nombre), cerrar: base === 'main', comentario: texto };
}

const REF = /(?:^|[\s(,:])#(\d+)\b|\bGH-(\d+)\b|\/issues\/(\d+)\b/gi;

/** Números referenciados en textos (descripción de la PR y mensajes de commit), sin repetir y ordenados. */
export function extraerIssues(textos) {
  const numeros = new Set();
  for (const t of textos) for (const m of String(t ?? '').matchAll(REF)) numeros.add(Number(m[1] ?? m[2] ?? m[3]));
  return [...numeros].sort((a, b) => a - b);
}

/** Commits que cuentan para la trazabilidad: sin los de merge (p. ej. "Merge pull request #2 from …"). */
export function commitsDeTrabajo(commits) {
  return commits.filter((c) => (c.parents?.length ?? 1) < 2 && !/^Merge (pull request|branch) /.test(c.commit?.message ?? ''));
}

/** ¿Se modifica este issue? Un issue cerrado solo se toca para marcarlo en producción. */
export function debeActualizar(issueAbierto, t) {
  return Boolean(t) && (issueAbierto || t.etiqueta === ETIQUETAS.main.nombre);
}
