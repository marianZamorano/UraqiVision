// T032 (001-base-web): selector de idioma accesible (RF-20, RNF-03, RNF-04). Cambia sin recargar; el nombre visible
// del idioma destino va en su propio idioma (`lang`, WCAG 3.1.2) y forma parte del nombre accesible (WCAG 2.5.3).
import { useTranslation } from "react-i18next";
import { changeLanguage, useLanguage } from "../i18n";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const target = useLanguage() === "es" ? "en" : "es";
  const targetName = t(`language.names.${target}`);

  return (
    <button
      type="button"
      className="language-switcher"
      lang={target}
      aria-label={`${t("language.switchTo")} ${targetName}`}
      onClick={() => void changeLanguage(target)}
    >
      {targetName}
    </button>
  );
}
