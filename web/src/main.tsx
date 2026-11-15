// Punto de entrada (001 T001). La portada no carga CesiumJS ni MapLibre (RNF-01).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./i18n";
import "./styles/global.css";

const raiz = document.getElementById("root");
if (!raiz) throw new Error("Falta el elemento #root en index.html");

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
