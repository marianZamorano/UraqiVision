// Detección y redacción de secretos. Funciones puras, sin E/S.
// Los patrones priorizan alta confianza para minimizar falsos positivos.

export const SECRET_RULES = [
  { id: 'private-key', severity: 'critical', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g },
  { id: 'aws-access-key-id', severity: 'critical', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: 'github-token', severity: 'critical', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
  { id: 'github-fine-grained-pat', severity: 'critical', re: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/g },
  { id: 'gitlab-token', severity: 'critical', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
  { id: 'slack-token', severity: 'critical', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: 'stripe-live-key', severity: 'critical', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g },
  { id: 'google-api-key', severity: 'high', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'anthropic-api-key', severity: 'critical', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { id: 'openai-api-key', severity: 'critical', re: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}\b/g },
  { id: 'postman-api-key', severity: 'critical', re: /\bPMAK-[0-9a-f]{24}-[0-9a-f]{34}\b/g },
  { id: 'npm-token', severity: 'critical', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { id: 'jwt', severity: 'high', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { id: 'url-with-credentials', severity: 'high', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"]+:([^\s@/'"]{3,})@[^\s'"]+/gi, group: 1 },
  {
    id: 'generic-assignment',
    severity: 'medium',
    re: /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?([^\s"'`,;]{8,})/gi,
    group: 1,
    requireComplexity: true,
  },
];

// Para la regla genérica: el valor debe parecer un secreto (≥ 2 clases de caracteres) y no un identificador.
function looksLikeSecretValue(v) {
  if (/^[a-z]+([_.:-][a-z]+)*$/i.test(v)) return false;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(v)).length;
  return classes >= 2;
}

// Valores que son claramente marcadores de ejemplo y no secretos reales.
const PLACEHOLDER = /^(?:x+|\*+|\.+|<[^>]*>|\$\{[^}]*\}|\{\{[^}]*\}\}|\{env:[^}]*\}|changeme|change_me|example|sample|dummy|placeholder|your[_-].*|redacted|password|secret|test|todo|null|undefined|none)$/i;
const LOOKS_PLACEHOLDER = /(?:x{6,}|example|placeholder|dummy|changeme|redacted|\$\{|process\.env|import\.meta\.env|\{env:)/i;

function isPlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDER.test(value) || LOOKS_PLACEHOLDER.test(value);
}

export function maskValue(value) {
  const s = String(value);
  if (s.length <= 8) return '[REDACTED]';
  return `${s.slice(0, 4)}…[REDACTED:${s.length}]`;
}

/**
 * Busca secretos en un texto.
 * @returns {{rule:string, severity:string, line:number, preview:string}[]}
 */
export function scanText(text, { minSeverity = 'medium' } = {}) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const order = { medium: 1, high: 2, critical: 3 };
  const min = order[minSeverity] ?? 1;
  const findings = [];
  for (const rule of SECRET_RULES) {
    if (order[rule.severity] < min) continue;
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      const value = rule.group ? m[rule.group] : m[0];
      if (rule.group && isPlaceholder(value)) continue;
      if (rule.requireComplexity && !looksLikeSecretValue(value)) continue;
      if (!rule.group && LOOKS_PLACEHOLDER.test(m[0])) continue;
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ rule: rule.id, severity: rule.severity, line, preview: maskValue(value) });
      if (m[0].length === 0) rule.re.lastIndex++;
    }
  }
  return findings;
}

/** Sustituye los secretos detectados por marcadores de redacción. */
export function redact(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const rule of SECRET_RULES) {
    rule.re.lastIndex = 0;
    out = out.replace(rule.re, (match, ...groups) => {
      if (rule.group) {
        const value = groups[rule.group - 1];
        if (isPlaceholder(value)) return match;
        if (rule.requireComplexity && !looksLikeSecretValue(value)) return match;
        return match.replace(value, '[REDACTED]');
      }
      if (LOOKS_PLACEHOLDER.test(match)) return match;
      return `[REDACTED:${rule.id}]`;
    });
  }
  return out;
}

/** Redacta recursivamente cadenas dentro de objetos/arrays (para logs y respuestas MCP). */
export function redactDeep(value, depth = 0) {
  if (depth > 20) return '[TRUNCATED]';
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/^(?:password|passwd|secret|token|api[_-]?key|authorization|cookie|set-cookie)$/i.test(k) && typeof v === 'string') {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactDeep(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}
