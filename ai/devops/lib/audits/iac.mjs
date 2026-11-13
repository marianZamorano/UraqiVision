// Auditoría estática de IaC (Terraform/OpenTofu y manifiestos Kubernetes).
// Nunca ejecuta apply/destroy. Con runTools=true y terraform instalado ejecuta solo
// "fmt -check" y "validate" tras "init -backend=false" (sin tocar estado remoto).
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { finding, hasCommand, readText, rel, walkFiles } from '../common.mjs';
import { scanText } from '../secrets.mjs';

export function auditTerraformText(text, file) {
  const findings = [];
  if (!text) return findings;
  const lines = text.split(/\r?\n/);
  lines.forEach((l, i) => {
    const line = i + 1;
    if (/cidr_blocks\s*=\s*\[[^\]]*"0\.0\.0\.0\/0"/.test(l) || /ipv6_cidr_blocks\s*=\s*\[[^\]]*"::\/0"/.test(l)) {
      findings.push(finding('high', 'iac/open-ingress', 'Regla abierta a Internet (0.0.0.0/0). Verifica que no sea ingress a puertos administrativos.', { file, line }));
    }
    if (/acl\s*=\s*"public-read(?:-write)?"/.test(l)) findings.push(finding('high', 'iac/public-bucket', 'Bucket con ACL pública.', { file, line }));
    if (/publicly_accessible\s*=\s*true/.test(l)) findings.push(finding('high', 'iac/public-db', 'Base de datos accesible públicamente.', { file, line }));
    if (/(?:encrypted|storage_encrypted)\s*=\s*false/.test(l)) findings.push(finding('medium', 'iac/no-encryption', 'Cifrado en reposo desactivado.', { file, line }));
    if (/"(?:Action|Resource)"\s*:\s*"\*"|actions\s*=\s*\[\s*"\*"\s*\]/.test(l)) findings.push(finding('high', 'iac/iam-wildcard', 'Política IAM con comodín (*): aplica mínimo privilegio.', { file, line }));
    if (/prevent_destroy\s*=\s*false/.test(l)) findings.push(finding('info', 'iac/prevent-destroy-off', 'prevent_destroy desactivado.', { file, line }));
  });
  if (/^\s*terraform\s*\{/m.test(text) && !/required_version\s*=/.test(text)) {
    findings.push(finding('low', 'iac/no-required-version', 'Bloque terraform sin required_version.', { file }));
  }
  const reqProviders = text.match(/required_providers\s*\{([\s\S]*?)\n\s*\}/);
  if (reqProviders && /source\s*=/.test(reqProviders[1]) && !/version\s*=/.test(reqProviders[1])) {
    findings.push(finding('medium', 'iac/unpinned-provider', 'Proveedores sin restricción de versión.', { file }));
  }
  for (const m of text.matchAll(/output\s+"([^"]*(?:password|secret|token|key)[^"]*)"\s*\{([\s\S]*?)\n\}/gi)) {
    if (!/sensitive\s*=\s*true/.test(m[2])) findings.push(finding('medium', 'iac/output-not-sensitive', `output "${m[1]}" debería marcarse sensitive = true.`, { file }));
  }
  for (const m of text.matchAll(/variable\s+"([^"]*(?:password|secret|token)[^"]*)"\s*\{([\s\S]*?)\n\}/gi)) {
    if (/default\s*=\s*"[^"]+"/.test(m[2])) findings.push(finding('high', 'iac/secret-default', `variable "${m[1]}" con valor por defecto literal.`, { file }));
  }
  findings.push(...scanText(text, { file }));
  return findings;
}

export function auditK8sText(text, file) {
  const findings = [];
  if (!text || !/^\s*kind\s*:/m.test(text)) return findings;
  text.split(/\r?\n/).forEach((l, i) => {
    const line = i + 1;
    if (/privileged\s*:\s*true/.test(l)) findings.push(finding('high', 'k8s/privileged', 'Contenedor privilegiado.', { file, line }));
    if (/hostNetwork\s*:\s*true|hostPID\s*:\s*true/.test(l)) findings.push(finding('high', 'k8s/host-namespace', 'Comparte namespaces del host.', { file, line }));
    if (/image\s*:\s*\S+:latest\b|image\s*:\s*[^:@\s]+\s*$/.test(l)) findings.push(finding('medium', 'k8s/mutable-image', 'Imagen sin versión fija.', { file, line }));
    if (/allowPrivilegeEscalation\s*:\s*true/.test(l)) findings.push(finding('medium', 'k8s/priv-escalation', 'allowPrivilegeEscalation: true.', { file, line }));
  });
  if (/kind\s*:\s*(?:Deployment|StatefulSet|DaemonSet|Pod)\b/.test(text) && !/resources\s*:/.test(text)) {
    findings.push(finding('low', 'k8s/no-resources', 'Sin requests/limits de recursos.', { file }));
  }
  if (/kind\s*:\s*Secret\b/.test(text) && /^\s*data\s*:/m.test(text)) {
    findings.push(finding('high', 'k8s/secret-manifest', 'Secret con datos en el repositorio (base64 no es cifrado). Usa Sealed Secrets/External Secrets.', { file }));
  }
  findings.push(...scanText(text, { file }));
  return findings;
}

function runTerraformTools(root, dirs) {
  const findings = [];
  const notes = [];
  const bin = hasCommand('terraform') ? 'terraform' : hasCommand('tofu') ? 'tofu' : null;
  if (!bin) {
    notes.push('terraform/tofu no instalado: se omiten fmt/validate (solo análisis estático).');
    return { findings, notes };
  }
  for (const d of dirs) {
    const fmt = spawnSync(bin, ['fmt', '-check', '-recursive'], { cwd: d, encoding: 'utf8' });
    if (fmt.status !== 0) findings.push(finding('low', 'iac/fmt', `${bin} fmt -check falló en ${rel(root, d)}.`, { file: rel(root, d) }));
    const init = spawnSync(bin, ['init', '-backend=false', '-input=false', '-no-color'], { cwd: d, encoding: 'utf8' });
    if (init.status !== 0) {
      notes.push(`${bin} init -backend=false falló en ${rel(root, d)} (¿sin red?); validate omitido.`);
      continue;
    }
    const val = spawnSync(bin, ['validate', '-no-color'], { cwd: d, encoding: 'utf8' });
    if (val.status !== 0) findings.push(finding('high', 'iac/validate', `${bin} validate falló en ${rel(root, d)}: ${(val.stderr || val.stdout).split('\n').find(Boolean) ?? ''}`, { file: rel(root, d) }));
  }
  return { findings, notes };
}

export function auditIac(root, { runTools = false } = {}) {
  const findings = [];
  const notes = [];
  const all = walkFiles(root);
  const tf = all.filter((f) => /\.(?:tf|tfvars)$/i.test(f));
  const k8s = all.filter((f) => /\.ya?ml$/i.test(f) && /(?:^|[\\/])(?:k8s|kubernetes|manifests|deploy|helm|charts)[\\/]/i.test(f));
  if (!tf.length && !k8s.length) notes.push('No se encontró IaC (Terraform/OpenTofu/Kubernetes). Para Vercel zero-config no es obligatorio.');
  for (const f of tf) findings.push(...auditTerraformText(readText(f), rel(root, f)));
  for (const f of k8s) findings.push(...auditK8sText(readText(f), rel(root, f)));
  if (runTools && tf.length) {
    const r = runTerraformTools(root, [...new Set(tf.map((f) => dirname(f)))]);
    findings.push(...r.findings);
    notes.push(...r.notes);
  }
  return { findings, notes, files: tf.length + k8s.length };
}
