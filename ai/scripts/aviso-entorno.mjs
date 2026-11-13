#!/usr/bin/env node
// Aviso al equipo cuando una PR cambia la estructura de una plantilla de entorno (.env.example o .env.<x>.example):
// comenta mencionando a todos los colaboradores excepto el autor, con las claves nuevas y eliminadas (nunca valores).
// Falla si una plantilla trae valores en claves sensibles.
//   node ai/scripts/aviso-entorno.mjs --pr <N> [--simular]
import { repoSlug, api, colaboradores } from '../hooks/lib/github.mjs';
import { parseClaves, compararClaves, sensiblesConValor } from '../hooks/lib/entorno.mjs';

const args = process.argv.slice(2);
const numero = Number((args.includes('--pr') ? args[args.indexOf('--pr') + 1] : undefined) ?? process.env.PR_NUMBER);
const simular = args.includes('--simular');
const slug = repoSlug();
const pr = await api(`repos/${slug}/pulls/${numero}`);
const archivos = (await api(`repos/${slug}/pulls/${numero}/files?per_page=100`)).map((f) => f.filename).filter((f) => /(^|\/)\.env(\.[\w-]+)?\.example$/.test(f));

async function contenido(ruta, ref) {
  try {
    const r = await api(`repos/${slug}/contents/${ruta}?ref=${ref}`);
    return Buffer.from(r.content, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

const cambios = [];
const errores = [];
for (const f of archivos) {
  const antes = await contenido(f, pr.base.sha);
  const despues = await contenido(f, pr.head.sha);
  const sens = sensiblesConValor(despues);
  if (sens.length) errores.push(`${f}: las claves sensibles deben ir vacías (${sens.join(', ')}).`);
  const d = compararClaves(parseClaves(antes), parseClaves(despues));
  if (d.faltanEnLocal.length || d.faltanEnPlantilla.length) cambios.push({ f, nuevas: d.faltanEnLocal, eliminadas: d.faltanEnPlantilla });
}

if (cambios.length) {
  const otros = (await colaboradores(slug)).filter((c) => c !== pr.user.login);
  const marca = `<!-- uraqi-aviso-entorno sha=${pr.head.sha} -->`;
  const cuerpo = [
    marca,
    `### ⚠ Cambió la estructura del .env ${otros.map((c) => `@${c}`).join(' ')}`,
    '',
    ...cambios.map((c) => `- \`${c.f}\`: ${c.nuevas.length ? `claves nuevas **${c.nuevas.join(', ')}**` : ''}${c.nuevas.length && c.eliminadas.length ? '; ' : ''}${c.eliminadas.length ? `claves eliminadas **${c.eliminadas.join(', ')}**` : ''}`),
    '',
    `Al traer este cambio, \`npm run env:sync\` agrega las claves nuevas vacías a tu \`.env\` (el hook de git lo hace solo al hacer pull o cambiar de rama). Pide los valores a @${pr.user.login} por un canal privado: nunca se publican en GitHub.`,
  ].join('\n');
  console.log(cuerpo.replace(marca, '').trim());
  if (!simular) {
    const previos = await api(`repos/${slug}/issues/${numero}/comments?per_page=100`);
    if (!previos.some((c) => c.body?.includes(marca))) await api(`repos/${slug}/issues/${numero}/comments`, { method: 'POST', body: { body: cuerpo } });
  }
} else console.log('Sin cambios de estructura en las plantillas de entorno.');

for (const e of errores) console.log(`::error::${e}`);
process.exit(errores.length ? 1 : 0);
