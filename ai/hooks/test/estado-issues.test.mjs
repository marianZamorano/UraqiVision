// Pruebas del estado automático de issues. Ejecutar: node --test ai/hooks/test/estado-issues.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transicion, extraerIssues, extraerIssuesDePR, commitsDeTrabajo, debeActualizar, ETIQUETAS } from '../lib/estado-issues.mjs';

test('de la PR solo cuentan los issues tras una palabra clave', () => {
  assert.deepEqual(extraerIssuesDePR('Closes #3\n\nSe probó: detecta el issue #1 y la PR #2.'), [3]);
  assert.deepEqual(extraerIssuesDePR('## Issues incluidos\n- Refs #3\n- Refs #5, #7 y #9\nFixes: #11'), [3, 5, 7, 9, 11]);
  assert.deepEqual(extraerIssuesDePR('chore: algo (#1)'), []);
});

test('PR abierta hacia dev: en revisión; hacia qa o main no cambia', () => {
  assert.equal(transicion({ accion: 'opened', fusionada: false, base: 'dev', pr: 5 }).etiqueta, ETIQUETAS.revision.nombre);
  assert.equal(transicion({ accion: 'reopened', fusionada: false, base: 'dev', pr: 5 }).etiqueta, ETIQUETAS.revision.nombre);
  assert.equal(transicion({ accion: 'opened', fusionada: false, base: 'qa', pr: 5 }), null);
});

test('fusionada: dev (se cierra), preproducción y producción', () => {
  const dev = transicion({ accion: 'closed', fusionada: true, base: 'dev', pr: 5 });
  assert.equal(dev.etiqueta, ETIQUETAS.dev.nombre);
  assert.ok(dev.quitar.includes(ETIQUETAS.revision.nombre));
  assert.equal(dev.cerrar, true);
  assert.match(dev.comentario, /#5/);
  const qa = transicion({ accion: 'closed', fusionada: true, base: 'qa', pr: 6 });
  assert.equal(qa.etiqueta, ETIQUETAS.qa.nombre);
  assert.ok(qa.quitar.includes(ETIQUETAS.dev.nombre));
  assert.equal(qa.cerrar, false);
  const main = transicion({ accion: 'closed', fusionada: true, base: 'main', pr: 7 });
  assert.equal(main.etiqueta, ETIQUETAS.main.nombre);
  assert.equal(main.cerrar, true);
  assert.ok(!main.quitar.includes(ETIQUETAS.main.nombre));
});

test('cerrada sin fusionar: quita "en revisión" en dev; nada en qa/main', () => {
  const t = transicion({ accion: 'closed', fusionada: false, base: 'dev', pr: 5 });
  assert.deepEqual([t.etiqueta, t.quitar, t.cerrar], [null, [ETIQUETAS.revision.nombre], false]);
  assert.equal(transicion({ accion: 'closed', fusionada: false, base: 'main', pr: 5 }), null);
  assert.equal(transicion({ accion: 'closed', fusionada: true, base: 'feat/1-x', pr: 5 }), null);
});

test('extrae issues de la descripción y de los commits, sin repetir', () => {
  assert.deepEqual(extraerIssues(['Closes #3, Refs #12', 'feat(x): algo #3', 'fix: otro\n\nRefs #7', 'ver GH-9 y https://github.com/o/r/issues/11']), [3, 7, 9, 11, 12]);
  assert.deepEqual(extraerIssues(['color #fff no', 'nada']), []);
});

test('ignora los commits de merge', () => {
  const commits = [
    { parents: [{}], commit: { message: 'feat: a #3' } },
    { parents: [{}, {}], commit: { message: 'Merge pull request #2 from x/y' } },
    { parents: [{}], commit: { message: 'Merge branch dev into feat/3-x' } },
  ];
  assert.deepEqual(commitsDeTrabajo(commits).map((c) => c.commit.message), ['feat: a #3']);
});

test('las fusiones actualizan issues cerrados; "en revisión" solo los abiertos', () => {
  const dev = transicion({ accion: 'closed', fusionada: true, base: 'dev', pr: 5 });
  const qa = transicion({ accion: 'closed', fusionada: true, base: 'qa', pr: 5 });
  const main = transicion({ accion: 'closed', fusionada: true, base: 'main', pr: 5 });
  const revision = transicion({ accion: 'opened', fusionada: false, base: 'dev', pr: 5 });
  const sinFusionar = transicion({ accion: 'closed', fusionada: false, base: 'dev', pr: 5 });
  for (const t of [dev, qa, main]) assert.equal(debeActualizar(false, t), true);
  assert.equal(debeActualizar(true, revision), true);
  assert.equal(debeActualizar(false, revision), false);
  assert.equal(debeActualizar(false, sinFusionar), false);
});
