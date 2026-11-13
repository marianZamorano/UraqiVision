// Pruebas de las reglas de entorno. Ejecutar: node --test ai/hooks/test/entorno.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseEntradas, parseClaves, compararClaves, sensiblesConValor, agregarClaves, clasificar, pares, mensajePausa } from '../lib/entorno.mjs';
import { revisar, sincronizar, sincronizarLocal } from '../lib/entorno-git.mjs';

test('al recibir cambios, solo se agregan claves al .env local; la plantilla no se toca', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uraqi-env-'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  fs.writeFileSync(path.join(dir, '.env.example'), 'A=\nB=\n');
  fs.writeFileSync(path.join(dir, '.env'), 'A=1\nSOLO_LOCAL=2\n');
  assert.deepEqual(sincronizarLocal(dir), ['B']);
  assert.equal(fs.readFileSync(path.join(dir, '.env.example'), 'utf8'), 'A=\nB=\n', 'la plantilla queda igual');
  assert.match(fs.readFileSync(path.join(dir, '.env'), 'utf8'), /A=1[\s\S]*SOLO_LOCAL=2[\s\S]*B=\n/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lee claves en orden y sin valores en los mensajes', () => {
  const t = '# comentario\nexport A=1\nB="dos"\n\nC=\n  D = x\nno es clave\n';
  assert.deepEqual(parseClaves(t), ['A', 'B', 'C', 'D']);
  assert.equal(parseEntradas(t)[1].valor, 'dos');
});

test('compara estructura en ambos sentidos', () => {
  assert.deepEqual(compararClaves(['A', 'B'], ['B', 'C']), { faltanEnLocal: ['C'], faltanEnPlantilla: ['A'] });
  assert.deepEqual(compararClaves(['A'], ['A']), { faltanEnLocal: [], faltanEnPlantilla: [] });
});

test('claves sensibles deben ir vacías en la plantilla', () => {
  assert.deepEqual(sensiblesConValor('INSIGHT_API_KEY=abc\nEARTHDATA_TOKEN=\nPORT=5173\nDB_PASSWORD=x'), ['INSIGHT_API_KEY', 'DB_PASSWORD']);
});

test('agrega claves vacías sin tocar las existentes', () => {
  assert.equal(agregarClaves('A=1', ['B', 'C'], 'nuevas'), 'A=1\n\n# nuevas\nB=\nC=\n');
  assert.equal(agregarClaves('A=1\n', [], 'x'), 'A=1\n');
});

test('solo .env y .env.example; otros solo si están declarados', () => {
  assert.equal(clasificar('.env'), 'local');
  assert.equal(clasificar('.env.example'), 'plantilla');
  assert.equal(clasificar('.env.local'), 'prohibido');
  assert.equal(clasificar('.env.sample'), 'prohibido');
  assert.equal(clasificar('.env.test', ['test']), 'local-permitido');
  assert.equal(clasificar('.env.test.example', ['test']), 'plantilla-permitida');
  assert.equal(clasificar('.env.test.example'), 'prohibido');
  assert.equal(clasificar('README.md'), null);
  assert.deepEqual(pares(['test']), [['.env', '.env.example'], ['.env.test', '.env.test.example']]);
});

test('el mensaje de pausa no contiene valores y pide comunicar', () => {
  const m = mensajePausa(['NUEVA_CLAVE'], 'C:/Users/x/Downloads/uraqivision.env');
  assert.match(m, /PAUSA/);
  assert.match(m, /NUEVA_CLAVE/);
  assert.match(m, /URAQI_ENV_COMUNICADO=1/);
});

test('revisar y sincronizar en una carpeta temporal (sin mostrar valores)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uraqi-env-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ uraqi: { envPermitidos: [] } }));
  fs.writeFileSync(path.join(dir, '.env.example'), 'A=\nAPI_KEY=\n');
  // Sin .env: solo aviso.
  assert.deepEqual(revisar(dir).errores, []);
  // sync crea el .env desde la plantilla.
  assert.equal(sincronizar(dir)[0].accion, 'creado');
  assert.deepEqual(parseClaves(fs.readFileSync(path.join(dir, '.env'), 'utf8')), ['A', 'API_KEY']);
  // Clave nueva en el .env local con valor secreto: revisar avisa; sync la agrega VACÍA a la plantilla.
  fs.appendFileSync(path.join(dir, '.env'), 'NUEVA_TOKEN=valor-secreto\n');
  assert.ok(revisar(dir).errores.some((e) => e.includes('NUEVA_TOKEN')));
  const cambios = sincronizar(dir);
  assert.ok(cambios.some((c) => c.archivo === '.env.example' && c.estructura));
  const plantilla = fs.readFileSync(path.join(dir, '.env.example'), 'utf8');
  assert.match(plantilla, /NUEVA_TOKEN=\n/);
  assert.ok(!plantilla.includes('valor-secreto'), 'el valor nunca pasa a la plantilla');
  assert.deepEqual(revisar(dir).errores, []);
  // Archivos no permitidos.
  fs.writeFileSync(path.join(dir, '.env.local'), 'X=1');
  assert.ok(revisar(dir).errores.some((e) => e.startsWith('.env.local')));
  fs.rmSync(dir, { recursive: true, force: true });
});
