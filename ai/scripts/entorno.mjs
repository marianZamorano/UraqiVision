#!/usr/bin/env node
// Variables de entorno de UraqiVision (reglas en ai/hooks/lib/entorno.mjs). Nunca muestra valores.
//   node ai/scripts/entorno.mjs check       revisa archivos permitidos, estructura y claves sensibles vacías
//   node ai/scripts/entorno.mjs sync        crea el .env desde .env.example y sincroniza las claves (sin valores)
//   node ai/scripts/entorno.mjs compartir   copia tu .env a Descargas para compartirlo con el equipo
// Los asistentes de IA generan o actualizan el .env SOLO con `sync`: nunca lo leen ni lo escriben a mano.
import { revisar, sincronizar, compartir } from '../hooks/lib/entorno-git.mjs';
import { mensajePausa } from '../hooks/lib/entorno.mjs';

const sub = process.argv[2] ?? 'check';

if (sub === 'check') {
  const { errores, avisos } = revisar();
  for (const a of avisos) console.log(`Aviso: ${a}`);
  for (const e of errores) console.error(`✖ ${e}`);
  console.log(errores.length ? `\n${errores.length} problema(s) de entorno.` : 'Entorno correcto: .env y .env.example con la misma estructura.');
  process.exit(errores.length ? 1 : 0);
}

if (sub === 'sync') {
  const cambios = sincronizar();
  if (!cambios.length) console.log('Sin cambios: la estructura ya coincidía.');
  for (const c of cambios) console.log(`${c.archivo}: ${c.accion} (${c.claves.join(', ')})`);
  const estructura = cambios.filter((c) => c.estructura).flatMap((c) => c.claves);
  if (estructura.length) {
    const copia = compartir();
    console.log(`\n${mensajePausa(estructura, copia)}`);
  }
  process.exit(0);
}

if (sub === 'compartir') {
  const copia = compartir();
  console.log(copia ? `Tu .env se copió en ${copia}. Compártelo por un canal privado y bórralo de ahí después.` : 'No tienes .env: créalo con npm run env:sync.');
  process.exit(copia ? 0 : 1);
}

console.error(`Subcomando desconocido: ${sub} (usa check, sync o compartir)`);
process.exit(2);
