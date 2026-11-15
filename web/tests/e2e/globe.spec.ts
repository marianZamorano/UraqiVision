// #115, #121 (RF-02, RF-25, RNF-01, RNF-11): en un navegador con WebGL el explorador es un recorrido por secciones
// sobre el globo 3D, con los créditos de sus proveedores; la portada sigue sin pedir CesiumJS (home-performance.spec.ts).
import { expect, test, type Page } from "@playwright/test";

async function openTour(page: Page, errores: string[]) {
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/explore");
  const globo = page.getByRole("region", { name: "Globo 3D de Bolivia" });
  await expect(globo).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/preparando el globo 3d/i)).toHaveCount(0);
  return globo;
}

const navButton = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Secciones del recorrido" }).getByRole("button", { name });

test("el explorador muestra el globo 3D con sus créditos y el recorrido por secciones", async ({ page }) => {
  const errores: string[] = [];
  const globo = await openTour(page, errores);

  await expect(globo.locator("canvas").first()).toBeVisible();
  await expect(globo.locator(".cesium-widget-credits")).toBeAttached();
  // Visor limpio: ningún control de Cesium (barra, línea de tiempo, animación, ayuda…); solo los créditos (enlaces).
  await expect(globo.locator("button, input, select")).toHaveCount(0);
  await expect(globo.locator(".cesium-viewer-toolbar")).toBeHidden();
  await expect(navButton(page, "La Tierra")).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("list", { name: "Estaciones disponibles" })).toBeAttached();

  expect(errores).toEqual([]);
});

test("la navegación del recorrido desplaza la página hasta la sección y la marca como activa", async ({ page }) => {
  const errores: string[] = [];
  await openTour(page, errores);

  await navButton(page, "Bolivia").click();
  await expect(navButton(page, "Bolivia")).toHaveAttribute("aria-current", "step", { timeout: 10_000 });
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await navButton(page, "La Tierra").focus();
  await page.keyboard.press("Enter");
  await expect(navButton(page, "La Tierra")).toHaveAttribute("aria-current", "step", { timeout: 10_000 });

  expect(errores).toEqual([]);
});

test("hacer clic en el marcador de Bolivia en el globo lleva a la sección de Bolivia", async ({ page }) => {
  const errores: string[] = [];
  const globo = await openTour(page, errores);

  // Clic real sobre el marcador: en la vista de entrada mira a Bolivia, centrado en la parte libre de la pantalla
  // (#123: descontando el panel a la izquierda, la navegación a la derecha y la cabecera arriba). Se reintenta
  // mientras el globo termina de dibujarse.
  const lienzo = globo.locator("canvas").first();
  await expect(async () => {
    const caja = await lienzo.boundingBox();
    if (!caja) throw new Error("sin lienzo");
    const libre = await page.evaluate(() => {
      const panel = document.querySelector(".tour-panel")?.getBoundingClientRect();
      const nav = document.querySelector(".tour-nav ol")?.getBoundingClientRect();
      const cabecera = document.querySelector(".topbar")?.getBoundingClientRect();
      // 48 px: margen extra con la navegación (NAV_MARGIN de ExplorePage, #125).
      return { left: panel?.right ?? 0, right: nav ? window.innerWidth - nav.left + 48 : 0, top: cabecera?.bottom ?? 0 };
    });
    await page.mouse.click(
      caja.x + caja.width / 2 + (libre.left - libre.right) / 2,
      caja.y + caja.height / 2 + libre.top / 2,
    );
    await expect(navButton(page, "Bolivia")).toHaveAttribute("aria-current", "step", { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  expect(errores).toEqual([]);
});
