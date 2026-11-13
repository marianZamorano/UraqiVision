// Comprobación de consumo frente a límites gratuitos documentados.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { finding } from './common.mjs';

const LIMITS_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'free-tier-limits.json');

export function loadLimits(file = LIMITS_FILE) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function staleness(limits, now = new Date()) {
  const days = Math.floor((now - new Date(limits.verifiedAt)) / 86_400_000);
  return { days, stale: days > (limits.staleAfterDays ?? 90) };
}

/**
 * usage: { provider, plan, monthly?: {clave: valor}, ...otras claves numéricas }
 * Compara cada clave numérica de usage con el límite del mismo nombre.
 */
export function checkUsage(usage, limits = loadLimits(), { warnAt = 0.8 } = {}) {
  const findings = [];
  const notes = [];
  const st = staleness(limits);
  if (st.stale) {
    findings.push(finding('medium', 'free-tier/stale-limits', `Los límites se verificaron hace ${st.days} días (${limits.verifiedAt}). Re-verifica en las fuentes oficiales antes de decidir.`));
  }
  const plan = limits.providers?.[usage.provider]?.plans?.[usage.plan];
  if (!plan) {
    findings.push(finding('high', 'free-tier/unknown-plan', `Sin datos verificados para ${usage.provider}/${usage.plan}. No asumas que es gratuito.`));
    return { findings, notes };
  }
  const compare = (section, used, lim) => {
    for (const [k, v] of Object.entries(used ?? {})) {
      if (typeof v !== 'number') continue;
      const limit = lim?.[k];
      if (typeof limit !== 'number') {
        notes.push(`Sin límite documentado para "${section}${k}"; no evaluado.`);
        continue;
      }
      const ratio = v / limit;
      const pct = Math.round(ratio * 100);
      if (ratio >= 1) findings.push(finding('critical', 'free-tier/exceeded', `${section}${k}: ${v} / ${limit} (${pct}%). ${plan.onExceed ?? ''}`.trim()));
      else if (ratio >= warnAt) findings.push(finding('high', 'free-tier/near-limit', `${section}${k}: ${v} / ${limit} (${pct}%).`));
      else findings.push(finding('info', 'free-tier/ok', `${section}${k}: ${v} / ${limit} (${pct}%).`));
    }
  };
  compare('monthly.', usage.monthly, plan.monthly);
  const { provider, plan: _p, monthly, ...rest } = usage;
  compare('', rest, plan);
  if (plan.commercialUse === false && usage.commercial === true) {
    findings.push(finding('critical', 'free-tier/commercial', `${provider}/${usage.plan} no permite uso comercial.`));
  }
  if (plan.creditCardRequired === true) notes.push('Este plan requiere tarjeta: riesgo de cargos al exceder cuotas.');
  return { findings, notes };
}
