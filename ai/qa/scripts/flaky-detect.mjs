#!/usr/bin/env node
// Detecta pruebas inestables (flaky) comparando varias ejecuciones del mismo conjunto (JUnit XML o JSON Jest/Vitest).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, writeOutput } from './lib/cli.mjs';
import { parseTestResults } from './lib/junit.mjs';

const USAGE = `Uso: node flaky-detect.mjs <run1> <run2> [runN...] [--json]

Cada archivo es el resultado de una ejecución (JUnit XML o JSON de Jest/Vitest) sin cambios de código entre ellas.
Una prueba es flaky si pasa en unas ejecuciones y falla en otras.
Salida: 0 sin flaky, 1 con flaky, 2 entrada inválida.`;

export function detectFlaky(runs) {
  if (runs.length < 2) throw new UsageError('Se necesitan al menos 2 ejecuciones');
  const byTest = new Map();
  runs.forEach((r, idx) => {
    for (const c of r.cases) {
      const key = `${c.suite} :: ${c.name}`;
      if (!byTest.has(key)) byTest.set(key, { test: key, outcomes: new Array(runs.length).fill('absent'), durations: [] });
      const e = byTest.get(key);
      e.outcomes[idx] = c.status === 'error' ? 'failed' : c.status;
      if (c.durationMs !== null) e.durations.push(c.durationMs);
    }
  });
  const flaky = [];
  const consistentlyFailing = [];
  for (const e of byTest.values()) {
    const executed = e.outcomes.filter((o) => o === 'passed' || o === 'failed');
    const fails = executed.filter((o) => o === 'failed').length;
    if (fails > 0 && fails < executed.length) {
      const min = Math.min(...e.durations);
      const max = Math.max(...e.durations);
      flaky.push({ ...e, failRate: Number((fails / executed.length).toFixed(2)), durationSpreadMs: e.durations.length ? max - min : null, hint: e.durations.length && max > 3 * Math.max(min, 1) ? 'Gran variación de duración: posible dependencia de tiempos/esperas' : 'Revisar orden/estado compartido, datos y esperas' });
    } else if (fails > 0 && fails === executed.length) consistentlyFailing.push(e.test);
  }
  flaky.sort((a, b) => b.failRate - a.failRate);
  return { runs: runs.length, tests: byTest.size, flaky, consistentlyFailing };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('flaky-detect', () => {
    const { values, positionals } = cli({ name: 'flaky-detect', usage: USAGE, options: { out: { type: 'string' }, force: { type: 'boolean' } } });
    const runs = positionals.map((f) => {
      if (!fs.existsSync(f)) throw new UsageError(`No existe: ${f}`);
      try {
        return parseTestResults(fs.readFileSync(f, 'utf8'));
      } catch (err) {
        throw new UsageError(`${f}: ${err.message}`);
      }
    });
    const r = detectFlaky(runs);
    const md = ['# Detección de pruebas flaky', '', `Ejecuciones: ${r.runs} · Pruebas: ${r.tests} · Flaky: ${r.flaky.length} · Fallan siempre: ${r.consistentlyFailing.length}`, '', '| Prueba | Resultados | % fallo | Dispersión (ms) | Pista |', '|---|---|---|---|---|', ...r.flaky.map((f) => `| ${f.test} | ${f.outcomes.join(' / ')} | ${f.failRate * 100}% | ${f.durationSpreadMs ?? 'n/a'} | ${f.hint} |`)].join('\n');
    writeOutput(values.out, values.json ? JSON.stringify(r, null, 2) : md, { force: values.force });
    return r.flaky.length ? EXIT.CHECK_FAILED : EXIT.OK;
  });
}
