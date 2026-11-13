// Pruebas de la agrupación de cambios. Ejecutar: node --test ai/hooks/test/commit-groups.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agrupar, esGrande, grupoDe, mensajeSugerido, parseNameStatus, parsePorcelain } from '../lib/commit-groups.mjs';

const e = (path, status = 'M') => ({ status, path });

test('cada archivo cae en su grupo, con las copias generadas junto a su fuente', () => {
  assert.equal(grupoDe('.agents/skills/fichas-atlas/SKILL.md'), 'skills');
  assert.equal(grupoDe('.claude/skills/fichas-atlas/SKILL.md'), 'skills');
  assert.equal(grupoDe('ai/agents/revisor-qa.md'), 'agentes');
  assert.equal(grupoDe('.codex/agents/revisor-qa.toml'), 'agentes');
  assert.equal(grupoDe('ai/hooks/lib/guard.mjs'), 'guardas');
  assert.equal(grupoDe('.githooks/pre-push'), 'guardas');
  assert.equal(grupoDe('.claude/settings.json'), 'ai');
  assert.equal(grupoDe('ai/sync.mjs'), 'ai');
  assert.equal(grupoDe('.github/workflows/trazabilidad.yml'), 'ci');
  assert.equal(grupoDe('package-lock.json'), 'deps');
  assert.equal(grupoDe('AGENTS.md'), 'docs');
  assert.equal(grupoDe('web/src/App.tsx'), 'web');
  assert.equal(grupoDe('LICENSE'), 'raiz');
});

test('un solo grupo nunca es grande, aunque tenga muchos archivos', () => {
  const muchos = Array.from({ length: 40 }, (_, i) => e(`.agents/skills/s${i}/SKILL.md`, 'A'));
  assert.equal(esGrande(agrupar(muchos)), false);
});

test('es grande con 3 grupos o con 2 grupos y 8 archivos', () => {
  assert.equal(esGrande(agrupar([e('AGENTS.md'), e('ai/hooks/x.mjs'), e('.github/a.yml')])), true);
  assert.equal(esGrande(agrupar([e('AGENTS.md'), e('ai/hooks/x.mjs')])), false);
  const ocho = [e('AGENTS.md'), ...Array.from({ length: 7 }, (_, i) => e(`ai/hooks/h${i}.mjs`))];
  assert.equal(esGrande(agrupar(ocho)), true);
});

test('orden sugerido: dependencias antes que guardas y documentación al final', () => {
  const claves = agrupar([e('AGENTS.md'), e('ai/hooks/x.mjs'), e('package.json')]).map((g) => g.clave);
  assert.deepEqual(claves, ['deps', 'guardas', 'docs']);
});

test('mensaje sugerido en Conventional Commits con issue y ≤ 100 caracteres', () => {
  const [g] = agrupar([e('.agents/skills/a/SKILL.md', 'A'), e('.claude/skills/a/SKILL.md', 'A')]);
  assert.equal(mensajeSugerido(g, '12'), 'feat(skills): agregar skills #12');
  const [m] = agrupar([e('ai/hooks/x.mjs', 'M')]);
  assert.match(mensajeSugerido(m, '12'), /^refactor\(guardas\): actualizar guardas y hooks #12$/);
  assert.ok(mensajeSugerido(m).endsWith('#N'));
  const [d] = agrupar([e('AGENTS.md')]);
  assert.equal(mensajeSugerido(d, '3'), 'docs: actualizar documentación #3');
});

test('parsea la salida de git', () => {
  assert.deepEqual(parseNameStatus('M\tAGENTS.md\nR100\tviejo.md\tnuevo.md\n'), [e('AGENTS.md'), e('nuevo.md', 'R')]);
  assert.deepEqual(parsePorcelain(' M AGENTS.md\n?? ai/scripts/x.mjs\nA  package.json\n'), [e('AGENTS.md'), e('ai/scripts/x.mjs', '??'), e('package.json', 'A')]);
  // La primera línea empieza con espacio: si se recorta la salida, se perdería el punto de ".agents".
  assert.deepEqual(parsePorcelain(' M .agents/skills/a/SKILL.md\n'), [e('.agents/skills/a/SKILL.md')]);
});
