// Reglas de las variables de entorno de UraqiVision (RNF-06). Funciones puras: nunca devuelven valores, solo
// nombres de claves, para que ningún mensaje ni asistente vea credenciales.
//
// - Solo existen `.env` (local, nunca se sube) y `.env.example` (se sube, misma estructura, sin credenciales).
// - Otros `.env.<nombre>` solo en caso de extrema necesidad: se declaran en package.json → "uraqi.envPermitidos"
//   y cada uno tiene su `.env.<nombre>.example`.
// - El `.env` y su `.example` tienen siempre las mismas claves.
// - En los `.example`, las claves sensibles van vacías.

export const SENSIBLE = /(KEY|TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|AUTH)/i;

/** Entradas CLAVE=valor en orden (acepta `export CLAVE=...`; ignora comentarios y líneas vacías). */
export function parseEntradas(texto) {
  const entradas = [];
  for (const linea of String(texto ?? '').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(linea);
    if (m) entradas.push({ clave: m[1], valor: m[2].trim().replace(/^(['"])(.*)\1$/, '$2') });
  }
  return entradas;
}

export const parseClaves = (texto) => parseEntradas(texto).map((e) => e.clave);

/** Diferencia de estructura: claves que faltan en cada lado. */
export function compararClaves(clavesLocal, clavesPlantilla) {
  const local = new Set(clavesLocal);
  const plantilla = new Set(clavesPlantilla);
  return {
    faltanEnLocal: [...plantilla].filter((c) => !local.has(c)),
    faltanEnPlantilla: [...local].filter((c) => !plantilla.has(c)),
  };
}

/** Claves sensibles con valor en una plantilla (.example): nunca deberían tener valor. */
export const sensiblesConValor = (textoPlantilla) => parseEntradas(textoPlantilla).filter((e) => SENSIBLE.test(e.clave) && e.valor !== '').map((e) => e.clave);

/** Agrega al final las claves que falten, vacías. No toca las existentes ni sus valores. */
export function agregarClaves(texto, claves, comentario) {
  if (!claves.length) return texto;
  const base = String(texto ?? '');
  const sep = base === '' || base.endsWith('\n') ? '' : '\n';
  return `${base}${sep}${comentario ? `\n# ${comentario}\n` : ''}${claves.map((c) => `${c}=`).join('\n')}\n`;
}

/**
 * Clasifica un nombre de archivo de entorno:
 *   'local' (.env), 'plantilla' (.env.example), 'local-permitido' (.env.<x> declarado),
 *   'plantilla-permitida' (.env.<x>.example declarado), 'prohibido' (cualquier otro .env*), null (no es .env*)
 */
export function clasificar(nombre, permitidos = []) {
  if (!/^\.env/.test(nombre)) return null;
  if (nombre === '.env') return 'local';
  if (nombre === '.env.example') return 'plantilla';
  const m = /^\.env\.([\w-]+?)(\.example)?$/.exec(nombre);
  if (m && permitidos.includes(m[1])) return m[2] ? 'plantilla-permitida' : 'local-permitido';
  return 'prohibido';
}

/** Par local → plantilla de cada archivo de entorno permitido. */
export const pares = (permitidos = []) => [['.env', '.env.example'], ...permitidos.map((p) => [`.env.${p}`, `.env.${p}.example`])];

export const mensajePausa = (claves, copia) => [
  '[uraqi-guard:entorno-pausa] ⏸ PAUSA: cambiaste la estructura del .env.',
  `Claves nuevas o eliminadas: ${claves.join(', ') || '(ninguna detectada)'}.`,
  'Antes de continuar, comunica este cambio a tu equipo:',
  copia ? `  - Tu .env se copió en ${copia}: compártelo por un canal privado y bórralo de ahí después.` : '  - Comparte los valores nuevos por un canal privado (npm run env:compartir copia tu .env a Descargas).',
  '  - La PR avisará a los colaboradores, pero no esperes a la PR para decírselo.',
  'Cuando lo hayas comunicado, repite el commit con URAQI_ENV_COMUNICADO=1.',
  'Asistentes de IA: detente y pide a la persona que comunique el cambio; no lo confirmes por ella.',
].join('\n');
