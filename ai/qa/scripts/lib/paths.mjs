// Resolución segura de rutas: confinamiento a una raíz y rutas protegidas.
import path from 'node:path';
import fs from 'node:fs';

export class PathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PathError';
  }
}

/** Normaliza separadores a '/' y minúsculas en Windows para comparar. */
export function normalizeForCompare(p) {
  const n = path.resolve(p).replace(/\\/g, '/');
  return process.platform === 'win32' ? n.toLowerCase() : n;
}

export function isInside(root, target) {
  const r = normalizeForCompare(root).replace(/\/+$/, '');
  const t = normalizeForCompare(target);
  return t === r || t.startsWith(`${r}/`);
}

/**
 * Resuelve `p` relativo a `root` y garantiza que el resultado (incluidos symlinks) quede dentro.
 * Lanza PathError si escapa de la raíz.
 */
export function resolveInside(root, p) {
  if (typeof p !== 'string' || p.length === 0) throw new PathError('Ruta vacía o inválida');
  if (p.includes('\0')) throw new PathError('Ruta con byte nulo');
  const abs = path.resolve(root, p);
  if (!isInside(root, abs)) throw new PathError(`Ruta fuera de la raíz autorizada: ${p}`);
  if (fs.existsSync(abs)) {
    const real = fs.realpathSync(abs);
    const realRoot = fs.realpathSync(root);
    if (!isInside(realRoot, real)) throw new PathError(`Ruta (symlink) fuera de la raíz autorizada: ${p}`);
  }
  return abs;
}

// Archivos que nunca deben leerse ni escribirse por herramientas automáticas.
const PROTECTED_PATTERNS = [
  /(^|\/)\.env(\.[^/]*)?$/i, // .env.example/.sample/.template se excluyen en isSecretFile
  /(^|\/)[^/]*\.(pem|key|p12|pfx|jks|keystore)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)\.netrc$/i,
  /(^|\/)\.aws\/credentials$/i,
  /(^|\/)\.ssh\//i,
  /(^|\/)\.git\/(config|hooks\/)/i,
  /(^|\/)credentials(\.json)?$/i,
];

/** ¿Es un archivo con secretos reales (no se permite leer ni escribir)? `.env.example` está permitido. */
export function isSecretFile(p) {
  const n = String(p).replace(/\\/g, '/');
  if (/(^|\/)\.env\.(example|sample|template)$/i.test(n)) return false;
  return PROTECTED_PATTERNS.some((re) => re.test(n));
}

/** Lee un archivo de texto con límite de tamaño. */
export function readTextLimited(absPath, maxBytes = 5 * 1024 * 1024) {
  const st = fs.statSync(absPath);
  if (!st.isFile()) throw new PathError(`No es un archivo: ${absPath}`);
  if (st.size > maxBytes) throw new PathError(`Archivo demasiado grande (${st.size} B > ${maxBytes} B)`);
  return fs.readFileSync(absPath, 'utf8');
}

/** Recorre un directorio con límites, saltando carpetas pesadas o sensibles. */
export function walk(root, { maxFiles = 5000, maxDepth = 8, skip = DEFAULT_SKIP } = {}) {
  const out = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length && out.length < maxFiles) {
    const { dir, depth } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (depth < maxDepth) stack.push({ dir: full, depth: depth + 1 });
      } else if (e.isFile()) {
        out.push(full);
        if (out.length >= maxFiles) break;
      }
    }
  }
  return out;
}

export const DEFAULT_SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'target', 'bin', 'obj',
  '.venv', 'venv', '__pycache__', '.gradle', '.idea', '.vscode', '.runtime', '.turbo', '.cache', 'vendor',
]);

export function toPosixRelative(root, abs) {
  return path.relative(root, abs).replace(/\\/g, '/');
}
