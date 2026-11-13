#!/usr/bin/env node
// Hook de git commit-msg. Solo avisa, nunca bloquea:
// - si el mensaje no cita ningún identificador del documento maestro (§1, §28);
// - si incluye un Co-Authored-By de un asistente de IA (convención del equipo, AGENTS.md §6).
import fs from 'node:fs';

const file = process.argv[2];
const msg = file ? fs.readFileSync(file, 'utf8').replace(/^#.*$/gm, '').trim() : '';
if (!msg || /^(Merge|Revert) /.test(msg)) process.exit(0);

const ID = /\b(?:RF|RNF|MC|RN|CQ|VC|PS|CU|HU|OE|DP)-\d{2}\b|\bM-[A-ZÁÉÍÓÚ]{4,}\b/;
const AI_COAUTHOR = /^Co-Authored-By:.*\b(?:Claude|Anthropic|Gemini|Codex|OpenAI|ChatGPT|opencode|Copilot)\b/im;

if (!ID.test(msg)) {
  process.stderr.write('[uraqi] Aviso: el mensaje no cita ningún identificador (RF-xx, RNF-xx, MC-xx, RN-xx, CQ-xx, VC-xx, PS-xx, M-MODULO). Si el commit resuelve un requisito, cítalo.\n');
}
if (AI_COAUTHOR.test(msg)) {
  process.stderr.write('[uraqi] Aviso: el mensaje incluye un Co-Authored-By de un asistente de IA; la convención del equipo es no incluirlo.\n');
}
process.exit(0);
