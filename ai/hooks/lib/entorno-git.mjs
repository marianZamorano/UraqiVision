// Operaciones de entorno sobre el repositorio (leen y escriben archivos locales; nunca imprimen valores).
// Las usan ai/scripts/entorno.mjs y los hooks de git.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseClaves, compararClaves, sensiblesConValor, agregarClaves, clasificar, pares } from './entorno.mjs';

export function raiz() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

/** Entornos extra permitidos en package.json → "uraqi.envPermitidos" (por defecto, ninguno). */
export function permitidos(dir = raiz()) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).uraqi?.envPermitidos ?? [];
  } catch {
    return [];
  }
}

const leer = (archivo) => (fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null);

/** Revisión completa: archivos no permitidos, estructura y valores sensibles en las plantillas. */
export function revisar(dir = raiz()) {
  const perm = permitidos(dir);
  const errores = [];
  const avisos = [];
  const archivos = fs.readdirSync(dir).filter((f) => /^\.env/.test(f) && fs.statSync(path.join(dir, f)).isFile());
  for (const f of archivos) {
    if (clasificar(f, perm) === 'prohibido') {
      errores.push(`${f}: no permitido. Solo existen .env y .env.example; otro .env.* solo si es imprescindible, declarado en package.json → "uraqi.envPermitidos" con su .example.`);
    }
  }
  for (const [local, plantilla] of pares(perm)) {
    const tl = leer(path.join(dir, local));
    const tp = leer(path.join(dir, plantilla));
    if (tp === null) {
      if (tl !== null) errores.push(`Existe ${local} pero no ${plantilla}: crea la plantilla con npm run env:sync.`);
      continue;
    }
    const sens = sensiblesConValor(tp);
    if (sens.length) errores.push(`${plantilla}: las claves sensibles deben ir vacías (${sens.join(', ')}).`);
    if (tl === null) {
      avisos.push(`No tienes ${local}: créalo con npm run env:sync y pide los valores al equipo.`);
      continue;
    }
    const d = compararClaves(parseClaves(tl), parseClaves(tp));
    if (d.faltanEnLocal.length) errores.push(`${local} no tiene claves de ${plantilla}: ${d.faltanEnLocal.join(', ')} (npm run env:sync las agrega vacías).`);
    if (d.faltanEnPlantilla.length) errores.push(`${plantilla} no tiene claves de ${local}: ${d.faltanEnPlantilla.join(', ')} (npm run env:sync las agrega vacías a la plantilla).`);
  }
  return { errores, avisos };
}

/**
 * Sincroniza la estructura en ambos sentidos sin tocar valores existentes:
 * crea el local desde la plantilla si falta, agrega al local las claves nuevas (vacías) y agrega a la plantilla
 * las claves que solo tiene el local (vacías). Devuelve qué cambió (solo nombres de claves).
 */
export function sincronizar(dir = raiz()) {
  const cambios = [];
  for (const [local, plantilla] of pares(permitidos(dir))) {
    const rl = path.join(dir, local);
    const rp = path.join(dir, plantilla);
    let tl = leer(rl);
    let tp = leer(rp);
    if (tl === null && tp === null) continue;
    if (tp === null) {
      tp = agregarClaves('', parseClaves(tl), `Estructura de ${local}: solo nombres, sin valores (RNF-06)`);
      fs.writeFileSync(rp, tp);
      cambios.push({ archivo: plantilla, accion: 'creada', claves: parseClaves(tp), estructura: true });
      continue;
    }
    if (tl === null) {
      fs.writeFileSync(rl, agregarClaves('', parseClaves(tp), `Creado desde ${plantilla}: completa los valores (pídelos al equipo)`));
      cambios.push({ archivo: local, accion: 'creado', claves: parseClaves(tp), estructura: false });
      continue;
    }
    const d = compararClaves(parseClaves(tl), parseClaves(tp));
    if (d.faltanEnLocal.length) {
      fs.writeFileSync(rl, agregarClaves(tl, d.faltanEnLocal, `Claves nuevas de ${plantilla}: completa los valores`));
      cambios.push({ archivo: local, accion: 'claves agregadas', claves: d.faltanEnLocal, estructura: false });
    }
    if (d.faltanEnPlantilla.length) {
      fs.writeFileSync(rp, agregarClaves(tp, d.faltanEnPlantilla, null));
      cambios.push({ archivo: plantilla, accion: 'claves agregadas', claves: d.faltanEnPlantilla, estructura: true });
    }
  }
  return cambios;
}

/**
 * Solo hacia el local: agrega al .env (y a los permitidos) las claves de su plantilla que falten, vacías.
 * Nunca modifica las plantillas. Es lo que corresponde al recibir cambios de otros (pull, cambio de rama).
 */
export function sincronizarLocal(dir = raiz()) {
  const agregadas = [];
  for (const [local, plantilla] of pares(permitidos(dir))) {
    const tl = leer(path.join(dir, local));
    const tp = leer(path.join(dir, plantilla));
    if (tl === null || tp === null) continue;
    const { faltanEnLocal } = compararClaves(parseClaves(tl), parseClaves(tp));
    if (faltanEnLocal.length) {
      fs.writeFileSync(path.join(dir, local), agregarClaves(tl, faltanEnLocal, `Claves nuevas de ${plantilla}: completa los valores`));
      agregadas.push(...faltanEnLocal);
    }
  }
  return agregadas;
}

/** Copia el .env a la carpeta Descargas para compartirlo con el equipo. Devuelve la ruta o null si no hay .env. */
export function compartir(dir = raiz(), ahora = new Date()) {
  const origen = path.join(dir, '.env');
  if (!fs.existsSync(origen)) return null;
  const descargas = path.join(os.homedir(), 'Downloads');
  fs.mkdirSync(descargas, { recursive: true });
  const sello = ahora.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  const destino = path.join(descargas, `uraqivision-${sello}.env`);
  fs.copyFileSync(origen, destino);
  return destino;
}

/** Claves de .env.example en un commit (o en el stage con ":"). null si el archivo no existe allí. */
export function clavesEn(ref, archivo = '.env.example') {
  try {
    return parseClaves(execFileSync('git', ['show', `${ref}:${archivo}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

/**
 * Tras cambiar de rama o hacer pull: si .env.example cambió entre dos commits, agrega al .env local las claves
 * nuevas (vacías) y avisa qué valores pedir. Nunca modifica la plantilla ni imprime valores.
 */
export function avisarCambiosDeEntorno(anterior, nuevo) {
  if (!anterior || !nuevo || anterior === nuevo) return;
  const antes = clavesEn(anterior) ?? [];
  const despues = clavesEn(nuevo);
  if (!despues) return;
  const d = compararClaves(antes, despues);
  if (!d.faltanEnLocal.length && !d.faltanEnPlantilla.length) return;
  const agregadas = sincronizarLocal();
  process.stderr.write([
    '[uraqi] Cambió la estructura de .env.example.',
    d.faltanEnLocal.length ? `  Claves nuevas: ${d.faltanEnLocal.join(', ')}.` : '',
    d.faltanEnPlantilla.length ? `  Claves eliminadas: ${d.faltanEnPlantilla.join(', ')} (puedes quitarlas de tu .env).` : '',
    agregadas.length ? `  Se agregaron vacías a tu .env: ${agregadas.join(', ')}. Pide los valores a quien hizo el cambio (revisa si te compartió su .env).` : '',
  ].filter(Boolean).join('\n') + '\n');
}
