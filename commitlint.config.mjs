// Formato de los mensajes de commit de UraqiVision: Conventional Commits.
//   tipo(alcance): descripción en minúscula (IDENTIFICADORES) #issue
//   feat(mapa): deslizador antes/después (RF-06) #12
// commitlint valida el formato; ai/hooks/git-commit-msg.mjs exige además la referencia al issue (#N).
// Se ejecuta en el hook commit-msg (.githooks) y en el workflow de trazabilidad de cada PR.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']],
    // Alcances sugeridos: módulos de §19 del documento maestro y partes del repositorio. Solo avisa.
    'scope-enum': [1, 'always', [
      'ingesta', 'ciencia', 'validacion', 'publicacion', 'insight', 'globo', 'mapa', 'atlas', 'interfaz',
      'pipeline', 'web', 'datos', 'i18n',
      'ai', 'guardas', 'skills', 'agentes', 'mcp', 'qa', 'devops', 'specs', 'docs', 'deps', 'ci',
    ]],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
  helpUrl: 'Formato: tipo(alcance): descripción (RF-xx) #N — ver la skill flujo-issues-y-pr',
};
