#!/usr/bin/env node
// Comprueba que la configuración de Claude Code del proyecto aplica los controles de
// supervisión humana (hooks, deny/ask, bypass desactivado) y autoprueba el motor de políticas.
import { parseArgs } from 'node:util';
import { emit, summarize, finding } from '../lib/common.mjs';
import { checkApprovalPolicy, selfTest } from '../lib/approval-policy.mjs';

const { values: a } = parseArgs({
  options: {
    settings: { type: 'string', default: '.claude/settings.json' },
    'self-test': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    'fail-on': { type: 'string', default: 'high' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});
if (a.help) {
  console.log('Uso: node check-approval-policy.mjs [--settings .claude/settings.json] [--self-test] [--json]');
  process.exit(0);
}
const findings = a['self-test']
  ? selfTest().map((f) => finding('critical', 'policy/selftest', `${f.kind} "${f.input}": esperado ${f.expected}, obtenido ${f.got}`))
  : checkApprovalPolicy(a.settings).findings;
const title = a['self-test'] ? 'Autoprueba del motor de políticas' : `Política de aprobación (${a.settings})`;
process.exit(emit(title, { findings, summary: summarize(findings) }, { json: a.json, out: a.out, failOn: a['fail-on'] }));
