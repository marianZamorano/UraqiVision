// T015 (001-base-web): i18n español/inglés con react-i18next (RF-20, RNF-03). Los textos viven en es.json y
// en.json; tests/unit/i18n.test.ts exige paridad de claves. El idioma se persiste de forma segura y se refleja en
// <html lang> (research.md §2: el idioma vive en contexto persistible, no en la URL). Presupuesto inicial del plan
// de 001: la portada solo incluye el español; el inglés se descarga al elegirlo (changeLanguage).
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import type { Language } from "../contracts/view-state";
import es from "./es.json";

export const LANGUAGE_STORAGE_KEY = "uraqivision-lang";

/** Idioma guardado, o español si no hay uno válido o el almacenamiento está bloqueado. */
export function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // Navegación privada o almacenamiento bloqueado: se usa el idioma por defecto.
  }
  return "es";
}

/** Guarda el idioma sin fallar si el almacenamiento no está disponible. */
export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Sin almacenamiento, el idioma dura solo esta visita.
  }
}

/** Claves (con ruta a.b.c) que están en `source` y faltan en `target`. */
export function missingKeys(source: object, target: object, prefix = ""): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const other = (target as Record<string, unknown>)[key];
    if (value && typeof value === "object") {
      return other && typeof other === "object" ? missingKeys(value, other, path) : [path];
    }
    return other === undefined ? [path] : [];
  });
}

/** Claves pedidas que no existen en el diccionario (detección de claves faltantes). */
export const missingKeysSeen = new Set<string>();

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es } },
  lng: "es",
  fallbackLng: "es",
  supportedLngs: ["es", "en"],
  initAsync: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  saveMissing: true,
  missingKeyHandler: (_languages, _namespace, key) => {
    missingKeysSeen.add(key);
    if (import.meta.env.DEV && import.meta.env.MODE !== "test") console.warn(`[i18n] clave faltante: ${key}`);
  },
});

function reflectLanguage(language: string): void {
  const value: Language = language === "en" ? "en" : "es";
  storeLanguage(value);
  if (typeof document !== "undefined") document.documentElement.lang = value;
}

i18n.on("languageChanged", reflectLanguage);

/** Cambia el idioma sin recargar; descarga el diccionario inglés la primera vez que se pide. */
export async function changeLanguage(language: Language): Promise<void> {
  if (!i18n.hasResourceBundle(language, "translation")) {
    const dictionary = language === "en" ? await import("./en.json") : { default: es };
    i18n.addResourceBundle(language, "translation", dictionary.default);
  }
  await i18n.changeLanguage(language);
}

// Arranque: español inmediato; si la persona eligió inglés antes, se carga y se aplica enseguida.
// <html lang> refleja el idioma realmente mostrado: pasa a "en" solo cuando el inglés ya está cargado.
if (readStoredLanguage() === "en") void changeLanguage("en");
else reflectLanguage("es");

/** Idioma activo de la interfaz; se actualiza al cambiarlo sin recargar. */
export function useLanguage(): Language {
  const { i18n: instance } = useTranslation();
  return instance.resolvedLanguage === "en" ? "en" : "es";
}

export default i18n;
