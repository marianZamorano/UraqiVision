#!/usr/bin/env node
// Lista los issues que lleva una PR de promoción, para pegarlos en su descripción.
//   node ai/scripts/issues-de-promocion.mjs dev qa     → issues de los commits de dev que aún no están en qa
//   node ai/scripts/issues-de-promocion.mjs qa main    → issues de los commits de qa que aún no están en main
// Usa las ramas remotas (origin/...) actualizadas con git fetch. Solo lee: no crea nada en GitHub.
import { execFileSync } from 'node:child_process';

const [origen, destino] = process.argv.slice(2);
const validas = { dev: 'qa', qa: 'main' };
if (validas[origen] !== destino) {
  process.stderr.write('Uso: node ai/scripts/issues-de-promocion.mjs <dev qa | qa main>\n');
  process.exit(2);
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
git('fetch', '-q', 'origin', origen, destino);

const issues = new Map(); // número -> títulos de commits que lo citan
const sinIssue = [];
for (const sha of git('rev-list', '--no-merges', `origin/${destino}..origin/${origen}`).split('\n').filter(Boolean)) {
  const msg = git('log', '-1', '--format=%B', sha);
  const titulo = msg.split('\n')[0];
  const refs = [...msg.matchAll(/(?:^|[\s(,:])#(\d+)\b|\bGH-(\d+)\b|\/issues\/(\d+)\b/gi)].map((m) => m[1] ?? m[2] ?? m[3]);
  if (!refs.length) sinIssue.push(`${sha.slice(0, 7)} ${titulo}`);
  for (const n of new Set(refs)) issues.set(n, [...(issues.get(n) ?? []), titulo]);
}

if (!issues.size && !sinIssue.length) {
  console.log(`No hay commits nuevos de ${origen} para ${destino}.`);
  process.exit(0);
}
const ordenados = [...issues.keys()].sort((a, b) => a - b);
console.log(`## Issues incluidos (${origen} → ${destino})\n`);
for (const n of ordenados) console.log(`- Refs #${n}`);
if (sinIssue.length) {
  process.stderr.write(`\nAviso: commits sin issue (el workflow los rechazará):\n- ${sinIssue.join('\n- ')}\n`);
  process.exit(1);
}
