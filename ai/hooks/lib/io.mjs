// Utilidades de entrada y salida comunes a los hooks.
export function platform() {
  const arg = process.argv.find((a) => a.startsWith('--platform='));
  return arg ? arg.split('=')[1] : 'claude';
}

export async function readStdinJson() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

/** Bloqueo: código 2 y motivo por stderr. Lo entienden Claude Code, Codex CLI y Gemini CLI. */
export function block(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

/** Error interno: avisa y deja pasar (las guardas son una capa extra sobre los permisos nativos). */
export function failOpen(name, err) {
  process.stderr.write(`[uraqi-guard] ${name}: error interno (${err?.message ?? err}); sin bloqueo.\n`);
  process.exit(0);
}
