// Portada (001 T019, #127; RF-01): «UraqiVision» en grande, la frase del equipo, qué hace la web, el problema (§4.1) y
// cómo usarla en tres pasos, en menos de un minuto de lectura. El planeta es solo CSS: la portada no carga CesiumJS
// ni imágenes (RNF-01) y su animación se detiene con movimiento reducido (RNF-12). Textos traducidos (RNF-03).
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link } from "../app/router";
import "./home.css";

const PROBLEMS = ["unseen", "notUnderstood", "scattered"] as const;
const STEPS = ["travel", "choose", "read"] as const;

/**
 * Planeta decorativo de fondo: horizonte con barrido de radar y un satélite en órbita. Vive en un nodo al principio
 * de <body> (como el globo del explorador): la animación de entrada de <main> usa transform, que haría que su
 * posición fija se midiera contra <main> y quedara recortado a la columna central.
 */
function HomePlanet() {
  const [host] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    document.body.prepend(host);
    return () => host.remove();
  }, [host]);

  return createPortal(
    <div className="home-planet" aria-hidden="true">
      <div className="home-planet__frame">
        <div className="home-planet__orbit">
          <span className="home-planet__satellite" />
        </div>
        <div className="home-planet__sphere">
          <span className="home-planet__sweep" />
        </div>
      </div>
    </div>,
    host,
  );
}

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home">
      <HomePlanet />

      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-eyebrow">{t("pages.home.eyebrow")}</p>
        <h1 id="home-title" className="home-title">
          {t("app.title")}
        </h1>
        <blockquote className="home-quote">
          <p>{t("pages.home.quote")}</p>
        </blockquote>
        <p className="home-lead">{t("pages.home.lead")}</p>
        <div className="cta-row home-cta">
          <Link to="/explore" className="button-primary">
            {t("pages.home.cta")}
          </Link>
          <Link to="/method" className="button-secondary">
            {t("app.method")}
          </Link>
        </div>
      </section>

      <section className="home-block" aria-labelledby="home-problem">
        <h2 id="home-problem" className="home-block__title">
          {t("pages.home.problemTitle")}
        </h2>
        <ul className="home-cards">
          {PROBLEMS.map((problem) => (
            <li key={problem} className="home-card">
              <h3>{t(`pages.home.problems.${problem}.title`)}</h3>
              <p>{t(`pages.home.problems.${problem}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-block" aria-labelledby="home-steps">
        <h2 id="home-steps" className="home-block__title">
          {t("pages.home.stepsTitle")}
        </h2>
        <ol className="home-cards home-steps">
          {STEPS.map((step, i) => (
            <li key={step} className="home-card">
              <span className="home-step__number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{t(`pages.home.steps.${step}.title`)}</h3>
              <p>{t(`pages.home.steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
