// Pruebas de las buenas prácticas de PR. Ejecutar: node --test ai/hooks/test/buenas-practicas-pr.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarPR, tamano, esGenerado, secciones, extraerCierres, prPermitida } from '../lib/buenas-practicas-pr.mjs';
import { evaluateTool } from '../lib/guard.mjs';

const cuerpoOk = '## Issues\n\nCloses #12\n\n## Qué cambia\n\n- Agrega el workflow.\n\n## Cómo se verificó\n\n- npm test en verde.\n';
const prTrabajo = (extra = {}) => ({ titulo: 'feat(ci): buenas prácticas de pr #12', cuerpo: cuerpoOk, head: 'feat/12-buenas-practicas-pr', base: 'dev', borrador: false, mergeable: true, mergeableState: 'clean', ...extra });
const refs = { cierra: [12], todas: [12] };
const existe12 = new Map([[12, { esPR: false }]]);

test('una PR de trabajo correcta pasa sin errores', () => {
  const r = evaluarPR({ pr: prTrabajo(), issues: existe12, referencias: refs, archivos: [{ filename: 'a.mjs', additions: 30, deletions: 2 }] });
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.etiquetas, ['tipo: feat', 'tamaño: S']);
});

test('título, rama y cierre del issue de la rama', () => {
  const r = evaluarPR({ pr: prTrabajo({ titulo: 'Agrego cosas', head: 'mi-rama' }), issues: existe12, referencias: refs });
  assert.ok(r.errores.some((e) => e.startsWith('Título')));
  assert.ok(r.errores.some((e) => e.startsWith('Rama')));
  const otra = evaluarPR({ pr: prTrabajo({ head: 'feat/9-otra-cosa' }), issues: existe12, referencias: refs });
  assert.ok(otra.errores.some((e) => e.includes('issue #9')));
});

test('descripción: secciones obligatorias, sin (completar); en borrador solo avisa', () => {
  const r = evaluarPR({ pr: prTrabajo({ cuerpo: '## Issues\n\nCloses #12\n\n## Qué cambia\n\n- (completar)\n' }), issues: existe12, referencias: refs });
  assert.ok(r.errores.some((e) => e.includes('«qué cambia»')));
  assert.ok(r.errores.some((e) => e.includes('Cómo se verificó')));
  const borrador = evaluarPR({ pr: prTrabajo({ borrador: true, cuerpo: '## Issues\n\nCloses #12' }), issues: existe12, referencias: refs });
  assert.deepEqual(borrador.errores, []);
  assert.ok(borrador.avisos.some((a) => a.includes('borrador')));
});

test('referencias inexistentes o a PR, y conflictos', () => {
  const r = evaluarPR({ pr: prTrabajo({ mergeable: false, mergeableState: 'dirty' }), issues: new Map([[12, { esPR: false }], [4, { esPR: true }]]), referencias: { cierra: [12], todas: [4, 12, 99] } });
  assert.ok(r.errores.some((e) => e.includes('#99')));
  assert.ok(r.errores.some((e) => e.includes('#4 es una PR')));
  assert.ok(r.errores.some((e) => e.includes('conflictos')));
  const atras = evaluarPR({ pr: prTrabajo({ mergeableState: 'behind' }), issues: existe12, referencias: refs });
  assert.ok(atras.avisos.some((a) => a.includes('desactualizada')));
});

test('promociones: título propio, sin regla de rama ni de tamaño', () => {
  const promo = { titulo: 'Promoción dev → qa: release 1', cuerpo: '## Issues\n\nRefs #12\n\n## Qué cambia\n\n- x\n\n## Cómo se verificó\n\n- y\n', head: 'dev', base: 'qa', borrador: false, mergeable: true, mergeableState: 'clean' };
  const grande = [{ filename: 'a.mjs', additions: 5000, deletions: 0 }];
  const r = evaluarPR({ pr: promo, issues: existe12, referencias: { cierra: [], todas: [12] }, archivos: grande });
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.etiquetas, ['promoción', 'tamaño: XL']);
  assert.ok(evaluarPR({ pr: { ...promo, titulo: 'Release' }, issues: existe12, referencias: { cierra: [], todas: [12] } }).errores.length);
});

test('tamaño: sin contar archivos generados; aviso en PR grandes', () => {
  assert.equal(esGenerado('.claude/skills/x/SKILL.md'), true);
  assert.equal(esGenerado('package-lock.json'), true);
  assert.equal(esGenerado('ai/sync.mjs'), false);
  assert.deepEqual([tamano(5), tamano(50), tamano(300), tamano(700), tamano(2000)], ['XS', 'S', 'M', 'L', 'XL']);
  const archivos = [{ filename: 'a.mjs', additions: 900, deletions: 0 }, { filename: '.claude/x', additions: 5000, deletions: 0 }];
  const r = evaluarPR({ pr: prTrabajo(), issues: existe12, referencias: refs, archivos });
  assert.equal(r.lineas, 900);
  assert.ok(r.avisos.some((a) => a.includes('PR grande')));
});

test('auxiliares: secciones, cierres y pares permitidos', () => {
  assert.equal(secciones('## Qué cambia\n<!-- nota -->\n- algo\n')['qué cambia'].trim(), '- algo');
  assert.deepEqual(extraerCierres('Closes #3, #5 y Refs #9\nFixes: #7'), [3, 5, 7]);
  assert.equal(prPermitida('dev', 'feat/1-x').ok, true);
  assert.equal(prPermitida('qa', 'dev').ok, true);
  assert.equal(prPermitida('main', 'qa').ok, true);
  for (const [b, h] of [[undefined, 'feat/1-x'], ['main', 'feat/1-x'], ['qa', 'feat/1-x'], ['main', 'dev'], ['dev', 'qa']]) assert.equal(prPermitida(b, h).ok, false, `${h} → ${b}`);
});

test('guarda: gh pr create solo con destino y origen correctos', () => {
  const enRama = { branch: 'feat/12-buenas-practicas-pr' };
  for (const command of ['gh pr create --fill', 'gh pr create --base main --fill', 'gh pr create -B qa --title x', 'gh pr create --base=main --head dev']) {
    assert.equal(evaluateTool('Bash', { command }, undefined, enRama).decision, 'deny', command);
  }
  for (const command of ['gh pr create --base dev --fill', 'gh pr create -B dev -t "feat: x" -F body.md', 'gh pr create --base qa --head dev', 'gh pr create --base=main --head=qa']) {
    assert.equal(evaluateTool('Bash', { command }, undefined, enRama).decision, null, command);
  }
  assert.equal(evaluateTool('Bash', { command: 'gh pr create --base qa' }, undefined, { branch: 'dev' }).decision, null);
});
