#!/usr/bin/env node
// Baseline de seguridad DEFENSIVO y ESTÁTICO: busca patrones inseguros en el código fuente sin ejecutar nada
// ni enviar tráfico. Complementa (no sustituye) un SAST completo y la revisión manual.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, writeOutput } from './lib/cli.mjs';
import { walk, toPosixRelative, isSecretFile } from './lib/paths.mjs';
import { scanText } from './lib/secrets.mjs';

const USAGE = `Uso: node security-baseline.mjs --root <dir> [--json] [--out archivo] [--fail-on high|medium]

Reglas: secretos embebidos, eval/new Function, TLS desactivado, CORS comodín, SQL por concatenación,
JWT inseguro, hashing débil para contraseñas, aleatoriedad débil para tokens, ejecución de comandos con
interpolación, logging de datos sensibles, ValidationPipe sin whitelist (NestJS), dependencias de hardening ausentes.
Salida: 0 sin hallazgos al nivel de --fail-on (por defecto high), 1 con hallazgos, 2 uso incorrecto.`;

const SRC = /\.(m?[jt]sx?|cjs|py|java|kt|cs|go|rb|php)$/i;
const TEST = /(\.(test|spec)\.|__tests__|\/tests?\/|\/fixtures?\/)/i;

export const RULES = [
  { id: 'eval', severity: 'high', re: /\beval\s*\(|\bnew\s+Function\s*\(/, cwe: 'CWE-95', advice: 'Evitar evaluación dinámica de código' },
  { id: 'tls-disabled', severity: 'high', re: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true/, cwe: 'CWE-295', advice: 'No desactivar la verificación TLS' },
  { id: 'cors-wildcard', severity: 'medium', re: /origin\s*:\s*['"]\*['"]|Access-Control-Allow-Origin['"]?\s*,\s*['"]\*['"]|enableCors\(\s*\)|cors\(\s*\)/, cwe: 'CWE-942', advice: 'Restringir orígenes CORS explícitamente' },
  { id: 'sql-concatenation', severity: 'high', re: /\b(query|execute|raw|\$queryRawUnsafe|\$executeRawUnsafe|createQueryBuilder\([^)]*\)\.where)\s*\(\s*(`[^`]*\$\{|['"][^'"]*(select|insert|update|delete|where)[^'"]*['"]\s*\+)/i, cwe: 'CWE-89', advice: 'Usar consultas parametrizadas' },
  { id: 'jwt-none', severity: 'high', re: /algorithms?\s*:\s*\[?\s*['"]none['"]|ignoreExpiration\s*:\s*true/i, cwe: 'CWE-347', advice: 'No aceptar alg "none" ni ignorar la expiración' },
  { id: 'weak-hash', severity: 'medium', re: /createHash\(\s*['"](md5|sha1)['"]\s*\)|hashlib\.(md5|sha1)\(|MessageDigest\.getInstance\(\s*"(MD5|SHA-1)"/i, cwe: 'CWE-328', advice: 'Para contraseñas usar bcrypt/argon2/scrypt' },
  { id: 'weak-random-token', severity: 'medium', re: /(token|secret|password|otp|nonce|session)[^\n]{0,40}Math\.random\(\)|Math\.random\(\)[^\n]{0,40}(token|secret|password|otp|nonce)/i, cwe: 'CWE-338', advice: 'Usar crypto.randomBytes/randomUUID' },
  { id: 'command-injection', severity: 'high', re: /\b(exec|execSync|spawn|spawnSync)\s*\(\s*`[^`]*\$\{|os\.system\(\s*f?['"][^'"]*\{|subprocess\.\w+\([^)]*shell\s*=\s*True/, cwe: 'CWE-78', advice: 'Evitar shell con interpolación; usar execFile con argumentos' },
  { id: 'sensitive-logging', severity: 'medium', re: /(console\.(log|info|debug)|logger\.(log|info|debug)|print)\s*\([^)]*\b(password|passwd|token|secret|authorization|apiKey|api_key)\b/i, cwe: 'CWE-532', advice: 'No registrar datos sensibles' },
  { id: 'validation-pipe-no-whitelist', severity: 'medium', re: /new\s+ValidationPipe\s*\(\s*\)/, cwe: 'CWE-20', advice: 'ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })' },
  { id: 'stack-trace-exposure', severity: 'low', re: /res\.(send|json)\(\s*(err|error)(\.stack)?\s*\)/, cwe: 'CWE-209', advice: 'No devolver errores internos al cliente' },
];

export function securityBaseline(root) {
  const findings = [];
  const files = walk(root, { maxFiles: 20000 });
  let deps = {};
  for (const f of files) {
    const rel = toPosixRelative(root, f);
    if (isSecretFile(rel)) {
      findings.push({ rule: 'secret-file-in-tree', severity: 'medium', file: rel, line: 0, cwe: 'CWE-538', advice: 'Verificar que esté en .gitignore y no versionado', excerpt: '(contenido no leído)' });
      continue;
    }
    if (path.basename(f) === 'package.json' && !rel.includes('node_modules')) {
      try {
        const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
        deps = { ...deps, ...pkg.dependencies };
      } catch { /* manifiesto inválido: se ignora */ }
    }
    if (!SRC.test(f) || fs.statSync(f).size > 1024 * 1024) continue;
    const text = fs.readFileSync(f, 'utf8');
    const isTest = TEST.test(`/${rel}`);
    text.split(/\r?\n/).forEach((line, i) => {
      for (const r of RULES) if (r.re.test(line)) findings.push({ rule: r.id, severity: isTest && r.severity === 'high' ? 'medium' : r.severity, file: rel, line: i + 1, cwe: r.cwe, advice: r.advice, excerpt: line.trim().slice(0, 140), inTest: isTest });
    });
    for (const s of scanText(text, { minSeverity: 'high' })) findings.push({ rule: `hardcoded-secret:${s.rule}`, severity: isTest ? 'medium' : 'high', file: rel, line: s.line, cwe: 'CWE-798', advice: 'Mover a gestor de secretos / variables de entorno', excerpt: s.preview });
  }
  const web = ['express', '@nestjs/core', 'fastify', 'koa'].find((d) => deps[d]);
  if (web) {
    if (!deps.helmet && !deps['@fastify/helmet']) findings.push({ rule: 'missing-security-headers-lib', severity: 'low', file: 'package.json', line: 0, cwe: 'CWE-693', advice: `Framework ${web} sin helmet: verificar cabeceras de seguridad`, excerpt: '' });
    if (!deps['@nestjs/throttler'] && !deps['express-rate-limit'] && !deps['@fastify/rate-limit']) findings.push({ rule: 'missing-rate-limit-lib', severity: 'low', file: 'package.json', line: 0, cwe: 'CWE-770', advice: 'Sin librería de rate limiting declarada', excerpt: '' });
  }
  const count = (s) => findings.filter((f) => f.severity === s).length;
  return { root: root.replace(/\\/g, '/'), filesScanned: files.length, summary: { high: count('high'), medium: count('medium'), low: count('low') }, findings };
}

function toMarkdown(r) {
  const L = ['# Baseline de seguridad (estático, defensivo)', '', `Archivos: ${r.filesScanned} · Alto: ${r.summary.high} · Medio: ${r.summary.medium} · Bajo: ${r.summary.low}`, '', '| Sev. | Regla | CWE | Ubicación | Recomendación | Extracto |', '|---|---|---|---|---|---|'];
  const order = { high: 0, medium: 1, low: 2 };
  for (const f of [...r.findings].sort((a, b) => order[a.severity] - order[b.severity])) L.push(`| ${f.severity} | ${f.rule} | ${f.cwe} | \`${f.file}:${f.line}\` | ${f.advice} | \`${String(f.excerpt).replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`);
  L.push('', '> Hallazgos de análisis por patrones: cada uno es una hipótesis hasta confirmarlo en el código.');
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('security-baseline', () => {
    const { values } = cli({ name: 'security-baseline', usage: USAGE, options: { root: { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' }, 'fail-on': { type: 'string', default: 'high' } } });
    if (!values.root || !fs.existsSync(values.root)) throw new UsageError('--root debe ser un directorio existente');
    if (!['high', 'medium'].includes(values['fail-on'])) throw new UsageError('--fail-on debe ser high o medium');
    const r = securityBaseline(path.resolve(values.root));
    writeOutput(values.out, values.json ? JSON.stringify(r, null, 2) : toMarkdown(r), { force: values.force });
    const failing = values['fail-on'] === 'medium' ? r.summary.high + r.summary.medium : r.summary.high;
    return failing ? EXIT.CHECK_FAILED : EXIT.OK;
  });
}
