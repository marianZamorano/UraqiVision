#!/usr/bin/env node
// Escanea archivos, directorios o el diff staged de git en busca de secretos. Nunca imprime el valor completo.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cli, run, EXIT, UsageError } from './lib/cli.mjs';
import { scanText } from './lib/secrets.mjs';
import { walk, isSecretFile } from './lib/paths.mjs';

const USAGE = `Uso:
  node scan-secrets.mjs <archivo|directorio> [...] [--min-severity medium|high|critical] [--json]
  node scan-secrets.mjs --staged      # escanea solo las líneas añadidas en el índice de git (solo lectura)

Archivos de secretos reales (.env, *.pem, id_rsa...) se reportan por su nombre sin leer su contenido.
Salida: 0 sin hallazgos, 1 con hallazgos, 2 uso incorrecto.`;

const BINARY = /\.(png|jpe?g|gif|ico|pdf|zip|gz|tgz|jar|exe|dll|so|dylib|woff2?|ttf|mp4|lockb)$/i;

export function scanPaths(targets, minSeverity = 'medium') {
  const findings = [];
  for (const t of targets) {
    const abs = path.resolve(t);
    if (!fs.existsSync(abs)) throw new UsageError(`No existe: ${t}`);
    const files = fs.statSync(abs).isDirectory() ? walk(abs, { maxFiles: 20000 }) : [abs];
    for (const f of files) {
      const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
      if (isSecretFile(rel)) {
        findings.push({ file: rel, line: 0, rule: 'secret-file', severity: 'high', preview: 'Archivo de secretos presente (contenido no leído)' });
        continue;
      }
      if (BINARY.test(f) || fs.statSync(f).size > 5 * 1024 * 1024) continue;
      for (const s of scanText(fs.readFileSync(f, 'utf8'), { minSeverity })) findings.push({ file: rel, ...s });
    }
  }
  return findings;
}

/** Analiza un diff unificado y devuelve hallazgos en líneas añadidas. */
export function scanDiff(diffText, minSeverity = 'medium') {
  const findings = [];
  let file = null;
  let newLine = 0;
  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+++ ')) file = line.replace(/^\+\+\+ (b\/)?/, '');
    else if (line.startsWith('@@')) newLine = Number(/\+(\d+)/.exec(line)?.[1] ?? 0) - 1;
    else if (line.startsWith('+') && !line.startsWith('+++')) {
      newLine++;
      for (const s of scanText(line.slice(1), { minSeverity })) findings.push({ file, ...s, line: newLine });
    } else if (!line.startsWith('-')) newLine++;
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run('scan-secrets', () => {
    const { values, positionals } = cli({
      name: 'scan-secrets',
      usage: USAGE,
      options: { staged: { type: 'boolean' }, 'min-severity': { type: 'string', default: 'medium' } },
    });
    const min = values['min-severity'];
    if (!['medium', 'high', 'critical'].includes(min)) throw new UsageError(`--min-severity inválido: ${min}`);
    let findings;
    if (values.staged) {
      const diff = execFileSync('git', ['diff', '--cached', '--no-color', '-U0'], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
      findings = scanDiff(diff, min);
    } else {
      if (!positionals.length) throw new UsageError('Indica al menos un archivo o directorio, o usa --staged');
      findings = scanPaths(positionals, min);
    }
    if (values.json) process.stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`);
    else if (!findings.length) process.stdout.write('Sin secretos detectados.\n');
    else findings.forEach((f) => process.stdout.write(`[${f.severity}] ${f.rule} ${f.file}:${f.line} ${f.preview}\n`));
    return findings.length ? EXIT.CHECK_FAILED : EXIT.OK;
  });
}
