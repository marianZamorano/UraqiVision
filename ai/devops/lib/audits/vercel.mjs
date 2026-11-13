// Auditoría estática de configuración de Vercel (vercel.json / vercel.ts / .gitignore).
// Límites del plan leídos de config/free-tier-limits.json (fecha de verificación incluida).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { finding, readJson, readText } from '../common.mjs';
import { scanText } from '../secrets.mjs';
import { loadLimits } from '../free-tier.mjs';

// Claves de nivel superior documentadas en https://vercel.com/docs/project-configuration
export const KNOWN_KEYS = new Set([
  '$schema', 'buildCommand', 'bunVersion', 'cleanUrls', 'crons', 'devCommand', 'fluid', 'framework',
  'functions', 'functionFailoverRegions', 'git', 'github', 'headers', 'ignoreCommand', 'images',
  'installCommand', 'outputDirectory', 'public', 'redirects', 'regions', 'rewrites', 'trailingSlash',
  'services', 'routes', 'builds', 'env', 'build', 'version', 'name', 'alias', 'scope', 'cache',
]);
const LEGACY_KEYS = { builds: 'Legacy: usa detección de framework o "functions".', routes: 'Legacy: usa rewrites/redirects/headers.', version: 'Obsoleto.', name: 'Obsoleto: el nombre se define en el proyecto.', alias: 'Obsoleto: usa dominios del proyecto.', scope: 'Obsoleto: usa --scope en la CLI.' };
const ROUTES_INCOMPATIBLE = ['rewrites', 'redirects', 'headers', 'cleanUrls', 'trailingSlash'];

/** ¿La expresión cron se ejecuta más de una vez al día? (minuto y hora deben ser fijos). */
export function cronRunsMoreThanDaily(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour] = parts;
  const fixed = (f) => /^\d+$/.test(f);
  return !(fixed(min) && fixed(hour));
}

