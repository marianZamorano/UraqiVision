#!/usr/bin/env node
// Actualiza el estado de los issues de una PR (reglas en ai/hooks/lib/estado-issues.mjs).
//   node ai/scripts/estado-issues.mjs --pr <N> [--accion opened|reopened|closed] [--simular]
// En GitHub Actions lo ejecuta el workflow "Estado de issues" con la acción del evento. En local sirve para
// sincronizar una PR ya fusionada (deduce la acción de su estado) o, con --simular, para ver qué haría.
import { repoSlug, api } from '../hooks/lib/github.mjs';
import { ETIQUETAS, transicion, extraerIssues, extraerIssuesDePR, commitsDeTrabajo, debeActualizar } from '../hooks/lib/estado-issues.mjs';

const args = process.argv.slice(2);
const valor = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const numero = Number(valor('--pr'));
const simular = args.includes('--simular');
if (!Number.isInteger(numero)) {
  console.error('Uso: node ai/scripts/estado-issues.mjs --pr <N> [--accion opened|reopened|closed] [--simular]');
  process.exit(2);
}

const slug = repoSlug();
const pr = await api(`repos/${slug}/pulls/${numero}`);
const accion = valor('--accion') ?? process.env.GITHUB_EVENT_ACTION ?? (pr.state === 'closed' ? 'closed' : 'opened');
const t = transicion({ accion, fusionada: Boolean(pr.merged_at), base: pr.base.ref, pr: numero });
if (!t) {
  console.log(`PR #${numero} (${accion}, base ${pr.base.ref}): sin cambios de estado.`);
  process.exit(0);
}

const commits = commitsDeTrabajo(await api(`repos/${slug}/pulls/${numero}/commits?per_page=100`));
// De la PR, solo los issues tras una palabra clave; de los commits, cualquier #N (cada commit cita su issue).
const candidatos = [...new Set([
  ...extraerIssuesDePR(`${pr.title}\n${pr.body ?? ''}`),
  ...extraerIssues(commits.map((c) => c.commit.message)),
])].filter((n) => n !== numero).sort((a, b) => a - b);

async function asegurarEtiquetas() {
  const existentes = new Set((await api(`repos/${slug}/labels?per_page=100`)).map((l) => l.name));
  for (const e of Object.values(ETIQUETAS)) {
    if (!existentes.has(e.nombre)) await api(`repos/${slug}/labels`, { method: 'POST', body: { name: e.nombre, color: e.color, description: e.descripcion } });
  }
}

let actualizados = 0;
if (!simular && t.etiqueta) await asegurarEtiquetas();
for (const n of candidatos) {
  let issue;
  try {
    issue = await api(`repos/${slug}/issues/${n}`);
  } catch {
    continue; // el número no existe
  }
  if (issue.pull_request) continue; // es una PR, no un issue
  if (!debeActualizar(issue.state === 'open', t)) {
    console.log(`#${n}: cerrado, sin cambios.`);
    continue;
  }
  const actuales = issue.labels.map((l) => l.name);
  const quitar = t.quitar.filter((q) => actuales.includes(q));
  const pasos = [
    ...quitar.map((q) => `quitar «${q}»`),
    ...(t.etiqueta && !actuales.includes(t.etiqueta) ? [`agregar «${t.etiqueta}»`] : []),
    ...(t.comentario ? ['comentar'] : []),
    ...(t.cerrar && issue.state === 'open' ? ['cerrar'] : []),
  ];
  console.log(`#${n} «${issue.title}»: ${pasos.join(', ') || 'ya estaba al día'}`);
  if (simular || !pasos.length) continue;
  for (const q of quitar) await api(`repos/${slug}/issues/${n}/labels/${encodeURIComponent(q)}`, { method: 'DELETE' });
  if (t.etiqueta && !actuales.includes(t.etiqueta)) await api(`repos/${slug}/issues/${n}/labels`, { method: 'POST', body: { labels: [t.etiqueta] } });
  if (t.comentario) await api(`repos/${slug}/issues/${n}/comments`, { method: 'POST', body: { body: t.comentario } });
  if (t.cerrar && issue.state === 'open') await api(`repos/${slug}/issues/${n}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
  actualizados += 1;
}
console.log(`PR #${numero} (${accion}, base ${pr.base.ref}): ${candidatos.length} referencia(s), ${actualizados} issue(s) actualizado(s)${simular ? ' [simulación]' : ''}.`);
