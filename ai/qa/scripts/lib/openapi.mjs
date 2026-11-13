// Lectura de contratos (OpenAPI 3.x / Swagger 2.0 en JSON, colecciones Postman v2.x) y diff de compatibilidad.

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'];

function deref(spec, node, seen = new Set()) {
  if (node && typeof node === 'object' && typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
    if (seen.has(node.$ref)) return {};
    seen.add(node.$ref);
    let cur = spec;
    for (const k of node.$ref.slice(2).split('/')) cur = cur?.[k.replace(/~1/g, '/').replace(/~0/g, '~')];
    return deref(spec, cur ?? {}, seen);
  }
  return node ?? {};
}

export function detectContractKind(doc) {
  if (doc?.openapi && String(doc.openapi).startsWith('3')) return 'openapi3';
  if (doc?.swagger === '2.0') return 'swagger2';
  if (doc?.info?.schema && /postman/i.test(doc.info.schema)) return 'postman';
  if (Array.isArray(doc?.item) && doc?.info) return 'postman';
  return null;
}

function opParams(spec, pathItem, op) {
  const all = [...(pathItem.parameters ?? []), ...(op.parameters ?? [])].map((p) => deref(spec, p));
  const byKey = new Map();
  for (const p of all) byKey.set(`${p.in}:${p.name}`, p);
  return [...byKey.values()].map((p) => ({ name: p.name, in: p.in, required: Boolean(p.required || p.in === 'path'), schemaType: deref(spec, p.schema ?? p).type ?? null }));
}

function bodySchema(spec, op) {
  const rb = deref(spec, op.requestBody);
  const content = rb.content?.['application/json'] ?? Object.values(rb.content ?? {})[0];
  if (content?.schema) return { required: Boolean(rb.required), schema: deref(spec, content.schema) };
  const p = (op.parameters ?? []).map((x) => deref(spec, x)).find((x) => x.in === 'body');
  if (p) return { required: Boolean(p.required), schema: deref(spec, p.schema) };
  return null;
}

function responseSchemas(spec, op) {
  const out = {};
  for (const [code, r0] of Object.entries(op.responses ?? {})) {
    const r = deref(spec, r0);
    const content = r.content?.['application/json'] ?? Object.values(r.content ?? {})[0];
    out[code] = content?.schema ? deref(spec, content.schema) : r.schema ? deref(spec, r.schema) : null;
  }
  return out;
}

/** Lista operaciones de un OpenAPI/Swagger. */
export function listOperations(spec) {
  const kind = detectContractKind(spec);
  if (kind !== 'openapi3' && kind !== 'swagger2') throw new Error('Se esperaba un documento OpenAPI 3.x o Swagger 2.0 (JSON)');
  const ops = [];
  for (const [p, item0] of Object.entries(spec.paths ?? {})) {
    const item = deref(spec, item0);
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      ops.push({
        method: method.toUpperCase(),
        path: p,
        operationId: op.operationId ?? null,
        summary: op.summary ?? null,
        security: (op.security ?? spec.security ?? []).flatMap((s) => Object.keys(s)),
        parameters: opParams(spec, item, op),
        requestBody: bodySchema(spec, op) ? { required: bodySchema(spec, op).required } : null,
        responses: Object.keys(op.responses ?? {}),
      });
    }
  }
  return ops;
}

/** Lista peticiones de una colección Postman v2.x (recursivo en carpetas). */
export function listPostmanRequests(collection) {
  const out = [];
  const visit = (items, folder) => {
    for (const it of items ?? []) {
      if (Array.isArray(it.item)) visit(it.item, folder ? `${folder}/${it.name}` : it.name);
      else if (it.request) {
        const url = typeof it.request.url === 'string' ? it.request.url : it.request.url?.raw ?? '';
        out.push({ folder: folder ?? '', name: it.name ?? '', method: it.request.method ?? 'GET', url, hasTests: (it.event ?? []).some((e) => e.listen === 'test') });
      }
    }
  };
  visit(collection.item, '');
  return out;
}

function propsOf(spec, schema) {
  const s = deref(spec, schema);
  const props = {};
  for (const sub of s.allOf ?? []) Object.assign(props, propsOf(spec, sub).props);
  Object.assign(props, s.properties ?? {});
  const required = new Set([...(s.required ?? []), ...(s.allOf ?? []).flatMap((x) => deref(spec, x).required ?? [])]);
  return { props, required, type: s.type ?? (s.properties ? 'object' : null), items: s.items };
}

