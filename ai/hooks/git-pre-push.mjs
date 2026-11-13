#!/usr/bin/env node
// Hook de git pre-push: nada llega a dev, qa ni main sin PR y todo commit que se sube cita su issue.
// git pasa <remoto> <url> como argumentos y por stdin una línea por referencia:
//   <ref local> <sha local> <ref remota> <sha remoto>
import { git, ISSUE_REF, EXEMPT_MESSAGE } from './lib/git.mjs';

const ZERO = /^0+$/;
const PROTECTED = /^refs\/heads\/(main|qa|dev)$/;
const remote = process.argv[2] || 'origin';
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const lines = Buffer.concat(chunks).toString('utf8').split('\n').map((l) => l.trim()).filter(Boolean);

const problems = [];
const warnings = [];
for (const line of lines) {
  const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
  if (PROTECTED.test(remoteRef)) {
    problems.push(`Push a ${remoteRef.replace('refs/heads/', '')} bloqueado: dev, qa y main solo reciben cambios mediante una PR aprobada.`);
    continue;
  }
  if (ZERO.test(localSha)) continue; // borrado de una rama remota que no es main
  const branch = remoteRef.replace('refs/heads/', '');
  if (!/^[a-z]+\/\d+-/i.test(branch)) warnings.push(`La rama "${branch}" no sigue la convención tipo/N-descripcion (por ejemplo feat/12-deslizador).`);
  const range = ZERO.test(remoteSha) ? [localSha, '--not', `--remotes=${remote}`] : [`${remoteSha}..${localSha}`];
  let commits = [];
  try {
    commits = git(['rev-list', '--no-merges', ...range]).split('\n').filter(Boolean);
  } catch {
    continue;
  }
  for (const sha of commits) {
    const msg = git(['log', '-1', '--format=%B', sha]);
    if (!EXEMPT_MESSAGE.test(msg) && !ISSUE_REF.test(msg)) problems.push(`${sha.slice(0, 7)} "${msg.split('\n')[0]}" no cita ningún issue (#N).`);
  }
}

for (const w of warnings) process.stderr.write(`[uraqi] Aviso: ${w}\n`);
if (problems.length) {
  process.stderr.write(`[uraqi-guard:pre-push] Push bloqueado:\n- ${problems.join('\n- ')}\nFlujo: issue → rama tipo/N-descripcion desde dev → commits con #N → push de la rama → PR a dev con "Closes #N" → PR dev→qa → PR qa→main (skill flujo-issues-y-pr).\n`);
  process.exit(1);
}
