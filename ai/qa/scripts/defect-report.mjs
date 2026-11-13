#!/usr/bin/env node
// Genera borradores de reporte de defecto a partir de fallos reales en resultados de pruebas.
// Separa hechos observados de hipótesis; todo texto se redacta para no exponer secretos.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, requireFile, writeOutput } from './lib/cli.mjs';
import { parseTestResults } from './lib/junit.mjs';
import { redact } from './lib/secrets.mjs';

const USAGE = `Uso: node defect-report.mjs --results <junit.xml|resultado.json> [--case "subcadena del nombre"]
                              [--severity S1|S2|S3|S4] [--environment "..."] [--commit SHA] [--out defectos.md]

Crea un borrador por cada caso fallido (o solo los que coinciden con --case). El borrador NO se envía a
ningún gestor de incidencias: crearlo en un sistema externo requiere aprobación explícita.
Salida: 0 hay borradores, 1 no se encontraron fallos que coincidan, 2 entrada inválida.`;

export function draftDefects(results, { match, severity = 'S3', environment, commit } = {}) {
  const failed = results.cases.filter((c) => (c.status === 'failed' || c.status === 'error') && (!match || `${c.suite} ${c.name}`.toLowerCase().includes(match.toLowerCase())));
  return failed.map((c, i) => {
    const firstLine = redact(c.message || c.details.split('\n')[0] || 'Fallo sin mensaje');
    return [
      `## DEF-DRAFT-${String(i + 1).padStart(3, '0')}: ${redact(c.name).slice(0, 100)}`,
      '',
      '| Campo | Valor |', '|---|---|',
      `| Severidad propuesta | ${severity} (a confirmar por QA) |`,
      `| Prioridad | Pendiente de triage |`,
      `| Suite / archivo | ${redact(c.suite)} ${c.file ? `/ \`${c.file}\`` : ''} |`,
      `| Entorno | ${redact(environment ?? `${os.platform()} ${os.release()}, Node ${process.version}`)} |`,
      `| Commit | ${commit ?? 'no indicado'} |`,
      `| Tipo de fallo | ${c.status === 'error' ? 'Error de ejecución (la prueba no llegó a evaluar la aserción)' : 'Aserción fallida'} |`,
      '',
      '### Resultado observado (hecho)', '', '```', firstLine, '```', '',
      '### Detalle (traza redactada)', '', '```', redact(c.details).slice(0, 3000) || '(sin detalle)', '```', '',
      '### Resultado esperado', '', '_Completar a partir del criterio de aceptación o del contrato._', '',
      '### Pasos para reproducir', '', `1. Ejecutar la prueba \`${redact(c.name)}\` de forma aislada.`, '2. _Completar precondiciones y datos usados._', '',
      '### Hipótesis (no verificadas)', '', '- _Completar tras aplicar `systematic-debugging`._', '',
      '### Evidencias adjuntas', '', '- Resultado de ejecución origen de este borrador.', '',
    ].join('\n');
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('defect-report', () => {
    const { values } = cli({ name: 'defect-report', usage: USAGE, options: { results: { type: 'string' }, case: { type: 'string' }, severity: { type: 'string', default: 'S3' }, environment: { type: 'string' }, commit: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    if (!/^S[1-4]$/.test(values.severity)) throw new UsageError('--severity debe ser S1..S4');
    let results;
    try {
      results = parseTestResults(fs.readFileSync(requireFile(values.results, '--results'), 'utf8'));
    } catch (err) {
      throw new UsageError(err.message);
    }
    const drafts = draftDefects(results, { match: values.case, severity: values.severity, environment: values.environment, commit: values.commit });
    if (!drafts.length) {
      process.stdout.write('No se encontraron casos fallidos que coincidan.\n');
      return EXIT.CHECK_FAILED;
    }
    writeOutput(values.out, `# Borradores de defectos\n\n${drafts.join('\n---\n\n')}`, { force: values.force });
    return EXIT.OK;
  });
}
