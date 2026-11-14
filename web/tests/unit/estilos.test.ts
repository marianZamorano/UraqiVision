// T004 (001-base-web): tokens, foco visible y movimiento reducido (RNF-04, RNF-12, §20.2).
import { describe, expect, it } from "vitest";
import global from "../../src/styles/global.css?raw";
import tokens from "../../src/styles/tokens.css?raw";

/** Luminancia relativa y contraste WCAG 2.2 entre dos colores #rrggbb. */
const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
};
const token = (nombre: string) => {
  const m = new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens);
  if (!m?.[1]) throw new Error(`Falta el token --${nombre}`);
  return m[1];
};

describe("tokens de diseño", () => {
  it("el texto sobre el fondo cumple el contraste propuesto para el aire libre (7:1, AAA)", () => {
    expect(contraste(token("color-texto"), token("color-fondo"))).toBeGreaterThanOrEqual(7);
  });

  it("el foco visible cumple 3:1 frente al fondo (WCAG 1.4.11)", () => {
    expect(contraste(token("color-foco"), token("color-fondo"))).toBeGreaterThanOrEqual(3);
  });

  it("la paleta de cambio es de un solo tono y más oscura cuanto más cambio (§20.2)", () => {
    const escala = [1, 2, 3, 4, 5].map((n) => luminancia(token(`cambio-${n}`)));
    for (let i = 1; i < escala.length; i++) expect(escala[i]).toBeLessThan(escala[i - 1] as number);
  });

  it("define la trama gris de las zonas sin dato (§20.2)", () => {
    expect(tokens).toMatch(/--trama-sin-dato:/);
  });
});

describe("estilos globales", () => {
  it("el foco es visible con :focus-visible (RNF-04)", () => {
    expect(global).toMatch(/:focus-visible\s*\{[^}]*outline/);
  });

  it("anula animaciones y transiciones con prefers-reduced-motion (RNF-12)", () => {
    expect(global).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(global).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(global).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });
});
