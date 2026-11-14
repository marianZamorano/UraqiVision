// 004 T029: término del glosario (RF-19, FR-014a; research.md R6).
// - Botón con nombre accesible (el término); no es un enlace y no cambia de página.
// - La definición se abre al pasar el cursor, al tocar o con el teclado (Enter/Espacio del botón).
// - Es persistente (WCAG 1.4.13): no desaparece al sacar el cursor; se cierra con Escape, con el botón «cerrar»
//   (≥ 24 × 24 px, WCAG 2.5.8) o tocando fuera. Al cerrar, el foco vuelve al término.
// - Los textos llegan por props desde i18n (RNF-03). Las definiciones salen de §30 (contenido/glosario.md).
import { useEffect, useId, useRef, useState } from "react";
import "./glosario.css";

interface Props {
  termino: string;
  definicion: string;
  etiquetaCerrar: string;
}

export function TerminoGlosario({ termino, definicion, etiquetaCerrar }: Props) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  const contenedor = useRef<HTMLSpanElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const cerrar = () => {
    setAbierta(false);
    boton.current?.focus();
  };

  // Tocar fuera cierra la definición (sin mover el foco al término: la persona eligió otro sitio).
  useEffect(() => {
    if (!abierta) return;
    const alTocar = (e: PointerEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierta(false);
    };
    document.addEventListener("pointerdown", alTocar);
    return () => document.removeEventListener("pointerdown", alTocar);
  }, [abierta]);

  return (
    <span className="glosario" ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="glosario__termino"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta(true)}
        onMouseEnter={() => setAbierta(true)}
      >
        {termino}
      </button>
      {abierta && (
        <span
          id={id}
          role="dialog"
          aria-modal="false"
          aria-label={termino}
          className="glosario__definicion"
          onKeyDown={(e) => {
            if (e.key === "Escape") cerrar();
          }}
        >
          <span>{definicion}</span>
          <button type="button" className="glosario__cerrar" aria-label={etiquetaCerrar} onClick={cerrar}>
            ×
          </button>
        </span>
      )}
    </span>
  );
}
