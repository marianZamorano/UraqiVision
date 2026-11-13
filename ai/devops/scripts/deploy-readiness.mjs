#!/usr/bin/env node
// Informe agregado de readiness: compatibilidad, Vercel, CI, contenedores, IaC, secretos, Git, env
// y (opcional) build. Nivel: NOT_READY | CONFIG_PREPARED | BUILD_VERIFIED.
import { parseArgs } from 'node:util';
import { COMMON_OPTIONS, emit, ensureDir } from '../lib/common.mjs';
import { readiness } from '../lib/readiness.mjs';

const { values: a } = parseArgs({
  options: {
    ...COMMON_OPTIONS,
    'app-dir': { type: 'string', default: '.' },
    plan: { type: 'string', default: 'hobby' },
    'with-build': { type: 'boolean', default: false },
    'env-file': { type: 'string' },
  },
});
if (a.help) {
  console.log('Uso: node deploy-readiness.mjs [--root REPO] [--app-dir apps/web] [--with-build] [--env-file F] [--out DevOps/reports/readiness.md] [--json]');
  process.exit(0);
}
const r = readiness(ensureDir(a.root), { appDir: a['app-dir'], plan: a.plan, withBuild: a['with-build'], envFile: a['env-file'] });
if (!a.json) console.log(`Nivel de readiness: ${r.level}\n${r.note}`);
process.exit(emit(`Readiness de despliegue — ${r.level}`, r, { json: a.json, out: a.out, failOn: a['fail-on'] }));
