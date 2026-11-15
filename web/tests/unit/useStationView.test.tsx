// T010 y T011 (001-base-web): control de solicitudes vigentes al cargar una estación: cancelación, respuestas
// tardías descartadas y reintento (RF-34, FR-007 a FR-010, FR-022).
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublishedStation } from "../../src/contracts/view-state";
import { demoStations, fetchStation, StationNotFoundError } from "../../src/data/publicationRepository";
import { useStationView } from "../../src/data/useStationView";

vi.mock("../../src/data/publicationRepository", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/data/publicationRepository")>();
  return { ...original, fetchStation: vi.fn() };
});

type Pending = { resolve: (s: PublishedStation) => void; reject: (e: unknown) => void; signal: AbortSignal };
let pending: Pending[] = [];
const tarija = demoStations.tarija as PublishedStation;
const santaCruz = demoStations["santa-cruz"] as PublishedStation;

beforeEach(() => {
  pending = [];
  vi.mocked(fetchStation).mockReset();
  vi.mocked(fetchStation).mockImplementation(
    (_id: string, signal?: AbortSignal) =>
      new Promise<PublishedStation>((resolve, reject) => {
        pending.push({ resolve, reject, signal: signal as AbortSignal });
      }),
  );
});

describe("useStationView", () => {
  it("empieza en loading y pasa a available con el modo de evidencia", async () => {
    const { result } = renderHook(() => useStationView("tarija"));
    expect(result.current.view.kind).toBe("loading");

    await act(async () => pending[0]?.resolve(tarija));

    expect(result.current.view).toEqual({ kind: "available", data: tarija, evidenceMode: "DEMO" });
  });

  it("al cambiar de estación cancela la anterior y descarta su respuesta tardía", async () => {
    const { result, rerender } = renderHook(({ id }) => useStationView(id), { initialProps: { id: "tarija" } });
    rerender({ id: "santa-cruz" });

    expect(pending[0]?.signal.aborted).toBe(true);

    await act(async () => pending[1]?.resolve(santaCruz));
    await act(async () => pending[0]?.resolve(tarija));

    expect(result.current.view.kind).toBe("available");
    expect(result.current.view.kind === "available" && result.current.view.data.stationId).toBe("santa-cruz");
  });

  it("al desmontar cancela la solicitud", () => {
    const { unmount } = renderHook(() => useStationView("tarija"));
    unmount();
    expect(pending[0]?.signal.aborted).toBe(true);
  });

  it("un fallo da error y reintentar vuelve a cargar", async () => {
    const { result } = renderHook(() => useStationView("tarija"));
    await act(async () => pending[0]?.reject(new Error("red")));
    expect(result.current.view.kind).toBe("error");

    act(() => result.current.retry());
    expect(result.current.view.kind).toBe("loading");
    await act(async () => pending[1]?.resolve(tarija));

    await waitFor(() => expect(result.current.view.kind).toBe("available"));
    expect(fetchStation).toHaveBeenCalledTimes(2);
  });

  it("una estación sin publicación queda en «sin datos» (RN-13)", async () => {
    const { result } = renderHook(() => useStationView("nada"));
    await act(async () => pending[0]?.reject(new StationNotFoundError("nada")));

    expect(result.current.view).toEqual({ kind: "no-data", reason: "states.reason.station-not-found" });
  });

  it("sin identificador no pide nada y queda en «sin datos»", () => {
    const { result } = renderHook(() => useStationView(undefined));

    expect(result.current.view).toEqual({ kind: "no-data", reason: "states.reason.no-station-id" });
    expect(fetchStation).not.toHaveBeenCalled();
  });
});
