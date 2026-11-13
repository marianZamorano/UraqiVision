// Construcción de informes de evidencias en Markdown. Separa hechos verificados, hipótesis y recomendaciones.
import { redact } from './secrets.mjs';

const esc = (s) => redact(String(s ?? '')).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/**
 * @param {object} input
 * @param {string} input.title
 * @param {{name:string, results:{format:string, totals:object, cases:object[]}}[]} [input.testRuns]
 * @param {object} [input.performance]   resumen de summarizeK6
 * @param {{passed:boolean, results:object[]}} [input.gate]
 * @param {string[]} [input.facts]           hechos con evidencia
 * @param {string[]} [input.hypotheses]      hipótesis no verificadas
 * @param {string[]} [input.recommendations]
 * @param {string[]} [input.notExecuted]     pruebas no ejecutadas o pendientes
 * @param {object} [input.context]           entorno, commit, fecha, alcance
 */
export function buildEvidenceReport(input) {
  if (!input || typeof input.title !== 'string' || !input.title.trim()) throw new Error('title es obligatorio');
  const L = [];
  L.push(`# ${esc(input.title)}`, '');
  const ctx = input.context ?? {};
  L.push(`> Generado: ${new Date().toISOString()}${ctx.commit ? ` · Commit: \`${esc(ctx.commit)}\`` : ''}${ctx.environment ? ` · Entorno: ${esc(ctx.environment)}` : ''}`, '');
  if (ctx.scope) L.push(`**Alcance:** ${esc(ctx.scope)}`, '');

  const runs = input.testRuns ?? [];
  const gateFailed = input.gate && !input.gate.passed;
  const anyFailed = runs.some((r) => (r.results.totals.failed ?? 0) + (r.results.totals.error ?? 0) > 0);
  const verdict = runs.length === 0 && !input.performance ? 'SIN EVIDENCIA DE EJECUCIÓN' : anyFailed || gateFailed ? 'NO APTO' : 'APTO (según la evidencia aportada)';
  L.push('## Veredicto', '', `**${verdict}**`, '');

  if (runs.length) {
    L.push('## Resultados de pruebas (hechos)', '', '| Ejecución | Formato | Total | ✅ | ❌ | ⚠️ error | ⏭️ | Tasa de éxito |', '|---|---|---|---|---|---|---|---|');
    for (const r of runs) {
      const t = r.results.totals;
      L.push(`| ${esc(r.name)} | ${r.results.format} | ${t.total} | ${t.passed} | ${t.failed} | ${t.error ?? 0} | ${t.skipped} | ${t.passRate ?? 'n/a'}% |`);
    }
    L.push('');
    const failures = runs.flatMap((r) => r.results.cases.filter((c) => c.status === 'failed' || c.status === 'error').map((c) => ({ run: r.name, ...c })));
    if (failures.length) {
      L.push('### Fallos', '', '| Ejecución | Suite | Caso | Mensaje |', '|---|---|---|---|');
      for (const f of failures.slice(0, 50)) L.push(`| ${esc(f.run)} | ${esc(f.suite)} | ${esc(f.name)} | ${esc(f.message).slice(0, 200)} |`);
      if (failures.length > 50) L.push('', `_… ${failures.length - 50} fallos adicionales omitidos._`);
      L.push('');
    }
  }

  if (input.performance) {
    const p = input.performance;
    L.push('## Rendimiento (hechos)', '', '| Métrica | Valor |', '|---|---|');
    L.push(`| Peticiones | ${p.requests?.count ?? 'n/a'} (${p.requests?.ratePerSec?.toFixed?.(2) ?? 'n/a'} req/s) |`);
    L.push(`| Latencia p95 / p99 (ms) | ${p.latencyMs?.p95 ?? 'n/a'} / ${p.latencyMs?.p99 ?? 'n/a'} |`);
    L.push(`| Tasa de error | ${p.errorRate ?? 'n/a'} |`);
    L.push(`| VUs máx. | ${p.maxVus ?? 'n/a'} |`, '');
  }

  if (input.gate) {
    L.push('## Quality gates', '', '| Gate | Métrica | Esperado | Real | Estado |', '|---|---|---|---|---|');
    for (const g of input.gate.results) L.push(`| ${esc(g.id ?? g.name)} | ${esc(g.metric ?? '')} | ${esc(g.expected ?? g.limit)} | ${g.actual ?? 'n/a'} | ${g.status} |`);
    L.push('');
  }

  const list = (title, items, empty) => {
    L.push(`## ${title}`, '');
    if (items?.length) items.forEach((i) => L.push(`- ${esc(i)}`));
    else L.push(`_${empty}_`);
    L.push('');
  };
  list('Hechos verificados adicionales', input.facts, 'Ninguno aportado.');
  list('Hipótesis (no verificadas)', input.hypotheses, 'Ninguna.');
  list('Recomendaciones (no ejecutadas)', input.recommendations, 'Ninguna.');
  list('Pruebas no ejecutadas / pendientes', input.notExecuted, 'No se declararon pruebas pendientes.');
  L.push('---', '_Este informe solo refleja la evidencia aportada. Las recomendaciones requieren aprobación antes de ejecutarse._');
  return L.join('\n');
}
