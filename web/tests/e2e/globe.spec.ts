// #115 (RF-02, RNF-01, RNF-11): en un navegador con WebGL el explorador pinta el globo 3D de Bolivia con los créditos
// de sus proveedores; la portada sigue sin pedir CesiumJS (home-performance.spec.ts).
import { expect, test } from "@playwright/test";

test("el explorador muestra el globo 3D con sus créditos", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));

  await page.goto("/explore");

  const globo = page.getByRole("region", { name: "Globo 3D de Bolivia" });
  await expect(globo).toBeVisible({ timeout: 20_000 });
  await expect(globo.locator("canvas").first()).toBeVisible();
  await expect(globo.locator(".cesium-widget-credits")).toBeAttached();
  await expect(page.getByText(/preparando el globo 3d/i)).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Estaciones disponibles" })).toBeVisible();

  expect(errores).toEqual([]);
});

// #115 (RF-25, RF-28): se entra viendo la Tierra entera; el marcador «Bolivia» está en el centro de la vista de entrada.
test("hacer clic en Bolivia en el globo lleva a Bolivia y ofrece volver o ver la Tierra", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/explore");

  const globo = page.getByRole("region", { name: "Globo 3D de Bolivia" });
  await expect(page.getByRole("button", { name: "Ir a Bolivia" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/haz clic en bolivia/i)).toBeVisible();

  // Clic real sobre el marcador (centro del lienzo); se reintenta mientras el globo termina de dibujarse.
  const lienzo = globo.locator("canvas").first();
  await expect(async () => {
    const caja = await lienzo.boundingBox();
    if (!caja) throw new Error("sin lienzo");
    await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await expect(page.getByRole("button", { name: "Volver a Bolivia" })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await page.getByRole("button", { name: "Ver la Tierra entera" }).click();
  await expect(page.getByRole("button", { name: "Ir a Bolivia" })).toBeVisible();
  await page.getByRole("button", { name: "Ir a Bolivia" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Volver a Bolivia" })).toBeVisible();

  expect(errores).toEqual([]);
});
