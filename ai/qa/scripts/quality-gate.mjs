#!/usr/bin/env node
// Evalúa quality gates a partir de artefactos reales. Apto para uso local y en CI (código de salida).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile } from './lib/cli.mjs';
import { parseTestResults, totalsOf } from './lib/junit.mjs';
import { summarizeK6 } from './lib/k6.mjs';
import { evaluateGates, coverageMetrics } from './lib/gate.mjs';
import { scanPaths } from './scan-secrets.mjs';

const USAGE = `Uso: node quality-gate.mjs --config <gates.json> [--results archivo]... [--coverage coverage-summary.json]
                             [--k6 resumen.json] [--contract-diff diff.json] [--secrets-scan dir]... [--json]

gates.json: { "gates": [ { "id": "tests-pass", "metric": "failedTests", "op": "==", "value": 0 },
                         { "id": "pass-rate", "metric": "passRate", "op": ">=", "value": 100 },
                         { "id": "coverage", "metric": "coverageLines", "op": ">=", "value": 80 },
                         { "id": "p95", "metric": "p95Ms", "op": "<=", "value": 500, "required": false } ] }

Métricas disponibles: totalTests, failedTests, skippedTests, passRate, coverageLines, coverageStatements,
coverageFunctions, coverageBranches, p95Ms, p99Ms, errorRate, breakingChanges, secretsFound.
Una métrica requerida ausente hace FALLAR el gate (no se asume éxito sin evidencia).
Salida: 0 gates superados, 1 algún gate falla, 2 entrada inválida.`;

export function collectMetrics({ results = [], coverage, k6, contractDiff, secretsFindings }) {
  const m = {};
  if (results.length) {
    const t = totalsOf(results.flatMap((r) => r.cases));
    Object.assign(m, { totalTests: t.total, failedTests: t.failed + (t.error ?? 0), skippedTests: t.skipped, passRate: t.passRate });
  }
  if (coverage) Object.assign(m, coverageMetrics(coverage));
  if (k6) Object.assign(m, { p95Ms: k6.latencyMs?.p95 ?? null, p99Ms: k6.latencyMs?.p99 ?? null, errorRate: k6.errorRate });
  if (contractDiff) m.breakingChanges = contractDiff.summary?.breaking ?? null;
  if (secretsFindings) m.secretsFound = secretsFindings.length;
  return m;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('quality-gate', () => {
    const { values } = cli({
      name: 'quality-gate',
      usage: USAGE,
      options: { config: { type: 'string' }, results: { type: 'string', multiple: true }, coverage: { type: 'string' }, k6: { type: 'string' }, 'contract-diff': { type: 'string' }, 'secrets-scan': { type: 'string', multiple: true } },
    });
    const config = readJson(requireFile(values.config, '--config'));
    const results = (values.results ?? []).map((f) => {
      try {
        return parseTestResults(fs.readFileSync(requireFile(f, '--results'), 'utf8'));
      } catch (err) {
        throw new UsageError(`${f}: ${err.message}`);
      }
    });
    const metrics = collectMetrics({
      results,
      coverage: values.coverage ? readJson(requireFile(values.coverage, '--coverage')) : undefined,
      k6: values.k6 ? summarizeK6(readJson(requireFile(values.k6, '--k6'))) : undefined,
      contractDiff: values['contract-diff'] ? readJson(requireFile(values['contract-diff'], '--contract-diff')) : undefined,
      secretsFindings: values['secrets-scan'] ? scanPaths(values['secrets-scan'], 'high') : undefined,
    });
    let evaluation;
    try {
      evaluation = evaluateGates(config, metrics);
    } catch (err) {
      throw new UsageError(err.message);
    }
    if (values.json) process.stdout.write(`${JSON.stringify({ metrics, ...evaluation }, null, 2)}\n`);
    else {
      for (const r of evaluation.results) process.stdout.write(`${r.status.toUpperCase().padEnd(7)} ${r.id}: ${r.metric} = ${r.actual ?? 'n/a'} (esperado ${r.expected})${r.reason ? ` — ${r.reason}` : ''}\n`);
      process.stdout.write(`\nQuality gate: ${evaluation.passed ? 'SUPERADO' : 'NO SUPERADO'}\n`);
    }
    return evaluation.passed ? EXIT.OK : EXIT.CHECK_FAILED;
  });
}
