// Validación local de install/lint/typecheck/test/build. Ejecuta SOLO scripts declarados en
// package.json del proyecto objetivo y SOLO cuando se invoca explícitamente (dryRun lista el plan).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { finding, readJson } from './common.mjs';

const STEP_ORDER = [
  ['lint', ['lint']],
  ['typecheck', ['typecheck', 'type-check', 'check-types', 'tsc']],
  ['test', ['test', 'test:unit', 'test:ci']],
  ['build', ['build']],
];

const INSTALL = { npm: ['ci'], pnpm: ['install', '--frozen-lockfile'], yarn: ['install', '--immutable'], bun: ['install', '--frozen-lockfile'] };

export function planBuild(pkgDir, { packageManager = 'npm', install = false } = {}) {
  const pkg = readJson(join(pkgDir, 'package.json'));
  if (!pkg.ok) return { steps: [], error: `package.json no legible en ${pkgDir} (${pkg.error})` };
  const scripts = pkg.value.scripts ?? {};
  const steps = [];
  if (install) steps.push({ step: 'install', cmd: packageManager, args: INSTALL[packageManager] ?? ['install'] });
  for (const [step, candidates] of STEP_ORDER) {
    const name = candidates.find((c) => scripts[c]);
    if (!name) {
      steps.push({ step, skipped: true, reason: 'script no definido' });
      continue;
    }
    if (step === 'test' && /no test specified|exit 0\s*$/.test(scripts[name])) {
      steps.push({ step, script: name, placeholder: true, cmd: packageManager, args: ['run', name] });
      continue;
    }
    steps.push({ step, script: name, cmd: packageManager, args: ['run', name] });
  }
  return { steps };
}

export function runBuild(pkgDir, opts = {}) {
  const { dryRun = false, timeoutMs = 600_000 } = opts;
  const plan = planBuild(pkgDir, opts);
  const findings = [];
  if (plan.error) return { findings: [finding('high', 'build/no-package', plan.error)], results: [] };
  const results = [];
  for (const s of plan.steps) {
    if (s.skipped) {
      findings.push(finding(s.step === 'build' ? 'medium' : 'low', `build/missing-${s.step}`, `Sin script de ${s.step}.`));
      results.push({ ...s, status: 'skipped' });
      continue;
    }
    if (s.placeholder) findings.push(finding('medium', 'build/placeholder-test', `El script "${s.script}" no ejecuta pruebas reales.`));
    if (dryRun) {
      results.push({ ...s, status: 'planned' });
      continue;
    }
    const started = Date.now();
    const r = spawnSync(s.cmd, s.args, { cwd: pkgDir, encoding: 'utf8', timeout: timeoutMs, shell: process.platform === 'win32', env: { ...process.env, CI: '1' } });
    const ok = r.status === 0;
    const tail = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n');
    results.push({ step: s.step, script: s.script, status: ok ? 'passed' : 'failed', exitCode: r.status, durationMs: Date.now() - started, outputTail: tail });
    if (!ok) {
      findings.push(finding('high', `build/${s.step}-failed`, `"${s.cmd} ${s.args.join(' ')}" falló (exit ${r.status ?? 'timeout'}).`));
      if (s.step === 'install') break;
    }
  }
  return { findings, results };
}
