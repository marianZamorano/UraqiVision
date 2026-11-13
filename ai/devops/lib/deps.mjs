// Auditoría de dependencias vulnerables con la herramienta nativa del gestor de paquetes.
// Requiere lockfile; consulta el registro público (lectura). No modifica dependencias.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { finding, hasCommand } from './common.mjs';

/** Normaliza la salida JSON de `npm audit --json` (v7+). */
export function parseNpmAudit(json) {
  const v = json?.metadata?.vulnerabilities ?? {};
  const findings = [];
  for (const [name, info] of Object.entries(json?.vulnerabilities ?? {})) {
    const sev = info.severity === 'moderate' ? 'medium' : info.severity;
    findings.push(finding(['critical', 'high', 'medium', 'low'].includes(sev) ? sev : 'info', 'deps/vulnerable', `${name} (${info.range ?? 'rango desconocido'})${info.fixAvailable ? ' — fix disponible' : ''}`));
  }
  return { findings, counts: { critical: v.critical ?? 0, high: v.high ?? 0, medium: v.moderate ?? 0, low: v.low ?? 0 } };
}

export function auditDependencies(dir, { production = false } = {}) {
  const notes = [];
  if (!existsSync(join(dir, 'package-lock.json'))) {
    if (existsSync(join(dir, 'pnpm-lock.yaml'))) notes.push('pnpm: ejecuta "pnpm audit --json" (no automatizado aquí).');
    else if (existsSync(join(dir, 'yarn.lock'))) notes.push('yarn: ejecuta "yarn npm audit --json" (yarn berry) o "yarn audit --json".');
    return { findings: [finding('medium', 'deps/no-lockfile', 'Sin package-lock.json: no se puede auditar de forma reproducible.')], notes };
  }
  if (!hasCommand('npm')) return { findings: [finding('medium', 'deps/no-npm', 'npm no está disponible.')], notes };
  const args = ['audit', '--json', ...(production ? ['--omit=dev'] : [])];
  const r = spawnSync('npm', args, { cwd: dir, encoding: 'utf8', shell: process.platform === 'win32', timeout: 120_000 });
  try {
    return { ...parseNpmAudit(JSON.parse(r.stdout)), notes };
  } catch {
    return { findings: [finding('medium', 'deps/audit-failed', `npm audit no devolvió JSON (exit ${r.status}); ¿sin red?`)], notes };
  }
}
