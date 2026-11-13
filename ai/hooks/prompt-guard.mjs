#!/usr/bin/env node
// Hook del mensaje del usuario (UserPromptSubmit en Claude y Codex, BeforeAgent en Gemini).
// Si el mensaje contiene un secreto, no se envía al modelo.
import { evaluatePrompt } from './lib/guard.mjs';
import { readStdinJson, block, failOpen } from './lib/io.mjs';

try {
  const event = await readStdinJson();
  const result = evaluatePrompt(event.prompt ?? event.user_prompt ?? '');
  if (result.decision === 'deny') block(result.reason);
  process.exit(0);
} catch (err) {
  failOpen('prompt-guard', err);
}
