// T010 (001-base-web): máquina de los seis estados de RF-34 (RN-13, PS-04). Los motivos y mensajes son claves de
// traducción: el estado no guarda textos en un idioma (FR-013, FR-014).
import { describe, expect, it, vi } from "vitest";
import { StationNotFoundError } from "../../src/data/publicationRepository";
import { availableState, loadingState, viewStateFromError } from "../../src/data/viewState";

describe("máquina de estados de la vista", () => {
  it("loading identifica la solicitud vigente", () => {
    expect(loadingState("tarija:0")).toEqual({ kind: "loading", requestId: "tarija:0" });
  });

  it("available conserva el modo de evidencia del dato (RN-04)", () => {
    expect(availableState({ id: 1 }, "DEMO")).toEqual({ kind: "available", data: { id: 1 }, evidenceMode: "DEMO" });
  });

  it("una cancelación no produce estado: la respuesta se descarta", () => {
    const abort = new DOMException("cancelada", "AbortError");
    expect(viewStateFromError(abort, vi.fn())).toBeNull();
  });

  it("una estación sin publicación es «sin datos», no un error ni un cero (RN-13)", () => {
    expect(viewStateFromError(new StationNotFoundError("x"), vi.fn())).toEqual({
      kind: "no-data",
      reason: "states.reason.station-not-found",
    });
  });

  it("cualquier otro fallo es un error con reintento", () => {
    const retry = vi.fn();
    const state = viewStateFromError(new Error("red"), retry);

    expect(state).toEqual({ kind: "error", message: "states.reason.load-failed", retry });
  });
});