function compareSchema(oldSpec, newSpec, a, b, where, direction, changes, depth = 0) {
  if (!a || !b || depth > 6) return;
  const A = propsOf(oldSpec, a);
  const B = propsOf(newSpec, b);
  if (A.type && B.type && A.type !== B.type) {
    changes.push({ level: 'breaking', where, change: `Tipo cambiado ${A.type} → ${B.type}` });
    return;
  }
  if (A.type === 'array' && A.items && B.items) compareSchema(oldSpec, newSpec, A.items, B.items, `${where}[]`, direction, changes, depth + 1);
  for (const [name, sch] of Object.entries(A.props)) {
    if (!(name in B.props)) {
      if (direction === 'response') changes.push({ level: 'breaking', where: `${where}.${name}`, change: 'Propiedad eliminada de la respuesta' });
      else changes.push({ level: 'non-breaking', where: `${where}.${name}`, change: 'Propiedad eliminada de la petición (se ignorará si el servidor no la rechaza)' });
      continue;
    }
    const ta = deref(oldSpec, sch).type;
    const tb = deref(newSpec, B.props[name]).type;
    if (ta && tb && ta !== tb) changes.push({ level: 'breaking', where: `${where}.${name}`, change: `Tipo cambiado ${ta} → ${tb}` });
    if (direction === 'response' && A.required.has(name) && !B.required.has(name)) {
      changes.push({ level: 'breaking', where: `${where}.${name}`, change: 'Propiedad de respuesta deja de ser obligatoria' });
    }
    const ea = deref(oldSpec, sch).enum;
    const eb = deref(newSpec, B.props[name]).enum;
    if (Array.isArray(ea) && Array.isArray(eb)) {
      const removed = ea.filter((v) => !eb.includes(v));
      const added = eb.filter((v) => !ea.includes(v));
      if (direction === 'request' && removed.length) changes.push({ level: 'breaking', where: `${where}.${name}`, change: `Valores enum eliminados: ${removed.join(', ')}` });
      if (direction === 'response' && added.length) changes.push({ level: 'potentially-breaking', where: `${where}.${name}`, change: `Nuevos valores enum en respuesta: ${added.join(', ')}` });
    }
    compareSchema(oldSpec, newSpec, sch, B.props[name], `${where}.${name}`, direction, changes, depth + 1);
  }
  for (const name of Object.keys(B.props)) {
    if (name in A.props) continue;
    if (direction === 'request' && B.required.has(name)) changes.push({ level: 'breaking', where: `${where}.${name}`, change: 'Nueva propiedad obligatoria en la petición' });
    else changes.push({ level: 'non-breaking', where: `${where}.${name}`, change: 'Propiedad añadida' });
  }
  if (direction === 'request') {
    for (const name of B.required) {
      if (name in A.props && !A.required.has(name)) changes.push({ level: 'breaking', where: `${where}.${name}`, change: 'Propiedad de petición pasa a ser obligatoria' });
    }
  }
}

/** Compara dos contratos OpenAPI y clasifica los cambios. */
export function diffContracts(oldSpec, newSpec) {
  const changes = [];
  const index = (spec) => {
    const map = new Map();
    for (const [p, item0] of Object.entries(spec.paths ?? {})) {
      const item = deref(spec, item0);
      for (const m of METHODS) if (item[m]) map.set(`${m.toUpperCase()} ${p}`, { item, op: item[m] });
    }
    return map;
  };
  for (const s of [oldSpec, newSpec]) {
    const k = detectContractKind(s);
    if (k !== 'openapi3' && k !== 'swagger2') throw new Error('Ambos documentos deben ser OpenAPI 3.x o Swagger 2.0 (JSON)');
  }
  const A = index(oldSpec);
  const B = index(newSpec);
  for (const [key, { item, op }] of A) {
    if (!B.has(key)) {
      changes.push({ level: 'breaking', where: key, change: 'Operación eliminada' });
      continue;
    }
    const nb = B.get(key);
    const pa = new Map(opParams(oldSpec, item, op).map((p) => [`${p.in}:${p.name}`, p]));
    const pb = new Map(opParams(newSpec, nb.item, nb.op).map((p) => [`${p.in}:${p.name}`, p]));
    for (const [k, p] of pb) {
      if (!pa.has(k) && p.required) changes.push({ level: 'breaking', where: `${key} param ${k}`, change: 'Nuevo parámetro obligatorio' });
      else if (!pa.has(k)) changes.push({ level: 'non-breaking', where: `${key} param ${k}`, change: 'Nuevo parámetro opcional' });
      else if (!pa.get(k).required && p.required) changes.push({ level: 'breaking', where: `${key} param ${k}`, change: 'Parámetro pasa a ser obligatorio' });
      else if (pa.get(k).schemaType && p.schemaType && pa.get(k).schemaType !== p.schemaType) {
        changes.push({ level: 'breaking', where: `${key} param ${k}`, change: `Tipo cambiado ${pa.get(k).schemaType} → ${p.schemaType}` });
      }
    }
    for (const k of pa.keys()) if (!pb.has(k)) changes.push({ level: 'non-breaking', where: `${key} param ${k}`, change: 'Parámetro eliminado' });

    const ba = bodySchema(oldSpec, op);
    const bb = bodySchema(newSpec, nb.op);
    if (!ba && bb?.required) changes.push({ level: 'breaking', where: `${key} body`, change: 'Cuerpo de petición pasa a ser obligatorio' });
    if (ba && bb) compareSchema(oldSpec, newSpec, ba.schema, bb.schema, `${key} body`, 'request', changes);

    const ra = responseSchemas(oldSpec, op);
    const rb = responseSchemas(newSpec, nb.op);
    for (const code of Object.keys(ra)) {
      if (!(code in rb)) {
        changes.push({ level: /^2/.test(code) ? 'breaking' : 'potentially-breaking', where: `${key} response ${code}`, change: 'Código de respuesta eliminado' });
      } else if (ra[code] && rb[code]) {
        compareSchema(oldSpec, newSpec, ra[code], rb[code], `${key} response ${code}`, 'response', changes);
      }
    }
    for (const code of Object.keys(rb)) {
      if (!(code in ra)) changes.push({ level: 'potentially-breaking', where: `${key} response ${code}`, change: 'Nuevo código de respuesta (los clientes deben manejarlo)' });
    }
  }
  for (const key of B.keys()) if (!A.has(key)) changes.push({ level: 'non-breaking', where: key, change: 'Operación añadida' });
  const count = (l) => changes.filter((c) => c.level === l).length;
  return { compatible: count('breaking') === 0, summary: { breaking: count('breaking'), potentiallyBreaking: count('potentially-breaking'), nonBreaking: count('non-breaking') }, changes };
}
