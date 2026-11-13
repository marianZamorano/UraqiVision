// Reglas de las guardas de UraqiVision, compartidas por Claude Code, Gemini CLI, Codex CLI y opencode.
// Funciones puras: reciben eventos normalizados y devuelven { decision: 'deny' | null, rule, reason }.
// Solo endurecen: nunca aprueban nada. Las aprobaciones ("ask") las dan los permisos nativos de cada
// plataforma (.claude/settings.json, opencode.json, aprobaciones de Codex y Gemini).
import path from 'node:path';

const NONE = Object.freeze({ decision: null, rule: null, reason: null });
const deny = (rule, reason) => ({ decision: 'deny', rule, reason: `[uraqi-guard:${rule}] ${reason}` });

// ------------------------------------------------------------------ Secretos

// Solo patrones de alta confianza, para no bloquear código legítimo.
export const SECRET_PATTERNS = [
  { id: 'anthropic-key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: 'openai-key', re: /\bsk-(?!ant-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'github-token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/ },
  { id: 'aws-access-key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  // Los tokens de Earthdata Login son JWT.
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}/ },
  { id: 'netrc-password', re: /\bmachine\s+\S+\s+login\s+\S+\s+password\s+\S+/i },
];

export function findSecrets(text) {
  const s = String(text ?? '');
  return SECRET_PATTERNS.filter((p) => p.re.test(s)).map((p) => p.id);
}

// ------------------------------------------------------------------ Rutas

const ENV_TEMPLATE = /^\.env\.(example|sample|template)$/i;

/** Archivos cuyo contenido no debe llegar al modelo ni modificarse desde un agente. */
export function isSecretPath(p) {
  const base = path.basename(String(p ?? '').replace(/\\/g, '/'));
  if (!base) return false;
  if (/^\.env(\..+)?$/i.test(base) && !ENV_TEMPLATE.test(base)) return true;
  if (/^[._]netrc$/i.test(base)) return true; // credenciales de Earthdata (earthaccess, asf_search)
  if (/^id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i.test(base) && !base.endsWith('.pub')) return true;
  if (/\.(pem|key|p12|pfx)$/i.test(base)) return true;
  return false;
}

/** Rutas que un agente no escribe: secretos, internos de git y el documento maestro (fuente de verdad). */
export function protectedWriteReason(p, cwd = process.cwd()) {
  const raw = String(p ?? '');
  if (!raw) return null;
  if (isSecretPath(raw)) return 'archivo con secretos';
  const rel = path.relative(cwd, path.resolve(cwd, raw)).replace(/\\/g, '/');
  if (rel === '.git' || rel.startsWith('.git/')) return 'interno de git';
  if (/^docs\/UraqiVisionDocumentoMaestro[^/]*\.pdf$/i.test(rel)) {
    return 'documento maestro (fuente de verdad: se cambia publicando una versión nueva, no desde un agente)';
  }
  return null;
}

// ------------------------------------------------------------------ Comandos

const ROOTISH = String.raw`(?:\/|~\/?|\*|\.\.?\/?|\$HOME\/?|\$env:USERPROFILE|[A-Za-z]:[\\/]?|\\)`;
const SECRET_FILE_IN_CMD = String.raw`(?:^|[\s/\\'"=])(?:\.env(?!\.(?:example|sample|template)\b)(?:\.[\w-]+)?|[._]netrc|id_rsa|id_ed25519|[\w.-]+\.pem|[\w.-]+\.key)(?=$|[\s'";|&)])`;

