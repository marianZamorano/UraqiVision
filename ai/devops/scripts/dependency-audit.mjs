#!/usr/bin/env node
// Dependencias vulnerables vía npm audit (lectura del registro). No aplica "audit fix".
import { parseArgs } from 'node:util';
import { COMMON_OPTIONS, emit, ensureDir, summarize } from '../lib/common.mjs';
import { auditDependencies } from '../lib/deps.mjs';

const { values: a } = parseArgs({ options: { ...COMMON_OPTIONS, production: { type: 'boolean', default: false } } });
if (a.help) {
  console.log('Uso: node dependency-audit.mjs [--root DIR] [--production] [--json] [--out informe.md] [--fail-on high]');
  process.exit(0);
}
const r = auditDependencies(ensureDir(a.root), { production: a.production });
process.exit(emit('Auditoría de dependencias', { ...r, summary: summarize(r.findings) }, { json: a.json, out: a.out, failOn: a['fail-on'] }));
