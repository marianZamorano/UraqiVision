// Herramientas del MCP qa-evidence. TODAS son de solo lectura: ninguna escribe archivos, ejecuta comandos
// ni hace llamadas de red. El acceso a disco está confinado a `ctx.root` y excluye archivos de secretos.
import fs from 'node:fs';
import { validate } from '../../scripts/lib/schema.mjs';
import { resolveInside, readTextLimited, isSecretFile, toPosixRelative, PathError } from '../../scripts/lib/paths.mjs';
import { parseTestResults } from '../../scripts/lib/junit.mjs';
import { summarizeK6, evaluateThresholds } from '../../scripts/lib/k6.mjs';
import { evaluateGates, coverageMetrics, validateGateConfig } from '../../scripts/lib/gate.mjs';
import { detectContractKind, listOperations, listPostmanRequests, diffContracts } from '../../scripts/lib/openapi.mjs';
import { buildEvidenceReport } from '../../scripts/lib/report.mjs';
import { discover } from '../../scripts/lib/discovery.mjs';
import { classifySql } from '../../scripts/lib/sql.mjs';
import { totalsOf } from '../../scripts/lib/junit.mjs';

export const LIMITS = Object.freeze({ maxFileBytes: 5 * 1024 * 1024, maxInlineChars: 1_000_000, maxCases: 200, timeoutMs: 20_000 });

export class ToolError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ToolError';
  }
}

const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function safeRead(ctx, relPath) {
  let abs;
  try {
    abs = resolveInside(ctx.root, relPath);
  } catch (e) {
    throw new ToolError(e.message);
  }
  if (isSecretFile(toPosixRelative(ctx.root, abs))) throw new ToolError(`Acceso denegado a archivo de secretos: ${relPath}`);
  if (!fs.existsSync(abs)) throw new ToolError(`No existe: ${relPath}`);
  try {
    return readTextLimited(abs, LIMITS.maxFileBytes);
  } catch (e) {
    throw new ToolError(e instanceof PathError ? e.message : `No se pudo leer ${relPath}: ${e.message}`);
  }
}

function safeJson(ctx, relPath) {
  try {
    return JSON.parse(safeRead(ctx, relPath));
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(`JSON inválido en ${relPath}: ${e.message}`);
  }
}

function parseResultsFile(ctx, p) {
  try {
    return parseTestResults(safeRead(ctx, p));
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(`${p}: ${e.message}`);
  }
}

const pathProp = { type: 'string', minLength: 1, maxLength: 1024, description: 'Ruta relativa a la raíz del proyecto' };
const thresholdsProp = {
  type: 'object',
  additionalProperties: false,
  properties: { p95Ms: { type: 'number', minimum: 0 }, p99Ms: { type: 'number', minimum: 0 }, errorRate: { type: 'number', minimum: 0, maximum: 1 }, minChecksRate: { type: 'number', minimum: 0, maximum: 1 } },
};
const gateProp = {
  type: 'array',
  minItems: 1,
  maxItems: 50,
  items: {
    type: 'object',
    required: ['id', 'metric', 'op', 'value'],
    additionalProperties: false,
    properties: { id: { type: 'string' }, metric: { type: 'string' }, op: { type: 'string', enum: ['>=', '<=', '>', '<', '=='] }, value: { type: 'number' }, required: { type: 'boolean' }, description: { type: 'string' } },
  },
};
const stringList = { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 2000 } };

