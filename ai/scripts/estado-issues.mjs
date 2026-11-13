#!/usr/bin/env node
// Actualiza el estado de los issues de una PR (reglas en ai/hooks/lib/estado-issues.mjs).
//   node ai/scripts/estado-issues.mjs --pr <N> [--accion <evento>] [--simular]
// Lo ejecuta el workflow "Estado de issues". En local, --simular muestra qué haría. Para aplicar desde local sin
// que la protección lo revierta, usa el workflow: gh workflow run estado-issues.yml --ref dev -f pr=<N>
import { repoSlug, api, colaboradores, revisiones, normalizarPR } from '../hooks/lib/github.mjs';
import { evaluarAprobacion } from '../hooks/lib/aprobaciones.mjs';
import {
  ETIQUETAS, OTRAS, transicion, requiereAprobacionCompleta, debeActualizar, extraerIssues, extraerIssuesDePR,
  commitsDeTrabajo, esPromocion, issueDePromocion, leerMarcadorPromocion,
} from '../hooks/lib/estado-issues.mjs';

const args = process.argv.slice(2);
const valor = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const numero = Number(valor('--pr') ?? process.env.PR_NUMBER);
const simular = args.includes('--simular');
if (!Number.isInteger(numero)) {
  console.error('Uso: node ai/scripts/estado-issues.mjs --pr <N> [--accion <evento>] [--simular]');
  process.exit(2);
}

const slug = repoSlug();
const prRaw = await api(`repos/${slug}/pulls/${numero}`);
const pr = normalizarPR(prRaw);
const accion = valor('--accion') || process.env.GITHUB_EVENT_ACTION || (prRaw.state === 'closed' ? 'closed' : 'opened');
const fusionada = Boolean(prRaw.merged_at);
const log = (m) => console.log(m);
const hacer = async (descripcion, fn) => { log(`  - ${descripcion}`); if (!simular) await fn(); };

async function asegurarEtiquetas() {
  if (simular) return;
  const existentes = new Set((await api(`repos/${slug}/labels?per_page=100`)).map((l) => l.name));
  for (const e of [...Object.values(ETIQUETAS), ...Object.values(OTRAS)]) {
    if (!existentes.has(e.nombre)) await api(`repos/${slug}/labels`, { method: 'POST', body: { name: e.nombre, color: e.color, description: e.descripcion } });
  }
}

async function leerIssue(n) {
  try {
    const i = await api(`repos/${slug}/issues/${n}`);
    return i.pull_request ? null : i;
  } catch {
    return null;
  }
}

