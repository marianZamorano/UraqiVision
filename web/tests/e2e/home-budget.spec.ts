// T048 (001-base-web): la portada carga en menos de 3 s a 10 Mbps (RNF-01), a 320 px (RNF-05) y con movimiento
// reducido (RNF-12), medido con las herramientas del navegador (Chrome DevTools Protocol), sin caché.
// SUPUESTO (RNF-01 no fija la latencia): 40 ms de ida y vuelta y 5 Mbps de subida.
// Resultados medidos y fecha: tests/e2e/evidencia-base-web.md.
import { expect, test } from "@playwright/test";

const MBPS = 1_000_000 / 8; // bytes por segundo de 1 Mbps
const BUDGET_MS = 3_000;

test("la portada carga en menos de 3 s a 10 Mbps, a 320 px y con movimiento reducido", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 40,
    downloadThroughput: 10 * MBPS,
    uploadThroughput: 5 * MBPS,
  });

  await page.goto("/", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    const bytes = performance
      .getEntriesByType("resource")
      .reduce((total, entry) => total + ((entry as PerformanceResourceTiming).transferSize || 0), nav.transferSize || 0);
    return {
      loadMs: Math.round(nav.loadEventEnd),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      firstContentfulPaintMs: paint ? Math.round(paint.startTime) : null,
      transferredKb: Math.round(bytes / 1024),
      cesiumRequested: performance.getEntriesByType("resource").some((e) => /cesium/i.test(e.name)),
    };
  });

  testInfo.annotations.push({ type: "medicion", description: JSON.stringify(metrics) });
  console.log(`[T048] ${JSON.stringify(metrics)}`);

  expect(metrics.cesiumRequested).toBe(false);
  expect(metrics.loadMs).toBeLessThan(BUDGET_MS);
});
