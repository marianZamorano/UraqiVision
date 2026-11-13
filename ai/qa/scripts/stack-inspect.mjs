#!/usr/bin/env node
// Inspección de stack y artefactos de testing de un proyecto (solo lectura).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError, writeOutput } from './lib/cli.mjs';
import { discover } from './lib/discovery.mjs';

const USAGE = `Uso: node stack-inspect.mjs --root <dir> [--json] [--max-files N] [--out archivo]

Lee manifiestos, lockfiles y nombres de archivos para listar tecnologías declaradas y artefactos de
testing (configs, tests, contratos, colecciones, scripts de carga, pipelines, migraciones).
No lee archivos de secretos (.env, claves). No ejecuta nada del proyecto.
Salida: 0 OK, 2 uso incorrecto, 3 error interno.`;

function toMarkdown(d) {
  const L = [`# Inventario de stack y artefactos de testing`, '', `Raíz: \`${d.root}\` · Archivos analizados: ${d.limits.filesScanned}${d.limits.truncated ? ' (truncado)' : ''}`, ''];
  L.push('## Manifiestos', '', ...(d.manifests.length ? d.manifests.map((m) => `- \`${m.path}\` (${m.ecosystem})`) : ['_Ninguno_']), '');
  L.push('## Lockfiles', '', ...(d.lockfiles.length ? d.lockfiles.map((l) => `- \`${l}\``) : ['_Ninguno_']), '');
  L.push('## Tecnologías declaradas', '', '| Categoría | Tecnología | Estado | Evidencia |', '|---|---|---|---|');
  for (const [cat, list] of Object.entries(d.technologies)) for (const t of list) L.push(`| ${cat} | ${t.name} | ${t.status} | ${t.evidence.join('<br>')} |`);
  L.push('', '## Artefactos de testing', '');
  for (const [kind, files] of Object.entries(d.artifacts)) L.push(`### ${kind} (${files.length})`, '', ...files.slice(0, 30).map((f) => `- \`${f}\``), files.length > 30 ? `- … ${files.length - 30} más` : '', '');
  L.push('## Scripts de package.json', '', ...(d.scripts.length ? d.scripts.map((s) => `- \`${s.manifest}\` → \`${s.name}\`: \`${s.command}\``) : ['_Ninguno_']), '');
  L.push('> ' + d.limits.note);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('stack-inspect', () => {
    const { values } = cli({ name: 'stack-inspect', usage: USAGE, options: { root: { type: 'string' }, 'max-files': { type: 'string' }, out: { type: 'string' }, force: { type: 'boolean' } } });
    if (!values.root) throw new UsageError('--root es obligatorio');
    const root = path.resolve(values.root);
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new UsageError(`No es un directorio: ${values.root}`);
    const result = discover(root, { maxFiles: values['max-files'] ? Number(values['max-files']) : 5000 });
    writeOutput(values.out, values.json ? JSON.stringify(result, null, 2) : toMarkdown(result), { force: values.force });
    return EXIT.OK;
  });
}
