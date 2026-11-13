// Reglas de aprobación de PR de UraqiVision. Funciones puras (sin red); los datos los trae lib/github.mjs.
//
// - PR hacia dev: el autor puede fusionarla él mismo, confirmando. No se exige la aprobación de nadie más.
//   (GitHub no permite aprobar la propia PR: en dev, "aprobar la propia" = fusionarla tras confirmar.)
// - PR hacia qa o main: deben aprobar TODOS los colaboradores excepto el autor, y la aprobación debe ser del
//   último commit de la PR (una aprobación de un commit anterior queda obsoleta).
// - En cualquier rama, un "cambios solicitados" vigente impide fusionar.

export const RAMAS_TODOS_APRUEBAN = ['qa', 'main'];
export const RAMAS_AUTOAPROBACION = ['dev'];
const DECISIVOS = new Set(['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED']);

/** Última revisión decisiva de cada persona (los comentarios sin veredicto no cuentan). */
export function ultimasRevisiones(reviews) {
  const ultimas = new Map();
  const ordenadas = [...(reviews ?? [])].sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)));
  for (const r of ordenadas) {
    const login = r.user?.login;
    if (login && DECISIVOS.has(r.state)) ultimas.set(login, r);
  }
  return ultimas;
}

/**
 * pr: { base, autor, headSha, draft }
 * colaboradores: logins con acceso al repositorio (sin bots)
 * reviews: respuesta de GET /pulls/{n}/reviews ({ user: {login}, state, commit_id, submitted_at })
 */
export function evaluarAprobacion(pr, colaboradores, reviews) {
  const exigeTodos = RAMAS_TODOS_APRUEBAN.includes(pr.base);
  const requeridos = exigeTodos ? colaboradores.filter((c) => c !== pr.autor) : [];
  const ultimas = ultimasRevisiones(reviews);
  const aprobaron = [];
  const obsoletas = [];
  const cambiosPedidos = [];
  for (const [login, r] of ultimas) {
    if (r.state === 'CHANGES_REQUESTED') cambiosPedidos.push(login);
    else if (r.state === 'APPROVED') (r.commit_id === pr.headSha ? aprobaron : obsoletas).push(login);
  }
  const faltan = requeridos.filter((u) => !aprobaron.includes(u));
  const motivos = [];
  if (pr.draft) motivos.push('la PR está en borrador');
  if (cambiosPedidos.length) motivos.push(`cambios solicitados por ${cambiosPedidos.join(', ')}`);
  if (exigeTodos && faltan.length) motivos.push(`falta la aprobación de ${faltan.join(', ')}`);
  if (exigeTodos && !requeridos.length) motivos.push('no hay otros colaboradores que puedan aprobar');
  const regla = exigeTodos
    ? `PR hacia ${pr.base}: deben aprobar todos los colaboradores excepto el autor (${requeridos.length} persona(s)), sobre el último commit.`
    : `PR hacia ${pr.base}: el autor puede fusionarla él mismo tras confirmar; no se exige la aprobación de otros.`;
  return { exigeTodos, requeridos, aprobaron, obsoletas, cambiosPedidos, faltan, listo: motivos.length === 0, motivos, regla };
}

/** ¿Esta persona tiene que aprobar esta PR ahora? */
export function debeAprobar(login, pr, evaluacion) {
  return evaluacion.exigeTodos && pr.autor !== login && evaluacion.faltan.includes(login);
}

/** Origen permitido para cada rama: a qa solo desde dev y a main solo desde qa. */
export function origenPermitido(base, head) {
  if (base === 'qa') return head === 'dev';
  if (base === 'main') return head === 'qa';
  return true;
}
