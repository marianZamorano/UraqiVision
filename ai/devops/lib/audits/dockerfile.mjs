// Auditoría estática de Dockerfiles y docker-compose. Complementa (no sustituye) a hadolint/trivy.
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { finding, readText, rel, walkFiles } from '../common.mjs';
import { scanText } from '../secrets.mjs';

export function auditDockerfileText(text, file, { hasDockerignore = true } = {}) {
  const findings = [];
  if (!text) return findings;
  // Une líneas continuadas con "\" para analizar instrucciones completas.
  const logical = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const prev = logical[logical.length - 1];
    if (prev && prev.cont) {
      prev.text += ' ' + raw.trim();
      prev.cont = /\\\s*$/.test(raw);
    } else logical.push({ text: raw.trim(), line: i + 1, cont: /\\\s*$/.test(raw) });
  });
  let lastUser = null;
  let hasHealthcheck = false;
  const stages = [];
  for (const { text: l, line } of logical) {
    if (!l || l.startsWith('#')) continue;
    const [instr] = l.split(/\s+/);
    const I = instr.toUpperCase();
    if (I === 'FROM') {
      const image = l.split(/\s+/)[1] ?? '';
      stages.push(image);
      if (image.toLowerCase() !== 'scratch' && !image.startsWith('$')) {
        if (!image.includes(':') && !image.includes('@')) findings.push(finding('medium', 'docker/untagged-image', `FROM ${image} sin tag (equivale a :latest).`, { file, line }));
        else if (/:latest\b/.test(image)) findings.push(finding('medium', 'docker/latest-tag', `FROM ${image}: usa una versión fija.`, { file, line }));
        else if (!image.includes('@sha256:')) findings.push(finding('info', 'docker/no-digest', `FROM ${image}: fijar por digest mejora la reproducibilidad.`, { file, line }));
      }
      lastUser = null;
    }
    if (I === 'USER') lastUser = l.split(/\s+/)[1];
    if (I === 'HEALTHCHECK') hasHealthcheck = true;
    if (I === 'ADD') {
      if (/https?:\/\//.test(l)) findings.push(finding('medium', 'docker/add-url', 'ADD con URL: descarga sin verificar checksum; usa curl + verificación o COPY.', { file, line }));
      else if (!/\.(tar|tgz|tar\.gz|tar\.xz)\b/.test(l)) findings.push(finding('low', 'docker/add-vs-copy', 'Usa COPY en lugar de ADD para archivos locales.', { file, line }));
    }
    if ((I === 'ENV' || I === 'ARG') && /\b[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\b/i.test(l)) {
      findings.push(finding('high', 'docker/secret-in-layer', `${I} con nombre de secreto: queda en las capas/historial de la imagen. Usa --mount=type=secret.`, { file, line }));
    }
    if (I === 'RUN') {
      if (/\b(?:curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/.test(l)) findings.push(finding('high', 'docker/curl-pipe-sh', 'Script remoto ejecutado sin verificación.', { file, line }));
      if (/apt-get\s+install/.test(l) && !/--no-install-recommends/.test(l)) findings.push(finding('low', 'docker/apt-recommends', 'apt-get install sin --no-install-recommends.', { file, line }));
      if (/apt-get\s+(?:update|install)/.test(l) && !/rm\s+-rf\s+\/var\/lib\/apt\/lists/.test(l)) findings.push(finding('low', 'docker/apt-lists', 'No se limpian /var/lib/apt/lists en la misma capa.', { file, line }));
      if (/\bnpm\s+install\b/.test(l) && !/\bnpm\s+install\s+-g\b/.test(l)) findings.push(finding('low', 'docker/npm-install', 'Usa "npm ci" para builds reproducibles.', { file, line }));
      if (/\bsudo\b/.test(l)) findings.push(finding('low', 'docker/sudo', 'Evita sudo dentro de la imagen.', { file, line }));
      if (/chmod\s+(?:-R\s+)?777/.test(l)) findings.push(finding('medium', 'docker/chmod-777', 'Permisos 777.', { file, line }));
    }
    if (I === 'EXPOSE' && /\b22\b/.test(l)) findings.push(finding('medium', 'docker/ssh-port', 'EXPOSE 22: no ejecutes SSH en contenedores.', { file, line }));
    if (I === 'COPY' && /^COPY\s+(?:--\S+\s+)*\.\s+\S+/i.test(l) && !hasDockerignore) {
      findings.push(finding('medium', 'docker/no-dockerignore', 'COPY . sin .dockerignore: puede copiar .env, .git o node_modules a la imagen.', { file, line }));
    }
  }
  if (stages.length && (!lastUser || /^(?:root|0)(?::|$)/.test(lastUser))) {
    findings.push(finding('high', 'docker/runs-as-root', 'La etapa final se ejecuta como root: añade USER sin privilegios.', { file }));
  }
  if (stages.length && !hasHealthcheck) findings.push(finding('low', 'docker/no-healthcheck', 'Sin HEALTHCHECK (opcional si el orquestador define probes).', { file }));
  findings.push(...scanText(text, { file }));
  return findings;
}

export function auditComposeText(text, file) {
  const findings = [];
  if (!text) return findings;
  text.split(/\r?\n/).forEach((l, i) => {
    const line = i + 1;
    if (/privileged\s*:\s*true/.test(l)) findings.push(finding('high', 'compose/privileged', 'Contenedor privilegiado.', { file, line }));
    if (/\/var\/run\/docker\.sock/.test(l)) findings.push(finding('high', 'compose/docker-sock', 'Monta el socket de Docker (equivale a root en el host).', { file, line }));
    if (/network_mode\s*:\s*["']?host/.test(l)) findings.push(finding('medium', 'compose/host-network', 'network_mode: host.', { file, line }));
    if (/image\s*:\s*\S+:latest\b/.test(l)) findings.push(finding('medium', 'compose/latest-tag', 'Imagen con :latest.', { file, line }));
    if (/^\s*-?\s*["']?(?:0\.0\.0\.0:)?\d+:\d+["']?\s*$/.test(l) && /5432|3306|6379|27017/.test(l)) {
      findings.push(finding('medium', 'compose/db-port-exposed', 'Puerto de base de datos publicado en todas las interfaces; usa 127.0.0.1:PUERTO.', { file, line }));
    }
  });
  findings.push(...scanText(text, { file }));
  return findings;
}

export function auditContainers(root) {
  const findings = [];
  const notes = [];
  const files = walkFiles(root).filter((f) => /(?:^|[\\/])(?:Dockerfile(?:\.[\w-]+)?|[\w.-]+\.Dockerfile|Containerfile|(?:docker-)?compose(?:\.[\w-]+)?\.ya?ml)$/i.test(f));
  if (!files.length) notes.push('No se encontraron Dockerfiles ni archivos compose.');
  for (const f of files) {
    const r = rel(root, f);
    if (/compose/i.test(r)) findings.push(...auditComposeText(readText(f), r));
    else findings.push(...auditDockerfileText(readText(f), r, { hasDockerignore: existsSync(join(dirname(f), '.dockerignore')) || existsSync(join(root, '.dockerignore')) }));
  }
  return { findings, notes, files: files.length };
}
