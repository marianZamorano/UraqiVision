// Pruebas del estado automático de issues, promociones, rama y PR automáticas y protección.
// Ejecutar: node --test ai/hooks/test/estado-issues.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ETIQUETAS, OTRAS, transicion, debeActualizar, extraerIssues, extraerIssuesDePR, commitsDeTrabajo,
  requiereAprobacionCompleta, issueDePromocion, leerMarcadorPromocion, esIssueDeTrabajo, tipoDeIssue, slug,
  ramaDeIssue, proteccion,
} from '../lib/estado-issues.mjs';

const E = Object.fromEntries(Object.entries(ETIQUETAS).map(([k, v]) => [k, v.nombre]));

test('PR hacia dev: borrador en progreso, lista en revisión', () => {
  assert.equal(transicion({ accion: 'opened', base: 'dev', pr: 5, borrador: true }).etiqueta, E.progreso);
  const lista = transicion({ accion: 'opened', base: 'dev', pr: 5, borrador: false });
  assert.equal(lista.etiqueta, E.revision);
  assert.deepEqual(lista.quitar, [E.progreso]);
  assert.equal(transicion({ accion: 'ready_for_review', base: 'dev', pr: 5 }).etiqueta, E.revision);
  assert.equal(transicion({ accion: 'converted_to_draft', base: 'dev', pr: 5 }).etiqueta, E.progreso);
  assert.equal(transicion({ accion: 'opened', base: 'qa', pr: 5 }), null);
});

test('PR aceptada en dev: issue cerrado; qa y main actualizan la etiqueta', () => {
  const dev = transicion({ accion: 'closed', fusionada: true, base: 'dev', pr: 5 });
  assert.deepEqual([dev.etiqueta, dev.cerrar], [E.dev, true]);
  assert.ok(dev.quitar.includes(E.progreso) && dev.quitar.includes(E.revision));
  const qa = transicion({ accion: 'closed', fusionada: true, base: 'qa', pr: 6 });
  assert.deepEqual([qa.etiqueta, qa.cerrar], [E.qa, false]);
  const main = transicion({ accion: 'closed', fusionada: true, base: 'main', pr: 7 });
  assert.deepEqual([main.etiqueta, main.cerrar], [E.main, true]);
});

test('cerrada sin fusionar: se quitan los estados en curso (solo dev)', () => {
  const t = transicion({ accion: 'closed', fusionada: false, base: 'dev', pr: 5 });
  assert.deepEqual([t.etiqueta, t.quitar], [null, [E.progreso, E.revision]]);
  assert.equal(transicion({ accion: 'closed', fusionada: false, base: 'main', pr: 5 }), null);
});

test('qa y main exigen aprobación completa; dev no', () => {
  assert.equal(requiereAprobacionCompleta('qa'), true);
  assert.equal(requiereAprobacionCompleta('main'), true);
  assert.equal(requiereAprobacionCompleta('dev'), false);
});

test('las fusiones actualizan issues cerrados; el resto solo abiertos', () => {
  for (const base of ['dev', 'qa', 'main']) assert.equal(debeActualizar(false, transicion({ accion: 'closed', fusionada: true, base, pr: 1 })), true);
  assert.equal(debeActualizar(false, transicion({ accion: 'opened', base: 'dev', pr: 1 })), false);
  assert.equal(debeActualizar(true, transicion({ accion: 'opened', base: 'dev', pr: 1 })), true);
});

test('referencias: commits con cualquier #N; PR solo tras palabra clave', () => {
  assert.deepEqual(extraerIssues(['feat(x): algo #3', 'fix: otro\n\nRefs #7', 'ver GH-9']), [3, 7, 9]);
  assert.deepEqual(extraerIssuesDePR('Closes #3\n\nSe probó: detecta el issue #1 y la PR #2.'), [3]);
  assert.deepEqual(extraerIssuesDePR('- Refs #3\n- Refs #5, #7 y #9\nFixes: #11'), [3, 5, 7, 9, 11]);
  const commits = [{ parents: [{}], commit: { message: 'feat: a #3' } }, { parents: [{}, {}], commit: { message: 'Merge pull request #2 from x/y' } }];
  assert.deepEqual(commitsDeTrabajo(commits).length, 1);
});

test('issue de promoción: marcador, título y lista de issues', () => {
  const p = issueDePromocion({ pr: 12, head: 'dev', base: 'qa', titulo: 'Release 1', url: 'u', issues: [3, 5] });
  assert.equal(leerMarcadorPromocion(p.body), 12);
  assert.match(p.title, /^\[Promoción\] dev → qa: Release 1$/);
  assert.match(p.body, /Refs #3[\s\S]*Refs #5/);
  assert.equal(leerMarcadorPromocion('sin marcador'), null);
});

test('rama automática: tipo según plantilla, slug ASCII y exclusiones', () => {
  const tarea = { number: 8, title: '[Tarea] Crear rama y PR borrador a dev automáticamente al crear un issue', labels: [] };
  assert.equal(tipoDeIssue(tarea), 'feat');
  assert.equal(tipoDeIssue({ title: '[Defecto] Cifra en cero', labels: [] }), 'fix');
  assert.equal(tipoDeIssue({ title: 'x', labels: [{ name: 'defecto' }] }), 'fix');
  assert.equal(slug('[Tarea] Ñandú: validación de áreas!'), 'nandu-validacion-de-areas');
  assert.ok(ramaDeIssue(tarea).length <= 'feat/8-'.length + 40);
  assert.match(ramaDeIssue(tarea), /^feat\/8-crear-rama-y-pr-borrador-a-dev/);
  assert.equal(esIssueDeTrabajo(tarea), true);
  assert.equal(esIssueDeTrabajo({ title: '[Promoción] dev → qa: x', labels: [] }), false);
  assert.equal(esIssueDeTrabajo({ title: 'x', labels: [{ name: OTRAS.promocion.nombre }] }), false);
  assert.equal(esIssueDeTrabajo({ title: 'x', labels: [], pull_request: {} }), false);
});

test('protección: revierte cambios manuales y respeta a la automatización', () => {
  assert.equal(proteccion({ accion: 'labeled', esBot: true, etiqueta: E.main }), null);
  assert.equal(proteccion({ accion: 'labeled', esBot: false, etiqueta: E.main }).revertir, 'quitar-etiqueta');
  assert.equal(proteccion({ accion: 'unlabeled', esBot: false, etiqueta: E.dev }).revertir, 'poner-etiqueta');
  assert.equal(proteccion({ accion: 'labeled', esBot: false, etiqueta: 'documentación' }), null);
  assert.equal(proteccion({ accion: 'closed', esBot: false, esIssuePromocion: true, promocionAprobada: false }).revertir, 'reabrir');
  assert.equal(proteccion({ accion: 'closed', esBot: false, esIssuePromocion: true, promocionAprobada: true }), null);
  assert.equal(proteccion({ accion: 'closed', esBot: false, etiquetasIssue: [E.progreso] }).revertir, 'reabrir');
  assert.equal(proteccion({ accion: 'closed', esBot: false, etiquetasIssue: [] }), null);
  assert.equal(proteccion({ accion: 'reopened', esBot: false, etiquetasIssue: [E.dev] }).revertir, 'cerrar');
  assert.equal(proteccion({ accion: 'reopened', esBot: false, etiquetasIssue: [] }), null);
});
