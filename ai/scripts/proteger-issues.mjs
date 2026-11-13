#!/usr/bin/env node
// Protección del estado de los issues contra cambios manuales (reglas en ai/hooks/lib/estado-issues.mjs):
// - etiquetas "estado: …" puestas o quitadas a mano → se revierte;
// - issue de promoción cerrado a mano sin que su PR se haya fusionado con la aprobación completa → se reabre;
// - issue con PR en curso cerrado a mano → se reabre (se cierra solo al aceptar la PR);
// - issue cuya PR ya fue aceptada reabierto a mano → se vuelve a cerrar.
// Lo ejecuta el workflow "Protección de issues" (eventos de issues, que corren desde la rama por defecto).
// Los cambios que hace la automatización con GITHUB_TOKEN no disparan este workflow.
import { repoSlug, api, colaboradores, revisiones, normalizarPR } from '../hooks/lib/github.mjs';
import { evaluarAprobacion } from '../hooks/lib/aprobaciones.mjs';
import { OTRAS, proteccion, leerMarcadorPromocion } from '../hooks/lib/estado-issues.mjs';

const numero = Number(process.env.ISSUE_NUMBER);
const accion = process.env.GITHUB_EVENT_ACTION;
const esBot = process.env.SENDER_TYPE === 'Bot';
const etiqueta = process.env.LABEL_NAME ?? '';
if (!Number.isInteger(numero) || !accion) {
  console.error('Faltan ISSUE_NUMBER o GITHUB_EVENT_ACTION.');
  process.exit(2);
}

const slug = repoSlug();
const issue = await api(`repos/${slug}/issues/${numero}`);
if (issue.pull_request) process.exit(0);
const etiquetasIssue = issue.labels.map((l) => l.name);
const prPromocion = leerMarcadorPromocion(issue.body);
const esIssuePromocion = etiquetasIssue.includes(OTRAS.promocion.nombre) || prPromocion !== null;

let promocionAprobada = false;
if (esIssuePromocion && prPromocion && accion === 'closed') {
  const raw = await api(`repos/${slug}/pulls/${prPromocion}`);
  if (raw.merged_at) {
    const ev = evaluarAprobacion(normalizarPR(raw), await colaboradores(slug), await revisiones(slug, prPromocion));
    promocionAprobada = ev.listo;
  }
}

const d = proteccion({ accion, esBot, etiqueta, etiquetasIssue, esIssuePromocion, promocionAprobada });
if (!d) {
  console.log(`#${numero} ${accion}: permitido.`);
  process.exit(0);
}
console.log(`#${numero} ${accion}: se revierte (${d.revertir}).`);
if (d.revertir === 'quitar-etiqueta') await api(`repos/${slug}/issues/${numero}/labels/${encodeURIComponent(d.etiqueta)}`, { method: 'DELETE' });
if (d.revertir === 'poner-etiqueta') await api(`repos/${slug}/issues/${numero}/labels`, { method: 'POST', body: { labels: [d.etiqueta] } });
if (d.revertir === 'reabrir') await api(`repos/${slug}/issues/${numero}`, { method: 'PATCH', body: { state: 'open' } });
if (d.revertir === 'cerrar') await api(`repos/${slug}/issues/${numero}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
await api(`repos/${slug}/issues/${numero}/comments`, { method: 'POST', body: { body: d.comentario } });
