#!/usr/bin/env node
// Hook de git post-merge (pull o merge): si cambió .env.example, agrega al .env local las claves nuevas vacías y
// avisa qué valores pedir al equipo. Nunca bloquea ni muestra valores.
import { avisarCambiosDeEntorno } from './lib/entorno-git.mjs';

try {
  avisarCambiosDeEntorno('ORIG_HEAD', 'HEAD');
} catch {
  // el aviso nunca impide el merge
}
process.exit(0);
