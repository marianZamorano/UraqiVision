#!/usr/bin/env node
// Detecta cambios incompatibles entre dos versiones de un contrato OpenAPI/Swagger (JSON).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile, writeOutput } from './lib/cli.mjs';
import { diffContracts } from './lib/openapi.mjs';

const USAGE = `Uso: node contract-diff.mjs --old <v1.json> --new <v2.json> [--fail-on breaking|potentially-breaking] [--json] [--out archivo]

Clasifica cambios: breaking (rompe clientes), potentially-breaking, non-breaking.
Solo JSON (convierte YAML a JSON antes, p. ej. con la herramienta de tu stack).
Salida: 0 compatible, 1 hay cambios al nivel de --fail-on (por defecto breaking), 2 entrada inválida.`;

function toMarkdown(r) {
  const L = ['# Diff de contrato de API', '', `**Compatible:** ${r.compatible ? 'sí' : 'NO'} · breaking: ${r.summary.breaking} · potencialmente: ${r.summary.potentiallyBreaking} · compatibles: ${r.summary.nonBreaking}`, '', '| Nivel | Ubicación | Cambio |', '|---|---|---|'];
  const order = { breaking: 0, 'potentially-breaking': 1, 'non-breaking': 2 };
  for (const c of [...r.changes].sort((a, b) => order[a.level] - order[b.level])) L.push(`| ${c.level} | \`${c.where}\` | ${c.change} |`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('contract-diff', () => {
    const { values } = cli({ name: 'contract-diff', usage: USAGE, options: { old: { type: 'string' }, new: { type: 'string' }, 'fail-on': { type: 'string', default: 'breaking' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    let result;
    try {
      result = diffContracts(readJson(requireFile(values.old, '--old')), readJson(requireFile(values.new, '--new')));
    } catch (err) {
      throw err instanceof UsageError ? err : new UsageError(err.message);
    }
    writeOutput(values.out, values.json ? JSON.stringify(result, null, 2) : toMarkdown(result), { force: values.force });
    const failOn = values['fail-on'] === 'potentially-breaking' ? result.summary.breaking + result.summary.potentiallyBreaking : result.summary.breaking;
    return failOn > 0 ? EXIT.CHECK_FAILED : EXIT.OK;
  });
}
