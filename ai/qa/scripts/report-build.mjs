#!/usr/bin/env node
// Construye un informe de evidencias en Markdown a partir de resultados reales (JUnit/JSON, k6, gates).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile, writeOutput } from './lib/cli.mjs';
import { parseTestResults } from './lib/junit.mjs';
import { summarizeK6 } from './lib/k6.mjs';
import { buildEvidenceReport } from './lib/report.mjs';

const USAGE = `Uso: node report-build.mjs --title "Informe" [--results archivo]... [--k6 resumen.json]
                            [--notes notas.json] [--commit SHA] [--environment local] [--scope "..."] [--out informe.md]

notas.json (opcional): { "facts": [], "hypotheses": [], "recommendations": [], "notExecuted": [] }
El informe distingue hechos (resultados aportados), hipótesis, recomendaciones y pruebas no ejecutadas.
Salida: 0 informe generado, 2 entrada inválida.`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('report-build', () => {
    const { values } = cli({
      name: 'report-build',
      usage: USAGE,
      options: { title: { type: 'string' }, results: { type: 'string', multiple: true }, k6: { type: 'string' }, notes: { type: 'string' }, commit: { type: 'string' }, environment: { type: 'string' }, scope: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } },
    });
    if (!values.title) throw new UsageError('--title es obligatorio');
    const testRuns = (values.results ?? []).map((f) => {
      try {
        return { name: path.basename(f), results: parseTestResults(fs.readFileSync(requireFile(f, '--results'), 'utf8')) };
      } catch (err) {
        throw new UsageError(`${f}: ${err.message}`);
      }
    });
    let performance;
    if (values.k6) {
      try {
        performance = summarizeK6(readJson(requireFile(values.k6, '--k6')));
      } catch (err) {
        throw new UsageError(err.message);
      }
    }
    const notes = values.notes ? readJson(requireFile(values.notes, '--notes')) : {};
    const md = buildEvidenceReport({ title: values.title, testRuns, performance, ...notes, context: { commit: values.commit, environment: values.environment, scope: values.scope } });
    writeOutput(values.out, md, { force: values.force });
    return EXIT.OK;
  });
}
