#!/usr/bin/env node
// Compara consumo (archivo JSON aportado por ti o exportado del dashboard) con los límites
// gratuitos documentados en config/free-tier-limits.json. --show lista los límites.
import { parseArgs } from 'node:util';
import { emit, readJson, summarize } from '../lib/common.mjs';
import { checkUsage, loadLimits, staleness } from '../lib/free-tier.mjs';

const { values: a } = parseArgs({
  options: {
    usage: { type: 'string' },
    show: { type: 'string' },
    'warn-at': { type: 'string', default: '0.8' },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    'fail-on': { type: 'string', default: 'critical' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});
const limits = loadLimits();
if (a.help || (!a.usage && !a.show)) {
  console.log('Uso: node free-tier-check.mjs --show vercel|neon|supabase|github-actions|all');
  console.log('     node free-tier-check.mjs --usage consumo.json [--warn-at 0.8]');
  console.log('Formato de consumo: {"provider":"vercel","plan":"hobby","monthly":{"functionInvocations":120000}}');
  process.exit(a.help ? 0 : 2);
}
if (a.show) {
  const st = staleness(limits);
  const known = a.show === 'all' || a.show in limits.providers;
  if (!known) {
    console.error(`Proveedor sin datos verificados: ${a.show}. Disponibles: ${Object.keys(limits.providers).join(', ')}`);
    process.exit(2);
  }
  const sel = a.show === 'all' ? limits.providers : { [a.show]: limits.providers[a.show] };
  console.log(JSON.stringify({ verifiedAt: limits.verifiedAt, daysSinceVerification: st.days, stale: st.stale, providers: sel }, null, 2));
  process.exit(0);
}
const u = readJson(a.usage);
if (!u.ok) {
  console.error(`Error: no se pudo leer ${a.usage} (${u.error}).`);
  process.exit(2);
}
const r = checkUsage(u.value, limits, { warnAt: Number(a['warn-at']) });
process.exit(emit('Consumo frente a plan gratuito', { ...r, summary: summarize(r.findings) }, { json: a.json, out: a.out, failOn: a['fail-on'] }));
