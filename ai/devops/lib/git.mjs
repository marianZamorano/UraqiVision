// Estado de Git de solo lectura para readiness y flujo de ramas.
import { spawnSync } from 'node:child_process';
import { finding } from './common.mjs';

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

export function gitState(root) {
  if (git(root, ['rev-parse', '--is-inside-work-tree']) !== 'true') return { isRepo: false };
  const porcelain = git(root, ['status', '--porcelain']) ?? '';
  const branch = git(root, ['branch', '--show-current']);
  const upstream = git(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const aheadBehind = upstream ? git(root, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]) : null;
  const [behind, ahead] = aheadBehind ? aheadBehind.split(/\s+/).map(Number) : [null, null];
  return {
    isRepo: true,
    branch,
    head: git(root, ['rev-parse', '--short', 'HEAD']),
    dirtyFiles: porcelain ? porcelain.split('\n').length : 0,
    upstream,
    ahead,
    behind,
    remotes: (git(root, ['remote']) ?? '').split('\n').filter(Boolean),
  };
}

export function gitReadinessFindings(state, { productionBranch = 'main' } = {}) {
  const f = [];
  if (!state.isRepo) return [finding('high', 'git/not-repo', 'No es un repositorio Git.')];
  if (state.dirtyFiles) f.push(finding('medium', 'git/dirty', `${state.dirtyFiles} archivo(s) sin confirmar: el despliegue no correspondería a un commit.`));
  if (!state.upstream) f.push(finding('low', 'git/no-upstream', `La rama ${state.branch} no tiene upstream.`));
  if (state.behind) f.push(finding('medium', 'git/behind', `La rama está ${state.behind} commit(s) por detrás de ${state.upstream}.`));
  if (state.branch === productionBranch) f.push(finding('info', 'git/on-production-branch', `Estás en ${productionBranch}: un push dispara el despliegue de producción si hay integración Git.`));
  return f;
}
