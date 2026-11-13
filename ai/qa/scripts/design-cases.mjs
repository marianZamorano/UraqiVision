#!/usr/bin/env node
// Generador de casos de prueba por técnicas de caja negra: particiones de equivalencia (EP),
// análisis de valores límite (BVA), tabla de decisión y combinatoria por pares (pairwise).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, readJson, requireFile, writeOutput } from './lib/cli.mjs';

const USAGE = `Uso: node design-cases.mjs --spec <spec.json> [--json] [--out archivo]

spec.json:
{
  "feature": "Alta de recurso",
  "fields": [
    { "name": "capacity", "type": "integer", "min": 1, "max": 500, "required": false },
    { "name": "name", "type": "string", "minLength": 3, "maxLength": 80, "required": true },
    { "name": "email", "type": "email", "required": true },
    { "name": "status", "type": "enum", "values": ["ACTIVE", "INACTIVE"] },
    { "name": "active", "type": "boolean" }
  ],
  "rules": [                     // opcional: tabla de decisión
    { "conditions": { "authenticated": true, "role": "admin" }, "outcome": "201" },
    { "conditions": { "authenticated": false }, "outcome": "401" }
  ],
  "pairwise": true               // opcional: combinaciones por pares de valores válidos representativos
}
Salida: 0 OK, 2 spec inválida.`;

const TYPES = new Set(['integer', 'number', 'string', 'email', 'enum', 'boolean', 'date', 'uuid']);

export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') return ['La spec debe ser un objeto'];
  if (!Array.isArray(spec.fields) || !spec.fields.length) errors.push('"fields" debe ser un array no vacío');
  (spec.fields ?? []).forEach((f, i) => {
    if (!f?.name) errors.push(`fields[${i}].name es obligatorio`);
    if (!TYPES.has(f?.type)) errors.push(`fields[${i}].type inválido (${f?.type}); usar ${[...TYPES].join(', ')}`);
    if ((f?.type === 'integer' || f?.type === 'number') && f.min !== undefined && f.max !== undefined && f.min > f.max) errors.push(`fields[${i}]: min > max`);
    if (f?.type === 'string' && f.minLength !== undefined && f.maxLength !== undefined && f.minLength > f.maxLength) errors.push(`fields[${i}]: minLength > maxLength`);
    if (f?.type === 'enum' && (!Array.isArray(f.values) || !f.values.length)) errors.push(`fields[${i}].values es obligatorio para enum`);
  });
  return errors;
}

const str = (n, ch = 'a') => ch.repeat(Math.max(0, n));

/** Casos EP + BVA por campo. Cada caso: { field, technique, value, valid, rationale } */
export function fieldCases(f) {
  const cases = [];
  const add = (technique, value, valid, rationale) => cases.push({ field: f.name, technique, value, valid, rationale });
  if (f.required) add('EP', undefined, false, 'Campo obligatorio ausente');
  else add('EP', undefined, true, 'Campo opcional ausente');
  add('EP', null, Boolean(f.nullable), f.nullable ? 'null permitido' : 'null no permitido');

  if (f.type === 'integer' || f.type === 'number') {
    const step = f.type === 'integer' ? 1 : f.step ?? 0.01;
    if (f.min !== undefined) {
      add('BVA', f.min - step, false, 'Justo por debajo del mínimo');
      add('BVA', f.min, true, 'Mínimo');
      add('BVA', Number((f.min + step).toFixed(6)), true, 'Justo por encima del mínimo');
    }
    if (f.max !== undefined) {
      add('BVA', Number((f.max - step).toFixed(6)), true, 'Justo por debajo del máximo');
      add('BVA', f.max, true, 'Máximo');
      add('BVA', f.max + step, false, 'Justo por encima del máximo');
    }
    if (f.min !== undefined && f.max !== undefined) add('EP', f.type === 'integer' ? Math.floor((f.min + f.max) / 2) : (f.min + f.max) / 2, true, 'Valor nominal de la partición válida');
    if (f.type === 'integer') add('EP', (f.min ?? 0) + 0.5, false, 'Decimal en campo entero');
    add('EP', 'abc', false, 'Tipo incorrecto (texto)');
  } else if (f.type === 'string') {
    const min = f.minLength ?? 0;
    const max = f.maxLength;
    if (min > 0) {
      add('BVA', str(min - 1), false, 'Longitud mínima - 1');
      add('BVA', str(min), true, 'Longitud mínima');
    } else add('BVA', '', true, 'Cadena vacía (minLength 0)');
    if (max !== undefined) {
      add('BVA', str(max), true, 'Longitud máxima');
      add('BVA', str(max + 1), false, 'Longitud máxima + 1');
    }
    add('EP', '   ', min === 0, 'Solo espacios (verificar trim)');
    add('EP', 'Ñandú – ✓ 漢字', true, 'Unicode / caracteres especiales');
    add('EP', 123, false, 'Tipo incorrecto (número)');
  } else if (f.type === 'email') {
    add('EP', 'usuario@example.com', true, 'Email válido');
    add('EP', 'usuario@', false, 'Sin dominio');
    add('EP', 'usuario.example.com', false, 'Sin @');
    add('EP', 'USUARIO@EXAMPLE.COM', true, 'Mayúsculas (verificar normalización)');
    add('EP', ` usuario@example.com `, false, 'Espacios alrededor (verificar trim/rechazo)');
  } else if (f.type === 'enum') {
    f.values.forEach((v) => add('EP', v, true, 'Valor permitido'));
    add('EP', `${f.values[0]}`.toLowerCase() === `${f.values[0]}` ? `${f.values[0]}`.toUpperCase() : `${f.values[0]}`.toLowerCase(), false, 'Cambio de mayúsculas (sensibilidad)');
    add('EP', '__INVALID__', false, 'Valor fuera del dominio');
  } else if (f.type === 'boolean') {
    add('EP', true, true, 'true');
    add('EP', false, true, 'false');
    add('EP', 'true', false, 'Booleano como texto');
  } else if (f.type === 'date') {
    add('EP', '2024-02-29', true, 'Año bisiesto');
    add('EP', '2023-02-29', false, 'Fecha imposible');
    add('EP', '2024-13-01', false, 'Mes fuera de rango');
  } else if (f.type === 'uuid') {
    add('EP', '123e4567-e89b-42d3-a456-426614174000', true, 'UUID v4 válido');
    add('EP', 'not-a-uuid', false, 'Formato inválido');
  }
  return cases;
}

