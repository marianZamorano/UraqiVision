#!/usr/bin/env node
// Revisa las buenas prácticas de una PR (reglas en ai/hooks/lib/buenas-practicas-pr.mjs): título, rama,
// descripción, issues válidos, conflictos, secretos y tamaño. Pone etiquetas de tipo y tamaño, asigna al autor y
// mantiene un comentario de resumen. Falla si hay errores.
//   node ai/scripts/buenas-practicas-pr.mjs --pr <N> [--simular]
//   node ai/scripts/buenas-practicas-pr.mjs --pr <N> --borrar-rama    (tras fusionar: borra la rama de trabajo)
import fs from 'node:fs';
import { repoSlug, api } from '../hooks/lib/github.mjs';
import { findSecrets } from '../hooks/lib/guard.mjs';
import { extraerIssuesDePR } from '../hooks/lib/estado-issues.mjs';
import { evaluarPR, extraerCierres, ramaBorrable } from '../hooks/lib/buenas-practicas-pr.mjs';

const args = process.argv.slice(2);
const numero = Number((args.includes('--pr') ? args[args.indexOf('--pr') + 1] : undefined) ?? process.env.PR_NUMBER);
const simular = args.includes('--simular');
if (!Number.isInteger(numero)) {
  console.error('Uso: node ai/scripts/buenas-practicas-pr.mjs --pr <N> [--simular | --borrar-rama]');
  process.exit(2);
}
const slug = repoSlug();
const MARCA = '<!-- uraqi-buenas-practicas -->';

let raw = await api(`repos/${slug}/pulls/${numero}`);

if (args.includes('--borrar-rama')) {
  const mismoRepo = raw.head.repo?.full_name === raw.base.repo.full_name;
  if (raw.merged_at && mismoRepo && ramaBorrable(raw.head.ref)) {
    console.log(`Borrar la rama fusionada ${raw.head.ref}${simular ? ' [simulación]' : ''}`);
    if (!simular) await api(`repos/${slug}/git/refs/heads/${raw.head.ref}`, { method: 'DELETE' }).catch((e) => console.log(`No se pudo borrar: ${e.message.slice(0, 120)}`));
  } else console.log(`La rama ${raw.head.ref} no se borra (no fusionada, de otro repositorio o protegida).`);
  process.exit(0);
}

// GitHub calcula "mergeable" en segundo plano: se reintenta unos segundos si todavía no está.
for (let i = 0; i < 5 && raw.mergeable === null && raw.state === 'open'; i += 1) {
  await new Promise((r) => setTimeout(r, 3000));
  raw = await api(`repos/${slug}/pulls/${numero}`);
}

const archivos = [];
for (let pagina = 1; pagina <= 3; pagina += 1) {
  const lote = await api(`repos/${slug}/pulls/${numero}/files?per_page=100&page=${pagina}`);
  archivos.push(...lote);
  if (lote.length < 100) break;
}

const texto = `${raw.title}\n${raw.body ?? ''}`;
const referencias = { cierra: extraerCierres(texto), todas: extraerIssuesDePR(texto) };
const issues = new Map();
for (const n of referencias.todas) {
  try {
    const i = await api(`repos/${slug}/issues/${n}`);
    issues.set(n, { esPR: Boolean(i.pull_request) });
  } catch {
    // no existe: evaluarPR lo informa
  }
}

const pr = {
  titulo: raw.title, cuerpo: raw.body ?? '', head: raw.head.ref, base: raw.base.ref, borrador: raw.draft,
  mergeable: raw.mergeable, mergeableState: raw.mergeable_state,
};
const r = evaluarPR({ pr, archivos, issues, referencias });

// Secretos en las líneas agregadas (complementa el pre-commit, que puede no estar activo en otra máquina).
for (const a of archivos) {
  for (const linea of String(a.patch ?? '').split('\n')) {
    if (linea.startsWith('+') && !linea.startsWith('+++')) {
      const s = findSecrets(linea.slice(1));
      if (s.length) r.errores.push(`Posible secreto (${s.join(', ')}) en ${a.filename}: quítalo y rótalo si llegó a compartirse.`);
    }
  }
}

const resumen = [
  MARCA,
  `### Buenas prácticas de la PR ${r.errores.length ? '❌' : '✅'}`,
  '',
  r.errores.length ? `**Por corregir:**\n${r.errores.map((e) => `- ${e}`).join('\n')}` : 'Sin errores.',
  r.avisos.length ? `\n**Avisos:**\n${r.avisos.map((a) => `- ${a}`).join('\n')}` : '',
  '',
  `Etiquetas: ${r.etiquetas.map((e) => `\`${e}\``).join(', ')} · ${r.lineas} líneas cambiadas (sin generados).`,
  '',
  '<sub>Se actualiza solo en cada cambio de la PR. Reglas: skill `flujo-issues-y-pr`.</sub>',
].join('\n');

console.log(resumen.replace(MARCA, '').trim());
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${resumen}\n`);

if (!simular) {
  // Etiquetas: crea las que falten y reemplaza las de tipo/tamaño anteriores.
  const existentes = new Set((await api(`repos/${slug}/labels?per_page=100`)).map((l) => l.name));
  for (const e of r.etiquetas) {
    if (!existentes.has(e)) await api(`repos/${slug}/labels`, { method: 'POST', body: { name: e, color: e.startsWith('tamaño') ? 'ededed' : 'bfd4f2' } }).catch(() => {});
  }
  const actuales = raw.labels.map((l) => l.name);
  for (const vieja of actuales.filter((l) => /^(tipo|tamaño): /.test(l) && !r.etiquetas.includes(l))) {
    await api(`repos/${slug}/issues/${numero}/labels/${encodeURIComponent(vieja)}`, { method: 'DELETE' }).catch(() => {});
  }
  const nuevas = r.etiquetas.filter((e) => !actuales.includes(e));
  if (nuevas.length) await api(`repos/${slug}/issues/${numero}/labels`, { method: 'POST', body: { labels: nuevas } });
  if (!raw.assignees?.length && raw.user?.type === 'User') {
    await api(`repos/${slug}/issues/${numero}/assignees`, { method: 'POST', body: { assignees: [raw.user.login] } }).catch(() => {});
  }
  // Comentario de resumen único, actualizado en cada ejecución.
  const comentarios = await api(`repos/${slug}/issues/${numero}/comments?per_page=100`);
  const previo = comentarios.find((c) => c.body?.includes(MARCA));
  if (previo) await api(`repos/${slug}/issues/comments/${previo.id}`, { method: 'PATCH', body: { body: resumen } });
  else await api(`repos/${slug}/issues/${numero}/comments`, { method: 'POST', body: { body: resumen } });
}

for (const a of r.avisos) console.log(`::warning::${a}`);
for (const e of r.errores) console.log(`::error::${e}`);
process.exit(r.errores.length ? 1 : 0);
