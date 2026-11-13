#!/usr/bin/env node
// Propone dividir los cambios pendientes en commits por tema y, SOLO si la persona lo aprueba, los crea.
//
//   node ai/scripts/dividir-commits.mjs              muestra la propuesta (no cambia nada)
//   node ai/scripts/dividir-commits.mjs --json       propuesta en JSON (para agentes de IA)
//   node ai/scripts/dividir-commits.mjs --aplicar    muestra la propuesta y PREGUNTA: aplicar, editar o cancelar
//   opciones: --issue N (si la rama no es tipo/N-…), --si (no pregunta: solo tras la aprobación de la persona),
//             --mensajes archivo.json ({"clave del grupo": "mensaje"} para reemplazar los sugeridos)
//
// Cada commit pasa por los hooks normales (issue, formato, secretos). Si uno falla, se detiene y los archivos
// de los grupos restantes quedan sin commitear, como estaban.
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { agrupar, describirPlan, mensajeSugerido, parsePorcelain } from '../hooks/lib/commit-groups.mjs';
import { currentBranch, issueFromBranch, git, gitRaw } from '../hooks/lib/git.mjs';
import { PROTECTED_BRANCHES } from '../hooks/lib/guard.mjs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);

const branch = currentBranch();
const issue = valor('--issue') ?? issueFromBranch(branch);
const entries = parsePorcelain(gitRaw(['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-uall', '--no-renames']));
if (!entries.length) {
  console.log('No hay cambios pendientes.');
  process.exit(0);
}
const grupos = agrupar(entries);
const propios = valor('--mensajes') ? JSON.parse(fs.readFileSync(valor('--mensajes'), 'utf8')) : {};
const plan = grupos.map((g) => ({ clave: g.clave, mensaje: propios[g.clave] ?? mensajeSugerido(g, issue), archivos: g.archivos }));

if (flag('--json')) {
  console.log(JSON.stringify({ rama: branch, issue: issue ?? null, grupos: plan }, null, 2));
  process.exit(0);
}

console.log(describirPlan(grupos, issue));
if (Object.keys(propios).length) {
  console.log('\nMensajes que se usarán:');
  plan.forEach((p, i) => console.log(`  ${i + 1}. ${p.mensaje}`));
}
if (!flag('--aplicar')) {
  console.log('\nSolo es una propuesta. Para aplicarla: npm run commits:dividir (pregunta antes de crear los commits).');
  process.exit(0);
}

if (PROTECTED_BRANCHES.includes(branch)) {
  console.error(`\nEstás en ${branch}: crea primero la rama del issue (git switch -c feat/<N>-descripcion) y vuelve a ejecutar.`);
  process.exit(1);
}
if (!issue) {
  console.error('\nFalta el issue: usa una rama tipo/N-descripcion o pasa --issue N.');
  process.exit(1);
}

if (!flag('--si')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const r = (await rl.question(`\n¿Crear ${plan.length} commit(s) así? [s] sí / [e] editar mensajes / [n] no: `)).trim().toLowerCase();
  if (r === 'e') {
    for (const p of plan) {
      const nuevo = (await rl.question(`Mensaje para ${p.clave} [${p.mensaje}]: `)).trim();
      if (nuevo) p.mensaje = nuevo;
    }
  } else if (r !== 's' && r !== 'si' && r !== 'sí') {
    rl.close();
    console.log('Cancelado: no se creó ningún commit.');
    process.exit(0);
  }
  rl.close();
}

git(['reset', '-q']); // solo quita del stage; no toca el contenido de los archivos
const hechos = [];
for (const p of plan) {
  try {
    execFileSync('git', ['add', '-A', '--', ...p.archivos.map((a) => a.path)], { stdio: 'inherit' });
    execFileSync('git', ['commit', '-F', '-'], { input: `${p.mensaje}\n`, stdio: ['pipe', 'inherit', 'inherit'] });
    hechos.push(p);
  } catch {
    git(['reset', '-q']);
    console.error(`\nSe detuvo en el grupo "${p.clave}". Commits creados: ${hechos.length} de ${plan.length}.`);
    console.error('Los archivos de los grupos restantes siguen sin commitear. Corrige el mensaje o el problema y vuelve a ejecutar.');
    process.exit(1);
  }
}
console.log(`\nListo: ${hechos.length} commit(s) creados.`);
console.log(git(['log', '--oneline', `-${hechos.length}`]));
