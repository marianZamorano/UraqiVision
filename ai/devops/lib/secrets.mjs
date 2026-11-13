// Detección de secretos por patrones + entropía. Nunca devuelve el valor detectado:
// solo tipo, línea y longitud. Comentario de excepción por línea: `devops-allow-secret`.
import { readText, rel, walkFiles, finding, toPosix } from './common.mjs';
import { basename } from 'node:path';

export const SECRET_PATTERNS = [
  { id: 'private-key', severity: 'critical', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/ },
  { id: 'aws-access-key-id', severity: 'critical', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'github-token', severity: 'critical', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/ },
  { id: 'gitlab-token', severity: 'critical', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'slack-token', severity: 'high', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'stripe-live-key', severity: 'critical', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/ },
  { id: 'google-api-key', severity: 'high', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'anthropic-api-key', severity: 'critical', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'openai-api-key', severity: 'critical', re: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: 'npm-token', severity: 'critical', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { id: 'jwt', severity: 'medium', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    id: 'connection-string-with-password',
    severity: 'critical',
    re: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqps?):\/\/[^\s:@/'"]+:([^\s@/'"]+)@[^\s'"]+/,
    group: 1,
  },
];

const ASSIGNMENT_RE =
  /\b([A-Za-z0-9_.-]*(?:secret|token|passw(?:or)?d|pwd|api[_-]?key|apikey|private[_-]?key|client[_-]?secret|access[_-]?key)[A-Za-z0-9_.-]*)\s*[:=]\s*["'`]?([^\s"'`,;]{12,})/i;

const PLACEHOLDER_RE =
  /^(?:<.*>|\$\{.*\}|\$\(.*\)|\{\{.*\}\}|%[A-Z_]+%|\$[A-Z_]+|x{4,}|\*{4,}|\.{3,})$|changeme|change[_-]?me|example|placeholder|your[_-]|dummy|sample|redacted|fake|test[_-]?(?:key|token|secret)|not[_-]?a[_-]?secret|secrets\.|process\.env|import\.meta\.env|env\(|getenv/i;

const ALLOW_MARKER = 'devops-allow-secret';

/** Entropía de Shannon en bits por carácter. */
export function entropy(s) {
  if (!s) return 0;
  const freq = new Map();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

// Expresiones de código (llamadas a funciones, referencias HCL/JS) no son literales secretos.
const EXPRESSION_RE = /^[A-Za-z_$][\w$]*\(|^(?:var|local|data|module|ephemeral|each|self|resource|config|settings|env|vars|inputs|steps|needs|github)\.[A-Za-z_]/;

export function isPlaceholder(value) {
  return PLACEHOLDER_RE.test(value) || EXPRESSION_RE.test(value);
}

/** Analiza un texto y devuelve hallazgos sin el valor del secreto. */
export function scanText(text, { file = null } = {}) {
  const results = [];
  if (!text) return results;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.includes(ALLOW_MARKER)) return;
    let matched = false;
    for (const p of SECRET_PATTERNS) {
      const m = line.match(p.re);
      if (!m) continue;
      const value = p.group ? m[p.group] : m[0];
      if (p.group && isPlaceholder(value)) continue;
      matched = true;
      results.push(
        finding(p.severity, `secret/${p.id}`, `Posible secreto (${p.id}), longitud ${value.length}`, {
          file,
          line: idx + 1,
        }),
      );
    }
    if (matched) return;
    const a = line.match(ASSIGNMENT_RE);
    if (a) {
      const value = a[2];
      if (!isPlaceholder(value) && entropy(value) >= 3.5 && /[0-9]/.test(value) && /[A-Za-z]/.test(value)) {
        results.push(
          finding('high', 'secret/generic-assignment', `Asignación sospechosa a "${a[1]}" (entropía alta), longitud ${value.length}`, {
            file,
            line: idx + 1,
          }),
        );
      }
    }
  });
  return results;
}

/** Archivos que nunca deberían versionarse aunque no contengan patrones conocidos. */
export function isSensitiveFilename(path) {
  const name = basename(toPosix(path)).toLowerCase();
  if (/^\.env(\..+)?$/.test(name)) return !/\.(example|sample|template|dist|defaults?)$/.test(name);
  return (
    /\.(pem|key|p12|pfx|jks|keystore|ppk)$/.test(name) ||
    /^id_(rsa|dsa|ecdsa|ed25519)$/.test(name) ||
    ['credentials.json', 'service-account.json', '.npmrc', '.pypirc', '.netrc', 'terraform.tfvars'].includes(name) ||
    /\.tfstate(\.backup)?$/.test(name)
  );
}

export function scanFiles(root, files) {
  const findings = [];
  for (const f of files) {
    const r = rel(root, f);
    if (isSensitiveFilename(r)) {
      findings.push(finding('high', 'secret/sensitive-file', 'Archivo sensible presente en el árbol (verifica que esté en .gitignore)', { file: r }));
    }
    findings.push(...scanText(readText(f), { file: r }));
  }
  return findings;
}

export function scanTree(root) {
  return scanFiles(root, walkFiles(root));
}
