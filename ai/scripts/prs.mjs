#!/usr/bin/env node
// Revisión y aprobación de PR de UraqiVision (reglas en ai/hooks/lib/aprobaciones.mjs).
//
//   node ai/scripts/prs.mjs                      PRs que esperan tu aprobación y estado de las tuyas (--json)
//   node ai/scripts/prs.mjs estado <N>           quién aprobó, quién falta y si se puede fusionar
//   node ai/scripts/prs.mjs aprobar <N> [--si]   muestra el resumen, PREGUNTA y aprueba (gh pr review --approve)
//   node ai/scripts/prs.mjs fusionar <N> [--si]  comprueba las reglas, PREGUNTA y fusiona con merge commit
//   node ai/scripts/prs.mjs ci --pr <N>          modo GitHub Actions: pide revisores y falla si faltan aprobaciones
//
// --si omite la pregunta: úsalo SOLO cuando la persona ya lo confirmó (por ejemplo, un asistente que preguntó).
import readline from 'node:readline/promises';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { repoSlug, usuarioActual, colaboradores, invitacionesPendientes, pr as leerPR, revisiones, checks, api } from '../hooks/lib/github.mjs';
import { evaluarAprobacion, origenPermitido } from '../hooks/lib/aprobaciones.mjs';
import { estadoPRs, textoAviso } from '../hooks/lib/prs-resumen.mjs';

const args = process.argv.slice(2);
const sub = args[0] && !args[0].startsWith('-') ? args[0] : 'pendientes';
const numero = Number(args.find((a, i) => i > 0 && /^\d+$/.test(a)) ?? (args.includes('--pr') ? args[args.indexOf('--pr') + 1] : NaN));
const si = args.includes('--si');

