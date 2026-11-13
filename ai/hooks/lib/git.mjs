// Utilidades de git para los hooks (con efectos de lectura: ejecutan git). Las reglas puras están en guard.mjs.
import { execFileSync } from 'node:child_process';

const run = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Rama actual, o null si HEAD está desacoplado o no es un repositorio. */
export function currentBranch(cwd = process.cwd()) {
  try {
    return run(['symbolic-ref', '--short', '-q', 'HEAD'], cwd) || null;
  } catch {
    return null;
  }
}

/** Referencia a un issue en un mensaje de commit o de PR: #12, GH-12 o la URL del issue. */
export const ISSUE_REF = /(?:^|[\s(,:])#\d+\b|\bGH-\d+\b|\/issues\/\d+\b/i;

/** Número de issue en el nombre de la rama, con la convención tipo/N-descripcion (feat/12-deslizador). */
export function issueFromBranch(branch) {
  const m = /^[a-z]+\/(\d+)-/i.exec(branch ?? '');
  return m ? m[1] : null;
}

/** Mensajes que no necesitan issue: merges, reverts y commits de autosquash. */
export const EXEMPT_MESSAGE = /^(Merge |Revert "|fixup! |squash! |amend! )/;

/** Salida de git sin recortar: necesaria para formatos donde el espacio inicial importa (status --porcelain). */
export const gitRaw = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

export { run as git };
