// Normaliza resultados de k6 en dos formatos:
//  - `handleSummary(data)` serializado con JSON.stringify (métricas con `.values` y thresholds `{ok}`)
//  - `--summary-export` (métricas planas; thresholds como booleanos)
// Para el formato `--summary-export` el significado del booleano de thresholds no se interpreta:
// se reporta tal cual y la evaluación fiable se hace con umbrales propios (`evaluateThresholds`).

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function summarizeK6(data) {
  if (!data || typeof data !== 'object' || typeof data.metrics !== 'object') {
    throw new Error('No parece un resumen de k6 (falta "metrics")');
  }
  const m = data.metrics;
  const vals = (name) => (m[name] ? m[name].values ?? m[name] : null);
  const dur = vals('http_req_duration');
  const failed = vals('http_req_failed');
  const reqs = vals('http_reqs');
  const checks = vals('checks');
  const iterations = vals('iterations');
  const vus = vals('vus_max') ?? vals('vus');

  const summary = {
    format: m.http_req_duration?.values ? 'handleSummary' : 'summary-export',
    requests: { count: num(reqs?.count), ratePerSec: num(reqs?.rate) },
    latencyMs: dur
      ? { avg: num(dur.avg), min: num(dur.min), med: num(dur.med), max: num(dur.max), p90: num(dur['p(90)']), p95: num(dur['p(95)']), p99: num(dur['p(99)']) }
      : null,
    errorRate: failed ? num(failed.rate ?? failed.value) : null,
    checks: checks ? { passes: num(checks.passes), fails: num(checks.fails), rate: num(checks.rate ?? checks.value) } : null,
    iterations: num(iterations?.count),
    maxVus: num(vus?.max ?? vus?.value),
    k6Thresholds: [],
  };

  for (const [metric, def] of Object.entries(m)) {
    const th = def?.thresholds;
    if (!th || typeof th !== 'object') continue;
    for (const [expr, val] of Object.entries(th)) {
      if (val && typeof val === 'object' && 'ok' in val) {
        summary.k6Thresholds.push({ metric, expression: expr, ok: Boolean(val.ok) });
      } else {
        summary.k6Thresholds.push({ metric, expression: expr, raw: val, ok: null, note: 'Formato --summary-export: booleano sin interpretar' });
      }
    }
  }
  return summary;
}

/** Evalúa umbrales propios sobre el resumen normalizado. */
export function evaluateThresholds(summary, { p95Ms, p99Ms, errorRate, minChecksRate } = {}) {
  const results = [];
  const add = (name, actual, limit, ok) => results.push({ name, actual, limit, status: actual === null ? 'unknown' : ok ? 'pass' : 'fail' });
  if (p95Ms !== undefined) add('p95 latency (ms)', summary.latencyMs?.p95 ?? null, `<= ${p95Ms}`, (summary.latencyMs?.p95 ?? Infinity) <= p95Ms);
  if (p99Ms !== undefined) add('p99 latency (ms)', summary.latencyMs?.p99 ?? null, `<= ${p99Ms}`, (summary.latencyMs?.p99 ?? Infinity) <= p99Ms);
  if (errorRate !== undefined) add('error rate', summary.errorRate, `<= ${errorRate}`, (summary.errorRate ?? Infinity) <= errorRate);
  if (minChecksRate !== undefined) add('checks rate', summary.checks?.rate ?? null, `>= ${minChecksRate}`, (summary.checks?.rate ?? -1) >= minChecksRate);
  const passed = results.every((r) => r.status === 'pass');
  return { passed, results };
}
