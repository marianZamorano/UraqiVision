// Lanza Vitest desde la ruta real del sistema (001 T002, PS-04).
// En Windows, si la terminal entrega la unidad en minúscula (`c:\...`, típico de VS Code y Git Bash), Vitest
// carga dos veces el mismo módulo y falla con «Cannot read properties of undefined (reading 'config')».
// Se normaliza la letra de la unidad a mayúscula (`C:\...`). En Linux y macOS no cambia nada.
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const unidadMayuscula = (ruta) => ruta.replace(/^([a-z]):/, (_, letra) => `${letra.toUpperCase()}:`);
const require = createRequire(import.meta.url);
const vitestBin = unidadMayuscula(join(dirname(require.resolve("vitest/package.json")), "vitest.mjs"));
const cwd = unidadMayuscula(realpathSync.native(process.cwd()));

const { status } = spawnSync(process.execPath, [vitestBin, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(status ?? 1);
