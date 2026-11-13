// Agregador de readiness de despliegue. Distingue tres niveles de evidencia:
//   CONFIG_PREPARED  -> configuración estática sin bloqueos
//   BUILD_VERIFIED   -> además, build/lint/test locales ejecutados con éxito
//   DEPLOYED_VERIFIED-> además, smoke tests contra la URL real del despliegue (lo aporta smoke-test)
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { summarize, failsAt } from './common.mjs';
import { detectStack, vercelCompatibility } from './stack.mjs';
import { auditVercelConfig } from './audits/vercel.mjs';
import { auditWorkflows } from './audits/workflows.mjs';
import { auditContainers } from './audits/dockerfile.mjs';
import { auditIac } from './audits/iac.mjs';
import { scanTree } from './secrets.mjs';
import { gitState, gitReadinessFindings } from './git.mjs';
import { checkEnv } from './env.mjs';
import { runBuild } from './build.mjs';

const tag = (section, list) => list.map((f) => ({ section, ...f }));

export function readiness(root, { appDir = '.', plan = 'hobby', withBuild = false, envFile = null } = {}) {
  root = resolve(root);
  const app = resolve(root, appDir);
  const stack = detectStack(app);
  const compat = vercelCompatibility(stack);
  const sections = {
    compatibility: compat.findings,
    vercel: auditVercelConfig(app, { plan }).findings,
    ci: auditWorkflows(root).findings,
    containers: auditContainers(app).findings,
    iac: auditIac(app).findings,
    secrets: scanTree(app),
    git: gitReadinessFindings(gitState(root)),
  };
  const example = ['.env.example', '.env.sample', '.env.template'].map((f) => join(app, f)).find(existsSync);
  sections.env = example ? checkEnv({ exampleFile: example, envFile }).findings : [];
  let build = null;
  if (withBuild) {
    const pm = stack.packages.find((p) => p.path === '.')?.packageManager ?? 'npm';
    build = runBuild(app, { packageManager: pm });
    sections.build = build.findings;
  }
  const findings = Object.entries(sections).flatMap(([k, v]) => tag(k, v));
  const blocked = failsAt(findings, 'high');
  let level = blocked ? 'NOT_READY' : 'CONFIG_PREPARED';
  if (!blocked && build && build.results.every((r) => r.status !== 'failed') && build.results.some((r) => r.status === 'passed')) level = 'BUILD_VERIFIED';
  return {
    level,
    note: 'DEPLOYED_VERIFIED solo se alcanza con smoke-test.mjs contra la URL real del despliegue.',
    components: compat.components,
    summary: summarize(findings),
    findings,
    build: build?.results ?? null,
  };
}
