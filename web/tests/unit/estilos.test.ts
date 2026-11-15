// T004 (001-base-web): tokens, foco visible y movimiento reducido (RNF-04, RNF-12, §20.2).
import { describe, expect, it } from "vitest";
import global from "../../src/styles/global.css?raw";
import tokens from "../../src/styles/tokens.css?raw";
import shell from "../../src/app/shell.css?raw";

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
const token = (nombre: string): string => {
  const m = new RegExp(`--${nombre}:\\s*([^;]+);`).exec(tokens);
  if (!m?.[1]) throw new Error(`Falta el token --${nombre}`);
  const valor = m[1].trim();
  const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(valor);
  return ref ? token(ref[1] as string) : valor;
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

describe("paleta y contraste por rol (RNF-04, WCAG 1.4.3 y 1.4.11)", () => {
  it("define exactamente 7 colores de paleta", () => {
    expect(tokens.match(/--paleta-[a-z0-9-]+:\s*#[0-9a-fA-F]{6}/g)).toHaveLength(7);
  });

  it("el texto principal y el secundario cumplen 4.5:1 sobre la superficie", () => {
    expect(contraste(token("color-texto"), token("color-superficie"))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(token("color-texto-secundario"), token("color-superficie"))).toBeGreaterThanOrEqual(4.5);
  });

  it("el texto principal es blanco sobre el fondo negro", () => {
    expect(token("color-texto")).toBe("#ffffff");
    expect(token("color-fondo")).toBe("#000000");
  });

  it("los títulos van en blanco sobre el cielo casi negro", () => {
    expect(token("color-titulo")).toBe("#ffffff");
  });

  it("el texto blanco del botón holográfico cumple 4.5:1 sobre su stop más oscuro", () => {
    expect(contraste(token("color-texto"), token("paleta-azul-electrico"))).toBeGreaterThanOrEqual(4.5);
  });

  it("los pasos claros de la escala de cambio se leen sobre el fondo (≥ 3:1; los oscuros son referencia gráfica)", () => {
    expect(contraste(token("cambio-1"), token("color-fondo"))).toBeGreaterThanOrEqual(3);
    expect(contraste(token("cambio-2"), token("color-fondo"))).toBeGreaterThanOrEqual(3);
  });

  it("fuera de la escala de cambio no hay tonos cálidos: rojo, naranja ni amarillo", () => {
    const fueraDeCambio = tokens.split("\n").filter((l) => !/--cambio-\d/.test(l)).join("\n");
    for (const hex of fueraDeCambio.match(/#[0-9a-fA-F]{6}/g) ?? []) {
      const [r, , b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(r > b && r > 90, `${hex} es un tono cálido`).toBe(false);
    }
  });

  it("define los tokens de vidrio y holografía usados por los paneles", () => {
    for (const nombre of ["vidrio-tenue", "vidrio-suave", "vidrio-fuerte", "desenfoque-vidrio", "holo", "resplandor"]) {
      expect(tokens).toContain(`--${nombre}:`);
    }
    expect(global).toMatch(/backdrop-filter|color-mix/);
  });

  it("títulos, marca y menú van siempre en mayúsculas", () => {
    expect(global).toMatch(/h1,\s*h2,\s*h3\s*\{[^}]*text-transform:\s*uppercase/);
    expect(shell).toMatch(/\.brand-block strong\s*\{[^}]*text-transform:\s*uppercase/);
    expect(shell).toMatch(/\.main-nav a\s*\{[^}]*text-transform:\s*uppercase/);
  });

  it("el rojo de acento nunca se usa como color de texto", () => {
    expect(shell).not.toMatch(/(^|[;{\s])color:\s*var\(--color-acento\)/m);
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
