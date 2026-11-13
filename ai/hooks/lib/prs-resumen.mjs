// Resumen de PRs que esperan acción de la persona actual. Lo usan los hooks (aviso automático) y ai/scripts/prs.mjs.
import { repoSlug, usuarioActual, colaboradores, prsAbiertas, revisiones } from './github.mjs';
import { evaluarAprobacion, debeAprobar } from './aprobaciones.mjs';

export async function estadoPRs() {
  const slug = repoSlug();
  const [yo, colabs, abiertas] = await Promise.all([usuarioActual(), colaboradores(slug), prsAbiertas(slug)]);
  const filas = await Promise.all(abiertas.map(async (p) => ({ pr: p, ev: evaluarAprobacion(p, colabs, await revisiones(slug, p.numero)) })));
  return {
    yo,
    colaboradores: colabs,
    porAprobar: filas.filter(({ pr, ev }) => debeAprobar(yo, pr, ev)),
    mias: filas.filter(({ pr }) => pr.autor === yo),
    otras: filas.filter(({ pr, ev }) => pr.autor !== yo && !debeAprobar(yo, pr, ev)),
  };
}

const linea = ({ pr, ev }) => `#${pr.numero} ${pr.head} → ${pr.base} «${pr.titulo}» de ${pr.autor}${ev.listo ? ' (lista para fusionar)' : ev.motivos.length ? ` (${ev.motivos.join('; ')})` : ''}`;

/**
 * Aviso automático para los hooks. Nunca lanza errores (sin gh, sin red o sin sesión, devuelve '').
 * - modo 'inicio': consulta siempre y devuelve el aviso completo si hay algo pendiente.
 * - modo 'periodico': consulta como mucho cada `intervaloMin` minutos y solo avisa si hay novedades
 *   respecto de la última consulta (nuevas PR por aprobar o PR tuyas que pasaron a estar listas).
 * El caché vive en .git/uraqi-prs.json (no se versiona).
 */
export async function avisoPRs({ modo = 'inicio', intervaloMin = 10 } = {}) {
  try {
    const { execFileSync } = await import('node:child_process');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { encoding: 'utf8' }).trim();
    const cacheFile = path.join(gitDir, 'uraqi-prs.json');
    const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { ts: 0, claves: [] };
    if (modo === 'periodico' && Date.now() - cache.ts < intervaloMin * 60_000) return '';
    const estado = await estadoPRs();
    const claves = [
      ...estado.porAprobar.map(({ pr }) => `aprobar:${pr.numero}:${pr.headSha}`),
      ...estado.mias.filter(({ ev }) => ev.listo).map(({ pr }) => `lista:${pr.numero}:${pr.headSha}`),
    ].sort();
    fs.writeFileSync(cacheFile, JSON.stringify({ ts: Date.now(), claves }));
    if (modo === 'periodico' && !claves.some((c) => !cache.claves.includes(c))) return '';
    return textoAviso(estado);
  } catch {
    return '';
  }
}

/** Texto breve para el contexto del asistente; cadena vacía si no hay nada que hacer. */
export function textoAviso(estado) {
  const partes = [];
  if (estado.porAprobar.length) {
    partes.push(`PRs que esperan TU aprobación (${estado.yo}):`, ...estado.porAprobar.map((f) => `  - ${linea(f)}`));
  }
  const listas = estado.mias.filter((f) => f.ev.listo);
  const bloqueadas = estado.mias.filter((f) => !f.ev.listo);
  if (listas.length) partes.push('Tus PRs listas para fusionar:', ...listas.map((f) => `  - ${linea(f)}`));
  if (bloqueadas.length) partes.push('Tus PRs en espera:', ...bloqueadas.map((f) => `  - ${linea(f)}`));
  if (!partes.length) return '';
  partes.push('Avisa a la persona y ofrécele revisarlas. Aprobar: npm run pr:aprobar -- <N>. Fusionar: npm run pr:fusionar -- <N>. Ambos piden confirmación; nunca apruebes ni fusiones sin que la persona lo confirme.');
  return `[UraqiVision] Revisiones de PR\n${partes.join('\n')}`;
}
