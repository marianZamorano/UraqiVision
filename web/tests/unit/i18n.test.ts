// T014 (001-base-web): paridad de diccionarios, claves faltantes y persistencia segura del idioma (RF-20, RNF-03).
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../src/i18n/en.json";
import es from "../../src/i18n/es.json";
import i18nSource from "../../src/i18n/index.ts?raw";
import i18n, { changeLanguage, missingKeys, missingKeysSeen, readStoredLanguage, storeLanguage } from "../../src/i18n";

function leaves(value: unknown, prefix = ""): Array<[string, unknown]> {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [[prefix, value]];
}

afterEach(async () => {
  vi.restoreAllMocks();
  localStorage.clear();
  await i18n.changeLanguage("es");
});

describe("diccionarios es/en", () => {
  it("tienen exactamente las mismas claves", () => {
    expect(missingKeys(es, en)).toEqual([]);
    expect(missingKeys(en, es)).toEqual([]);
  });

  it("no tienen textos vacíos", () => {
    for (const [key, text] of [...leaves(es), ...leaves(en)]) {
      expect(typeof text, key).toBe("string");
      expect((text as string).trim(), key).not.toBe("");
    }
  });

  it("missingKeys detecta claves anidadas ausentes", () => {
    expect(missingKeys({ a: { b: "x", c: "y" } }, { a: { b: "x" } })).toEqual(["a.c"]);
  });

  it("registra las claves que se piden y no existen", () => {
    i18n.t("clave.que.no.existe");
    expect(missingKeysSeen.has("clave.que.no.existe")).toBe(true);
  });
});

describe("persistencia del idioma", () => {
  it("lee el idioma guardado si es válido", () => {
    localStorage.setItem("uraqivision-lang", "en");
    expect(readStoredLanguage()).toBe("en");
  });

  it("ignora un valor guardado inválido", () => {
    localStorage.setItem("uraqivision-lang", "fr");
    expect(readStoredLanguage()).toBe("es");
  });

  it("no falla si el almacenamiento está bloqueado", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readStoredLanguage()).toBe("es");
    expect(() => storeLanguage("en")).not.toThrow();
  });

  it("al cambiar de idioma lo guarda y actualiza <html lang>", async () => {
    await changeLanguage("en");

    expect(localStorage.getItem("uraqivision-lang")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("carga del inglés bajo demanda (plan de 001: presupuesto inicial solo con español)", () => {
  it("el código fuente no importa en.json de forma estática", () => {
    expect(i18nSource).not.toMatch(/^import\s+en\s+from\s+["']\.\/en\.json["']/m);
    expect(i18nSource).toMatch(/import\(["']\.\/en\.json["']\)/);
  });

  it("changeLanguage carga el diccionario inglés y traduce", async () => {
    await changeLanguage("en");

    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
    expect(i18n.t("app.home")).toBe(en.app.home);
  });
});
