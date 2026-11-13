# Procedencia — `systematic-debugging`

| Campo | Valor |
|---|---|
| Origen | https://github.com/obra/superpowers/tree/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/systematic-debugging |
| Listado en skills.sh | https://skills.sh/obra/superpowers/systematic-debugging |
| Autor | Jesse Vincent (obra) y contribuidores |
| Licencia | MIT (copia íntegra en `LICENSE`) |
| Commit auditado | `bb92a77741419a4ab5f06e711a283343f1ada0c3` (2026-10-09) |
| Fecha de importación | 2026-10-18 |
| Clasificación | **APPROVED** — auditada en el repositorio chapterCoreIEEE (`QA/docs/SKILL_AUDIT.md`) |
| Modificaciones | Ninguna. Copia byte a byte del original (se añadieron solo `LICENSE` y este archivo). |

## Notas de integración

- Dentro del plugin se invoca como `systematic-debugging`. Las referencias internas del original a
  `superpowers:<skill>` corresponden a `<skill>` en este ecosistema.
- Cualquier instrucción de esta skill que implique modificar o borrar archivos o ejecutar comandos queda
  sometida al contrato de ejecución supervisada (`AGENTS.md (contrato supervisado)`) y a los hooks del plugin.
- **No actualizar** desde el repositorio de origen sin repetir la auditoría. Verificar integridad con:
  comparar el SHA-256 de abajo (`sha256sum .agents/skills/systematic-debugging/*`)

## Hashes SHA-256 (archivos importados)

```
c24733a5b1821bd6bed1fc950261f0b9f4e90097e0bbb96459d8179713730789 CREATION-LOG.md
51c6435d98c83c42c96ba7c35725a0b2c376cd487fb1a4e6bd0ddbe7e33ef202 SKILL.md
40ae5ebe497fdf310200e43fe986552546d0a22837c0d39e855db1cfd33eb88e condition-based-waiting-example.ts
e89fec8400d6cd50f43407cec9fab50976ba4d55d0ec2eb51c0bd68036b54c26 condition-based-waiting.md
1e175fb86fc357e58c6aebf5441e481e1b7868b4380c0456b63a17eefbd18ba7 defense-in-depth.md
dd7b8f13c4cc2a24b33ff87b18da9248f3e1c80a085c3316224f69ff0fa5c43c find-polluter.sh
75b933b6a8c40bdb2031b10f21654395b56ec6ab6bc7b018c18d3fe57aeb7fb8 root-cause-tracing.md
fe2ba480d78ac0d686dc025f41c2a32a43d642bf533f91b0c6053a04d35d6486 test-academic.md
0b6a915db0054577819834c79be9eb614e97bddba10d73768e1fbe91cfed048a test-pressure-1.md
b2030aeffba07050e8ad573ddf87486457c4a016a786bb326235bebd856f2016 test-pressure-2.md
96b50a52e2c7989c9cf20fb752c47c1e9a3a70dc362f8f7989f8f5b64dac7708 test-pressure-3.md
```
