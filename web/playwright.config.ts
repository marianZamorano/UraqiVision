// Playwright (001 T002): recorrido en el navegador contra la build local (PS-07, PS-09).
import { defineConfig, devices } from "@playwright/test";

// 4173 por defecto. En Windows, Hyper-V puede reservar rangos de puertos que lo incluyen (listen EACCES):
// en ese caso, PLAYWRIGHT_PORT=5180 npm run test:e2e (consulta: netsh interface ipv4 show excludedportrange).
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
