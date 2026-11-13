// Parsers de resultados de pruebas: JUnit XML y JSON de Jest/Vitest. Sin dependencias.

const ENTITIES = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'" };

function decode(s) {
  return String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(lt|gt|amp|quot|apos);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1]] = decode(m[3] ?? m[4]);
  return out;
}

function truncate(s, max = 2000) {
  const t = String(s ?? '').trim();
  return t.length > max ? `${t.slice(0, max)}… [truncado ${t.length - max} caracteres]` : t;
}

/**
 * Parsea JUnit XML (formato común de Jest/Vitest/Surefire/pytest/Playwright).
 * @returns {{format:'junit', totals:object, cases:object[]}}
 */
export function parseJUnit(xml) {
  if (typeof xml !== 'string' || !/<testsuites?[\s>]/.test(xml)) {
    throw new Error('No parece un documento JUnit XML (falta <testsuite> o <testsuites>)');
  }
  const cases = [];
  const caseRe = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  let m;
  while ((m = caseRe.exec(xml)) !== null) {
    const a = attrs(m[1]);
    const body = m[3] ?? '';
    let status = 'passed';
    let message = '';
    let details = '';
    const fail = body.match(/<(failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/);
    if (fail) {
      status = fail[1] === 'error' ? 'error' : 'failed';
      const fa = attrs(fail[2]);
      message = truncate(fa.message ?? '', 500);
      details = truncate(decode(fail[3] ?? ''));
    } else if (/<skipped\b/.test(body)) {
      status = 'skipped';
    }
    cases.push({
      suite: a.classname ?? '',
      name: a.name ?? '(sin nombre)',
      file: a.file ?? '',
      durationMs: a.time ? Math.round(Number(a.time) * 1000) : null,
      status,
      message,
      details,
    });
  }
  return { format: 'junit', totals: totalsOf(cases), cases };
}

/** Parsea JSON de Jest (`--json`) o Vitest (`--reporter=json`), que comparten forma. */
export function parseJestLikeJson(data) {
  if (!data || !Array.isArray(data.testResults)) {
    throw new Error('No parece un reporte JSON de Jest/Vitest (falta testResults[])');
  }
  const cases = [];
  for (const file of data.testResults) {
    for (const t of file.assertionResults ?? []) {
      const status = t.status === 'passed' ? 'passed' : t.status === 'failed' ? 'failed' : 'skipped';
      cases.push({
        suite: (t.ancestorTitles ?? []).join(' > '),
        name: t.title ?? t.fullName ?? '(sin nombre)',
        file: file.name ?? '',
        durationMs: typeof t.duration === 'number' ? Math.round(t.duration) : null,
        status,
        message: truncate((t.failureMessages ?? [])[0]?.split('\n')[0] ?? '', 500),
        details: truncate((t.failureMessages ?? []).join('\n')),
      });
    }
  }
  return { format: 'jest-json', totals: totalsOf(cases), cases };
}

export function totalsOf(cases) {
  const t = { total: cases.length, passed: 0, failed: 0, error: 0, skipped: 0, durationMs: 0 };
  for (const c of cases) {
    t[c.status] = (t[c.status] ?? 0) + 1;
    t.durationMs += c.durationMs ?? 0;
  }
  const executed = t.total - t.skipped;
  t.passRate = executed > 0 ? Number(((t.passed / executed) * 100).toFixed(2)) : null;
  return t;
}

/** Detecta el formato por contenido y parsea. */
export function parseTestResults(text) {
  const trimmed = String(text ?? '').trimStart();
  if (trimmed.startsWith('<')) return parseJUnit(trimmed);
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error('Formato no reconocido: se esperaba JUnit XML o JSON de Jest/Vitest');
  }
  return parseJestLikeJson(data);
}
