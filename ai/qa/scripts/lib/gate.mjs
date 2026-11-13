// Evaluación de quality gates sobre métricas planas.
//
// gates: [{ id, metric, op: '>='|'<='|'>'|'<'|'==', value, required?: boolean (default true), description? }]
// metrics: { [metric]: number|null }

const OPS = {
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '==': (a, b) => a === b,
};

export function validateGateConfig(config) {
  const errors = [];
  if (!config || !Array.isArray(config.gates)) return ['La configuración debe tener un array "gates"'];
  config.gates.forEach((g, i) => {
    if (!g || typeof g !== 'object') return errors.push(`gates[${i}] no es un objeto`);
    if (!g.id) errors.push(`gates[${i}].id es obligatorio`);
    if (!g.metric) errors.push(`gates[${i}].metric es obligatorio`);
    if (!OPS[g.op]) errors.push(`gates[${i}].op inválido: ${g.op} (usar ${Object.keys(OPS).join(' ')})`);
    if (typeof g.value !== 'number') errors.push(`gates[${i}].value debe ser numérico`);
  });
  return errors;
}

export function evaluateGates(config, metrics) {
  const problems = validateGateConfig(config);
  if (problems.length) throw new Error(`Configuración de gates inválida: ${problems.join('; ')}`);
  const results = config.gates.map((g) => {
    const actual = metrics?.[g.metric];
    const required = g.required !== false;
    if (actual === undefined || actual === null || Number.isNaN(actual)) {
      return { id: g.id, metric: g.metric, expected: `${g.op} ${g.value}`, actual: null, status: required ? 'fail' : 'skipped', reason: 'Métrica no disponible' };
    }
    const ok = OPS[g.op](actual, g.value);
    return { id: g.id, metric: g.metric, expected: `${g.op} ${g.value}`, actual, status: ok ? 'pass' : 'fail', reason: ok ? '' : g.description ?? '' };
  });
  return { passed: results.every((r) => r.status !== 'fail'), results };
}

/** Extrae métricas de cobertura de un coverage-summary.json (Istanbul/c8/Vitest/Jest). */
export function coverageMetrics(summary) {
  const t = summary?.total;
  if (!t) throw new Error('coverage-summary.json inválido: falta "total"');
  const pct = (k) => (typeof t[k]?.pct === 'number' ? t[k].pct : null);
  return { coverageLines: pct('lines'), coverageStatements: pct('statements'), coverageFunctions: pct('functions'), coverageBranches: pct('branches') };
}
