#!/usr/bin/env node
// Hook de inicio de sesión: recuerda al agente la fuente de verdad y las reglas clave. Nunca bloquea.
// Uso: node ai/hooks/session-context.mjs --platform=<claude|codex|gemini>
import { platform } from './lib/io.mjs';

export const CONTEXT = `[UraqiVision] Contexto del proyecto
- Fuente de verdad: docs/UraqiVisionDocumentoMaestrov1.0.pdf (busca en la copia .txt por identificador: RF-xx, RNF-xx, MC-xx, RN-xx, CQ-xx, VC-xx, PS-xx, DP-xx). Lo que no está en el documento no está decidido.
- Respeta el alcance MVP (§8); las decisiones pendientes DP-01 a DP-08 (§29) no se implementan hasta resolverse.
- No inventes datos, cifras, fuentes, DOI ni endpoints. Separa hechos, propuestas, hipótesis y pendientes.
- Ciencia: promedios en lineal y dB después; misma órbita y grilla (RN-01); sin dato nunca es cero (RN-13); causas como hipótesis (RN-05); hectáreas con rango (RN-06).
- Textos de interfaz en español e inglés (RNF-03). Ninguna clave en el código ni en el repo (RNF-06).
- Cita los identificadores en código, tareas y commits. Commits sin Co-Authored-By de IA.
- Skills: documento-maestro, sdd-uraqivision y las de cada módulo. Subagentes revisores de solo lectura.
- Las guardas [uraqi-guard:<regla>] bloquean secretos, .env/.netrc y comandos destructivos.`;

try {
  if (platform() === 'claude') {
    process.stdout.write(`${CONTEXT}\n`);
  } else {
    process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: CONTEXT } })}\n`);
  }
} catch {
  // SessionStart nunca bloquea.
}
process.exit(0);
