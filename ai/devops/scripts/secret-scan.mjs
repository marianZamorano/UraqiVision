#!/usr/bin/env node
// Detección de secretos. Modos: árbol completo (--root), archivos concretos (args) o
// solo archivos staged (--staged, para el pre-commit). Nunca imprime los valores.
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { COMMON_OPTIONS, emit, ensureDir, summarize, finding } from '../lib/common.mjs';
import { scanTree, scanFiles, scanText, isSensitiveFilename } from '../lib/secrets.mjs';

const { values: a, positionals } = parseArgs({
  options: { ...COMMON_OPTIONS, staged: { type: 'boolean', default: false } },
  allowPositionals: true,
});
if (a.help) {
  console.log('Uso: node secret-scan.mjs [--root DIR] [--staged] [archivo ...] [--json] [--out informe.md] [--fail-on high]');
  console.log('Excepción por línea: añade el comentario devops-allow-secret (justifícalo en la revisión).');
  process.exit(0);
}
const root = ensureDir(a.root);
let findings;
if (a.staged) {
  const list = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: root, encoding: 'utf8' });
  if (list.status !== 0) {
    console.error('Error: no se pudo leer el índice de Git.');
    process.exit(2);
  }
  findings = [];
  for (const f of list.stdout.split('\n').filter(Boolean)) {
    if (isSensitiveFilename(f)) findings.push(finding('critical', 'secret/sensitive-file-staged', 'Archivo sensible añadido al commit.', { file: f }));
    const blob = spawnSync('git', ['show', `:${f}`], { cwd: root, encoding: 'utf8', maxBuffer: 5_000_000 });
    if (blob.status === 0) findings.push(...scanText(blob.stdout, { file: f }));
  }
} else if (positionals.length) {
  findings = scanFiles(root, positionals.map((p) => resolve(root, p)));
} else {
  findings = scanTree(root);
}
process.exit(emit('Escaneo de secretos', { findings, summary: summarize(findings) }, { json: a.json, out: a.out, failOn: a['fail-on'] }));
