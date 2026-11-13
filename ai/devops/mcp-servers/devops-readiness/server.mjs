#!/usr/bin/env node
// MCP server "devops-readiness" (stdio, JSON-RPC 2.0, sin dependencias).
// Expone SOLO herramientas de lectura sobre el proyecto confinado en DEVOPS_MCP_ROOT (o cwd).
// No ejecuta shell, builds ni comandos remotos; no devuelve valores de secretos.
import { realpathSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { summarize, sortFindings } from '../../lib/common.mjs';
import { detectStack, vercelCompatibility } from '../../lib/stack.mjs';
import { auditVercelConfig } from '../../lib/audits/vercel.mjs';
import { auditWorkflows } from '../../lib/audits/workflows.mjs';
import { auditContainers } from '../../lib/audits/dockerfile.mjs';
import { auditIac } from '../../lib/audits/iac.mjs';
import { scanTree } from '../../lib/secrets.mjs';
import { checkEnv } from '../../lib/env.mjs';
import { loadLimits, checkUsage, staleness } from '../../lib/free-tier.mjs';
import { readiness } from '../../lib/readiness.mjs';
import { checkApprovalPolicy } from '../../lib/approval-policy.mjs';

export const SERVER_INFO = { name: 'devops-readiness', version: '1.0.0' };
export const SUPPORTED_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_FINDINGS = 200;

const ROOT = realpathSync(resolve(process.env.DEVOPS_MCP_ROOT ?? process.cwd()));

/** Resuelve una ruta relativa dentro de ROOT; rechaza escapes (.., absolutas fuera, symlinks). */
export function confine(p = '.') {
  const full = resolve(ROOT, String(p));
  if (!existsSync(full)) throw new RpcError(-32602, `La ruta no existe: ${p}`);
  const real = realpathSync(full);
  if (real !== ROOT && !real.startsWith(ROOT + sep)) throw new RpcError(-32602, `Ruta fuera de la raíz permitida: ${p}`);
  return real;
}

class RpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const pathProp = { path: { type: 'string', description: 'Ruta relativa a la raíz del proyecto (por defecto ".").' } };
const report = (r) => {
  const findings = sortFindings(r.findings ?? []);
  return { ...r, summary: summarize(findings), findings: findings.slice(0, MAX_FINDINGS), truncated: findings.length > MAX_FINDINGS };
};

export const TOOLS = {
  detect_stack: {
    description: 'Inventario de lenguajes, frameworks, gestores de paquetes, CI, IaC y señales (BD, colas, uploads), con compatibilidad preliminar con Vercel.',
    inputSchema: { type: 'object', properties: pathProp, additionalProperties: false },
    run: ({ path }) => {
      const stack = detectStack(confine(path));
      const compat = vercelCompatibility(stack);
      return report({ stack: { ...stack, root: '.' }, components: compat.components, findings: compat.findings });
    },
  },
  audit_vercel_config: {
    description: 'Audita vercel.json/vercel.ts/.gitignore: claves desconocidas o legacy, crons y duración frente al plan, secretos, cabeceras.',
    inputSchema: { type: 'object', properties: { ...pathProp, plan: { type: 'string', enum: ['hobby'], default: 'hobby' } }, additionalProperties: false },
    run: ({ path, plan = 'hobby' }) => report(auditVercelConfig(confine(path), { plan })),
  },
  audit_workflows: {
    description: 'Revisión estática de GitHub Actions: permisos, pinning por SHA, inyección de scripts, pull_request_target, secretos en logs.',
    inputSchema: { type: 'object', properties: pathProp, additionalProperties: false },
    run: ({ path }) => report(auditWorkflows(confine(path))),
  },
  audit_containers: {
    description: 'Revisión estática de Dockerfiles y compose: usuario root, tags mutables, secretos en capas, curl|sh, puertos expuestos.',
    inputSchema: { type: 'object', properties: pathProp, additionalProperties: false },
    run: ({ path }) => report(auditContainers(confine(path))),
  },
  audit_iac: {
    description: 'Revisión estática de Terraform/OpenTofu y manifiestos Kubernetes. No ejecuta terraform (ni plan ni apply).',
    inputSchema: { type: 'object', properties: pathProp, additionalProperties: false },
    run: ({ path }) => report(auditIac(confine(path), { runTools: false })),
  },
  scan_secrets: {
    description: 'Detecta posibles secretos y archivos sensibles. Devuelve tipo, archivo y línea; NUNCA el valor.',
    inputSchema: { type: 'object', properties: pathProp, additionalProperties: false },
    run: ({ path }) => report({ findings: scanTree(confine(path)) }),
  },
  check_env_example: {
    description: 'Lista las variables declaradas en un .env.example y, si se indica env_file, si cada una está presente (sin valores).',
    inputSchema: {
      type: 'object',
      properties: { example: { type: 'string', description: 'Ruta al .env.example' }, env_file: { type: 'string', description: 'Ruta opcional a un .env local para comprobar presencia' } },
      required: ['example'],
      additionalProperties: false,
    },
    run: ({ example, env_file }) => report(checkEnv({ exampleFile: confine(example), envFile: env_file ? confine(env_file) : null, processEnv: {} })),
  },
  get_free_tier_limits: {
    description: 'Límites de planes gratuitos verificados (Vercel Hobby, Neon, Supabase, GitHub Actions) con fecha de verificación y fuentes.',
    inputSchema: { type: 'object', properties: { provider: { type: 'string' } }, additionalProperties: false },
    run: ({ provider }) => {
      const l = loadLimits();
      if (provider && !l.providers[provider]) throw new RpcError(-32602, `Proveedor sin datos verificados: ${provider}`);
      return { verifiedAt: l.verifiedAt, ...staleness(l), providers: provider ? { [provider]: l.providers[provider] } : l.providers };
    },
  },
  check_free_tier_usage: {
    description: 'Compara un consumo aportado con los límites gratuitos documentados y avisa al acercarse (80%) o exceder.',
    inputSchema: {
      type: 'object',
      properties: { usage: { type: 'object', description: '{"provider":"vercel","plan":"hobby","monthly":{"functionInvocations":120000}}' }, warn_at: { type: 'number', default: 0.8 } },
      required: ['usage'],
      additionalProperties: false,
    },
    run: ({ usage, warn_at = 0.8 }) => report(checkUsage(usage, loadLimits(), { warnAt: warn_at })),
  },
  deployment_readiness: {
    description: 'Informe agregado de readiness (sin build): NOT_READY o CONFIG_PREPARED. El build y el smoke test se ejecutan con scripts bajo supervisión.',
    inputSchema: { type: 'object', properties: { app_dir: { type: 'string', default: '.' }, plan: { type: 'string', default: 'hobby' } }, additionalProperties: false },
    run: ({ app_dir = '.', plan = 'hobby' }) => {
      confine(app_dir);
      const r = readiness(ROOT, { appDir: app_dir, plan, withBuild: false });
      return { ...report(r), level: r.level, note: r.note };
    },
  },
  check_approval_policy: {
    description: 'Verifica que .claude/settings.json activa los hooks de supervisión, reglas deny/ask y bloqueo del modo bypass.',
    inputSchema: { type: 'object', properties: { settings_path: { type: 'string', default: '.claude/settings.json' } }, additionalProperties: false },
    run: ({ settings_path = '.claude/settings.json' }) => report(checkApprovalPolicy(confine(settings_path))),
  },
};

function validateArgs(schema, args) {
  if (args === undefined || args === null) args = {};
  if (typeof args !== 'object' || Array.isArray(args)) throw new RpcError(-32602, 'arguments debe ser un objeto');
  for (const k of schema.required ?? []) if (!(k in args)) throw new RpcError(-32602, `Falta el argumento requerido: ${k}`);
  if (schema.additionalProperties === false) {
    for (const k of Object.keys(args)) if (!(k in (schema.properties ?? {}))) throw new RpcError(-32602, `Argumento no permitido: ${k}`);
  }
  for (const [k, v] of Object.entries(args)) {
    const t = schema.properties?.[k]?.type;
    const ok = t === undefined || (t === 'object' ? typeof v === 'object' && v !== null && !Array.isArray(v) : typeof v === t);
    if (!ok) throw new RpcError(-32602, `El argumento ${k} debe ser de tipo ${t}`);
    const en = schema.properties?.[k]?.enum;
    if (en && !en.includes(v)) throw new RpcError(-32602, `El argumento ${k} debe ser uno de: ${en.join(', ')}`);
  }
  return args;
}

export function handle(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      return {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Herramientas DevOps de solo lectura. No despliegan ni modifican nada. Las operaciones con efectos (deploy, migraciones, IaC apply) requieren aprobación humana fuera de este servidor.',
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return {
        tools: Object.entries(TOOLS).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        })),
      };
    case 'tools/call': {
      const tool = TOOLS[params?.name];
      if (!tool) throw new RpcError(-32602, `Herramienta desconocida: ${params?.name}`);
      try {
        const result = tool.run(validateArgs(tool.inputSchema, params.arguments));
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false };
      } catch (err) {
        if (err instanceof RpcError) throw err;
        return { content: [{ type: 'text', text: `Error ejecutando ${params.name}: ${err.message}` }], isError: true };
      }
    }
    default:
      if (id === undefined) return undefined; // notificaciones (p. ej. notifications/initialized)
      throw new RpcError(-32601, `Método no soportado: ${method}`);
  }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

const isMain = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    try {
      const result = handle(msg);
      if (msg.id !== undefined && result !== undefined) send({ jsonrpc: '2.0', id: msg.id, result });
    } catch (err) {
      if (msg.id !== undefined) send({ jsonrpc: '2.0', id: msg.id, error: { code: err.code ?? -32603, message: err.message } });
    }
  });
  process.stderr.write(`devops-readiness MCP listo (raíz: ${ROOT})\n`);
}
