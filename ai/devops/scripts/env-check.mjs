#!/usr/bin/env node
// Verifica variables de entorno requeridas SIN imprimir valores (solo presente/ausente).
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { COMMON_OPTIONS, emit, summarize } from '../lib/common.mjs';
import { checkEnv } from '../lib/env.mjs';

const { values: a } = parseArgs({ options: { ...COMMON_OPTIONS, example: { type: 'string' }, 'env-file': { type: 'string' }, require: { type: 'string' } } });
if (a.help || (!a.example && !a.require)) {
  console.log('Uso: node env-check.mjs (--example .env.example | --require A,B) [--env-file .vercel/.env.preview.local] [--json]');
  console.log('Nunca muestra valores. Con --env-file solo comprueba que la clave exista y no esté vacía.');
  process.exit(a.help ? 0 : 2);
}
const r = checkEnv({
  required: a.require ? a.require.split(',').map((s) => s.trim()).filter(Boolean) : [],
  exampleFile: a.example ? resolve(a.root, a.example) : null,
  envFile: a['env-file'] ? resolve(a.root, a['env-file']) : null,
});
if (!a.json) for (const s of r.status) console.log(`  ${s.present ? 'OK     ' : 'FALTA  '} ${s.key}${s.source ? ` (${s.source})` : ''}`);
process.exit(emit('Variables de entorno', { ...r, summary: summarize(r.findings) }, { json: a.json, out: a.out, failOn: a['fail-on'] }));
