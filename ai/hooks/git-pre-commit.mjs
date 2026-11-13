#!/usr/bin/env node
// Hook de git pre-commit (PS-06, RNF-06): impide versionar archivos con secretos o líneas con claves.
// Se activa con: git config core.hooksPath .githooks
// También impide commitear directamente en dev, qa o main: el trabajo va en una rama tipo/N-descripcion y
// llega a esas ramas por PR.
import { execFileSync } from 'node:child_process';
import { findSecrets, isSecretPath, PROTECTED_BRANCHES } from './lib/guard.mjs';
import { currentBranch } from './lib/git.mjs';

const branch = currentBranch();
if (PROTECTED_BRANCHES.includes(branch)) {
  process.stderr.write(`[uraqi-guard:commit-en-main] No se commitea directamente en ${branch}.\nCrea una rama para el issue desde dev: git switch -c feat/<N>-descripcion (los cambios sin confirmar se mueven con ella).\n`);
  process.exit(1);
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const problems = [];

for (const file of git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean)) {
  if (isSecretPath(file)) problems.push(`${file}: archivo con secretos (usa .env.example).`);
}

let currentFile = '';
let lineNo = 0;
for (const line of git('diff', '--cached', '-U0', '--no-color', '--diff-filter=ACMR').split('\n')) {
  if (line.startsWith('+++ b/')) currentFile = line.slice(6);
  else if (line.startsWith('@@')) lineNo = Number(/\+(\d+)/.exec(line)?.[1] ?? 0) - 1;
  else if (line.startsWith('+') && !line.startsWith('+++')) {
    lineNo += 1;
    const found = findSecrets(line.slice(1));
    if (found.length) problems.push(`${currentFile}:${lineNo}: posible secreto (${found.join(', ')}).`);
  }
}

if (problems.length) {
  process.stderr.write(`[uraqi-guard:pre-commit] Commit bloqueado (RNF-06):\n- ${problems.join('\n- ')}\nQuita el secreto, rótalo si llegó a compartirse y vuelve a intentar.\n`);
  process.exit(1);
}
