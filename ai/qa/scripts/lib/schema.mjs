// Validador de un subconjunto de JSON Schema (draft-07 / 2020-12) suficiente para validar respuestas de API.
// Palabras clave soportadas: type, enum, const, required, properties, additionalProperties, items, minItems,
// maxItems, uniqueItems, minLength, maxLength, pattern, format(email|uri|date-time|uuid|date), minimum, maximum,
// exclusiveMinimum, exclusiveMaximum, multipleOf, anyOf, oneOf, allOf, not, nullable (OpenAPI 3.0), $ref local (#/...).

const FORMATS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uri: /^[a-z][a-z0-9+.-]*:[^\s]*$/i,
  'date-time': /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

export const SUPPORTED_KEYWORDS = new Set([
  'type', 'enum', 'const', 'required', 'properties', 'additionalProperties', 'items', 'minItems', 'maxItems',
  'uniqueItems', 'minLength', 'maxLength', 'pattern', 'format', 'minimum', 'maximum', 'exclusiveMinimum',
  'exclusiveMaximum', 'multipleOf', 'anyOf', 'oneOf', 'allOf', 'not', 'nullable', '$ref', '$schema', '$id',
  'title', 'description', 'default', 'examples', 'example', 'definitions', '$defs', 'components', 'readOnly',
  'writeOnly', 'deprecated',
]);

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function matchesType(v, t) {
  const actual = typeOf(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t;
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Solo se admiten $ref locales (#/...): ${ref}`);
  let node = root;
  for (const raw of ref.slice(2).split('/')) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node == null || !(key in node)) throw new Error(`$ref no resuelto: ${ref}`);
    node = node[key];
  }
  return node;
}

/**
 * Valida `data` contra `schema`.
 * @returns {{valid:boolean, errors:{path:string, message:string}[], unsupported:string[]}}
 */
export function validate(schema, data, { maxErrors = 100 } = {}) {
  const errors = [];
  const unsupported = new Set();

  function err(p, message) {
    if (errors.length < maxErrors) errors.push({ path: p || '$', message });
  }

  function check(s, v, p, depth) {
    if (depth > 64) return err(p, 'Profundidad máxima de esquema excedida');
    if (s === true || s === undefined) return;
    if (s === false) return err(p, 'El esquema no admite ningún valor');
    if (typeof s !== 'object' || s === null) return err(p, 'Esquema inválido');
    for (const k of Object.keys(s)) if (!SUPPORTED_KEYWORDS.has(k)) unsupported.add(k);

    if (s.$ref) return check(resolveRef(schema, s.$ref), v, p, depth + 1);
    if (v === null && s.nullable === true) return;

    if (s.type !== undefined) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.some((t) => matchesType(v, t))) {
        return err(p, `Tipo esperado ${types.join('|')}, recibido ${typeOf(v)}`);
      }
    }
    if (s.const !== undefined && JSON.stringify(s.const) !== JSON.stringify(v)) err(p, `Debe ser ${JSON.stringify(s.const)}`);
    if (Array.isArray(s.enum) && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) {
      err(p, `Valor fuera de enum ${JSON.stringify(s.enum)}`);
    }

    const t = typeOf(v);
    if (t === 'string') {
      if (s.minLength !== undefined && [...v].length < s.minLength) err(p, `Longitud mínima ${s.minLength}`);
      if (s.maxLength !== undefined && [...v].length > s.maxLength) err(p, `Longitud máxima ${s.maxLength}`);
      if (s.pattern !== undefined) {
        let re;
        try {
          re = new RegExp(s.pattern, 'u');
        } catch {
          err(p, `pattern inválido: ${s.pattern}`);
        }
        if (re && !re.test(v)) err(p, `No cumple pattern ${s.pattern}`);
      }
      if (s.format && FORMATS[s.format] && !FORMATS[s.format].test(v)) err(p, `Formato ${s.format} inválido`);
    }
    if (t === 'number' || t === 'integer') {
      if (s.minimum !== undefined && v < s.minimum) err(p, `Mínimo ${s.minimum}`);
      if (s.maximum !== undefined && v > s.maximum) err(p, `Máximo ${s.maximum}`);
      if (typeof s.exclusiveMinimum === 'number' && v <= s.exclusiveMinimum) err(p, `Debe ser > ${s.exclusiveMinimum}`);
      if (typeof s.exclusiveMaximum === 'number' && v >= s.exclusiveMaximum) err(p, `Debe ser < ${s.exclusiveMaximum}`);
      if (s.multipleOf !== undefined && Math.abs(v / s.multipleOf - Math.round(v / s.multipleOf)) > 1e-9) {
        err(p, `Debe ser múltiplo de ${s.multipleOf}`);
      }
    }
    if (t === 'array') {
      if (s.minItems !== undefined && v.length < s.minItems) err(p, `Mínimo ${s.minItems} elementos`);
      if (s.maxItems !== undefined && v.length > s.maxItems) err(p, `Máximo ${s.maxItems} elementos`);
      if (s.uniqueItems && new Set(v.map((x) => JSON.stringify(x))).size !== v.length) err(p, 'Elementos duplicados');
      if (s.items && typeof s.items === 'object' && !Array.isArray(s.items)) {
        v.forEach((item, i) => check(s.items, item, `${p}[${i}]`, depth + 1));
      }
    }
    if (t === 'object') {
      for (const r of s.required ?? []) if (!(r in v)) err(`${p}.${r}`, 'Propiedad requerida ausente');
      const props = s.properties ?? {};
      for (const [k, sub] of Object.entries(props)) if (k in v) check(sub, v[k], `${p}.${k}`, depth + 1);
      if (s.additionalProperties !== undefined) {
        for (const k of Object.keys(v)) {
          if (k in props) continue;
          if (s.additionalProperties === false) err(`${p}.${k}`, 'Propiedad no permitida');
          else if (typeof s.additionalProperties === 'object') check(s.additionalProperties, v[k], `${p}.${k}`, depth + 1);
        }
      }
    }
    if (Array.isArray(s.allOf)) s.allOf.forEach((sub) => check(sub, v, p, depth + 1));
    if (Array.isArray(s.anyOf) && !s.anyOf.some((sub) => subValid(sub, v))) err(p, 'No cumple ningún esquema de anyOf');
    if (Array.isArray(s.oneOf)) {
      const n = s.oneOf.filter((sub) => subValid(sub, v)).length;
      if (n !== 1) err(p, `Debe cumplir exactamente 1 esquema de oneOf (cumple ${n})`);
    }
    if (s.not !== undefined && subValid(s.not, v)) err(p, 'No debe cumplir el esquema de not');
  }

  // Evalúa un subesquema sin contaminar la lista de errores principal.
  function subValid(sub, v) {
    const saved = errors.splice(0);
    check(sub, v, '$', 1);
    const ok = errors.length === 0;
    errors.splice(0, errors.length, ...saved);
    return ok;
  }

  check(schema, data, '$', 0);
  return { valid: errors.length === 0, errors, unsupported: [...unsupported] };
}
