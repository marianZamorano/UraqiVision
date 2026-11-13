// Validación de variables de entorno requeridas. SOLO informa presencia/ausencia;
// nunca imprime ni devuelve valores.
import { readText, finding } from './common.mjs';

export function parseDotenvKeys(text) {
  const keys = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (m) keys.push({ key: m[1], empty: m[2].trim().replace(/^["']|["']$/g, '') === '' });
  }
  return keys;
}

/**
 * required: lista de claves (o se deriva de exampleFile).
 * sources: { envFile?: ruta a un .env local, processEnv?: objeto } — se consultan por presencia.
 */
export function checkEnv({ required = [], exampleFile = null, envFile = null, processEnv = process.env } = {}) {
  const findings = [];
  const notes = [];
  let keys = [...required];
  if (exampleFile) {
    const t = readText(exampleFile);
    if (t === null) findings.push(finding('high', 'env/no-example', `No existe ${exampleFile}.`));
    else keys.push(...parseDotenvKeys(t).map((k) => k.key));
  }
  keys = [...new Set(keys)];
  if (!keys.length) notes.push('No hay variables requeridas que validar.');
  const fileKeys = envFile ? parseDotenvKeys(readText(envFile) ?? '') : [];
  if (envFile && readText(envFile) === null) notes.push(`Archivo ${envFile} no encontrado; solo se consulta el entorno del proceso.`);
  const status = keys.map((key) => {
    const inFile = fileKeys.find((k) => k.key === key);
    const inProc = Object.prototype.hasOwnProperty.call(processEnv, key) && processEnv[key] !== '';
    const present = Boolean((inFile && !inFile.empty) || inProc);
    if (!present) findings.push(finding('high', 'env/missing', `Variable requerida ausente o vacía: ${key}`));
    return { key, present, source: inFile && !inFile.empty ? 'file' : inProc ? 'process' : null };
  });
  for (const k of keys) {
    if (/^(?:NEXT_PUBLIC_|VITE_|PUBLIC_|NUXT_PUBLIC_|REACT_APP_|EXPO_PUBLIC_)/.test(k) && /SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE_URL/i.test(k)) {
      findings.push(finding('critical', 'env/public-secret', `${k} tiene prefijo público: su valor se incrusta en el bundle del navegador.`));
    }
  }
  return { findings, notes, status };
}