export function auditVercelConfig(root, { plan = 'hobby' } = {}) {
  const findings = [];
  const notes = [];
  const limits = loadLimits().providers?.vercel?.plans?.[plan] ?? {};
  const jsonPath = join(root, 'vercel.json');
  const tsPath = join(root, 'vercel.ts');

  if (existsSync(tsPath)) {
    notes.push('vercel.ts detectado: se evalúa en build. Valida con "vercel build" en local; esta auditoría solo revisa secretos en el archivo.');
    findings.push(...scanText(readText(tsPath), { file: 'vercel.ts' }));
  }
  if (existsSync(jsonPath) && existsSync(tsPath)) {
    findings.push(finding('high', 'vercel/dual-config', 'Existen vercel.json y vercel.ts; usa solo uno.', { file: 'vercel.json' }));
  }

  if (existsSync(jsonPath)) {
    const parsed = readJson(jsonPath);
    if (!parsed.ok) {
      findings.push(finding('critical', 'vercel/invalid-json', `vercel.json no es JSON válido (${parsed.error})`, { file: 'vercel.json' }));
    } else {
      const cfg = parsed.value;
      findings.push(...scanText(readText(jsonPath), { file: 'vercel.json' }));
      for (const key of Object.keys(cfg)) {
        if (!KNOWN_KEYS.has(key)) findings.push(finding('medium', 'vercel/unknown-key', `Clave desconocida "${key}" (posible error tipográfico).`, { file: 'vercel.json' }));
        if (LEGACY_KEYS[key]) findings.push(finding('medium', 'vercel/legacy-key', `"${key}": ${LEGACY_KEYS[key]}`, { file: 'vercel.json' }));
      }
      if (cfg.routes && ROUTES_INCOMPATIBLE.some((k) => k in cfg)) {
        findings.push(finding('high', 'vercel/routes-conflict', '"routes" no puede combinarse con rewrites/redirects/headers/cleanUrls/trailingSlash.', { file: 'vercel.json' }));
      }
      if (cfg.env || cfg.build?.env) {
        findings.push(finding('medium', 'vercel/inline-env', 'Variables definidas en vercel.json: muévelas a Project Settings > Environment Variables (por entorno).', { file: 'vercel.json' }));
      }
      if (!cfg.$schema) findings.push(finding('info', 'vercel/no-schema', 'Añade "$schema": "https://openapi.vercel.sh/vercel.json" para validación en el editor.', { file: 'vercel.json' }));

      for (const [i, c] of (cfg.crons ?? []).entries()) {
        if (!c?.path?.startsWith?.('/')) findings.push(finding('high', 'vercel/cron-path', `crons[${i}].path debe empezar por "/".`, { file: 'vercel.json' }));
        const more = cronRunsMoreThanDaily(c?.schedule);
        if (more === null) findings.push(finding('high', 'vercel/cron-syntax', `crons[${i}].schedule no tiene 5 campos.`, { file: 'vercel.json' }));
        else if (more && limits.cronMinInterval === 'daily') {
          findings.push(finding('critical', 'vercel/cron-hobby', `crons[${i}] ("${c.schedule}") se ejecuta más de una vez al día: en Hobby el despliegue FALLA.`, { file: 'vercel.json' }));
        }
      }
      if ((cfg.crons ?? []).length > (limits.cronJobsPerProject ?? Infinity)) {
        findings.push(finding('high', 'vercel/cron-count', `Más de ${limits.cronJobsPerProject} cron jobs.`, { file: 'vercel.json' }));
      }
      for (const [pattern, fn] of Object.entries(cfg.functions ?? {})) {
        if (fn?.maxDuration && limits.functionMaxDurationSeconds && fn.maxDuration > limits.functionMaxDurationSeconds) {
          findings.push(finding('high', 'vercel/max-duration', `functions["${pattern}"].maxDuration=${fn.maxDuration}s supera el máximo del plan ${plan} (${limits.functionMaxDurationSeconds}s).`, { file: 'vercel.json' }));
        }
        if (fn?.runtime === 'edge' || fn?.runtime?.startsWith?.('edge')) {
          findings.push(finding('low', 'vercel/edge-runtime', `functions["${pattern}"] usa Edge runtime (obsoleto); prefiere Node.js sobre Fluid Compute.`, { file: 'vercel.json' }));
        }
      }
      for (const [i, r] of (cfg.rewrites ?? []).entries()) {
        if (/^http:\/\//i.test(r?.destination ?? '')) findings.push(finding('medium', 'vercel/insecure-rewrite', `rewrites[${i}] apunta a HTTP sin TLS.`, { file: 'vercel.json' }));
      }
      const headerKeys = new Set((cfg.headers ?? []).flatMap((h) => (h.headers ?? []).map((x) => String(x.key).toLowerCase())));
      for (const h of ['x-content-type-options', 'referrer-policy', 'x-frame-options']) {
        if (!headerKeys.has(h) && !(h === 'x-frame-options' && headerKeys.has('content-security-policy'))) {
          findings.push(finding('low', 'vercel/security-header', `Cabecera de seguridad ausente: ${h}.`, { file: 'vercel.json' }));
        }
      }
    }
  } else if (!existsSync(tsPath)) {
    notes.push('Sin vercel.json ni vercel.ts: Vercel usará detección automática (zero-config). Es válido si el framework está soportado.');
  }

  const gitignore = readText(join(root, '.gitignore')) ?? '';
  if (!/^\/?\.vercel\/?$/m.test(gitignore)) {
    findings.push(finding('medium', 'vercel/gitignore', '.vercel/ no está en .gitignore (contiene IDs de proyecto y puede contener env descargadas).', { file: '.gitignore' }));
  }
  if (!/^\/?\.env\*?(\.local)?$/m.test(gitignore) && !/^\.env/m.test(gitignore)) {
    findings.push(finding('high', 'vercel/gitignore-env', '.env* no está ignorado en .gitignore.', { file: '.gitignore' }));
  }
  return { findings, notes };
}
