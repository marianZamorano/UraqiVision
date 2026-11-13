#!/usr/bin/env node
// Inventario de tecnologías del proyecto objetivo + compatibilidad preliminar con Vercel.
import { parseArgs } from 'node:util';
import { COMMON_OPTIONS, emit, ensureDir, summarize } from '../lib/common.mjs';
import { detectStack, vercelCompatibility } from '../lib/stack.mjs';

const { values: a } = parseArgs({ options: COMMON_OPTIONS });
if (a.help) {
  console.log('Uso: node detect-stack.mjs [--root DIR] [--json] [--out inventario.json]');
  process.exit(0);
}
const stack = detectStack(ensureDir(a.root));
const compat = vercelCompatibility(stack);
const report = { stack, components: compat.components, findings: compat.findings, summary: summarize(compat.findings) };
if (!a.json && !a.out) {
  for (const p of stack.packages) {
    console.log(`- ${p.path} (${p.name ?? 'sin nombre'}) pm=${p.packageManager ?? '?'} frameworks=${p.frameworks.map((f) => `${f.name}@${f.version}`).join(', ') || 'ninguno'} entry=${p.entrypoint ?? '-'}`);
  }
  console.log(`docker=${stack.docker} ci=${JSON.stringify(stack.ci)} iac=${JSON.stringify(stack.iac)} vercel=${JSON.stringify(stack.vercel)}`);
  for (const c of compat.components) console.log(`  componente: ${c.package} ${c.framework} -> ${c.strategy}`);
}
process.exit(emit('Detección de stack', report, { json: a.json, out: a.out, failOn: a['fail-on'] }));