export const TOOLS = [
  {
    name: 'discover_test_assets',
    description: 'Inventaria (solo lectura) manifiestos, dependencias declaradas y artefactos de testing (configs, tests, contratos, colecciones, scripts de carga, CI, migraciones). No lee archivos de secretos.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { path: { ...pathProp, description: 'Subdirectorio relativo (por defecto la raíz)' }, maxFiles: { type: 'integer', minimum: 1, maximum: 20000 } } },
    annotations: { title: 'Descubrir artefactos de testing', ...RO },
    handler(args, ctx) {
      let dir;
      try {
        dir = resolveInside(ctx.root, args.path ?? '.');
      } catch (e) {
        throw new ToolError(e.message);
      }
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new ToolError('La ruta no es un directorio');
      return discover(dir, { maxFiles: args.maxFiles ?? 5000 });
    },
  },
  {
    name: 'read_api_contract',
    description: 'Lee un contrato de API (OpenAPI 3.x / Swagger 2.0 en JSON o colección Postman v2.x) y devuelve sus operaciones: método, ruta, parámetros, cuerpo, respuestas y seguridad.',
    inputSchema: { type: 'object', required: ['path'], additionalProperties: false, properties: { path: pathProp } },
    annotations: { title: 'Leer contrato de API', ...RO },
    handler(args, ctx) {
      const doc = safeJson(ctx, args.path);
      const kind = detectContractKind(doc);
      if (!kind) throw new ToolError('Formato no reconocido: se esperaba OpenAPI/Swagger JSON o colección Postman');
      if (kind === 'postman') return { kind, name: doc.info?.name ?? null, requests: listPostmanRequests(doc) };
      return { kind, title: doc.info?.title ?? null, version: doc.info?.version ?? null, operations: listOperations(doc) };
    },
  },
  {
    name: 'diff_api_contracts',
    description: 'Compara dos versiones de un contrato OpenAPI/Swagger (JSON) y clasifica los cambios en breaking, potentially-breaking y non-breaking.',
    inputSchema: { type: 'object', required: ['oldPath', 'newPath'], additionalProperties: false, properties: { oldPath: pathProp, newPath: pathProp } },
    annotations: { title: 'Diff de contratos', ...RO },
    handler(args, ctx) {
      try {
        return diffContracts(safeJson(ctx, args.oldPath), safeJson(ctx, args.newPath));
      } catch (e) {
        throw e instanceof ToolError ? e : new ToolError(e.message);
      }
    },
  },
  {
    name: 'parse_test_results',
    description: 'Analiza resultados de pruebas (JUnit XML o JSON de Jest/Vitest): totales, tasa de éxito y casos fallidos con mensajes redactados.',
    inputSchema: { type: 'object', required: ['path'], additionalProperties: false, properties: { path: pathProp, includePassed: { type: 'boolean' }, maxCases: { type: 'integer', minimum: 1, maximum: LIMITS.maxCases } } },
    annotations: { title: 'Analizar resultados de pruebas', ...RO },
    handler(args, ctx) {
      const r = parseResultsFile(ctx, args.path);
      const max = args.maxCases ?? 50;
      const cases = r.cases.filter((c) => args.includePassed || c.status === 'failed' || c.status === 'error');
      return { format: r.format, totals: r.totals, cases: cases.slice(0, max), truncatedCases: Math.max(0, cases.length - max) };
    },
  },
  {
    name: 'validate_json_schema',
    description: 'Valida un documento JSON contra un JSON Schema (subconjunto draft-07/2020-12, $ref locales). Datos y esquema pueden pasarse en línea o por ruta.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: { schema: { type: 'object' }, schemaPath: pathProp, data: {}, dataPath: pathProp, schemaPointer: { type: 'string', maxLength: 512, description: 'Puntero JSON dentro del esquema, p. ej. #/components/schemas/Item' } },
    },
    annotations: { title: 'Validar JSON Schema', ...RO },
    handler(args, ctx) {
      if ((args.schema === undefined) === (args.schemaPath === undefined)) throw new ToolError('Indica exactamente uno de schema o schemaPath');
      if ((args.data === undefined) === (args.dataPath === undefined)) throw new ToolError('Indica exactamente uno de data o dataPath');
      let schema = args.schema ?? safeJson(ctx, args.schemaPath);
      if (args.schemaPointer) schema = { ...schema, $ref: args.schemaPointer };
      const data = args.data !== undefined ? args.data : safeJson(ctx, args.dataPath);
      try {
        return validate(schema, data);
      } catch (e) {
        throw new ToolError(e.message);
      }
    },
  },
  {
    name: 'summarize_k6_results',
    description: 'Resume un resultado de k6 (handleSummary JSON o --summary-export): throughput, latencias p90/p95/p99, tasa de error, checks y thresholds; evalúa umbrales opcionales.',
    inputSchema: { type: 'object', required: ['path'], additionalProperties: false, properties: { path: pathProp, thresholds: thresholdsProp } },
    annotations: { title: 'Resumir resultados de k6', ...RO },
    handler(args, ctx) {
      let s;
      try {
        s = summarizeK6(safeJson(ctx, args.path));
      } catch (e) {
        throw e instanceof ToolError ? e : new ToolError(e.message);
      }
      return { summary: s, evaluation: args.thresholds ? evaluateThresholds(s, args.thresholds) : null };
    },
  },
  {
    name: 'evaluate_quality_gate',
    description: 'Evalúa quality gates sobre métricas explícitas o derivadas de artefactos (resultados de pruebas, cobertura, k6). Una métrica requerida ausente hace fallar el gate.',
    inputSchema: {
      type: 'object',
      required: ['gates'],
      additionalProperties: false,
      properties: { gates: gateProp, metrics: { type: 'object', additionalProperties: { type: ['number', 'null'] } }, resultsPaths: { type: 'array', maxItems: 20, items: pathProp }, coveragePath: pathProp, k6Path: pathProp },
    },
    annotations: { title: 'Evaluar quality gate', ...RO },
    handler(args, ctx) {
      const metrics = { ...(args.metrics ?? {}) };
      if (args.resultsPaths?.length) {
        const t = totalsOf(args.resultsPaths.flatMap((p) => parseResultsFile(ctx, p).cases));
        Object.assign(metrics, { totalTests: t.total, failedTests: t.failed + (t.error ?? 0), skippedTests: t.skipped, passRate: t.passRate });
      }
      if (args.coveragePath) {
        try {
          Object.assign(metrics, coverageMetrics(safeJson(ctx, args.coveragePath)));
        } catch (e) {
          throw e instanceof ToolError ? e : new ToolError(e.message);
        }
      }
      if (args.k6Path) {
        const s = summarizeK6(safeJson(ctx, args.k6Path));
        Object.assign(metrics, { p95Ms: s.latencyMs?.p95 ?? null, p99Ms: s.latencyMs?.p99 ?? null, errorRate: s.errorRate });
      }
      const problems = validateGateConfig({ gates: args.gates });
      if (problems.length) throw new ToolError(problems.join('; '));
      return { metrics, ...evaluateGates({ gates: args.gates }, metrics) };
    },
  },
  {
    name: 'check_sql_readonly',
    description: 'Clasifica sentencias SQL como readonly, effectful o destructive (análisis conservador). Usar ANTES de enviar SQL a cualquier MCP o cliente de base de datos.',
    inputSchema: { type: 'object', required: ['sql'], additionalProperties: false, properties: { sql: { type: 'string', minLength: 1, maxLength: 200000 } } },
    annotations: { title: 'Comprobar SQL de solo lectura', ...RO },
    handler(args) {
      return classifySql(args.sql);
    },
  },
  {
    name: 'build_evidence_report',
    description: 'Genera (sin escribir en disco) un informe Markdown de evidencias que separa hechos, hipótesis, recomendaciones y pruebas no ejecutadas, a partir de artefactos reales.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        resultsPaths: { type: 'array', maxItems: 20, items: pathProp },
        k6Path: pathProp,
        facts: stringList,
        hypotheses: stringList,
        recommendations: stringList,
        notExecuted: stringList,
        context: { type: 'object', additionalProperties: false, properties: { commit: { type: 'string', maxLength: 64 }, environment: { type: 'string', maxLength: 200 }, scope: { type: 'string', maxLength: 2000 } } },
      },
    },
    annotations: { title: 'Construir informe de evidencias', ...RO },
    handler(args, ctx) {
      const testRuns = (args.resultsPaths ?? []).map((p) => ({ name: p, results: parseResultsFile(ctx, p) }));
      const performance = args.k6Path ? summarizeK6(safeJson(ctx, args.k6Path)) : undefined;
      return { markdown: buildEvidenceReport({ ...args, testRuns, performance }), written: false, note: 'El informe no se ha guardado. Guardarlo requiere aprobación (escritura de archivo).' };
    },
  },
];

/** Valida argumentos contra el inputSchema de la herramienta. */
export function validateArgs(tool, args) {
  const r = validate(tool.inputSchema, args ?? {});
  if (!r.valid) throw new ToolError(`Argumentos inválidos: ${r.errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
}
