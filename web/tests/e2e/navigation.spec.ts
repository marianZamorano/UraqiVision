// T018 (001-base-web): recorrido en el navegador por portada, explorador, estación, Método y Acerca de, con
// teclado, recarga y a 320 px con movimiento reducido (§20.1, PS-07, PS-09, RNF-04, RNF-12).
import { expect, test } from "@playwright/test";

test("recorre todos los destinos y la recarga conserva la estación", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));

  await page.goto("/");
  await page.getByRole("link", { name: "Explorar Bolivia" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Explorador" })).toBeVisible();

  await page.getByRole("link", { name: "Tarija" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tarija" })).toBeVisible();
  await expect(page.getByText("Datos de ejemplo: no es un resultado.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Tarija" })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Explorador" })).toBeVisible();

  // Método y Acerca de ya no están en la navegación (#131), pero sus rutas siguen abriendo (RF-15, RF-24).
  await page.goto("/method");
  await expect(page.getByRole("heading", { level: 1, name: "Método" })).toBeVisible();
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "Acerca de" })).toBeVisible();

  expect(errores).toEqual([]);
});

test("se recorre con el teclado desde el enlace para saltar al contenido", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("a 320 px y con movimiento reducido la lista de estaciones es usable sin desplazamiento horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/explore");

  await expect(page.getByRole("list", { name: "Estaciones disponibles" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: "Tarija" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tarija" })).toBeVisible();
});
