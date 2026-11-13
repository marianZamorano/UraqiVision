#!/usr/bin/env node
// Priorización de pruebas basada en riesgo: riesgo = probabilidad × impacto (escala 1–5).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile, writeOutput } from './lib/cli.mjs';

const USAGE = `Uso: node risk-matrix.mjs --input <riesgos.json> [--json] [--out archivo]

riesgos.json: [{ "id": "R1", "area": "Autenticación", "description": "...", "likelihood": 1-5, "impact": 1-5,
                 "factors": { "complexity": 1-5, "changeFrequency": 1-5, "defectHistory": 1-5 } }]  // factors opcional
Calcula score = likelihood × impact (ajustado por factores si existen), nivel y prioridad de prueba.
Salida: 0 OK, 2 entrada inválida.`;

export function level(score) {
  if (score >= 15) return { level: 'CRÍTICO', priority: 'P1', depth: 'Pruebas exhaustivas: funcionales, negativas, límites, integración, no funcionales y regresión en cada cambio' };
  if (score >= 10) return { level: 'ALTO', priority: 'P2', depth: 'Pruebas funcionales y negativas completas + regresión automatizada' };
  if (score >= 5) return { level: 'MEDIO', priority: 'P3', depth: 'Camino feliz + negativos principales; smoke en regresión' };
  return { level: 'BAJO', priority: 'P4', depth: 'Smoke / exploratorio puntual' };
}

export function scoreRisks(risks) {
  if (!Array.isArray(risks) || !risks.length) throw new UsageError('La entrada debe ser un array no vacío de riesgos');
  const inRange = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
  return risks
    .map((r, i) => {
      if (!r?.id) throw new UsageError(`risks[${i}].id es obligatorio`);
      if (!inRange(r.likelihood) || !inRange(r.impact)) throw new UsageError(`risks[${i}] (${r.id}): likelihood e impact deben ser enteros 1–5`);
      let likelihood = r.likelihood;
      if (r.factors) {
        const vals = Object.values(r.factors).filter(inRange);
        if (vals.length) likelihood = Math.min(5, Math.max(1, Math.round((r.likelihood + vals.reduce((a, b) => a + b, 0) / vals.length) / 2)));
      }
      const score = likelihood * r.impact;
      return { id: r.id, area: r.area ?? '', description: r.description ?? '', likelihood, impact: r.impact, score, ...level(score) };
    })
    .sort((a, b) => b.score - a.score || b.impact - a.impact);
}

function toMarkdown(rows) {
  const L = ['# Matriz de riesgos y prioridad de pruebas', '', '| Prioridad | ID | Área | Prob. | Impacto | Score | Nivel | Profundidad de prueba |', '|---|---|---|---|---|---|---|---|'];
  for (const r of rows) L.push(`| ${r.priority} | ${r.id} | ${r.area} | ${r.likelihood} | ${r.impact} | ${r.score} | ${r.level} | ${r.depth} |`);
  L.push('', '## Mapa de calor (probabilidad × impacto)', '', '| P\\I | 1 | 2 | 3 | 4 | 5 |', '|---|---|---|---|---|---|');
  for (let p = 5; p >= 1; p--) L.push(`| ${p} | ${[1, 2, 3, 4, 5].map((i) => rows.filter((r) => r.likelihood === p && r.impact === i).map((r) => r.id).join(', ') || '·').join(' | ')} |`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('risk-matrix', () => {
    const { values } = cli({ name: 'risk-matrix', usage: USAGE, options: { input: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    const rows = scoreRisks(readJson(requireFile(values.input, '--input')));
    writeOutput(values.out, values.json ? JSON.stringify(rows, null, 2) : toMarkdown(rows), { force: values.force });
    return EXIT.OK;
  });
}