/** Valor válido representativo de un campo (para combinar con un único campo inválido). */
export function nominal(f) {
  return fieldCases(f).find((c) => c.valid && c.value !== undefined && c.value !== null && c.technique === 'EP')?.value
    ?? fieldCases(f).find((c) => c.valid && c.value !== undefined && c.value !== null)?.value;
}

/** Pairwise greedy sobre los valores válidos de cada campo (máx. 3 por campo). */
export function pairwise(fields) {
  const domains = fields.map((f) => [...new Set(fieldCases(f).filter((c) => c.valid && c.value !== undefined && c.value !== null).map((c) => JSON.stringify(c.value)))].slice(0, 3).map((s) => JSON.parse(s)));
  const uncovered = new Set();
  for (let i = 0; i < fields.length; i++) for (let j = i + 1; j < fields.length; j++) for (let a = 0; a < domains[i].length; a++) for (let b = 0; b < domains[j].length; b++) uncovered.add(`${i}:${a}|${j}:${b}`);
  const rows = [];
  let guard = 0;
  while (uncovered.size && guard++ < 1000) {
    const row = domains.map(() => 0);
    const first = [...uncovered][0].split('|').map((p) => p.split(':').map(Number));
    row[first[0][0]] = first[0][1];
    row[first[1][0]] = first[1][1];
    for (let k = 0; k < fields.length; k++) {
      if (k === first[0][0] || k === first[1][0]) continue;
      let best = 0;
      let bestScore = -1;
      for (let v = 0; v < domains[k].length; v++) {
        let score = 0;
        for (let o = 0; o < fields.length; o++) {
          if (o === k) continue;
          const key = o < k ? `${o}:${row[o]}|${k}:${v}` : `${k}:${v}|${o}:${row[o]}`;
          if (uncovered.has(key)) score++;
        }
        if (score > bestScore) [best, bestScore] = [v, score];
      }
      row[k] = best;
    }
    for (let i = 0; i < fields.length; i++) for (let j = i + 1; j < fields.length; j++) uncovered.delete(`${i}:${row[i]}|${j}:${row[j]}`);
    rows.push(Object.fromEntries(fields.map((f, k) => [f.name, domains[k][row[k]]])));
  }
  return rows;
}

export function designCases(spec) {
  const errors = validateSpec(spec);
  if (errors.length) throw new UsageError(`Spec inválida: ${errors.join('; ')}`);
  const base = Object.fromEntries(spec.fields.map((f) => [f.name, nominal(f)]));
  const cases = [];
  let n = 0;
  cases.push({ id: `TC-${String(++n).padStart(3, '0')}`, technique: 'EP', title: 'Todos los campos con valores válidos nominales', input: base, expected: 'valid' });
  for (const f of spec.fields) {
    for (const c of fieldCases(f)) {
      const input = { ...base };
      if (c.value === undefined) delete input[f.name];
      else input[f.name] = c.value;
      cases.push({ id: `TC-${String(++n).padStart(3, '0')}`, technique: c.technique, title: `${f.name}: ${c.rationale}`, input, expected: c.valid ? 'valid' : 'invalid' });
    }
  }
  for (const r of spec.rules ?? []) {
    cases.push({ id: `TC-${String(++n).padStart(3, '0')}`, technique: 'DecisionTable', title: `Regla: ${Object.entries(r.conditions).map(([k, v]) => `${k}=${v}`).join(', ')}`, input: { ...base, ...r.conditions }, expected: r.outcome });
  }
  if (spec.pairwise) for (const row of pairwise(spec.fields)) cases.push({ id: `TC-${String(++n).padStart(3, '0')}`, technique: 'Pairwise', title: 'Combinación por pares', input: row, expected: 'valid' });
  return { feature: spec.feature ?? '', total: cases.length, cases };
}

function toMarkdown(r) {
  const L = [`# Casos de prueba: ${r.feature}`, '', `Total: ${r.total}`, '', '| ID | Técnica | Título | Entrada | Esperado |', '|---|---|---|---|---|'];
  for (const c of r.cases) L.push(`| ${c.id} | ${c.technique} | ${c.title.replace(/\|/g, '\\|')} | \`${JSON.stringify(c.input).replace(/\|/g, '\\|').slice(0, 160)}\` | ${c.expected} |`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('design-cases', () => {
    const { values } = cli({ name: 'design-cases', usage: USAGE, options: { spec: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    const result = designCases(readJson(requireFile(values.spec, '--spec')));
    writeOutput(values.out, values.json ? JSON.stringify(result, null, 2) : toMarkdown(result), { force: values.force });
    return EXIT.OK;
  });
}
