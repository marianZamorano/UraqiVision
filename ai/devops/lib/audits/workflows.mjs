// Auditoría estática de GitHub Actions (heurística línea a línea, sin parser YAML).
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { finding, readText } from '../common.mjs';
import { scanText } from '../secrets.mjs';

const UNTRUSTED_CTX = /\$\{\{\s*(?:github\.event\.(?:issue|pull_request|comment|review|review_comment|discussion|head_commit|commits|pages)[\w.\[\]*]*\.(?:title|body|message|name|label|ref|head_ref|email|default_branch)|github\.head_ref)\s*\}\}/;

export function auditWorkflowText(text, file) {
  const findings = [];
  if (!text) return findings;
  const lines = text.split(/\r?\n/);
  const has = (re) => re.test(text);

  if (!/^permissions\s*:/m.test(text)) {
    findings.push(finding('medium', 'ci/no-top-permissions', 'Sin bloque "permissions" de nivel superior: el GITHUB_TOKEN puede tener permisos de escritura por defecto. Declara permisos mínimos (p. ej. contents: read).', { file }));
  }
  if (has(/permissions\s*:\s*write-all/)) findings.push(finding('high', 'ci/write-all', 'permissions: write-all concede permisos excesivos.', { file }));
  if (has(/^\s*pull_request_target\s*:/m) || has(/on\s*:\s*\[?[^\]\n]*pull_request_target/)) {
    const checkoutHead = has(/ref\s*:\s*\$\{\{\s*github\.event\.pull_request\.head\.(?:sha|ref)\s*\}\}/);
    findings.push(finding(checkoutHead ? 'critical' : 'high', 'ci/pull-request-target', checkoutHead
      ? 'pull_request_target + checkout del código del PR: ejecuta código no confiable con secretos (pwn request).'
      : 'pull_request_target expone secretos a eventos de forks; verifica que no se ejecute código del PR.', { file }));
  }
  let inRun = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    const uses = line.match(/^\s*-?\s*uses\s*:\s*['"]?([^'"\s#]+)/);
    if (uses) {
      const ref = uses[1];
      if (ref.startsWith('./') || ref.startsWith('docker://')) return;
      const [action, version = ''] = ref.split('@');
      if (!version) findings.push(finding('high', 'ci/unpinned-action', `${action} sin versión.`, { file, line: n }));
      else if (/^(?:main|master|latest|HEAD|dev|develop)$/i.test(version)) findings.push(finding('high', 'ci/branch-ref', `${ref} apunta a una rama mutable.`, { file, line: n }));
      else if (!/^[0-9a-f]{40}$/.test(version)) {
        const firstParty = /^(?:actions|github)\//.test(action);
        findings.push(finding(firstParty ? 'low' : 'medium', 'ci/tag-not-sha', `${ref}: fija la acción a un SHA completo (los tags son mutables).`, { file, line: n }));
      }
    }
    if (/^\s*-?\s*run\s*:/.test(line)) inRun = true;
    else if (/^\s*-?\s*(?:uses|with|name|if|env|id)\s*:/.test(line)) inRun = false;
    if (inRun && UNTRUSTED_CTX.test(line)) {
      findings.push(finding('high', 'ci/script-injection', 'Contexto controlado por el usuario interpolado en "run": pásalo por env y cítalo.', { file, line: n }));
    }
    if (/\b(?:echo|printf|cat)\b.*\$\{\{\s*secrets\./.test(line)) findings.push(finding('critical', 'ci/secret-echo', 'Se imprime un secreto en el log.', { file, line: n }));
    if (/--token[ =]\S*\$\{\{\s*secrets\./.test(line)) findings.push(finding('medium', 'ci/token-argv', 'Token en argumentos de línea de comandos: usa la variable de entorno VERCEL_TOKEN.', { file, line: n }));
    if (/\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/.test(line)) findings.push(finding('high', 'ci/curl-pipe-sh', 'Descarga y ejecución de script remoto sin verificación.', { file, line: n }));
    if (/continue-on-error\s*:\s*true/.test(line)) findings.push(finding('low', 'ci/continue-on-error', 'continue-on-error oculta fallos.', { file, line: n }));
    if (/\bvercel\b[^#\n]*\s--prod\b/.test(line) && !/^\s*environment\s*:/m.test(text)) {
      findings.push(finding('medium', 'ci/prod-without-environment', 'Despliegue a producción sin "environment:" (sin reglas de protección ni aprobadores).', { file, line: n }));
    }
  });
  if (/^\s*jobs\s*:/m.test(text) && !/timeout-minutes\s*:/.test(text)) {
    findings.push(finding('low', 'ci/no-timeout', 'Sin timeout-minutes: un job colgado consume minutos de la cuota gratuita.', { file }));
  }
  if (/^\s*-?\s*uses\s*:\s*actions\/checkout/m.test(text) && !/persist-credentials\s*:\s*false/.test(text)) {
    findings.push(finding('low', 'ci/persist-credentials', 'actions/checkout persiste el token en .git/config; usa persist-credentials: false si no haces push.', { file }));
  }
  if (!/concurrency\s*:/.test(text) && /\bvercel\b.*\bdeploy\b/.test(text)) {
    findings.push(finding('low', 'ci/no-concurrency', 'Despliegues sin "concurrency": dos ejecuciones pueden competir.', { file }));
  }
  findings.push(...scanText(text, { file }));
  return findings;
}

export function auditWorkflows(root) {
  const dir = join(root, '.github', 'workflows');
  const findings = [];
  const notes = [];
  if (!existsSync(dir)) {
    notes.push('No hay .github/workflows: el proyecto no tiene CI en GitHub Actions.');
    return { findings, notes };
  }
  const files = readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f));
  if (!files.length) notes.push('.github/workflows está vacío.');
  for (const f of files) findings.push(...auditWorkflowText(readText(join(dir, f)), `.github/workflows/${f}`));
  return { findings, notes, files: files.length };
}
