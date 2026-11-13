// Acceso de solo lectura (y las dos acciones aprobar/fusionar, que confirma quien llama) a la API de GitHub.
// Localmente usa `gh` con la sesión de la persona; en GitHub Actions usa fetch con GITHUB_TOKEN.
import { execFileSync } from 'node:child_process';

const enCI = () => Boolean(process.env.GITHUB_ACTIONS && process.env.GITHUB_TOKEN);

/** owner/repo desde GITHUB_REPOSITORY o desde el remoto origin. */
export function repoSlug(cwd = process.cwd()) {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8' }).trim();
  const m = /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/.exec(url);
  if (!m) throw new Error(`El remoto origin no es de GitHub: ${url}`);
  return m[1];
}

export async function api(path, { method = 'GET', body, timeout = 15000 } = {}) {
  if (enCI()) {
    const res = await fetch(`https://api.github.com/${path}`, {
      method,
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`GitHub ${method} ${path}: ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }
  const args = ['api', path, '-X', method];
  if (body) args.push('--input', '-');
  const out = execFileSync('gh', args, { encoding: 'utf8', timeout, input: body ? JSON.stringify(body) : undefined, stdio: ['pipe', 'pipe', 'pipe'] });
  return out.trim() ? JSON.parse(out) : null;
}

export async function usuarioActual() {
  if (enCI()) return process.env.GITHUB_ACTOR;
  return (await api('user')).login;
}

/** Colaboradores con acceso aceptado (las invitaciones pendientes no cuentan hasta aceptarse). Sin bots. */
export async function colaboradores(slug) {
  const lista = await api(`repos/${slug}/collaborators?per_page=100`);
  return lista.filter((c) => c.type === 'User' && !c.login.endsWith('[bot]')).map((c) => c.login).sort();
}

export async function invitacionesPendientes(slug) {
  try {
    return (await api(`repos/${slug}/invitations?per_page=100`)).map((i) => i.invitee?.login).filter(Boolean);
  } catch {
    return []; // requiere permisos de administración
  }
}

/** PR normalizada: { numero, titulo, url, autor, base, head, headSha, draft } */
export const normalizarPR = (p) => ({
  numero: p.number, titulo: p.title, url: p.html_url, autor: p.user?.login,
  base: p.base?.ref, head: p.head?.ref, headSha: p.head?.sha, draft: Boolean(p.draft),
});

export async function prsAbiertas(slug) {
  return (await api(`repos/${slug}/pulls?state=open&per_page=100`)).map(normalizarPR);
}

export async function pr(slug, numero) {
  return normalizarPR(await api(`repos/${slug}/pulls/${numero}`));
}

export async function revisiones(slug, numero) {
  return api(`repos/${slug}/pulls/${numero}/reviews?per_page=100`);
}

/** Estado de los checks del commit, sin contar el propio workflow de aprobaciones (se evalúa en vivo). */
export async function checks(slug, sha) {
  const { check_runs: runs = [] } = await api(`repos/${slug}/commits/${sha}/check-runs?per_page=100`);
  const propios = runs.filter((r) => r.name !== 'aprobaciones');
  return {
    total: propios.length,
    fallidos: propios.filter((r) => r.status === 'completed' && !['success', 'neutral', 'skipped'].includes(r.conclusion)).map((r) => r.name),
    pendientes: propios.filter((r) => r.status !== 'completed').map((r) => r.name),
  };
}
