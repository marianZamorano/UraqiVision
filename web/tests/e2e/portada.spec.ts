// T002 (001-base-web): prueba de humo en el navegador (PS-09). La portada abre, declara el idioma y no
// pide recursos del globo (RNF-01: CesiumJS solo al entrar al explorador).
import { expect, test } from "@playwright/test";

test("la portada abre sin errores y sin cargar CesiumJS", async ({ page }) => {
  const errores: string[] = [];
  const pedidas: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("request", (r) => pedidas.push(r.url()));

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("main")).toBeAttached();
  expect(errores).toEqual([]);
  expect(pedidas.some((u) => /cesium/i.test(u))).toBe(false);
});
