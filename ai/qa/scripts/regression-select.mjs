#!/usr/bin/env node
// Selección de pruebas de regresión según el impacto de los cambios (git diff de solo lectura o lista de archivos).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile, writeOutput } from './lib/cli.mjs';
import { globToRegExp } from './lib/glob.mjs';

const USAGE = `Uso:
  node regression-select.mjs --map <mapa.json> --base <ref-git> [--head HEAD] [--json]
  node regression-select.mjs --map <mapa.json> --files <lista.txt> [--json]

mapa.json:
{ "areas": [ { "name": "auth", "risk": "high", "paths": ["src/auth/**", "src/**/*.guard.ts"],
               "suites": ["test/auth/**", "e2e/login.spec.ts"], "tags": ["@auth"] } ],
  "alwaysRun": ["smoke"],                      // suites/tags que siempre se ejecutan
  "fullRegressionOn": ["package.json", "**/*.lock", "migrations/**"] }  // cambios que fuerzan regresión completa

Ejecuta solo 'git diff --name-only' (lectura). No ejecuta las pruebas: devuelve la selección.
Salida: 0 OK, 2 entrada inválida.`;

export function matchesAny(file, globs = []) {
  return globs.some((g) => globToRegExp(g).test(file));
}

export function selectRegression(map, changedFiles) {
  if (!Array.isArray(map?.areas)) throw new UsageError('El mapa requiere "areas"');
  const files = changedFiles.map((f) => f.replace(/\\/g, '/').trim()).filter(Boolean);
  const full = files.filter((f) => matchesAny(f, map.fullRegressionOn));
  const impacted = [];
  const unmapped = [];
  for (const f of files) {
    const areas = map.areas.filter((a) => matchesAny(f, a.paths));
    if (!areas.length) unmapped.push(f);
    for (const a of areas) {
      const existing = impacted.find((x) => x.name === a.name);
      if (existing) existing.files.push(f);
      else impacted.push({ name: a.name, risk: a.risk ?? 'medium', suites: a.suites ?? [], tags: a.tags ?? [], files: [f] });
    }
  }
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  impacted.sort((a, b) => (riskOrder[a.risk] ?? 9) - (riskOrder[b.risk] ?? 9));
  return {
    changedFiles: files.length,
    fullRegression: full.length > 0,
    fullRegressionReasons: full,
    alwaysRun: map.alwaysRun ?? [],
    impactedAreas: impacted,
    suites: [...new Set(impacted.flatMap((a) => a.suites))],
    tags: [...new Set([...(map.alwaysRun ?? []), ...impacted.flatMap((a) => a.tags)])],
    unmappedFiles: unmapped,
    recommendation: full.length
      ? 'Ejecutar regresión completa: cambios en archivos transversales.'
      : unmapped.length
        ? 'Ejecutar suites seleccionadas + smoke; revisar archivos sin mapear (posible brecha del mapa).'
        : 'Ejecutar suites seleccionadas + alwaysRun.',
  };
}

function changedFromGit(base, head) {
  if (!/^[\w./~^@{}-]+$/.test(base) || !/^[\w./~^@{}-]+$/.test(head)) throw new UsageError('Referencia git inválida');
  return execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' }).split(/\r?\n/);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('regression-select', () => {
    const { values } = cli({ name: 'regression-select', usage: USAGE, options: { map: { type: 'string' }, base: { type: 'string' }, head: { type: 'string', default: 'HEAD' }, files: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    const map = readJson(requireFile(values.map, '--map'));
    if (!values.base === !values.files) throw new UsageError('Indica exactamente una de --base o --files');
    const files = values.files ? fs.readFileSync(requireFile(values.files, '--files'), 'utf8').split(/\r?\n/) : changedFromGit(values.base, values.head);
    const r = selectRegression(map, files);
    const md = [
      '# Selección de regresión', '', `Archivos cambiados: ${r.changedFiles} · Regresión completa: ${r.fullRegression ? 'SÍ' : 'no'}`, '',
      '| Área | Riesgo | Suites | Archivos |', '|---|---|---|---|',
      ...r.impactedAreas.map((a) => `| ${a.name} | ${a.risk} | ${a.suites.join('<br>')} | ${a.files.length} |`),
      '', `**Tags:** ${r.tags.join(', ') || '—'}`, '', `**Sin mapear:** ${r.unmappedFiles.join(', ') || '—'}`, '', `**Recomendación:** ${r.recommendation}`,
    ].join('\n');
    writeOutput(values.out, values.json ? JSON.stringify(r, null, 2) : md, { force: values.force });
    return EXIT.OK;
  });
}
