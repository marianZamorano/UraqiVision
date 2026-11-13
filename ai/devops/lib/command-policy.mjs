// Política de comandos de shell (Bash y PowerShell) para el hook PreToolUse.
// deny  = nunca lo ejecuta un agente (irreversible, expone secretos o salta controles).
// ask   = requiere aprobación humana explícita en el diálogo de Claude Code.
// null  = sin decisión: aplica el flujo normal de permisos.
// Precedencia: deny > ask > null (igual que Claude Code).

const R = (id, decision, re, reason) => ({ id, decision, re, reason });

export const COMMAND_RULES = [
  // --- Destrucción local irreversible -------------------------------------------------
  R('fs-rm-root', 'deny', /\brm\s+(?:-[a-zA-Z]*[rR][a-zA-Z]*\s+|--recursive\s+|-[a-zA-Z]*f[a-zA-Z]*\s+|--force\s+|--no-preserve-root\s+)+(?:\/|~|\$HOME|\*|\.{1,2}\/?|[A-Za-z]:[\\/]?)(?:\s|$|;|&|\|)/,
    'Borrado recursivo sobre raíz, HOME, comodín o directorio actual.'),
  R('fs-remove-item-root', 'deny', /\bRemove-Item\b(?=.*-Recurse)(?=.*-Force).*?\s(?:[A-Za-z]:\\?|~|\$HOME|\$env:USERPROFILE|\\|\/|\*)(?:\s|$|;)/i,
    'Remove-Item -Recurse -Force sobre una raíz o perfil de usuario.'),
  R('fs-disk-tools', 'deny', /\b(?:mkfs(?:\.\w+)?|diskpart|format-volume|fdisk)\b|\bdd\s+[^|;&]*\bof=\/dev\//i,
    'Herramientas de disco destructivas.'),
  R('fs-chmod-777-root', 'deny', /\bchmod\s+-R\s+0?777\s+\/(?:\s|$)/, 'Permisos 777 recursivos sobre la raíz.'),

  // --- Ejecución de código remoto opaco ----------------------------------------------
  R('remote-pipe-shell', 'deny', /\b(?:curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z|da|k)?sh\b|\|\s*(?:iex|invoke-expression)\b/i,
    'Descargar y ejecutar código remoto sin inspección (curl | sh).'),

  // --- Exposición de secretos ----------------------------------------------------------
  R('secret-dump-env', 'deny', /(?:^|[;&|]\s*)(?:printenv|env|set|export\s+-p)\s*(?:$|[;&|>])|\b(?:Get-ChildItem|gci|dir|ls)\s+env:(?!\w)/i,
    'Volcar todas las variables de entorno expone secretos en el transcript.'),
  R('secret-print-var', 'deny', /\bprintenv\s+[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|DATABASE_URL|CONNECTION_STRING)|\b(?:echo|printf|Write-Output|Write-Host)\b[^;&|]*(?:\$\{?|\$env:)[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY|DATABASE_URL|CONNECTION_STRING)/i,
    'Imprimir una variable que probablemente contiene un secreto.'),
  R('secret-read-dotenv', 'deny', null, 'Leer un archivo .env real (usa scripts/env-check.mjs, que solo informa presencia).'),
  R('secret-cli-print', 'ask', /\bneon\s+connection-string\b|\bvercel\s+env\s+pull\b|\bgh\s+auth\s+token\b|\bvercel\s+env\s+run\b/i,
    'El comando escribe o imprime credenciales; confirma destino y necesidad.'),

  // --- Saltarse controles --------------------------------------------------------------
  R('git-no-verify', 'deny', /\bgit\s+(?:commit|push|merge|rebase)\b[^;&|]*\s(?:--no-verify|-n)(?:\s|$)/,
    'Omitir los hooks de Git (--no-verify) desactiva los controles de seguridad.'),
  R('git-force-push', 'deny', /\bgit\b[^;&|]*\bpush\b[^;&|]*(?:\s--force(?:-with-lease|-if-includes)?\b|\s-f\b|\s\+[^\s]+)/,
    'Force push reescribe historia remota; prohibido para agentes.'),
  R('skills-auto-install', 'deny', /\b(?:npx\s+)?skills\s+add\b[^;&|]*\s(?:-y|--yes)\b|\bneon\s+skills\b[^;&|]*\s(?:-y|--yes)\b/i,
    'Instalar skills sin confirmación salta la auditoría obligatoria (docs/SKILL_AUDIT.md).'),

  // --- IaC ------------------------------------------------------------------------------
  R('iac-auto-approve', 'deny', /\b(?:terraform|tofu|terragrunt|pulumi)\b[^;&|]*\b(?:apply|destroy|up)\b[^;&|]*(?:-auto-approve|--yes|-y\b|--skip-preview)/i,
    'apply/destroy sin revisión del plan está prohibido.'),
  R('iac-mutate', 'ask', /\b(?:terraform|tofu|terragrunt)\b[^;&|]*\b(?:apply|destroy|import|taint|untaint|state\s+(?:rm|mv|push|replace-provider)|force-unlock|workspace\s+delete)\b|\bpulumi\b[^;&|]*\b(?:up|destroy|import|refresh|state\s+delete)\b/i,
    'Modifica infraestructura o estado remoto.'),

  // --- Cloud y orquestación --------------------------------------------------------------
  R('aws-mutate', 'ask', /\baws\s+\S+\s+(?:create|delete|put|update|modify|terminate|run-instances|start|stop|reboot|attach|detach|associate|disassociate|authorize|revoke|remove|deregister|register|tag|untag)[\w-]*/i,
    'Operación de escritura en AWS.'),
  R('aws-s3-mutate', 'ask', /\baws\s+s3\s+(?:rm|rb|mv|sync|cp\b[^;&|]*\ss3:\/\/)/i, 'Escritura o borrado en S3.'),
  R('gcloud-mutate', 'ask', /\bgcloud\b[^;&|]*\s(?:create|delete|deploy|update|set-iam-policy|add-iam-policy-binding|remove-iam-policy-binding|enable|disable)\b/i,
    'Operación de escritura en Google Cloud.'),
  R('az-mutate', 'ask', /\baz\s+[^;&|]*\s(?:create|delete|update|set|assign|purge|deploy)\b/i, 'Operación de escritura en Azure.'),
  R('k8s-mutate', 'ask', /\b(?:kubectl|oc)\b[^;&|]*\s(?:apply|create|delete|replace|patch|scale|drain|cordon|rollout\s+(?:restart|undo)|set|edit|annotate|label)\b|\bhelm\s+(?:install|upgrade|uninstall|rollback|delete)\b/i,
    'Modifica un clúster Kubernetes.'),
  R('container-destroy', 'ask', /\bdocker\s+(?:system|volume|image|container|network|builder)\s+prune\b|\bdocker\s+volume\s+rm\b|\bdocker\s+(?:push|login)\b|\bdocker\s+compose\b[^;&|]*\bdown\b[^;&|]*\s-v\b/i,
    'Borra datos de contenedores o publica imágenes.'),

  // --- Bases de datos ---------------------------------------------------------------------
  R('db-destructive-sql', 'ask', /\b(?:DROP\s+(?:DATABASE|SCHEMA|TABLE|ROLE|USER)|TRUNCATE\s+(?:TABLE\s+)?\w|DELETE\s+FROM\s+\w+\s*(?:;|$|"|')|ALTER\s+(?:TABLE|ROLE|USER)\b)/i,
    'SQL destructivo o de cambio de permisos.'),
  R('db-migrate', 'ask', /\b(?:prisma\s+(?:migrate\s+(?:deploy|reset|resolve)|db\s+(?:push|execute))|drizzle-kit\s+(?:push|migrate|drop)|typeorm\b[^;&|]*\bmigration:(?:run|revert)|knex\s+migrate:(?:latest|rollback|up|down)|sequelize\s+db:(?:migrate|drop)|rails\s+db:(?:migrate|drop|reset)|alembic\s+(?:upgrade|downgrade)|flyway\s+(?:migrate|clean))\b|\bnpm\s+run\s+(?:db:|migrat)/i,
    'Migración: confirma que el destino no es una base de datos real sin autorización.'),
  R('neon-mutate', 'ask', /\bneon(?:ctl)?\s+(?:projects?|branches|databases|roles|endpoints)\s+(?:create|delete|reset|restore|update|set-default|rename)\b/i,
    'Crea o modifica recursos de Neon.'),

  // --- Git remoto y releases ----------------------------------------------------------------
  R('git-push', 'ask', /\bgit\b[^;&|]*\bpush\b/, 'Publica commits en un remoto.'),
  R('git-destructive-local', 'ask', /\bgit\s+(?:reset\s+--hard|clean\s+-[a-zA-Z]*[fdx]|checkout\s+(?:--\s+)?\.(?:\s|$)|restore\s+(?:--staged\s+)?\.(?:\s|$)|branch\s+-D|stash\s+(?:drop|clear)|filter-branch|filter-repo|update-ref\s+-d|reflog\s+expire)\b/,
    'Descarta trabajo local o reescribe historia.'),
  R('gh-mutate', 'ask', /\bgh\s+(?:release\s+(?:create|delete|edit|upload)|pr\s+merge|repo\s+(?:delete|edit|rename|archive)|secret\s+(?:set|delete)|variable\s+(?:set|delete)|workflow\s+(?:run|enable|disable)|run\s+(?:rerun|cancel|delete)|api\b[^;&|]*-X\s*(?:POST|PUT|PATCH|DELETE)|ruleset)\b/i,
    'Cambia releases, permisos, secretos o pipelines en GitHub.'),
  R('package-publish', 'ask', /\b(?:npm|pnpm|yarn|bun)\s+publish\b|\b(?:twine|poetry)\s+(?:upload|publish)\b|\bcargo\s+publish\b/i,
    'Publica un paquete en un registro público.'),

  // --- PaaS distintos de Vercel -------------------------------------------------------------
  R('paas-deploy', 'ask', /\b(?:netlify\s+deploy|flyctl?\s+(?:deploy|launch|destroy|scale|secrets)|railway\s+(?:up|down|delete)|render\s+deploy|heroku\s+(?:create|destroy|config:set|ps:scale)|wrangler\s+(?:deploy|publish|delete|secret))\b/i,
    'Despliega o modifica recursos en un proveedor externo.'),
];

// Subcomandos de Vercel CLI que solo leen o trabajan en local.
const VERCEL_READ_ONLY = new Set([
  'whoami', 'ls', 'list', 'inspect', 'logs', 'help', 'build', 'dev', 'switch', 'login', 'logout',
  'telemetry', 'completion', 'httpstat', 'curl', 'open',
]);
const VERCEL_READ_ONLY_PAIRS = new Set([
  'env ls', 'env list', 'project ls', 'projects ls', 'project list', 'projects list', 'domains ls',
  'domains list', 'domains inspect', 'dns ls', 'dns list', 'teams ls', 'teams list', 'certs ls',
  'alias ls', 'alias list', 'secrets ls', 'integration list', 'integration ls', 'git ls',
  'project inspect', 'projects inspect', 'metrics query', 'target ls', 'target list', 'usage show',
  'microfrontends ls', 'flags ls', 'flags list', 'cache ls', 'rolling-release status',
]);
const VERCEL_DENY = /\b(?:domains\s+(?:buy|transfer-in|move)|billing|upgrade)\b/i;
const VERCEL_PROD = /(?:^|\s)(?:--prod|--production|--target[ =]production)\b|\b(?:promote|rollback|rolling-release\s+(?:start|approve|complete))\b/i;

/** Extrae invocaciones de la CLI de Vercel (vercel / vc / npx vercel@x). */
function vercelInvocations(command) {
  const out = [];
  const re = /(?:^|[\s;&|(`])(?:npx\s+(?:-y\s+)?|pnpm\s+(?:dlx\s+)?|bunx\s+|yarn\s+)?(?:vercel|vc)(?:@[\w.-]+)?(?:\.cmd|\.exe)?(?=\s|$)([^;&|`)]*)/g;
  let m;
  while ((m = re.exec(command))) out.push(m[1].trim());
  return out;
}

function classifyVercel(args) {
  if (VERCEL_DENY.test(args)) {
    return { decision: 'deny', id: 'vercel-billing', reason: 'Compras/upgrades en Vercel: nunca los inicia un agente; hazlo tú desde el dashboard.' };
  }
  const tokens = args.split(/\s+/).filter(Boolean);
  const positional = tokens.filter((t) => !t.startsWith('-'));
  const isVersion = tokens.some((t) => t === '--version' || t === '-v' || t === '--help' || t === '-h');
  if (isVersion && positional.length === 0) return null;
  if (VERCEL_PROD.test(args)) {
    return { decision: 'ask', id: 'vercel-production', reason: 'Afecta a PRODUCCIÓN en Vercel (deploy --prod, promote, rollback). Requiere aprobación explícita y acotada.' };
  }
  const first = positional[0];
  const pair = positional.slice(0, 2).join(' ');
  if (first && VERCEL_READ_ONLY.has(first) && first !== 'build') return null;
  if (first === 'build') return null; // build local, no sube nada
  if (VERCEL_READ_ONLY_PAIRS.has(pair)) return null;
  if (!first || first === 'deploy' || first.includes('/') || first === '.') {
    return { decision: 'ask', id: 'vercel-deploy', reason: 'Crea un despliegue en Vercel (sube código y puede crear un proyecto). Confirma alcance: preview, proyecto y equipo.' };
  }
  return { decision: 'ask', id: 'vercel-mutate', reason: `Subcomando de Vercel con efectos remotos: "${pair}". Confirma antes de ejecutar.` };
}

/** Detecta lectura de archivos .env reales (no .example/.sample/.template). */
function readsDotenv(command) {
  const readers = /\b(?:cat|type|more|less|head|tail|bat|gc|get-content|nl|strings|xxd|od|sed|awk|grep|rg|findstr|select-string|source|cp|copy|scp|base64)\b|(?:^|[;&|]\s*)\.\s/i;
  if (!readers.test(command)) return false;
  const files = command.match(/(?:^|[\s'"=\/\\])(\.env(?:\.[\w-]+)*)(?=$|[\s'";|&)])/g) ?? [];
  return files.some((f) => !/\.(?:example|sample|template|dist|defaults?)$/i.test(f.trim().replace(/^['"=\/\\]/, '')));
}

/**
 * Evalúa un comando. Devuelve { decision, id, reason, matches[] } con la decisión más estricta.
 */
export function evaluateCommand(command) {
  const cmd = String(command ?? '');
  const matches = [];
  for (const rule of COMMAND_RULES) {
    if (rule.id === 'secret-read-dotenv') {
      if (readsDotenv(cmd)) matches.push(rule);
      continue;
    }
    if (rule.re && rule.re.test(cmd)) matches.push(rule);
  }
  for (const args of vercelInvocations(cmd)) {
    const v = classifyVercel(args);
    if (v) matches.push(v);
  }
  const deny = matches.find((m) => m.decision === 'deny');
  const pick = deny ?? matches.find((m) => m.decision === 'ask') ?? null;
  return {
    decision: pick?.decision ?? null,
    id: pick?.id ?? null,
    reason: pick?.reason ?? null,
    matches: matches.map((m) => ({ id: m.id, decision: m.decision })),
  };
}
