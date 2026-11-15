// T026 y T029 (001-base-web): presentador bilingüe de estados, modo de evidencia y ausencias (RF-34, RN-04, RN-13).
// T034: cambiar de idioma traduce los mensajes sin alterar el estado.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvidenceBadge, ReportableValueText, ViewStatePresenter } from "../../src/app/ViewStatePresenter";
import type { ViewState } from "../../src/contracts/view-state";
import { changeLanguage } from "../../src/i18n";

afterEach(async () => {
  await changeLanguage("es");
});

const states: Array<[ViewState<never>, RegExp]> = [
  [{ kind: "loading", requestId: "r1" }, /cargando la publicación/i],
  [{ kind: "no-data", reason: "states.reason.station-not-found" }, /no hay una publicación para esta estación/i],
  [{ kind: "incompatible-date", reason: "states.reason.no-compatible-date", availablePeriods: [] }, /no hay datos compatibles para la fecha elegida/i],
  [{ kind: "error", message: "states.reason.load-failed", retry: vi.fn() }, /no se pudo cargar/i],
];

describe("ViewStatePresenter", () => {
  it.each(states)("pinta %o con su mensaje traducido", (state, text) => {
    render(<ViewStatePresenter state={state} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("anuncia los cambios en una región viva educada sin mover el foco", () => {
    render(<ViewStatePresenter state={{ kind: "loading", requestId: "r1" }} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(document.activeElement).toBe(document.body);
  });

  it("el error se anuncia como alerta y su botón reintenta", () => {
    const retry = vi.fn();
    render(<ViewStatePresenter state={{ kind: "error", message: "states.reason.load-failed", retry }} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/no se pudo cargar/i);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("traduce el mensaje al cambiar de idioma sin alterar el estado (T034)", async () => {
    const state: ViewState<never> = { kind: "no-data", reason: "states.reason.station-not-found" };
    render(<ViewStatePresenter state={state} />);

    await act(async () => changeLanguage("en"));

    expect(screen.getByText(/there is no publication for this station/i)).toBeInTheDocument();
    expect(state).toEqual({ kind: "no-data", reason: "states.reason.station-not-found" });
  });
});

describe("EvidenceBadge (RN-04)", () => {
  it("marca DEMO de forma visible como datos de ejemplo, no como resultado", () => {
    render(<EvidenceBadge mode="DEMO" />);
    expect(screen.getByText("DEMO")).toBeInTheDocument();
    expect(screen.getByText(/datos de ejemplo: no es un resultado/i)).toBeInTheDocument();
  });

  it("marca REAL sin el aviso de ejemplo", () => {
    render(<EvidenceBadge mode="REAL" />);
    expect(screen.getByText("REAL")).toBeInTheDocument();
    expect(screen.queryByText(/datos de ejemplo/i)).not.toBeInTheDocument();
  });
});

describe("ReportableValueText (RN-13)", () => {
  it("una ausencia se muestra «no reportada» con su motivo, nunca como cero", () => {
    const { container } = render(
      <ReportableValueText value={{ value: null, unit: "ha", status: "not-reported", reason: "Sin escena válida" }} />,
    );
    expect(container).toHaveTextContent(/no reportada/i);
    expect(container).toHaveTextContent("Sin escena válida");
    expect(container.textContent).not.toMatch(/\b0\b/);
  });

  it("un cero reportado sí se muestra como cero", () => {
    const { container } = render(<ReportableValueText value={{ value: 0, unit: "ha", status: "reported" }} />);
    expect(container.textContent).toMatch(/\b0\b/);
    expect(container).toHaveTextContent("ha");
  });
});
