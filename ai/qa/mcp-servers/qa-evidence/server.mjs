#!/usr/bin/env node
// Servidor MCP "qa-evidence" sobre stdio (JSON-RPC 2.0, un mensaje por línea). Sin dependencias.
// Implementa el ciclo de vida con handshake `initialize` (revisiones hasta 2025-11-25), tools/list y tools/call.
// stdout se reserva EXCLUSIVAMENTE para mensajes del protocolo; los diagnósticos van a stderr sin datos sensibles.
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { TOOLS, ToolError, validateArgs, LIMITS } from './tools.mjs';
import { redactDeep } from '../../scripts/lib/secrets.mjs';

export const SERVER_INFO = { name: 'qa-evidence', version: '1.0.0' };
export const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_LINE = 10 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 200_000;

const INSTRUCTIONS =
  'Herramientas de SOLO LECTURA para analizar artefactos de QA (resultados de pruebas, contratos, k6, cobertura) dentro de la raíz del proyecto. ' +
  'No ejecutan pruebas ni escriben archivos. Distingue siempre los hechos que devuelven estas herramientas de tus hipótesis.';

export function createServer({ root = process.env.QA_EVIDENCE_ROOT || process.cwd(), log = (m) => process.stderr.write(`[qa-evidence] ${m}\n`) } = {}) {
  const ctx = { root: path.resolve(root) };
  let negotiated = null;

  const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
  const fail = (id, code, message, data) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } });

  function toolResult(payload, isError = false) {
    let text = JSON.stringify(payload, null, 2);
    if (text.length > MAX_OUTPUT_CHARS) text = `${text.slice(0, MAX_OUTPUT_CHARS)}\n… [salida truncada: ${text.length - MAX_OUTPUT_CHARS} caracteres]`;
    const result = { content: [{ type: 'text', text }], isError };
    if (!isError && negotiated && negotiated >= '2025-06-18' && payload && typeof payload === 'object' && !Array.isArray(payload)) result.structuredContent = payload;
    return result;
  }

  async function callTool(name, args) {
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { protocolError: fail(null, -32602, `Herramienta desconocida: ${name}`) };
    try {
      validateArgs(tool, args);
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new ToolError(`Tiempo límite excedido (${LIMITS.timeoutMs} ms)`)), LIMITS.timeoutMs);
      });
      const value = await Promise.race([Promise.resolve().then(() => tool.handler(args ?? {}, ctx)), timeout]).finally(() => clearTimeout(timer));
      return { result: toolResult(redactDeep(value)) };
    } catch (err) {
      const message = err instanceof ToolError ? err.message : 'Error interno de la herramienta';
      if (!(err instanceof ToolError)) log(`error interno en ${name}: ${err?.name ?? 'Error'}`);
      return { result: toolResult({ error: message }, true) };
    }
  }

  /** Procesa un mensaje ya parseado. Devuelve la respuesta o null para notificaciones. */
  async function handle(msg) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      return msg && 'id' in msg ? fail(msg.id, -32600, 'Petición inválida') : null;
    }
    const isNotification = !('id' in msg);
    const { id, method, params } = msg;
    switch (method) {
      case 'initialize': {
        const requested = params?.protocolVersion;
        negotiated = SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0];
        return ok(id, { protocolVersion: negotiated, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
      }
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return null;
      case 'ping':
        return isNotification ? null : ok(id, {});
      case 'tools/list':
        if (!negotiated) return fail(id, -32002, 'Servidor no inicializado');
        return ok(id, { tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })) });
      case 'tools/call': {
        if (!negotiated) return fail(id, -32002, 'Servidor no inicializado');
        if (!params || typeof params.name !== 'string') return fail(id, -32602, 'Falta params.name');
        const r = await callTool(params.name, params.arguments);
        if (r.protocolError) return { ...r.protocolError, id };
        return ok(id, r.result);
      }
      default:
        return isNotification ? null : fail(id, -32601, `Método no soportado: ${method}`);
    }
  }

  async function handleLine(line) {
    if (!line.trim()) return null;
    if (line.length > MAX_LINE) return fail(null, -32600, 'Mensaje demasiado grande');
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return fail(null, -32700, 'JSON inválido');
    }
    if (Array.isArray(msg)) return fail(null, -32600, 'Lotes JSON-RPC no soportados');
    return handle(msg);
  }

  return { handle, handleLine, ctx };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer();
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    const response = await server.handleLine(line);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  });
  rl.on('close', () => process.exit(0));
  process.stderr.write(`[qa-evidence] listo (raíz: ${server.ctx.root})\n`);
}
