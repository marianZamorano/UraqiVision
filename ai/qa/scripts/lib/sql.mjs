// Clasificación conservadora de sentencias SQL: readonly | effectful | destructive.
// Ante la duda, una sentencia NO se considera de solo lectura.

const READONLY_START = /^(select|with|show|describe|desc|values|table|explain)\b/i;
const DESTRUCTIVE = /^(drop|truncate|delete|grant|revoke|alter\s+(table|database|schema)[\s\S]*\bdrop\b)/i;
const EFFECTFUL_KEYWORDS = /\b(insert|update|delete|merge|upsert|create|alter|drop|truncate|grant|revoke|copy|call|do|vacuum|reindex|cluster|lock|refresh|comment\s+on|security\s+label|import|load|replace|rename|attach|detach|set\s+role|reset|discard)\b/i;
const EFFECTFUL_FUNCTIONS = /\b(pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|lo_import|lo_export|dblink(_exec)?|nextval|setval|pg_advisory_lock|set_config|pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|sleep|benchmark|xp_cmdshell|load_file)\s*\(/i;

/** Elimina comentarios y literales para no confundir palabras clave dentro de cadenas. */
export function stripSql(sql) {
  return String(sql ?? '')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""');
}

export function splitStatements(sql) {
  return stripSql(sql)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function classifyStatement(stmt) {
  const s = stmt.trim();
  if (DESTRUCTIVE.test(s)) return { type: 'destructive', reason: `Sentencia destructiva: ${s.split(/\s+/).slice(0, 2).join(' ').toUpperCase()}` };
  if (/^update\b/i.test(s) && !/\bwhere\b/i.test(s)) return { type: 'destructive', reason: 'UPDATE sin WHERE' };
  if (/^explain\b/i.test(s) && /\banalyze\b/i.test(s) && EFFECTFUL_KEYWORDS.test(s.replace(/^explain\b[^a-z]*(\([^)]*\))?\s*analyze\b/i, ''))) {
    return { type: 'effectful', reason: 'EXPLAIN ANALYZE ejecuta la sentencia' };
  }
  if (READONLY_START.test(s)) {
    if (EFFECTFUL_KEYWORDS.test(s.replace(/^(explain\b(\s+\([^)]*\))?(\s+analyze)?)/i, '').replace(/\bdesc\b/gi, ''))) {
      return { type: 'effectful', reason: 'Contiene palabras clave con efectos (p. ej. CTE con DML)' };
    }
    if (/\binto\b/i.test(s) && /^select\b/i.test(s)) return { type: 'effectful', reason: 'SELECT ... INTO crea/escribe datos' };
    if (/\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test(s)) return { type: 'effectful', reason: 'Bloqueo de filas (FOR UPDATE/SHARE)' };
    if (EFFECTFUL_FUNCTIONS.test(s)) return { type: 'effectful', reason: 'Llama a funciones con efectos o de acceso al sistema' };
    return { type: 'readonly', reason: '' };
  }
  return { type: 'effectful', reason: `Sentencia no reconocida como lectura: ${s.split(/\s+/)[0].toUpperCase()}` };
}

/** @returns {{readOnly:boolean, destructive:boolean, statements:{sql:string,type:string,reason:string}[]}} */
export function classifySql(sql) {
  const statements = splitStatements(sql).map((s) => ({ sql: s.length > 200 ? `${s.slice(0, 200)}…` : s, ...classifyStatement(s) }));
  return {
    readOnly: statements.length > 0 && statements.every((s) => s.type === 'readonly'),
    destructive: statements.some((s) => s.type === 'destructive'),
    statements,
  };
}
