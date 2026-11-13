#!/usr/bin/env node
// Al crear un issue de trabajo: crea la rama tipo/N-titulo desde dev con un commit vacío que cita el issue
// (GitHub no permite una PR sin commits), abre una PR en borrador hacia dev con "Closes #N", etiqueta el issue
// con "estado: en progreso" y comenta cómo empezar. Los issues de promoción no generan rama ni PR.
//   node ai/scripts/issue-a-pr.mjs --issue <N> [--simular]
// Lo ejecuta el workflow "Issue a PR" (evento issues: opened, que corre desde la rama por defecto).
import { repoSlug, api } from '../hooks/lib/github.mjs';
import { ETIQUETAS, esIssueDeTrabajo, ramaDeIssue, tipoDeIssue, tituloLimpio } from '../hooks/lib/estado-issues.mjs';

const args = process.argv.slice(2);
const numero = Number((args.includes('--issue') ? args[args.indexOf('--issue') + 1] : undefined) ?? process.env.ISSUE_NUMBER);
const simular = args.includes('--simular');
if (!Number.isInteger(numero)) {
  console.error('Uso: node ai/scripts/issue-a-pr.mjs --issue <N> [--simular]');
  process.exit(2);
}

const slug = repoSlug();
const issue = await api(`repos/${slug}/issues/${numero}`);
if (!esIssueDeTrabajo(issue)) {
  console.log(`#${numero}: no es un issue de trabajo (promoción o PR); no se crea rama.`);
  process.exit(0);
}

const rama = ramaDeIssue(issue);
const tipo = tipoDeIssue(issue);
const existe = await api(`repos/${slug}/git/ref/heads/${rama}`).then(() => true, () => false);
if (existe) {
  console.log(`La rama ${rama} ya existe; no se crea otra.`);
  process.exit(0);
}

const mensaje = `chore: iniciar el trabajo del issue #${numero}`;
const titulo = `${tipo}: ${tituloLimpio(issue.title)} (#${numero})`.slice(0, 256);
const cuerpo = [
  '## Issues', '', `Closes #${numero}`, '',
  '## Tipo de PR', '', '- [x] Trabajo → `dev`', '',
  '## Qué cambia', '', '- (completar)', '',
  '## Identificadores del documento maestro', '', '- (completar)', '',
  '## Cómo se verificó', '', '- (completar)', '',
  '> PR creada automáticamente al abrir el issue. Está en borrador: trabaja en la rama, completa esta descripción',
  '> y márcala como «lista para revisión» cuando termines.',
].join('\n');

console.log(`#${numero} → rama ${rama}, PR borrador hacia dev «${titulo}»${simular ? ' [simulación]' : ''}`);
if (simular) process.exit(0);

const dev = await api(`repos/${slug}/git/ref/heads/dev`);
const base = await api(`repos/${slug}/git/commits/${dev.object.sha}`);
const commit = await api(`repos/${slug}/git/commits`, { method: 'POST', body: { message: mensaje, tree: base.tree.sha, parents: [dev.object.sha] } });
await api(`repos/${slug}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${rama}`, sha: commit.sha } });
const pr = await api(`repos/${slug}/pulls`, { method: 'POST', body: { title: titulo, head: rama, base: 'dev', body: cuerpo, draft: true } });

const existentes = new Set((await api(`repos/${slug}/labels?per_page=100`)).map((l) => l.name));
if (!existentes.has(ETIQUETAS.progreso.nombre)) {
  await api(`repos/${slug}/labels`, { method: 'POST', body: { name: ETIQUETAS.progreso.nombre, color: ETIQUETAS.progreso.color, description: ETIQUETAS.progreso.descripcion } });
}
await api(`repos/${slug}/issues/${numero}/labels`, { method: 'POST', body: { labels: [ETIQUETAS.progreso.nombre] } });
await api(`repos/${slug}/issues/${numero}/comments`, {
  method: 'POST',
  body: { body: `Rama y PR creadas automáticamente: \`${rama}\` → PR #${pr.number} (borrador hacia \`dev\`).\n\nPara empezar:\n\n\`\`\`\ngit fetch origin\ngit switch ${rama}\n\`\`\`\n\nCada commit debe citar \`#${numero}\` (en esta rama se agrega solo). Al terminar, marca la PR como lista para revisión.` },
});
console.log(`Creadas la rama ${rama} y la PR #${pr.number}.`);