async function confirmar(pregunta) {
  if (si) return true;
  if (!process.stdin.isTTY) {
    console.error('\nSin terminal para preguntar. Si la persona ya lo confirmó, repite con --si.');
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const r = (await rl.question(`${pregunta} [s/N] `)).trim().toLowerCase();
  rl.close();
  return ['s', 'si', 'sí'].includes(r);
}

async function contexto(n) {
  if (!Number.isInteger(n)) throw new Error('Indica el número de la PR.');
  const slug = repoSlug();
  const [p, colabs, revs] = await Promise.all([leerPR(slug, n), colaboradores(slug), revisiones(slug, n)]);
  return { slug, pr: p, colabs, ev: evaluarAprobacion(p, colabs, revs) };
}

function imprimirEstado({ pr, ev }, chk) {
  console.log(`#${pr.numero} ${pr.head} → ${pr.base}  «${pr.titulo}»  de ${pr.autor}\n${pr.url}`);
  console.log(`Regla: ${ev.regla}`);
  if (ev.exigeTodos) {
    console.log(`  Aprobaron (último commit): ${ev.aprobaron.join(', ') || 'nadie'}`);
    console.log(`  Faltan: ${ev.faltan.join(', ') || 'nadie'}`);
    if (ev.obsoletas.length) console.log(`  Aprobaciones de un commit anterior (deben repetirse): ${ev.obsoletas.join(', ')}`);
  }
  if (ev.cambiosPedidos.length) console.log(`  Cambios solicitados por: ${ev.cambiosPedidos.join(', ')}`);
  if (chk) console.log(`  Checks: ${chk.fallidos.length ? `fallidos ${chk.fallidos.join(', ')}` : chk.pendientes.length ? `en curso ${chk.pendientes.join(', ')}` : chk.total ? 'en verde' : 'sin checks todavía'}`);
  if (!origenPermitido(pr.base, pr.head)) console.log(`  ⚠ A ${pr.base} solo se llega desde ${pr.base === 'qa' ? 'dev' : 'qa'}.`);
  console.log(ev.listo ? '→ Aprobaciones completas.' : `→ Aún no: ${ev.motivos.join('; ')}.`);
}

async function main() {
  if (sub === 'pendientes') {
    const estado = await estadoPRs();
    if (args.includes('--json')) return console.log(JSON.stringify(estado, null, 2));
    const texto = textoAviso(estado);
    console.log(texto || `No hay PRs que esperen tu acción (${estado.yo}).`);
    const inv = await invitacionesPendientes(repoSlug());
    if (inv.length) console.log(`\nInvitaciones sin aceptar (no cuentan como revisores hasta aceptarlas): ${inv.join(', ')}`);
    return;
  }

  if (sub === 'estado') {
    const c = await contexto(numero);
    return imprimirEstado(c, await checks(c.slug, c.pr.headSha));
  }

  if (sub === 'aprobar') {
    const c = await contexto(numero);
    const yo = await usuarioActual();
    imprimirEstado(c, await checks(c.slug, c.pr.headSha));
    if (c.pr.autor === yo) {
      console.error(c.pr.base === 'dev'
        ? '\nEs tu PR: GitHub no permite aprobar la propia. En dev puedes fusionarla tú: npm run pr:fusionar -- ' + numero
        : `\nEs tu PR: hacia ${c.pr.base} deben aprobarla los demás colaboradores.`);
      process.exit(1);
    }
    if (c.ev.aprobaron.includes(yo)) return console.log('\nYa aprobaste el último commit de esta PR.');
    if (!(await confirmar(`\n¿Aprobar la PR #${numero} como ${yo}?`))) return console.log('No se aprobó.');
    execFileSync('gh', ['pr', 'review', String(numero), '--approve', '--body', 'Aprobado tras revisión.'], { stdio: 'inherit' });
    return console.log(`Aprobada la PR #${numero}.`);
  }

  if (sub === 'fusionar') {
    const c = await contexto(numero);
    const yo = await usuarioActual();
    const chk = await checks(c.slug, c.pr.headSha);
    imprimirEstado(c, chk);
    const bloqueos = [...c.ev.motivos];
    if (!origenPermitido(c.pr.base, c.pr.head)) bloqueos.push(`a ${c.pr.base} solo se llega desde ${c.pr.base === 'qa' ? 'dev' : 'qa'}`);
    if (chk.fallidos.length) bloqueos.push(`checks fallidos: ${chk.fallidos.join(', ')}`);
    if (chk.pendientes.length) bloqueos.push(`checks en curso: ${chk.pendientes.join(', ')}`);
    if (bloqueos.length) {
      console.error(`\nNo se puede fusionar: ${bloqueos.join('; ')}.`);
      process.exit(1);
    }
    const quien = c.pr.base === 'dev' && c.pr.autor === yo ? ' (tu propia PR hacia dev)' : '';
    if (!(await confirmar(`\n¿Fusionar la PR #${numero} en ${c.pr.base} con merge commit${quien}?`))) return console.log('No se fusionó.');
    execFileSync('gh', ['pr', 'merge', String(numero), '--merge'], { stdio: 'inherit' });
    return console.log(`Fusionada la PR #${numero} en ${c.pr.base}.`);
  }

  if (sub === 'ci') {
    const c = await contexto(numero);
    const evento = process.env.GITHUB_EVENT_ACTION ?? '';
    if (c.ev.exigeTodos && ['opened', 'reopened', 'ready_for_review'].includes(evento) && c.ev.faltan.length) {
      try {
        await api(`repos/${c.slug}/pulls/${numero}/requested_reviewers`, { method: 'POST', body: { reviewers: c.ev.faltan } });
        console.log(`Revisión solicitada a: ${c.ev.faltan.join(', ')}`);
      } catch (err) {
        console.log(`::warning::No se pudo solicitar revisión automáticamente (${err.message.slice(0, 120)}).`);
      }
    }
    imprimirEstado(c);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Aprobaciones de la PR #${numero}\n\n${c.ev.regla}\n\n- Aprobaron: ${c.ev.aprobaron.join(', ') || 'nadie'}\n- Faltan: ${c.ev.faltan.join(', ') || 'nadie'}\n${c.ev.motivos.length ? `\n**Pendiente:** ${c.ev.motivos.join('; ')}\n` : '\n**Aprobaciones completas.**\n'}`);
    }
    if (!c.ev.listo) {
      console.log(`::error::${c.ev.motivos.join('; ')}`);
      process.exit(1);
    }
    return;
  }

  console.error(`Subcomando desconocido: ${sub}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(`[prs] ${err.message}`);
  process.exit(1);
});
