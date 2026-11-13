// Política de escritura de archivos (Edit/Write/MultiEdit/NotebookEdit) y de herramientas MCP.
import { toPosix } from './common.mjs';
import { isSensitiveFilename, scanText } from './secrets.mjs';

const ASK_PATHS = [
  { id: 'ci-pipeline', re: /(?:^|\/)\.github\/workflows\/[^/]+\.ya?ml$|(?:^|\/)\.gitlab-ci\.ya?ml$|(?:^|\/)azure-pipelines\.ya?ml$|(?:^|\/)Jenkinsfile$|(?:^|\/)\.circleci\/config\.ya?ml$|(?:^|\/)bitbucket-pipelines\.yml$/i,
    reason: 'Cambia un pipeline CI/CD (puede alterar despliegues o permisos).' },
  { id: 'container', re: /(?:^|\/)(?:Dockerfile(?:\.[\w-]+)?|[\w.-]+\.Dockerfile|Containerfile|docker-compose(?:\.[\w-]+)?\.ya?ml|compose(?:\.[\w-]+)?\.ya?ml|\.dockerignore)$/i,
    reason: 'Cambia la definición de contenedores.' },
  { id: 'iac', re: /\.(?:tf|tfvars|tf\.json|hcl|bicep)$|(?:^|\/)(?:Pulumi(?:\.[\w-]+)?\.ya?ml|cdk\.json|serverless\.ya?ml|template\.ya?ml)$|(?:^|\/)(?:k8s|kubernetes|helm|charts|manifests)\/.+\.ya?ml$/i,
    reason: 'Cambia infraestructura como código.' },
  { id: 'vercel-config', re: /(?:^|\/)(?:vercel\.json|vercel\.ts|\.vercelignore|now\.json)$|(?:^|\/)\.vercel\//i,
    reason: 'Cambia la configuración de Vercel (rutas, headers, funciones, crons).' },
  { id: 'claude-controls', re: /(?:^|\/)\.claude\/(?:settings(?:\.local)?\.json|hooks\/)|(?:^|\/)\.mcp\.json$|(?:^|\/)DevOps\/(?:hooks|lib|config)\//i,
    reason: 'Cambia los controles de seguridad del agente (hooks, permisos, políticas). Un agente no debe debilitar sus propias barreras.' },
  { id: 'git-controls', re: /(?:^|\/)\.git\/(?:hooks\/|config$)|(?:^|\/)\.husky\/|(?:^|\/)(?:CODEOWNERS|\.pre-commit-config\.yaml|lefthook\.ya?ml)$/i,
    reason: 'Cambia hooks de Git o propiedad del código.' },
  { id: 'dependency-manifest', re: /(?:^|\/)(?:\.npmrc|\.yarnrc(?:\.yml)?|pnpm-workspace\.yaml)$/i,
    reason: 'Cambia el registro/credenciales de paquetes.' },
];

/** Texto que el tool va a escribir, según el esquema de cada herramienta. */
export function contentOf(toolName, input = {}) {
  switch (toolName) {
    case 'Write':
      return input.content ?? '';
    case 'Edit':
      return input.new_string ?? '';
    case 'MultiEdit':
      return (input.edits ?? []).map((e) => e?.new_string ?? '').join('\n');
    case 'NotebookEdit':
      return input.new_source ?? '';
    default:
      return '';
  }
}

export function evaluateFileWrite(toolName, input = {}) {
  const path = toPosix(input.file_path ?? input.notebook_path ?? '');
  if (isSensitiveFilename(path)) {
    return { decision: 'deny', id: 'sensitive-file', reason: `Escritura en archivo sensible (${path.split('/').pop()}). Los secretos se gestionan en el proveedor, no en archivos editados por el agente.` };
  }
  const secrets = scanText(contentOf(toolName, input));
  if (secrets.length) {
    const kinds = [...new Set(secrets.map((s) => s.id))].join(', ');
    return { decision: 'deny', id: 'secret-in-content', reason: `El contenido parece incluir secretos (${kinds}). Usa variables de entorno del proveedor; si es un falso positivo documentado, añade el comentario devops-allow-secret en esa línea.` };
  }
  const hit = ASK_PATHS.find((p) => p.re.test(path));
  if (hit) return { decision: 'ask', id: hit.id, reason: hit.reason };
  return { decision: null, id: null, reason: null };
}

// --- MCP ---------------------------------------------------------------------------------
const MCP_READ_PREFIX = /^(?:list|get|search|read|fetch|web_fetch|check|inspect|query|describe|show|view|find|lookup|audit|detect|scan|validate|explain|summarize|status|whoami)(?:_|$)/i;
const MCP_PURCHASE = /(?:purchase|buy|checkout|billing|upgrade_plan|add_payment|subscribe)/i;
const MCP_PRODUCTION = /(?:promote|rollback|production|prod_)/i;

/** tool_name con formato mcp__<server>__<tool>. */
export function evaluateMcpTool(toolName) {
  const m = /^mcp__(.+?)__(.+)$/.exec(String(toolName ?? ''));
  if (!m) return { decision: null, id: null, reason: null };
  const [, server, tool] = m;
  if (MCP_PURCHASE.test(tool)) {
    return { decision: 'deny', id: 'mcp-purchase', reason: `La herramienta ${server}/${tool} puede generar cargos. Las compras solo las realiza una persona desde el dashboard del proveedor.` };
  }
  if (MCP_READ_PREFIX.test(tool)) return { decision: null, id: null, reason: null };
  if (MCP_PRODUCTION.test(tool)) {
    return { decision: 'ask', id: 'mcp-production', reason: `La herramienta ${server}/${tool} afecta a producción. Requiere aprobación explícita.` };
  }
  return { decision: 'ask', id: 'mcp-write', reason: `La herramienta ${server}/${tool} no es de solo lectura; confirma el alcance antes de ejecutarla.` };
}