export const SHELL_DENY = [
  { id: 'git-force-push', re: /\bgit\s+push\b[^;&|\n]*(?:\s-f\b|\s--force\b|\s--force-with-lease\b|\s\+[\w/.-]+)/i, why: 'Push forzado: reescribe el historial compartido' },
  { id: 'git-destructive', re: /\bgit\s+(?:reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s+\.|restore\s+(?:--source\s+\S+\s+)?\.(?:\s|$)|filter-branch|filter-repo|reflog\s+expire|gc\s+--prune=now)/i, why: 'Descarta trabajo sin confirmar o reescribe el historial' },
  { id: 'git-no-verify', re: /\bgit\s+(?:commit|push|merge)\b[^;&|\n]*--no-verify\b/i, why: 'Salta los hooks de git (escaneo de secretos)' },
  { id: 'rm-root', re: new RegExp(String.raw`\brm\s+(?:-[a-zA-Z]*\s+)*-[a-zA-Z]*(?:rf|fr)[a-zA-Z]*\s+(?:--\s+)?${ROOTISH}(?:\s|$|;|&|\|)`, 'i'), why: 'Borrado recursivo de la raíz, del home o con comodín' },
  { id: 'remove-item-root', re: new RegExp(String.raw`Remove-Item\b[^;|&\n]*-Recurse[^;|&\n]*\s${ROOTISH}(?:\s|$)`, 'i'), why: 'Borrado recursivo de la raíz o del home' },
  { id: 'remote-code-exec', re: /\b(?:curl|wget|iwr|Invoke-WebRequest|irm|Invoke-RestMethod)\b[^\n;]*\|\s*(?:sudo\s+)?(?:sh|bash|zsh|python3?|node|pwsh|powershell|iex|Invoke-Expression)\b|\biex\s*\(\s*(?:iwr|irm|New-Object\s+Net\.WebClient)/i, why: 'Descarga y ejecuta código remoto' },
  { id: 'secret-file-read', re: new RegExp(String.raw`\b(?:cat|type|more|less|head|tail|Get-Content|gc|bat|xxd|strings|base64|cp|copy|scp|Copy-Item)\b[^;&|\n]*${SECRET_FILE_IN_CMD}`, 'i'), why: 'Lee o copia un archivo con secretos (.env, .netrc, claves)' },
  { id: 'env-exfiltration', re: /\b(?:env|printenv|Get-ChildItem\s+env:|gci\s+env:)\b[^;&\n]*\|\s*[^;&\n]*\b(?:curl|wget|nc|iwr|Invoke-WebRequest|irm|Invoke-RestMethod)\b/i, why: 'Envía variables de entorno a la red' },
  { id: 'publish-package', re: /\b(?:npm|yarn|pnpm)\s+publish\b|\btwine\s+upload\b|\bgh\s+release\s+create\b/i, why: 'Publicación de paquetes o releases (fuera del alcance de un agente)' },
  { id: 'disable-guards', re: /--dangerously-skip-permissions|disableAllHooks|bypassPermissions|core\.hooksPath\s+(?:\/dev\/null|""|'')/i, why: 'Intento de desactivar los permisos o las guardas' },
];

export function evaluateShell(command) {
  const cmd = Array.isArray(command) ? command.join(' ') : String(command ?? '');
  if (!cmd.trim()) return NONE;
  const secrets = findSecrets(cmd);
  if (secrets.length) return deny('secret-in-command', `El comando contiene un posible secreto (${secrets.join(', ')}). Usa variables de entorno; nunca pongas secretos en comandos.`);
  for (const r of SHELL_DENY) {
    if (r.re.test(cmd)) return deny(r.id, `${r.why}. Bloqueado por las guardas de UraqiVision (AGENTS.md §3 y §6).`);
  }
  return NONE;
}

// ------------------------------------------------------------------ Escritura y lectura

export function evaluateWrite(filePath, content, cwd) {
  const reason = protectedWriteReason(filePath, cwd);
  if (reason) return deny('protected-path', `No se escribe en ${filePath}: ${reason}. Usa .env.example para documentar variables.`);
  const secrets = findSecrets(content);
  if (secrets.length) return deny('secret-in-content', `El contenido a escribir en ${filePath} contiene un posible secreto (${secrets.join(', ')}). Usa una referencia a variable de entorno (RNF-06).`);
  return NONE;
}

export function evaluateRead(filePath) {
  if (isSecretPath(filePath)) return deny('secret-file-read', `Lectura de ${path.basename(String(filePath))} bloqueada: su contenido se enviaría al modelo. Usa la plantilla .env.example.`);
  return NONE;
}

export function evaluatePrompt(text) {
  const secrets = findSecrets(text);
  if (!secrets.length) return NONE;
  return deny('secret-in-prompt', `El mensaje parece contener un secreto (${secrets.join(', ')}) y no se envió. Retíralo y usa una referencia a variable de entorno.`);
}

// ------------------------------------------------------------------ Normalización por plataforma

/** Extrae archivos y líneas añadidas de un parche estilo apply_patch (Codex) o patch (opencode). */
export function parsePatch(patch) {
  const files = [];
  let current = null;
  for (const line of String(patch ?? '').split(/\r?\n/)) {
    const m = /^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/.exec(line) || /^\*\*\* Move to:\s*(.+)$/.exec(line);
    if (m) {
      current = { path: m[1].trim(), content: '' };
      files.push(current);
    } else if (current && line.startsWith('+')) {
      current.content += `${line.slice(1)}\n`;
    }
  }
  return files;
}

/**
 * Convierte la llamada a herramienta de cada plataforma en eventos comunes:
 *   { kind: 'shell', command } | { kind: 'write', path, content } | { kind: 'read', path }
 */
export function normalize(toolName, input = {}) {
  const t = String(toolName ?? '');
  const i = input ?? {};
  const filePath = i.file_path ?? i.filePath ?? i.absolute_path ?? i.path ?? i.notebook_path;
  switch (t) {
    case 'Bash':
    case 'PowerShell':
    case 'run_shell_command':
    case 'bash':
    case 'shell':
      return [{ kind: 'shell', command: i.command ?? i.cmd ?? '' }];
    case 'Write':
    case 'write_file':
    case 'write':
      return [{ kind: 'write', path: filePath, content: i.content ?? '' }];
    case 'Edit':
    case 'replace':
    case 'edit':
      return [{ kind: 'write', path: filePath, content: i.new_string ?? i.newString ?? '' }];
    case 'MultiEdit':
      return [{ kind: 'write', path: filePath, content: (i.edits ?? []).map((e) => e.new_string ?? '').join('\n') }];
    case 'NotebookEdit':
      return [{ kind: 'write', path: filePath, content: i.new_source ?? '' }];
    case 'apply_patch':
    case 'patch': {
      const text = typeof i === 'string' ? i : i.command ?? i.input ?? i.patch ?? i.patchText ?? '';
      return parsePatch(Array.isArray(text) ? text.join('\n') : text).map((f) => ({ kind: 'write', ...f }));
    }
    case 'Read':
    case 'read_file':
    case 'read':
      return filePath ? [{ kind: 'read', path: filePath }] : [];
    default:
      return [];
  }
}

export function evaluateTool(toolName, input, cwd = process.cwd()) {
  for (const e of normalize(toolName, input)) {
    let r = NONE;
    if (e.kind === 'shell') r = evaluateShell(e.command);
    else if (e.kind === 'write') r = evaluateWrite(e.path, e.content, cwd);
    else if (e.kind === 'read') r = evaluateRead(e.path);
    if (r.decision) return r;
  }
  return NONE;
}
