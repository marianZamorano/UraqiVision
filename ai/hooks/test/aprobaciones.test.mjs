// Pruebas de las reglas de aprobación. Ejecutar: node --test ai/hooks/test/aprobaciones.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarAprobacion, debeAprobar, origenPermitido } from '../lib/aprobaciones.mjs';
import { evaluateTool } from '../lib/guard.mjs';

const equipo = ['ana', 'joaco', 'marian', 'mimi'];
const rev = (login, state, commit = 'h2', t = '2026-11-13T10:00:00Z') => ({ user: { login }, state, commit_id: commit, submitted_at: t });
const pr = (base, extra = {}) => ({ base, head: base === 'qa' ? 'dev' : base === 'main' ? 'qa' : 'feat/1-x', autor: 'marian', headSha: 'h2', draft: false, ...extra });

test('dev: el autor puede fusionar su propia PR sin aprobaciones', () => {
  const ev = evaluarAprobacion(pr('dev'), equipo, []);
  assert.equal(ev.listo, true);
  assert.deepEqual(ev.requeridos, []);
});

test('qa y main: deben aprobar todos menos el autor', () => {
  for (const base of ['qa', 'main']) {
    const ev = evaluarAprobacion(pr(base), equipo, [rev('ana', 'APPROVED'), rev('joaco', 'APPROVED')]);
    assert.equal(ev.listo, false, base);
    assert.deepEqual(ev.faltan, ['mimi'], base);
    assert.ok(!ev.requeridos.includes('marian'), 'el autor no se cuenta');
    const completa = evaluarAprobacion(pr(base), equipo, ['ana', 'joaco', 'mimi'].map((u) => rev(u, 'APPROVED')));
    assert.equal(completa.listo, true, base);
  }
});

test('una aprobación de un commit anterior queda obsoleta', () => {
  const ev = evaluarAprobacion(pr('main'), equipo, [rev('ana', 'APPROVED', 'h1'), rev('joaco', 'APPROVED'), rev('mimi', 'APPROVED')]);
  assert.deepEqual(ev.obsoletas, ['ana']);
  assert.deepEqual(ev.faltan, ['ana']);
});

test('cuenta la última revisión decisiva; los comentarios no cuentan', () => {
  const revs = [rev('ana', 'CHANGES_REQUESTED', 'h2', '2026-11-13T09:00:00Z'), rev('ana', 'APPROVED', 'h2', '2026-11-13T11:00:00Z'), rev('joaco', 'APPROVED'), rev('joaco', 'COMMENTED', 'h2', '2026-11-13T12:00:00Z'), rev('mimi', 'APPROVED')];
  assert.equal(evaluarAprobacion(pr('qa'), equipo, revs).listo, true);
});

test('cambios solicitados o borrador impiden fusionar, incluso en dev', () => {
  assert.equal(evaluarAprobacion(pr('dev'), equipo, [rev('ana', 'CHANGES_REQUESTED')]).listo, false);
  assert.equal(evaluarAprobacion(pr('dev', { draft: true }), equipo, []).listo, false);
});

test('a quién le toca aprobar y orígenes permitidos', () => {
  const ev = evaluarAprobacion(pr('qa'), equipo, [rev('ana', 'APPROVED')]);
  assert.equal(debeAprobar('joaco', pr('qa'), ev), true);
  assert.equal(debeAprobar('ana', pr('qa'), ev), false);
  assert.equal(debeAprobar('marian', pr('qa'), ev), false, 'el autor nunca');
  assert.equal(origenPermitido('qa', 'dev'), true);
  assert.equal(origenPermitido('qa', 'feat/1-x'), false);
  assert.equal(origenPermitido('main', 'dev'), false);
});

test('guardas: aprobar y fusionar solo por los scripts con confirmación', () => {
  for (const command of ['gh pr merge 7 --merge', 'gh pr merge 7 --admin', 'gh pr review 7 --approve', 'gh api repos/o/r/pulls/7/merge -X PUT', 'gh api repos/o/r/pulls/7/reviews -f event=APPROVE']) {
    assert.equal(evaluateTool('Bash', { command }, undefined, { branch: 'feat/1-x' }).decision, 'deny', command);
  }
  for (const command of ['npm run pr:aprobar -- 7', 'node ai/scripts/prs.mjs fusionar 7', 'gh pr view 7', 'gh pr review 7 --comment -b "ok"', 'gh api repos/o/r/pulls/7/reviews']) {
    assert.equal(evaluateTool('Bash', { command }, undefined, { branch: 'feat/1-x' }).decision, null, command);
  }
});