/** Aplica una transición a un issue (quitar estados anteriores, poner el nuevo, comentar, cerrar). */
async function aplicar(issue, t) {
  if (!debeActualizar(issue.state === 'open', t)) return log(`#${issue.number}: cerrado, sin cambios.`);
  const actuales = issue.labels.map((l) => l.name);
  log(`#${issue.number} «${issue.title}»`);
  for (const q of t.quitar.filter((x) => actuales.includes(x))) {
    await hacer(`quitar «${q}»`, () => api(`repos/${slug}/issues/${issue.number}/labels/${encodeURIComponent(q)}`, { method: 'DELETE' }));
  }
  const agrega = Boolean(t.etiqueta) && !actuales.includes(t.etiqueta);
  const cierra = t.cerrar && issue.state === 'open';
  if (agrega) await hacer(`agregar «${t.etiqueta}»`, () => api(`repos/${slug}/issues/${issue.number}/labels`, { method: 'POST', body: { labels: [t.etiqueta] } }));
  // Solo se comenta si el estado cambió de verdad: sincronizar dos veces no duplica comentarios.
  if (t.comentario && (agrega || cierra)) await hacer('comentar', () => api(`repos/${slug}/issues/${issue.number}/comments`, { method: 'POST', body: { body: t.comentario } }));
  if (cierra) await hacer('cerrar', () => api(`repos/${slug}/issues/${issue.number}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } }));
  if (!agrega && !cierra && !t.quitar.some((x) => actuales.includes(x))) log('  - ya estaba al día');
}

// Issues que lleva la PR: de los commits (cualquier #N) y de la descripción (solo tras palabra clave).
const commits = commitsDeTrabajo(await api(`repos/${slug}/pulls/${numero}/commits?per_page=100`));
const numeros = [...new Set([...extraerIssuesDePR(`${prRaw.title}\n${prRaw.body ?? ''}`), ...extraerIssues(commits.map((c) => c.commit.message))])]
  .filter((n) => n !== numero).sort((a, b) => a - b);
const issues = [];
let promocion = null;
for (const n of numeros) {
  const i = await leerIssue(n);
  if (!i) continue;
  if (leerMarcadorPromocion(i.body) === numero) promocion = i; // el issue de promoción de esta PR
  else if (!i.labels.some((l) => l.name === OTRAS.promocion.nombre)) issues.push(i);
}

log(`PR #${numero} ${pr.head} → ${pr.base} (${accion}${fusionada ? ', fusionada' : ''})${simular ? ' [simulación]' : ''}`);
await asegurarEtiquetas();

if (!esPromocion(pr.base)) {
  // PR de trabajo hacia dev: el autor puede fusionarla; fusionada = aceptada.
  const t = transicion({ accion, fusionada, base: pr.base, pr: numero, borrador: pr.draft });
  if (!t) log('Sin cambios de estado.');
  else for (const i of issues) await aplicar(i, t);
} else {
  // PR de promoción hacia qa o main.
  if (accion === 'opened' || accion === 'reopened') {
    if (!promocion) {
      const nuevo = issueDePromocion({ pr: numero, head: pr.head, base: pr.base, titulo: pr.titulo, url: pr.url, issues: issues.map((i) => i.number) });
      log(`Crear issue de promoción: ${nuevo.title}`);
      if (!simular) {
        promocion = await api(`repos/${slug}/issues`, { method: 'POST', body: { ...nuevo, labels: [OTRAS.promocion.nombre, ETIQUETAS.revision.nombre] } });
        const cuerpo = `${prRaw.body ?? ''}\n\n## Issue de promoción\n\nRefs #${promocion.number}\n`;
        await api(`repos/${slug}/pulls/${numero}`, { method: 'PATCH', body: { body: cuerpo } });
        await api(`repos/${slug}/issues/${numero}/comments`, { method: 'POST', body: { body: `Issue de promoción creado: #${promocion.number}. Se cerrará solo al fusionar esta PR con la aprobación completa.` } });
        log(`  - creado #${promocion.number} y enlazado en la PR`);
      }
    } else log(`Ya existe el issue de promoción #${promocion.number}.`);
  } else if (accion === 'closed' && !fusionada) {
    if (promocion && promocion.state === 'open') {
      log(`#${promocion.number}: la PR se cerró sin fusionar`);
      await hacer('comentar y cerrar como no planificado', async () => {
        await api(`repos/${slug}/issues/${promocion.number}/comments`, { method: 'POST', body: { body: `La PR #${numero} se cerró sin fusionar. Se cierra la promoción.` } });
        await api(`repos/${slug}/issues/${promocion.number}`, { method: 'PATCH', body: { state: 'closed', state_reason: 'not_planned' } });
      });
    }
  } else if (accion === 'closed' && fusionada) {
    const ev = evaluarAprobacion(pr, await colaboradores(slug), await revisiones(slug, numero));
    if (requiereAprobacionCompleta(pr.base) && !ev.listo) {
      // Prohibido cambiar estados sin la aprobación completa.
      const aviso = `⚠ La PR #${numero} se fusionó en \`${pr.base}\` sin cumplir las condiciones de aprobación (${ev.motivos.join('; ')}). No se actualiza el estado de ningún issue.`;
      log(aviso);
      if (!simular) {
        await api(`repos/${slug}/issues/${numero}/comments`, { method: 'POST', body: { body: aviso } });
        if (promocion) {
          await api(`repos/${slug}/issues/${promocion.number}/labels`, { method: 'POST', body: { labels: [OTRAS.incompleta.nombre] } });
          await api(`repos/${slug}/issues/${promocion.number}/comments`, { method: 'POST', body: { body: aviso } });
        }
      }
      process.exit(0);
    }
    const t = transicion({ accion, fusionada, base: pr.base, pr: numero });
    for (const i of issues) await aplicar(i, t);
    if (promocion) await aplicar(promocion, { ...t, cerrar: true, comentario: `Promoción completada: la PR #${numero} se fusionó en \`${pr.base}\` con la aprobación completa (${ev.aprobaron.join(', ') || 'sin otros colaboradores'}).` });
  } else log('Sin cambios de estado.');
}
